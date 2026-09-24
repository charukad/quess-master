'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import {
  Game,
  GameEvent,
  GameSession,
  GameSessionQuestion,
  GameSessionTeam,
  Question,
  QuestionAttempt,
  ScoreTransaction,
} from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { assertObjectId, requireOwnedSession } from '@/lib/authorization'
import { idString } from '@/lib/dto'
import type { HistoryEntryDTO, ScoreMap, SessionAttemptDTO } from '@/lib/types'

const actionIdSchema = z.string().uuid()

function validateIds(sessionId: string, teamId?: string, questionId?: string): void {
  assertObjectId(sessionId, 'session ID')
  if (teamId) assertObjectId(teamId, 'team ID')
  if (questionId) assertObjectId(questionId, 'question ID')
}

async function actionAlreadyApplied(actionId: string): Promise<boolean> {
  return Boolean(await GameEvent.exists({ actionId }))
}

export async function getSessionScores(sessionId: string): Promise<ScoreMap> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  const transactions = await ScoreTransaction.find({ gameSessionId: sessionId }).lean()
  return transactions.reduce<ScoreMap>((scores, transaction) => {
    const teamId = idString(transaction.teamId)
    scores[teamId] = (scores[teamId] ?? 0) + transaction.points
    return scores
  }, {})
}

export async function getSessionStats(sessionId: string): Promise<{ totalAttempts: number; totalCorrect: number }> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  const [totalAttempts, totalCorrect] = await Promise.all([
    QuestionAttempt.countDocuments({ gameSessionId: sessionId }),
    QuestionAttempt.countDocuments({ gameSessionId: sessionId, result: 'CORRECT' }),
  ])
  return { totalAttempts, totalCorrect }
}

export async function getQuestionAttempts(sessionId: string, questionId: string): Promise<SessionAttemptDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, undefined, questionId)
  const attempts = await QuestionAttempt.find({ gameSessionId: sessionId, questionId })
    .sort({ createdAt: 1 })
    .lean()
  return attempts.map((attempt) => ({
    id: idString(attempt._id),
    questionId: idString(attempt.questionId),
    teamId: idString(attempt.teamId),
    attemptNumber: attempt.attemptNumber,
    result: attempt.result as SessionAttemptDTO['result'],
    pointsAwarded: attempt.pointsAwarded,
    answeredAt: (attempt.answeredAt ?? attempt.createdAt).toISOString(),
  }))
}

async function advanceStandardSession(
  gameSessionId: string,
): Promise<void> {
  const gameSession = await GameSession.findById(gameSessionId)
  if (!gameSession) throw new Error('Session not found')
  const game = await Game.findById(gameSession.gameId)
  if (!game) throw new Error('Game not found')
  if (game.gameType !== 'STANDARD') return

  const nextQuestion = await GameSessionQuestion.findOne({
    gameSessionId,
    status: 'PENDING',
  }).sort({ displayOrder: 1 })

  if (!nextQuestion) {
    gameSession.status = 'COMPLETED'
    gameSession.completedAt = new Date()
    gameSession.currentQuestionId = undefined
    gameSession.timerStatus = 'STOPPED'
    game.status = 'COMPLETED'
    await Promise.all([gameSession.save(), game.save()])
    return
  }

  const teams = await GameSessionTeam.find({ gameSessionId }).sort({ displayOrder: 1 })
  const currentIndex = teams.findIndex((team) => idString(team.teamId) === idString(gameSession.originalQuestionTeamId))
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % teams.length : 0
  const nextTeam = teams[nextIndex]
  gameSession.currentQuestionId = nextQuestion.questionId
  gameSession.currentQuestionPosition = nextQuestion.displayOrder
  gameSession.timerDurationSeconds = nextQuestion.timeLimitSeconds
  gameSession.timerRemainingSeconds = nextQuestion.timeLimitSeconds
  gameSession.timerStatus = 'READY'
  if (nextTeam) {
    gameSession.currentTeamId = nextTeam.teamId
    gameSession.originalQuestionTeamId = nextTeam.teamId
    gameSession.currentTeamPosition = nextTeam.displayOrder
  }
  await gameSession.save()
}

