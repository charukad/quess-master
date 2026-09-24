'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import {
  Envelope,
  Game,
  GameEvent,
  GameSession,
  GameSessionQuestion,
  GameSessionTeam,
  MediaAsset,
  Question,
  SessionEnvelope,
  Team,
} from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { requireOwnedGame, requireOwnedSession } from '@/lib/authorization'
import { idString, toEnvelopeDTO, toMediaAssetDTO, toQuestionDTO } from '@/lib/dto'
import type { LiveSessionDTO, SessionEnvelopeDTO, SessionQuestionDTO, SessionTeamDTO } from '@/lib/types'

export async function createSessionAndStart(gameId: string): Promise<never> {
  await connectDB()
  const user = await getAuthUser()
  const game = await requireOwnedGame(gameId, user.id)
  const [teams, questions, envelopes] = await Promise.all([
    Team.find({ gameId }).sort({ displayOrder: 1 }).lean(),
    Question.find({ gameId }).sort({ displayOrder: 1 }).lean(),
    Envelope.find({ gameId }).sort({ displayOrder: 1 }).lean(),
  ])

  if (teams.length === 0) throw new Error('Add at least one team before starting')
  if (questions.length === 0) throw new Error('Add at least one question before starting')
  if (game.gameType === 'ENVELOPE_GRID' && envelopes.length === 0) {
    throw new Error('Add at least one envelope before starting')
  }

  const existingSession = await GameSession.findOne({ gameId, status: { $in: ['LIVE', 'PAUSED'] } })
  if (existingSession) redirect(`/sessions/${existingSession._id.toString()}/play`)

  const session = await GameSession.create({
    gameId,
    createdBy: user.id,
    status: 'LIVE',
    currentQuestionId: game.gameType === 'STANDARD' ? questions[0]._id : undefined,
    currentTeamId: teams[0]._id,
    originalQuestionTeamId: teams[0]._id,
    currentTeamPosition: 1,
    currentQuestionPosition: 1,
    timerStatus: 'READY',
    timerDurationSeconds: questions[0]?.timeLimitSeconds ?? 0,
    timerRemainingSeconds: questions[0]?.timeLimitSeconds ?? 0,
    startedAt: new Date(),
  })

  await Promise.all([
    GameSessionTeam.insertMany(teams.map((team) => ({
      gameSessionId: session._id,
      teamId: team._id,
      teamName: team.name,
      displayOrder: team.displayOrder,
    }))),
    GameSessionQuestion.insertMany(questions.map((question) => ({
      gameSessionId: session._id,
      questionId: question._id,
      displayOrder: question.displayOrder,
      points: question.points,
      timeLimitSeconds: question.timeLimitSeconds,
      status: 'PENDING',
    }))),
    envelopes.length > 0
      ? SessionEnvelope.insertMany(envelopes.map((envelope) => ({
          gameSessionId: session._id,
          envelopeId: envelope._id,
          status: 'LOCKED',
        })))
      : Promise.resolve(),
    GameEvent.create({
      gameSessionId: session._id,
      eventType: 'GAME_STARTED',
      eventData: { gameName: game.name },
      createdBy: user.id,
    }),
    Game.updateOne({ _id: gameId }, { status: 'LIVE' }),
  ])

  revalidatePath('/dashboard')
  redirect(`/sessions/${session._id.toString()}/play`)
}

