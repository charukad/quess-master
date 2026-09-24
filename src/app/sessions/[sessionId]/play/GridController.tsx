'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { completeSessionEnvelope, openSessionEnvelope, unlockSessionEnvelope } from '@/actions/envelopes'
import { closeQuestion, markAnswerCorrect, markAnswerWrong } from '@/lib/game-engine/core'
import { useSoundSettings } from '@/components/SoundProvider'
import type { LiveSessionDTO, QuestionDTO, ScoreMap } from '@/lib/types'

function EnvelopeQuestion({ question }: { question: QuestionDTO }) {
  return (
    <div className="flex w-full flex-col items-center">
      {question.media?.resourceType === 'image' && <div className="relative mb-5 h-56 w-full max-w-xl"><Image src={question.media.secureUrl} alt="Question media" fill unoptimized className="object-contain" /></div>}
      {question.media?.resourceType === 'audio' && <audio src={question.media.secureUrl} controls className="mb-5 w-full max-w-xl" />}
      {question.media?.resourceType === 'video' && <video src={question.media.secureUrl} controls className="mb-5 max-h-72 w-full max-w-xl" />}
      <h4 className="mb-8 text-4xl font-bold text-primary">{question.questionText}</h4>
      {question.answerType === 'MCQ' && <div className="mb-8 grid w-full max-w-xl grid-cols-2 gap-3">{question.options.map((option) => <div key={option.id} className="rounded-lg border p-3 text-left">{option.optionText}</div>)}</div>}
    </div>
  )
}

export default function GridController({ session, scores }: { session: LiveSessionDTO; scores: ScoreMap }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { playSound } = useSoundSettings()
  const envelopes = session.envelopes
  const teams = [...session.teams].sort((a, b) => a.displayOrder - b.displayOrder)
  const openedEnvelope = envelopes.find((item) => item.status === 'OPENED')
  const activeQuestion = openedEnvelope ? session.questions.find((question) => question.id === openedEnvelope.envelope.questionId) : undefined

  async function run(action: () => Promise<void>) {
    setLoading(true)
    setError('')
    try {
      await action()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = (envelopeId: string) => run(() => unlockSessionEnvelope(session.id, envelopeId))
  const handleOpen = (envelopeId: string) => run(async () => {
    playSound('reveal')
    await openSessionEnvelope(session.id, envelopeId)
  })
  const handleCorrect = () => openedEnvelope && activeQuestion && run(async () => {
    playSound('correct')
    await markAnswerCorrect(session.id, openedEnvelope.envelope.teamId, activeQuestion.id, crypto.randomUUID())
    await completeSessionEnvelope(session.id, openedEnvelope.envelopeId)
  })
  const handleWrong = () => openedEnvelope && activeQuestion && run(async () => {
    playSound('wrong')
    await markAnswerWrong(session.id, openedEnvelope.envelope.teamId, activeQuestion.id, crypto.randomUUID())
    await closeQuestion(session.id, activeQuestion.id, crypto.randomUUID())
    await completeSessionEnvelope(session.id, openedEnvelope.envelopeId)
  })

  const allComplete = envelopes.length > 0 && envelopes.every((envelope) => envelope.status === 'COMPLETED')
  if (allComplete) {
    return <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-12"><h2 className="text-3xl font-bold">All envelopes completed</h2><Link href={`/sessions/${session.id}/results`} className="rounded-md bg-primary px-5 py-3 text-primary-foreground">View results</Link></div>
  }

  return (
    <div className="grid flex-1 gap-8 md:grid-cols-[1fr_350px]">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {openedEnvelope && activeQuestion ? (
            <motion.div key={openedEnvelope.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex min-h-[560px] flex-col items-center justify-between text-center">
              <div className="w-full">
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">Envelope {openedEnvelope.envelope.envelopeNumber} · {openedEnvelope.envelope.title}</p>
                <h3 className="mb-6 text-3xl font-medium">{openedEnvelope.envelope.message}</h3>
                <hr className="mb-6" />
                <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">For {openedEnvelope.envelope.teamName} · {activeQuestion.points} points</p>
                <EnvelopeQuestion question={activeQuestion} />
              </div>
              <div className="flex w-full max-w-lg gap-4">
                <button onClick={handleCorrect} disabled={loading} className="flex-1 rounded-2xl bg-green-600 py-5 text-xl font-bold text-white disabled:opacity-50">✓ CORRECT</button>
                <button onClick={handleWrong} disabled={loading} className="flex-1 rounded-2xl bg-red-600 py-5 text-xl font-bold text-white disabled:opacity-50">✕ WRONG</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[560px]">
              <h3 className="mb-8 text-center text-2xl font-bold">Select an Envelope</h3>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                {envelopes.map((item) => (
                  <button
                    key={item.id}
                    disabled={loading || item.status === 'COMPLETED'}
                    onClick={() => item.status === 'LOCKED' ? handleUnlock(item.envelopeId) : handleOpen(item.envelopeId)}
                    className={`aspect-square rounded-2xl text-3xl font-bold shadow-sm transition-all disabled:cursor-not-allowed ${item.status === 'AVAILABLE' ? 'bg-primary text-primary-foreground hover:scale-105' : item.status === 'COMPLETED' ? 'border-2 border-dashed opacity-30' : 'bg-muted text-muted-foreground'}`}
                  >
                    {item.envelope.envelopeNumber}
                    <span className="mt-1 block text-xs font-normal uppercase">{item.status === 'LOCKED' ? 'Unlock' : item.status === 'AVAILABLE' ? 'Open' : item.status}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
      </div>
      <aside className="sticky top-8 h-fit rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 border-b pb-4 text-xl font-bold">Live Scoreboard</h3>
        <div className="space-y-3">{teams.map((team) => <div key={team.teamId} className="flex justify-between rounded-xl bg-muted/40 p-4"><span>{team.teamName}</span><strong className="text-2xl">{scores[team.teamId] ?? 0}</strong></div>)}</div>
      </aside>
    </div>
  )
}
