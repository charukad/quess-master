import { getServerSession } from 'next-auth'
import { cache } from 'react'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Gets the current authenticated user's ID from the NextAuth session.
 * Throws an error if the user is not authenticated.
 */
export const getAuthUser = cache(async (): Promise<{ id: string; email: string }> => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.email) {
    throw new Error('Unauthorized')
  }

  return {
    id: session.user.id,
    email: session.user.email,
  }
})
