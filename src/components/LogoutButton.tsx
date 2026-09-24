'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Logout
    </button>
  )
}
