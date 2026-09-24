'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { Envelope, Game, GameSession, Question, SessionEnvelope, Team } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { assertObjectId, requireOwnedGame, requireOwnedSession } from '@/lib/authorization'
import { idString, toEnvelopeDTO } from '@/lib/dto'
import type { EnvelopeDTO } from '@/lib/types'

const envelopeSchema = z.object({
  teamId: z.string(),
  questionId: z.string(),
  envelopeNumber: z.number().int().min(1).max(999),
  title: z.string().trim().max(100).optional().default(''),
  message: z.string().trim().min(1, 'Reveal message is required').max(1000),
})

export type CreateEnvelopeInput = z.infer<typeof envelopeSchema>

export async function createEnvelope(gameId: string, payload: CreateEnvelopeInput): Promise<EnvelopeDTO> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const input = envelopeSchema.parse(payload)
  assertObjectId(input.teamId, 'team ID')
  assertObjectId(input.questionId, 'question ID')

  const [team, question] = await Promise.all([
    Team.findOne({ _id: input.teamId, gameId }).lean(),
    Question.findOne({ _id: input.questionId, gameId }).lean(),
  ])
  if (!team || !question) throw new Error('Team or question does not belong to this game')

  const existingQuestion = await Envelope.exists({ gameId, questionId: input.questionId })
  if (existingQuestion) throw new Error('That question is already assigned to an envelope')

  const envelope = await Envelope.create({
    gameId,
    ...input,
    displayOrder: input.envelopeNumber,
  })
  revalidatePath(`/games/${gameId}/envelopes`)
  return toEnvelopeDTO(envelope, team.name, question.questionText)
}

export async function getEnvelopesForGame(gameId: string): Promise<EnvelopeDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const envelopes = await Envelope.find({ gameId }).sort({ envelopeNumber: 1 }).lean()
  const teamIds = envelopes.map((envelope) => envelope.teamId)
  const questionIds = envelopes.map((envelope) => envelope.questionId)
  const [teams, questions] = await Promise.all([
    Team.find({ _id: { $in: teamIds }, gameId }).lean(),
    Question.find({ _id: { $in: questionIds }, gameId }).lean(),
  ])
  const teamMap = new Map(teams.map((team) => [idString(team._id), team.name]))
  const questionMap = new Map(questions.map((question) => [idString(question._id), question.questionText]))
  return envelopes.map((envelope) => toEnvelopeDTO(
    envelope,
    teamMap.get(idString(envelope.teamId)) ?? 'Unknown team',
    questionMap.get(idString(envelope.questionId)) ?? 'Unknown question',
  ))
}

async function updateSessionEnvelope(
  sessionId: string,
  envelopeId: string,
  status: 'AVAILABLE' | 'OPENED' | 'COMPLETED',
): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  const session = await requireOwnedSession(sessionId, user.id)
  assertObjectId(envelopeId, 'envelope ID')
  const update: Record<string, string | Date> = { status }
  if (status === 'OPENED') update.openedAt = new Date()
  if (status === 'COMPLETED') update.completedAt = new Date()
  const result = await SessionEnvelope.updateOne({ gameSessionId: sessionId, envelopeId }, update)
  if (result.matchedCount !== 1) throw new Error('Session envelope not found')
  if (status === 'COMPLETED') {
    const remaining = await SessionEnvelope.countDocuments({ gameSessionId: sessionId, status: { $ne: 'COMPLETED' } })
    if (remaining === 0) {
      await Promise.all([
        GameSession.updateOne({ _id: sessionId }, { status: 'COMPLETED', completedAt: new Date(), timerStatus: 'STOPPED', $inc: { stateVersion: 1 } }),
        Game.updateOne({ _id: session.gameId, createdBy: user.id }, { status: 'COMPLETED' }),
      ])
    }
  }
  revalidatePath(`/sessions/${sessionId}/play`)
}

export async function unlockSessionEnvelope(sessionId: string, envelopeId: string): Promise<void> {
  return updateSessionEnvelope(sessionId, envelopeId, 'AVAILABLE')
}

export async function openSessionEnvelope(sessionId: string, envelopeId: string): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  const alreadyOpen = await SessionEnvelope.exists({ gameSessionId: sessionId, status: 'OPENED' })
  if (alreadyOpen) throw new Error('Complete the open envelope first')
  return updateSessionEnvelope(sessionId, envelopeId, 'OPENED')
}

export async function completeSessionEnvelope(sessionId: string, envelopeId: string): Promise<void> {
  return updateSessionEnvelope(sessionId, envelopeId, 'COMPLETED')
}
