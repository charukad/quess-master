'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { Game, Team } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { assertObjectId, requireOwnedGame } from '@/lib/authorization'
import { toTeamDTO } from '@/lib/dto'
import type { TeamDTO } from '@/lib/types'

const teamNameSchema = z.string().trim().min(1, 'Team name is required').max(60)

export async function createTeam(gameId: string, name: string): Promise<TeamDTO> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const validName = teamNameSchema.parse(name)
  const displayOrder = await Team.countDocuments({ gameId }) + 1
  const team = await Team.create({ gameId, name: validName, displayOrder })
  await Game.updateOne({ _id: gameId }, { teamCount: displayOrder })
  revalidatePath(`/games/${gameId}`)
  revalidatePath(`/games/${gameId}/teams`)
  return toTeamDTO(team)
}

export async function getTeamsForGame(gameId: string): Promise<TeamDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  const teams = await Team.find({ gameId }).sort({ displayOrder: 1 }).lean()
  return teams.map(toTeamDTO)
}

export async function updateTeam(gameId: string, teamId: string, name: string): Promise<TeamDTO> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  assertObjectId(teamId, 'team ID')
  const validName = teamNameSchema.parse(name)
  const team = await Team.findOneAndUpdate(
    { _id: teamId, gameId },
    { name: validName },
    { new: true },
  ).lean()
  if (!team) throw new Error('Team not found')
  revalidatePath(`/games/${gameId}`)
  revalidatePath(`/games/${gameId}/teams`)
  revalidatePath(`/games/${gameId}/setup`)
  return toTeamDTO(team)
}

export async function updateTeamOrder(gameId: string, teamIdsInOrder: string[]): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(gameId, user.id)
  teamIdsInOrder.forEach((id) => assertObjectId(id, 'team ID'))
  const ownedCount = await Team.countDocuments({ _id: { $in: teamIdsInOrder }, gameId })
  if (ownedCount !== teamIdsInOrder.length) throw new Error('Invalid team selection')
  await Team.bulkWrite(teamIdsInOrder.map((id, index) => ({
    updateOne: { filter: { _id: id, gameId }, update: { displayOrder: index + 1 } },
  })))
  revalidatePath(`/games/${gameId}/teams`)
  revalidatePath(`/games/${gameId}/setup`)
}
