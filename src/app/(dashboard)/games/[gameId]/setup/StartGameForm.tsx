'use client'

import { useActionState } from 'react'
import { startSession, type StartSessionState } from '@/actions/sessions'

const initialState: StartSessionState = { message: null }

export default function StartGameForm({ gameId, canStart }: { gameId: string; canStart: boolean }) {
  const [state, formAction, pending] = useActionState(startSession, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />
      {state.message && (
        <p role="alert" aria-live="polite" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!canStart || pending}
        className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Starting…' : '▶ Start Game Session'}
      </button>
    </form>
  )
}
