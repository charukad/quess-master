'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  closeQuestion,
  manualScoreAdjustment,
  markAnswerCorrect,
  markAnswerWrong,
  passQuestionToTeam,
  selectRandomEligibleTeam,
} from '@/lib/game-engine/core'
import { useSoundSettings } from '@/components/SoundProvider'
import { AnswerFeedback } from '@/components/AnswerFeedback'
import { Eye } from 'lucide-react'
import type { LiveSessionDTO, QuestionDTO, ScoreMap, SessionAttemptDTO } from '@/lib/types'

function QuestionTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (seconds <= 0) return
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [seconds])
  return <span className={remaining === 0 ? 'font-bold text-destructive' : ''}>{remaining}s</span>
}

function QuestionMedia({ question }: { question: QuestionDTO }) {
  if (!question.media) return null
  if (question.media.resourceType === 'image') {
    return <div className="relative mb-6 h-64 w-full max-w-2xl"><Image src={question.media.secureUrl} alt="Question media" fill sizes="(max-width: 768px) 100vw, 672px" className="rounded-xl object-contain" /></div>
  }
  if (question.media.resourceType === 'audio') return <audio src={question.media.secureUrl} controls className="mb-6 w-full max-w-xl" />
  if (question.media.resourceType === 'video') return <video src={question.media.secureUrl} controls className="mb-6 max-h-80 w-full max-w-2xl rounded-xl" />
  return null
}

