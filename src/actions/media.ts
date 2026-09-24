'use server'

import { v2 as cloudinary } from 'cloudinary'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { MediaAsset } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'
import { toMediaAssetDTO } from '@/lib/dto'
import type { MediaAssetDTO } from '@/lib/types'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const mediaPayloadSchema = z.object({
  publicId: z.string().min(1).max(500),
  secureUrl: z.url(),
  resourceType: z.string().min(1).max(30),
  format: z.string().max(30).optional(),
  bytes: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().nonnegative().optional(),
})

export type MediaUploadPayload = z.infer<typeof mediaPayloadSchema>

export async function getUploadSignature() {
  await getAuthUser()
  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'quiz-master'
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  )
  return { timestamp, signature, folder, apiKey: process.env.CLOUDINARY_API_KEY! }
}

export async function saveMediaAsset(payload: MediaUploadPayload): Promise<MediaAssetDTO> {
  await connectDB()
  const user = await getAuthUser()
  const input = mediaPayloadSchema.parse(payload)
  const asset = await MediaAsset.create({ createdBy: user.id, ...input })
  revalidatePath('/media')
  return toMediaAssetDTO(asset)
}

export async function getMediaAssets(): Promise<MediaAssetDTO[]> {
  await connectDB()
  const user = await getAuthUser()
  const assets = await MediaAsset.find({ createdBy: user.id }).sort({ createdAt: -1 }).lean()
  return assets.map(toMediaAssetDTO)
}
