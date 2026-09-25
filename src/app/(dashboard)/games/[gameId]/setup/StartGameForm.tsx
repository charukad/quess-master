'use client'

import { useActionState } from 'react'
import { startSession, type StartSessionState } from '@/actions/sessions'
import { Play } from 'lucide-react'

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
        className="quizza-button h-14 w-full text-base disabled:cursor-not-allowed"
      >
        {!pending && <Play className="h-5 w-5 fill-current" />}{pending ? 'Starting…' : 'Start Game Session'}
      </button>
    </form>
  )
}