export async function getLiveSession(sessionId: string): Promise<LiveSessionDTO> {
  await connectDB()
  const user = await getAuthUser()
  const session = await requireOwnedSession(sessionId, user.id)
  const [game, sessionTeams, sessionQuestions, sessionEnvelopes] = await Promise.all([
    Game.findOne({ _id: session.gameId, createdBy: user.id }).lean(),
    GameSessionTeam.find({ gameSessionId: sessionId }).sort({ displayOrder: 1 }).lean(),
    GameSessionQuestion.find({ gameSessionId: sessionId }).sort({ displayOrder: 1 }).lean(),
    SessionEnvelope.find({ gameSessionId: sessionId }).lean(),
  ])
  if (!game) throw new Error('Game not found')

  const questionIds = sessionQuestions.map((item) => item.questionId)
  const envelopeIds = sessionEnvelopes.map((item) => item.envelopeId)
  const [questions, envelopes] = await Promise.all([
    Question.find({ _id: { $in: questionIds }, gameId: game._id }).lean(),
    Envelope.find({ _id: { $in: envelopeIds }, gameId: game._id }).lean(),
  ])
  const mediaIds = questions.flatMap((question) => question.mediaAssetId ? [question.mediaAssetId] : [])
  const [media, teams] = await Promise.all([
    MediaAsset.find({ _id: { $in: mediaIds }, createdBy: user.id }).lean(),
    Team.find({ gameId: game._id }).lean(),
  ])

  const mediaMap = new Map(media.map((asset) => [idString(asset._id), toMediaAssetDTO(asset)]))
  const questionMap = new Map(questions.map((question) => [
    idString(question._id),
    toQuestionDTO(question, question.mediaAssetId ? mediaMap.get(idString(question.mediaAssetId)) : undefined),
  ]))
  const teamNameMap = new Map(teams.map((team) => [idString(team._id), team.name]))
  const sessionQuestionDTOs: SessionQuestionDTO[] = sessionQuestions.flatMap((item) => {
    const question = questionMap.get(idString(item.questionId))
    if (!question) return []
    return [{
      ...question,
      sessionQuestionId: idString(item._id),
      points: item.points,
      timeLimitSeconds: item.timeLimitSeconds,
      status: item.status as SessionQuestionDTO['status'],
    }]
  })
  const envelopeMap = new Map(envelopes.map((envelope) => [
    idString(envelope._id),
    toEnvelopeDTO(
      envelope,
      teamNameMap.get(idString(envelope.teamId)) ?? 'Unknown team',
      questionMap.get(idString(envelope.questionId))?.questionText ?? 'Unknown question',
    ),
  ]))
  const sessionEnvelopeDTOs: SessionEnvelopeDTO[] = sessionEnvelopes.flatMap((item) => {
    const envelope = envelopeMap.get(idString(item.envelopeId))
    if (!envelope) return []
    return [{
      id: idString(item._id),
      envelopeId: idString(item.envelopeId),
      status: item.status,
      envelope,
    }]
  })
  const teamDTOs: SessionTeamDTO[] = sessionTeams.map((team) => ({
    id: idString(team._id),
    teamId: idString(team.teamId),
    teamName: team.teamName,
    displayOrder: team.displayOrder,
  }))

  return {
    id: idString(session._id),
    status: session.status as LiveSessionDTO['status'],
    game: { id: idString(game._id), name: game.name, gameType: game.gameType },
    currentQuestionId: session.currentQuestionId ? idString(session.currentQuestionId) : undefined,
    currentTeamId: session.currentTeamId ? idString(session.currentTeamId) : undefined,
    originalQuestionTeamId: session.originalQuestionTeamId ? idString(session.originalQuestionTeamId) : undefined,
    currentQuestionPosition: session.currentQuestionPosition ?? 1,
    currentTeamPosition: session.currentTeamPosition ?? 1,
    timerStatus: session.timerStatus,
    timerDurationSeconds: session.timerDurationSeconds,
    timerRemainingSeconds: session.timerRemainingSeconds,
    stateVersion: session.stateVersion,
    startedAt: session.startedAt?.toISOString(),
    completedAt: session.completedAt?.toISOString(),
    teams: teamDTOs,
    questions: sessionQuestionDTOs,
    envelopes: sessionEnvelopeDTOs,
  }
}

export async function endSession(sessionId: string): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  const session = await requireOwnedSession(sessionId, user.id)
  await Promise.all([
    GameSession.updateOne(
      { _id: sessionId, createdBy: user.id },
      { status: 'COMPLETED', completedAt: new Date(), timerStatus: 'STOPPED', $inc: { stateVersion: 1 } },
    ),
    Game.updateOne({ _id: session.gameId, createdBy: user.id }, { status: 'COMPLETED' }),
    GameEvent.create({
      gameSessionId: sessionId,
      eventType: 'GAME_COMPLETED',
      createdBy: user.id,
    }),
  ])
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
}
