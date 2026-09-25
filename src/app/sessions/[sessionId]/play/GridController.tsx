'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Eye } from 'lucide-react'
import { completeSessionEnvelope, openSessionEnvelope, unlockSessionEnvelope } from '@/actions/envelopes'
import { closeQuestion, markAnswerCorrect, markAnswerWrong } from '@/lib/game-engine/core'
import { useSoundSettings } from '@/components/SoundProvider'
import { AnswerFeedback } from '@/components/AnswerFeedback'
import type { LiveSessionDTO, QuestionDTO, ScoreMap } from '@/lib/types'

function EnvelopeQuestion({ question, selectedOptionId, loading, onOptionSelect, showManualAnswer, onReveal }: {
  question: QuestionDTO
  selectedOptionId: string | null
  loading: boolean
  onOptionSelect: (option: QuestionDTO['options'][number]) => void
  showManualAnswer: boolean
  onReveal: () => void
}) {
  return (
    <div className="flex w-full flex-col items-center">
      {question.media?.resourceType === 'image' && <div className="relative mb-5 h-56 w-full max-w-xl"><Image src={question.media.secureUrl} alt="Question media" fill sizes="(max-width: 768px) 100vw, 576px" className="object-contain" /></div>}
      {question.media?.resourceType === 'audio' && <audio src={question.media.secureUrl} controls className="mb-5 w-full max-w-xl" />}
      {question.media?.resourceType === 'video' && <video src={question.media.secureUrl} controls className="mb-5 max-h-72 w-full max-w-xl" />}
      <h4 className="mb-8 text-4xl font-bold text-primary">{question.questionText}</h4>
      {question.answerType === 'MCQ' && <div className="mb-8 grid w-full max-w-xl grid-cols-2 gap-3">{question.options.map((option, index) => {
        const revealed = selectedOptionId !== null
        const selectedWrong = selectedOptionId === option.id && !option.isCorrect
        const revealedCorrect = revealed && option.isCorrect
        return <button key={option.id} type="button" aria-label={`Answer ${option.optionText}`} disabled={loading || revealed} onClick={() => onOptionSelect(option)} className={`min-h-16 rounded-2xl border-2 p-3 text-left font-bold transition-all disabled:cursor-default ${revealedCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : selectedWrong ? 'border-red-500 bg-red-50 text-red-800' : revealed ? 'bg-muted/30 opacity-45' : 'bg-white hover:-translate-y-1 hover:border-primary/40 hover:shadow-md'}`}><span className="mr-2 text-xs font-black text-primary">{String.fromCharCode(65 + index)}</span>{option.optionText}{revealedCorrect && <span className="float-right">✓</span>}{selectedWrong && <span className="float-right">✕</span>}</button>
      })}</div>}
      {question.answerType === 'MANUAL' && question.expectedAnswer && (
        <div className="mb-8">
          {!showManualAnswer ? <button type="button" onClick={onReveal} className="quizza-button-secondary"><Eye className="h-4 w-4" /> Reveal Answer</button> : <div className="animate-in zoom-in-95 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-left duration-300"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Expected answer</p><p className="mt-1 text-lg font-black text-foreground">{question.expectedAnswer}</p></div>}
        </div>
      )}
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
  const answerKey = openedEnvelope?.id ?? 'grid'
  const [answerState, setAnswerState] = useState<{ key: string; selectedOptionId: string | null; feedback: 'correct' | 'wrong' | null; showManualAnswer: boolean }>({ key: '', selectedOptionId: null, feedback: null, showManualAnswer: false })
  const selectedOptionId = answerState.key === answerKey ? answerState.selectedOptionId : null
  const answerFeedback = answerState.key === answerKey ? answerState.feedback : null
  const showManualAnswer = answerState.key === answerKey ? answerState.showManualAnswer : false

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
  const handleOptionSelect = (option: QuestionDTO['options'][number]) => openedEnvelope && activeQuestion && !selectedOptionId && run(async () => {
    const result = option.isCorrect ? 'correct' : 'wrong'
    setAnswerState({ key: answerKey, selectedOptionId: option.id, feedback: result, showManualAnswer: false })
    playSound(result)
    await new Promise((resolve) => window.setTimeout(resolve, option.isCorrect ? 1100 : 700))
    setAnswerState((current) => current.key === answerKey ? { ...current, feedback: null } : current)
    if (!option.isCorrect) await new Promise((resolve) => window.setTimeout(resolve, 550))
    if (option.isCorrect) {
      await markAnswerCorrect(session.id, openedEnvelope.envelope.teamId, activeQuestion.id, crypto.randomUUID())
    } else {
      await markAnswerWrong(session.id, openedEnvelope.envelope.teamId, activeQuestion.id, crypto.randomUUID())
      await closeQuestion(session.id, activeQuestion.id, crypto.randomUUID())
    }
    await completeSessionEnvelope(session.id, openedEnvelope.envelopeId)
  })

  const allComplete = envelopes.length > 0 && envelopes.every((envelope) => envelope.status === 'COMPLETED')
  if (allComplete) {
    return <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-12"><h2 className="text-3xl font-bold">All envelopes completed</h2><Link href={`/sessions/${session.id}/results`} className="rounded-md bg-primary px-5 py-3 text-primary-foreground">View results</Link></div>
  }

  return (
    <div className="grid flex-1 gap-8 md:grid-cols-[1fr_350px]">
      <div className="quizza-panel relative overflow-hidden p-8">
        <AnswerFeedback result={answerFeedback} />
        {openedEnvelope && activeQuestion ? (
            <div key={openedEnvelope.id} className="animate-in fade-in zoom-in-95 flex min-h-[560px] flex-col items-center justify-between text-center duration-300">
              <div className="w-full">
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">Envelope {openedEnvelope.envelope.envelopeNumber} · {openedEnvelope.envelope.title}</p>
                <h3 className="mb-6 text-3xl font-medium">{openedEnvelope.envelope.message}</h3>
                <hr className="mb-6" />
                <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">For {openedEnvelope.envelope.teamName} · {activeQuestion.points} points</p>
                <EnvelopeQuestion question={activeQuestion} selectedOptionId={selectedOptionId} loading={loading} onOptionSelect={handleOptionSelect} showManualAnswer={showManualAnswer} onReveal={() => { setAnswerState({ key: answerKey, selectedOptionId: null, feedback: null, showManualAnswer: true }); playSound('reveal') }} />
              </div>
              {activeQuestion.answerType === 'MANUAL' && <div className="flex w-full max-w-lg gap-4">
                <button onClick={handleCorrect} disabled={loading} className="flex-1 rounded-2xl bg-green-600 py-5 text-xl font-bold text-white disabled:opacity-50">✓ CORRECT</button>
                <button onClick={handleWrong} disabled={loading} className="flex-1 rounded-2xl bg-red-600 py-5 text-xl font-bold text-white disabled:opacity-50">✕ WRONG</button>
              </div>}
            </div>
          ) : (
            <div key="grid" className="animate-in fade-in min-h-[560px] duration-300">
              <div className="mb-7 text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Team envelope board</p><h3 className="mt-2 text-2xl font-black">Choose from a team window</h3><p className="mt-1 text-sm text-muted-foreground">Every section contains only the envelopes assigned to that team.</p></div>
              <div className={`grid gap-5 ${teams.length > 1 ? 'lg:grid-cols-2' : ''}`}>
                {teams.map((team, teamIndex) => {
                  const teamEnvelopes = envelopes.filter((item) => item.envelope.teamId === team.teamId)
                  return (
                    <section key={team.teamId} className="overflow-hidden rounded-3xl border bg-[#fbf9fc]">
                      <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${teamIndex % 2 === 0 ? 'bg-gradient-to-r from-[#fff0f5] to-[#fff7df]' : 'bg-gradient-to-r from-[#f5edf7] to-[#fff0f5]'}`}>
                        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Team {teamIndex + 1}</p><h4 className="mt-0.5 text-lg font-black">{team.teamName}</h4></div>
                        <div className="text-right"><p className="text-2xl font-black text-primary">{scores[team.teamId] ?? 0}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">points</p></div>
                      </div>
                      <div className="grid min-h-40 grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                        {teamEnvelopes.map((item) => (
                          <button
                            key={item.id}
                            disabled={loading || item.status === 'COMPLETED'}
                            onClick={() => item.status === 'LOCKED' ? handleUnlock(item.envelopeId) : handleOpen(item.envelopeId)}
                            className={`aspect-square rounded-2xl text-3xl font-black shadow-sm transition-all disabled:cursor-not-allowed ${item.status === 'AVAILABLE' ? 'bg-primary text-primary-foreground hover:-translate-y-1 hover:shadow-lg' : item.status === 'COMPLETED' ? 'border-2 border-dashed bg-white opacity-35' : 'border bg-white text-muted-foreground hover:border-primary/25'}`}
                          >
                            {item.envelope.envelopeNumber}
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider">{item.status === 'LOCKED' ? 'Unlock' : item.status === 'AVAILABLE' ? 'Open' : item.status}</span>
                          </button>
                        ))}
                        {teamEnvelopes.length === 0 && <div className="col-span-full grid min-h-32 place-items-center rounded-2xl border border-dashed bg-white text-center text-xs text-muted-foreground">No envelopes assigned</div>}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          )}
        {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
      </div>
      <aside className="quizza-panel sticky top-8 h-fit p-6">
        <h3 className="mb-4 border-b pb-4 text-xl font-bold">Live Scoreboard</h3>
        <div className="space-y-3">{teams.map((team) => <div key={team.teamId} className="flex justify-between rounded-xl bg-muted/40 p-4"><span>{team.teamName}</span><strong className="text-2xl">{scores[team.teamId] ?? 0}</strong></div>)}</div>
      </aside>
    </div>
  )
}
