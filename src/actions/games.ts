'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { Game, GameSession } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { requireOwnedGame } from '@/lib/authorization'
import { toGameDTO } from '@/lib/dto'
import type { GameDTO } from '@/lib/types'

const gameSchema = z.object({
  name: z.string().trim().min(3, 'Game name must be at least 3 characters').max(100),
  description: z.string().trim().max(500).optional().default(''),
  gameType: z.enum(['STANDARD', 'ENVELOPE_GRID']).default('STANDARD'),
})

export async function createGame(formData: FormData): Promise<never> {
  await connectDB()
  const user = await getAuthUser()
  const input = gameSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    gameType: formData.get('gameType'),
  })

  const game = await Game.create({
    createdBy: user.id,
    name: input.name,
    description: input.description,
    gameType: input.gameType,
    status: 'DRAFT',
  })

  revalidatePath('/dashboard')
  revalidatePath('/games')
  redirect(`/games/${game._id.toString()}`)
}

export async function getGames(): Promise<GameDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  const games = await Game.find({ createdBy: user.id }).sort({ createdAt: -1 }).lean()
  return games.map(toGameDTO)
}

export async function getGameById(id: string): Promise<GameDTO> {
  await connectDB()
  const user = await getAuthUser()
  return toGameDTO(await requireOwnedGame(id, user.id))
}

export async function updateGame(id: string, formData: FormData): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(id, user.id)
  const input = gameSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    gameType: formData.get('gameType'),
  })
  const game = await Game.findByIdAndUpdate(id, input, { new: true }).lean()
  if (!game) throw new Error('Game not found')
  revalidatePath(`/games/${id}`)
  revalidatePath('/games')
}

export async function deleteGame(id: string): Promise<void> {
  await connectDB()
  const user = await getAuthUser()
  await requireOwnedGame(id, user.id)
  const activeSession = await GameSession.exists({ gameId: id, status: { $in: ['LIVE', 'PAUSED'] } })
  if (activeSession) throw new Error('A live or paused game cannot be deleted')
  await Game.deleteOne({ _id: id, createdBy: user.id })
  revalidatePath('/dashboard')
  revalidatePath('/games')
}
