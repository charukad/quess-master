'use client'

import { useState } from 'react'
import { LoaderCircle, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteGame } from '@/actions/games'

export default function DeleteGameButton({ gameId, gameName }: { gameId: string; gameName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await deleteGame(gameId)
      router.push('/games')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete game')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-destructive/25 bg-white px-4 text-sm font-bold text-destructive transition hover:bg-destructive/5"><Trash2 className="h-4 w-4" /> Delete game</button>
  }

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.035] p-4">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-bold text-destructive">Permanently delete this game?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This removes its teams, questions, envelopes, completed sessions, scores, and history. A live or paused game cannot be deleted.</p></div>
        <button type="button" onClick={() => { setConfirming(false); setConfirmation(''); setError('') }} aria-label="Cancel game deletion" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-white text-muted-foreground"><X className="h-4 w-4" /></button>
      </div>
      <label className="mt-4 block space-y-2 text-xs font-bold">Type <span className="text-foreground">{gameName}</span> to confirm
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium" />
      </label>
      <button type="button" onClick={handleDelete} disabled={confirmation !== gameName || deleting} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
        {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deleting ? 'Deleting…' : 'Delete permanently'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