export async function markAnswerCorrect(
  sessionId: string,
  teamId: string,
  questionId: string,
  actionId: string,
): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, teamId, questionId)
  actionIdSchema.parse(actionId)
  if (await actionAlreadyApplied(actionId)) return

  const [sessionQuestion, sessionTeam] = await Promise.all([
    GameSessionQuestion.findOne({ gameSessionId: sessionId, questionId }),
    GameSessionTeam.findOne({ gameSessionId: sessionId, teamId }),
  ])
  if (!sessionQuestion || !sessionTeam) throw new Error('Question or team is not part of this session')
  if (sessionQuestion.status !== 'PENDING') throw new Error('Question has already been completed')
  const attemptNumber = await QuestionAttempt.countDocuments({ gameSessionId: sessionId, questionId }) + 1
  await QuestionAttempt.findOneAndUpdate(
    { gameSessionId: sessionId, questionId, teamId, result: 'CORRECT' },
    { $setOnInsert: { attemptNumber, pointsAwarded: sessionQuestion.points, answeredAt: new Date() } },
    { upsert: true },
  )
  await ScoreTransaction.findOneAndUpdate(
    { actionId },
    { $setOnInsert: { gameSessionId: sessionId, teamId, questionId, points: sessionQuestion.points, transactionType: 'CORRECT_ANSWER', reason: 'Answered correctly', createdBy: user.id } },
    { upsert: true },
  )
  await GameSessionQuestion.updateOne(
    { _id: sessionQuestion._id, status: 'PENDING' },
    { status: 'COMPLETED' },
  )
  await GameEvent.findOneAndUpdate(
    { actionId },
    { $setOnInsert: { gameSessionId: sessionId, eventType: 'ANSWER_CORRECT', teamId, questionId, eventData: { points: sessionQuestion.points }, createdBy: user.id } },
    { upsert: true },
  )
  await advanceStandardSession(sessionId)
  await GameSession.updateOne({ _id: sessionId }, { $inc: { stateVersion: 1 } })
  revalidatePath(`/sessions/${sessionId}`)
}

export async function markAnswerWrong(
  sessionId: string,
  teamId: string,
  questionId: string,
  actionId: string,
): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, teamId, questionId)
  actionIdSchema.parse(actionId)
  if (await actionAlreadyApplied(actionId)) return
  const [sessionQuestion, sessionTeam] = await Promise.all([
    GameSessionQuestion.exists({ gameSessionId: sessionId, questionId, status: 'PENDING' }),
    GameSessionTeam.exists({ gameSessionId: sessionId, teamId }),
  ])
  if (!sessionQuestion || !sessionTeam) throw new Error('Question or team is not active in this session')
  const alreadyAttempted = await QuestionAttempt.exists({ gameSessionId: sessionId, questionId, teamId })
  if (alreadyAttempted) throw new Error('This team has already attempted the question')
  const attemptNumber = await QuestionAttempt.countDocuments({ gameSessionId: sessionId, questionId }) + 1
  await Promise.all([
    QuestionAttempt.create({
      gameSessionId: sessionId,
      questionId,
      teamId,
      attemptNumber,
      result: 'WRONG',
      pointsAwarded: 0,
      answeredAt: new Date(),
    }),
    GameEvent.create({
      gameSessionId: sessionId,
      eventType: 'ANSWER_WRONG',
      teamId,
      questionId,
      actionId,
      createdBy: user.id,
    }),
  ])
  revalidatePath(`/sessions/${sessionId}/play`)
}

export async function passQuestionToTeam(
  sessionId: string,
  newTeamId: string,
  actionId: string,
): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  const session = await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, newTeamId)
  actionIdSchema.parse(actionId)
  if (await actionAlreadyApplied(actionId)) return
  if (!session.currentQuestionId) throw new Error('No active question')
  const [team, attempted] = await Promise.all([
    GameSessionTeam.findOne({ gameSessionId: sessionId, teamId: newTeamId }).lean(),
    QuestionAttempt.exists({ gameSessionId: sessionId, questionId: session.currentQuestionId, teamId: newTeamId }),
  ])
  if (!team || attempted) throw new Error('Team is not eligible for this question')
  await Promise.all([
    GameSession.updateOne(
      { _id: sessionId, createdBy: user.id },
      { currentTeamId: newTeamId, currentTeamPosition: team.displayOrder, $inc: { stateVersion: 1 } },
    ),
    GameEvent.create({
      gameSessionId: sessionId,
      eventType: 'QUESTION_PASSED',
      teamId: newTeamId,
      questionId: session.currentQuestionId,
      actionId,
      createdBy: user.id,
    }),
  ])
  revalidatePath(`/sessions/${sessionId}/play`)
}