export default function GameController({ session, scores, attempts }: {
  session: LiveSessionDTO
  scores: ScoreMap
  attempts: SessionAttemptDTO[]
}) {
  const [loading, setLoading] = useState(false)
  const [showWheel, setShowWheel] = useState(false)
  const [wheelWinner, setWheelWinner] = useState('')
  const [error, setError] = useState('')
  const { playSound } = useSoundSettings()
  const teams = [...session.teams].sort((a, b) => a.displayOrder - b.displayOrder)
  const currentQuestion = session.questions.find((question) => question.id === session.currentQuestionId)
  const currentTeam = teams.find((team) => team.teamId === session.currentTeamId)
  const attemptedTeamIds = new Set(attempts.map((attempt) => attempt.teamId))
  const hasCurrentTeamAttempted = currentTeam ? attemptedTeamIds.has(currentTeam.teamId) : false
  const answerKey = `${currentQuestion?.id ?? 'none'}:${currentTeam?.teamId ?? 'none'}`
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

  const handleCorrect = () => currentQuestion && currentTeam && run(async () => {
    playSound('correct')
    await markAnswerCorrect(session.id, currentTeam.teamId, currentQuestion.id, crypto.randomUUID())
  })

  const handleWrong = () => currentQuestion && currentTeam && run(async () => {
    playSound('wrong')
    await markAnswerWrong(session.id, currentTeam.teamId, currentQuestion.id, crypto.randomUUID())
  })

  const handleOptionSelect = (option: QuestionDTO['options'][number]) => currentQuestion && currentTeam && !selectedOptionId && run(async () => {
    const result = option.isCorrect ? 'correct' : 'wrong'
    setAnswerState({ key: answerKey, selectedOptionId: option.id, feedback: result, showManualAnswer: false })
    playSound(result)
    await new Promise((resolve) => window.setTimeout(resolve, option.isCorrect ? 1100 : 700))
    setAnswerState((current) => current.key === answerKey ? { ...current, feedback: null } : current)
    if (option.isCorrect) {
      await markAnswerCorrect(session.id, currentTeam.teamId, currentQuestion.id, crypto.randomUUID())
    } else {
      await markAnswerWrong(session.id, currentTeam.teamId, currentQuestion.id, crypto.randomUUID())
    }
  })

  const handlePass = () => run(async () => {
    if (!currentTeam) throw new Error('No active team')
    const currentIndex = teams.findIndex((team) => team.teamId === currentTeam.teamId)
    const nextTeam = Array.from({ length: teams.length - 1 }, (_, offset) => teams[(currentIndex + offset + 1) % teams.length])
      .find((team) => !attemptedTeamIds.has(team.teamId))
    if (!nextTeam) throw new Error('No eligible teams remain')
    await passQuestionToTeam(session.id, nextTeam.teamId, crypto.randomUUID())
  })

  const handleWheel = () => run(async () => {
    setShowWheel(true)
    setWheelWinner('')
    playSound('wheel')
    try {
      const winner = await selectRandomEligibleTeam(session.id, crypto.randomUUID())
      setWheelWinner(winner)
    } finally {
      setShowWheel(false)
    }
  })

  const handleClose = () => currentQuestion && run(() => closeQuestion(session.id, currentQuestion.id, crypto.randomUUID()))

  const adjustScore = (teamId: string, points: number) => run(() => manualScoreAdjustment(
    session.id,
    teamId,
    points,
    points > 0 ? 'Game master bonus' : 'Game master deduction',
    crypto.randomUUID(),
  ))

  if (!currentQuestion || !currentTeam) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-12 text-center">
        <h2 className="text-3xl font-bold">Game complete</h2>
        <Link href={`/sessions/${session.id}/results`} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground">View results</Link>
      </div>
    )
  }

  return (
    <div className="grid flex-1 gap-8 md:grid-cols-[1fr_350px]">
      <div className="flex flex-col gap-6">
        <div key={currentTeam.teamId} className="animate-in fade-in slide-in-from-top-2 relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-r from-[#fff6df] via-[#fff0f5] to-[#f5edf7] p-8 text-center duration-300">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">Current Team</p>
          <h2 className="text-5xl font-extrabold">{currentTeam.teamName}</h2>
          {hasCurrentTeamAttempted && <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">INCORRECT</span>}
        </div>
        <div className="quizza-panel relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8 text-center">
          <AnswerFeedback result={answerFeedback} />
          {showWheel ? (
              <div key="wheel" className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-6 duration-300">
                <div className="h-32 w-32 animate-spin rounded-full border-8 border-primary border-t-transparent" />
                <h3 className="text-2xl font-bold">Spinning the wheel…</h3>
              </div>
            ) : (
              <div key={currentQuestion.id} className="animate-in fade-in slide-in-from-right-2 flex w-full flex-col items-center duration-300">
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Question {session.currentQuestionPosition} · {currentQuestion.points} points · <QuestionTimer seconds={currentQuestion.timeLimitSeconds} />
                </p>
                <QuestionMedia question={currentQuestion} />
                <h3 className="mb-8 text-4xl font-medium">{currentQuestion.questionText}</h3>
                {currentQuestion.answerType === 'MCQ' && (
                  <div className="mb-8 grid w-full max-w-2xl grid-cols-2 gap-3">
                    {currentQuestion.options.map((option) => {
                      const revealed = selectedOptionId !== null
                      const selectedWrong = selectedOptionId === option.id && !option.isCorrect
                      const revealedCorrect = revealed && option.isCorrect
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-label={`Answer ${option.optionText}`}
                          disabled={loading || hasCurrentTeamAttempted || revealed}
                          onClick={() => handleOptionSelect(option)}
                          className={`group min-h-20 rounded-2xl border-2 p-4 text-left text-base font-bold transition-all disabled:cursor-default ${revealedCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_8px_28px_rgba(16,185,129,.18)]' : selectedWrong ? 'border-red-500 bg-red-50 text-red-800' : revealed ? 'border-border bg-muted/30 opacity-45' : 'border-border bg-white hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg'}`}
                        >
                          <span className="mr-3 inline-grid h-8 w-8 place-items-center rounded-xl bg-muted text-xs font-black group-hover:bg-primary/10 group-hover:text-primary">{String.fromCharCode(65 + currentQuestion.options.indexOf(option))}</span>
                          {option.optionText}
                          {revealedCorrect && <span className="float-right text-emerald-600">✓</span>}
                          {selectedWrong && <span className="float-right text-red-600">✕</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {currentQuestion.answerType === 'MANUAL' && currentQuestion.expectedAnswer && (
                  <div className="mb-8">
                    {!showManualAnswer ? (
                      <button type="button" onClick={() => { setAnswerState({ key: answerKey, selectedOptionId: null, feedback: null, showManualAnswer: true }); playSound('reveal') }} className="quizza-button-secondary"><Eye className="h-4 w-4" /> Reveal Answer</button>
                    ) : (
                      <div className="animate-in zoom-in-95 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-left duration-300"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Expected answer</p><p className="mt-1 text-lg font-black text-foreground">{currentQuestion.expectedAnswer}</p></div>
                    )}
                  </div>
                )}
                {!hasCurrentTeamAttempted && currentQuestion.answerType === 'MANUAL' ? (
                  <div className="flex gap-4">
                    <button onClick={handleCorrect} disabled={loading} className="rounded-2xl bg-green-600 px-10 py-5 text-xl font-bold text-white disabled:opacity-50">✓ CORRECT</button>
                    <button onClick={handleWrong} disabled={loading} className="rounded-2xl bg-red-600 px-10 py-5 text-xl font-bold text-white disabled:opacity-50">✕ WRONG</button>
                  </div>
                ) : hasCurrentTeamAttempted ? (
                  <div className="flex w-full max-w-md flex-col gap-3">
                    <p className="font-bold text-destructive">Answer incorrect. What next?</p>
                    <button onClick={handlePass} disabled={loading} className="rounded-xl bg-secondary py-4 font-bold">Pass to Next Team</button>
                    <button onClick={handleWheel} disabled={loading} className="rounded-xl bg-amber-500 py-4 font-bold text-white">Spin the Wheel</button>
                    <button onClick={handleClose} disabled={loading} className="rounded-xl border-2 py-4 font-bold text-muted-foreground">Close Question</button>
                  </div>
                ) : null}
                {wheelWinner && <p className="mt-4 font-bold text-primary">Selected: {wheelWinner}</p>}
                {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
              </div>
            )}
        </div>
      </div>
      <aside className="quizza-panel sticky top-8 h-fit p-6">
        <h3 className="mb-4 border-b pb-4 text-xl font-bold">Live Scoreboard</h3>
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.teamId} className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
              <span className="font-medium">{team.teamName}</span>
              <span className="flex items-center gap-2">
                <button aria-label={`Deduct 5 points from ${team.teamName}`} onClick={() => adjustScore(team.teamId, -5)} disabled={loading} className="rounded border px-2">−</button>
                <strong className="min-w-12 text-center text-2xl">{scores[team.teamId] ?? 0}</strong>
                <button aria-label={`Add 5 points to ${team.teamName}`} onClick={() => adjustScore(team.teamId, 5)} disabled={loading} className="rounded border px-2">+</button>
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
