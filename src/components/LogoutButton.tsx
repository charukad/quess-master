'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary sm:px-4"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  )
}
