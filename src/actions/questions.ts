'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { MediaAsset, Question } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { assertObjectId, requireOwnedGame } from '@/lib/authorization'
import { idString, toMediaAssetDTO, toQuestionDTO } from '@/lib/dto'
import type { QuestionDTO } from '@/lib/types'

const optionSchema = z.object({
  optionText: z.string().trim().min(1).max(300),
  isCorrect: z.boolean(),
})

const questionSchema = z.object({
  questionText: z.string().trim().min(1, 'Question text is required').max(2000),
  answerType: z.enum(['MCQ', 'MANUAL']),
  expectedAnswer: z.string().trim().max(2000).optional().default(''),
  points: z.number().int().min(0).max(100000),
  timeLimitSeconds: z.number().int().min(0).max(3600),
  mediaAssetId: z.string().optional(),
  options: z.array(optionSchema).max(12).default([]),
}).superRefine((value, context) => {
  if (value.answerType === 'MCQ') {
    if (value.options.length < 2) context.addIssue({ code: 'custom', path: ['options'], message: 'MCQ questions need at least two options' })
    if (value.options.filter((option) => option.isCorrect).length !== 1) {
      context.addIssue({ code: 'custom', path: ['options'], message: 'Select exactly one correct option' })
    }
  }
})

export interface CreateQuestionInput {
  questionText: string
  answerType: 'MCQ' | 'MANUAL'
  expectedAnswer?: string
  points: number
  timeLimitSeconds: number
  mediaAssetId?: string
  options?: Array<{ optionText: string; isCorrect: boolean }>
}

export async function createQuestion(gameId: string, payload: CreateQuestionInput): Promise<QuestionDTO> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const input = questionSchema.parse(payload)

  if (input.mediaAssetId) {
    assertObjectId(input.mediaAssetId, 'media asset ID')
    const mediaOwned = await MediaAsset.exists({ _id: input.mediaAssetId, createdBy: user.id })
    if (!mediaOwned) throw new Error('Media asset not found')
  }

  const displayOrder = await Question.countDocuments({ gameId }) + 1
  const question = await Question.create({
    gameId,
    questionText: input.questionText,
    answerType: input.answerType,
    expectedAnswer: input.answerType === 'MANUAL' ? input.expectedAnswer : undefined,
    points: input.points,
    timeLimitSeconds: input.timeLimitSeconds,
    mediaAssetId: input.mediaAssetId || undefined,
    displayOrder,
    options: input.answerType === 'MCQ'
      ? input.options.map((option, index) => ({ ...option, displayOrder: index + 1 }))
      : [],
  })

  revalidatePath(`/games/${gameId}`)
  revalidatePath(`/games/${gameId}/questions`)
  return toQuestionDTO(question)
}

export async function getQuestionsForGame(gameId: string): Promise<QuestionDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const questions = await Question.find({ gameId }).sort({ displayOrder: 1 }).lean()
  const mediaIds = questions.flatMap((question) => question.mediaAssetId ? [question.mediaAssetId] : [])
  const media = await MediaAsset.find({ _id: { $in: mediaIds }, createdBy: user.id }).lean()
  const mediaMap = new Map(media.map((asset) => [idString(asset._id), toMediaAssetDTO(asset)]))
  return questions.map((question) => toQuestionDTO(
    question,
    question.mediaAssetId ? mediaMap.get(idString(question.mediaAssetId)) : undefined,
  ))
}

export async function updateQuestionOrder(gameId: string, questionIdsInOrder: string[]): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  questionIdsInOrder.forEach((id) => assertObjectId(id, 'question ID'))
  const ownedCount = await Question.countDocuments({ _id: { $in: questionIdsInOrder }, gameId })
  if (ownedCount !== questionIdsInOrder.length) throw new Error('Invalid question selection')
  await Question.bulkWrite(questionIdsInOrder.map((id, index) => ({
    updateOne: { filter: { _id: id, gameId }, update: { displayOrder: index + 1 } },
  })))
  revalidatePath(`/games/${gameId}/questions`)
}