export async function selectRandomEligibleTeam(sessionId: string, actionId: string): Promise<string> {
  await connectDB()
  const user = await getAuthUser()
  const session = await requireOwnedSession(sessionId, user.id)
  actionIdSchema.parse(actionId)
  if (!session.currentQuestionId) throw new Error('No active question')
  const [teams, attempts] = await Promise.all([
    GameSessionTeam.find({ gameSessionId: sessionId }).lean(),
    QuestionAttempt.find({ gameSessionId: sessionId, questionId: session.currentQuestionId }).select('teamId').lean(),
  ])
  const attemptedIds = new Set(attempts.map((attempt) => idString(attempt.teamId)))
  const eligible = teams.filter((team) => !attemptedIds.has(idString(team.teamId)))
  if (eligible.length === 0) throw new Error('No eligible teams remain')
  const winner = eligible[Math.floor(Math.random() * eligible.length)]
  await passQuestionToTeam(sessionId, idString(winner.teamId), actionId)
  return winner.teamName
}

export async function closeQuestion(sessionId: string, questionId: string, actionId: string): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, undefined, questionId)
  actionIdSchema.parse(actionId)
  if (await actionAlreadyApplied(actionId)) return
  const result = await GameSessionQuestion.updateOne(
    { gameSessionId: sessionId, questionId, status: 'PENDING' },
    { status: 'SKIPPED' },
  )
  if (result.matchedCount !== 1) throw new Error('Question is not active')
  await GameEvent.findOneAndUpdate(
    { actionId },
    { $setOnInsert: { gameSessionId: sessionId, eventType: 'QUESTION_CLOSED', questionId, createdBy: user.id } },
    { upsert: true },
  )
  await advanceStandardSession(sessionId)
  await GameSession.updateOne({ _id: sessionId }, { $inc: { stateVersion: 1 } })
  revalidatePath(`/sessions/${sessionId}`)
}

export async function manualScoreAdjustment(
  sessionId: string,
  teamId: string,
  points: number,
  reason: string,
  actionId: string,
): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  validateIds(sessionId, teamId)
  actionIdSchema.parse(actionId)
  z.number().int().min(-100000).max(100000).parse(points)
  z.string().trim().min(1).max(300).parse(reason)
  if (await actionAlreadyApplied(actionId)) return
  const team = await GameSessionTeam.exists({ gameSessionId: sessionId, teamId })
  if (!team) throw new Error('Team is not part of this session')
  await Promise.all([
    ScoreTransaction.create({
      gameSessionId: sessionId,
      teamId,
      points,
      transactionType: 'MANUAL_ADJUSTMENT',
      reason,
      actionId,
      createdBy: user.id,
    }),
    GameEvent.create({
      gameSessionId: sessionId,
      eventType: 'SCORE_ADJUSTED',
      teamId,
      actionId,
      eventData: { points, reason },
      createdBy: user.id,
    }),
  ])
  revalidatePath(`/sessions/${sessionId}/play`)
}

export async function getSessionHistory(sessionId: string): Promise<HistoryEntryDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedSession(sessionId, user.id)
  const [events, transactions, teams, questions] = await Promise.all([
    GameEvent.find({ gameSessionId: sessionId }).lean(),
    ScoreTransaction.find({ gameSessionId: sessionId }).lean(),
    GameSessionTeam.find({ gameSessionId: sessionId }).lean(),
    Question.find({ _id: { $in: await GameSessionQuestion.find({ gameSessionId: sessionId }).distinct('questionId') } }).lean(),
  ])
  const teamMap = new Map(teams.map((team) => [idString(team.teamId), team.teamName]))
  const questionMap = new Map(questions.map((question) => [idString(question._id), question.questionText]))
  const eventRows: HistoryEntryDTO[] = events.map((event) => ({
    id: idString(event._id),
    kind: 'EVENT',
    type: event.eventType,
    reason: typeof event.eventData.message === 'string' ? event.eventData.message : 'Action recorded.',
    teamName: event.teamId ? teamMap.get(idString(event.teamId)) : undefined,
    questionText: event.questionId ? questionMap.get(idString(event.questionId)) : undefined,
    createdAt: event.createdAt.toISOString(),
  }))
  const scoreRows: HistoryEntryDTO[] = transactions.map((transaction) => ({
    id: idString(transaction._id),
    kind: 'SCORE',
    type: transaction.transactionType,
    reason: transaction.reason ?? 'Score updated.',
    points: transaction.points,
    teamName: teamMap.get(idString(transaction.teamId)),
    questionText: transaction.questionId ? questionMap.get(idString(transaction.questionId)) : undefined,
    createdAt: transaction.createdAt.toISOString(),
  }))
  return [...eventRows, ...scoreRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
