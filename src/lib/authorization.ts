import { Types } from 'mongoose'
import { Game, GameSession } from '@/lib/models'

export function assertObjectId(value: string, label = 'ID'): void {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`)
  }
}

export async function requireOwnedGame(gameId: string, userId: string) {
  assertObjectId(gameId, 'game ID')
  const game = await Game.findOne({ _id: gameId, createdBy: userId }).lean()
  if (!game) throw new Error('Game not found')
  return game
}

export async function requireOwnedSession(sessionId: string, userId: string) {
  assertObjectId(sessionId, 'session ID')
  const session = await GameSession.findOne({ _id: sessionId, createdBy: userId }).lean()
  if (!session) throw new Error('Session not found')
  return session
}
