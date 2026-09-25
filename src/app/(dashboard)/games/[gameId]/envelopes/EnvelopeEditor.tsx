'use client'

import { useState } from 'react'
import { createEnvelope } from '@/actions/envelopes'
import type { EnvelopeDTO, QuestionDTO, TeamDTO } from '@/lib/types'
import { MailOpen, Plus } from 'lucide-react'

export default function EnvelopeEditor({
  initialEnvelopes,
  teams,
  questions,
  gameId,
}: {
  initialEnvelopes: EnvelopeDTO[]
  teams: TeamDTO[]
  questions: QuestionDTO[]
  gameId: string
}) {
  const [envelopes, setEnvelopes] = useState(initialEnvelopes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [envelopeNumber, setEnvelopeNumber] = useState(initialEnvelopes.length + 1)
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [questionId, setQuestionId] = useState(questions[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const assignedQuestionIds = new Set(envelopes.map((envelope) => envelope.questionId))

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const created = await createEnvelope(gameId, { teamId, questionId, envelopeNumber, title, message })
      setEnvelopes((current) => [...current, created])
      setEnvelopeNumber((current) => current + 1)
      setQuestionId(questions.find((question) => question.id !== questionId && !assignedQuestionIds.has(question.id))?.id ?? '')
      setTitle('')
      setMessage('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add envelope')
    } finally {
      setLoading(false)
    }
  }

  const canCreate = teams.length > 0 && questions.some((question) => !assignedQuestionIds.has(question.id))

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configured Envelopes</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {envelopes.map((envelope) => (
            <div key={envelope.id} className="quizza-panel flex flex-col items-center gap-2 p-4 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><MailOpen className="h-5 w-5" /></span>
              <span className="text-2xl font-black text-primary">{envelope.envelopeNumber}</span>
              <span className="truncate text-xs font-medium uppercase">{envelope.teamName}</span>
              <span className="truncate text-xs text-muted-foreground" title={envelope.title}>{envelope.title || 'Untitled'}</span>
            </div>
          ))}
          {envelopes.length === 0 && <div className="col-span-full rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No envelopes created.</div>}
        </div>
      </div>
      <div className="quizza-panel sticky top-24 h-fit p-6">
        <h3 className="mb-4 text-lg font-black">Add envelope</h3>
        {!canCreate ? <p className="text-sm text-muted-foreground">Add teams and unassigned questions before creating envelopes.</p> : (
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-medium">Number
                <input type="number" min={1} max={999} value={envelopeNumber} onChange={(event) => setEnvelopeNumber(Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3" />
              </label>
              <label className="space-y-2 text-sm font-medium">Team
                <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3">
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">Question
              <select value={questionId} onChange={(event) => setQuestionId(event.target.value)} required className="h-10 w-full rounded-md border bg-background px-3">
                {questions.filter((question) => !assignedQuestionIds.has(question.id)).map((question) => (
                  <option key={question.id} value={question.id}>Q{question.displayOrder}: {question.questionText.slice(0, 45)}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium">Title
              <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="e.g. Science Bonus" className="h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <label className="block space-y-2 text-sm font-medium">Reveal Message
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={1000} className="min-h-20 w-full rounded-md border bg-background px-3 py-2" />
            </label>
            <button disabled={loading} type="submit" className="quizza-button w-full">
              {!loading && <Plus className="h-4 w-4" />}{loading ? 'Saving…' : 'Add Envelope'}
            </button>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
