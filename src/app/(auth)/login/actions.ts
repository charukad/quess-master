'use server'

import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
})

export async function signUp(email: string, password: string) {
  await connectDB()

  const credentials = credentialsSchema.parse({ email, password })

  const existingUser = await User.findOne({ email: credentials.email })
  if (existingUser) {
    throw new Error('An account with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(credentials.password, 12)

  const user = await User.create({
    email: credentials.email,
    password: hashedPassword,
    displayName: credentials.email.split('@')[0],
  })

  return { id: user._id.toString(), email: user.email }
}
