'use client'

import { useState } from 'react'
import { createQuestion, type CreateQuestionInput } from '@/actions/questions'
import type { MediaAssetDTO, QuestionDTO } from '@/lib/types'

interface EditableOption {
  optionText: string
  isCorrect: boolean
}

const emptyOptions = (): EditableOption[] => [
  { optionText: '', isCorrect: true },
  { optionText: '', isCorrect: false },
  { optionText: '', isCorrect: false },
  { optionText: '', isCorrect: false },
]

export default function QuestionsList({
  initialQuestions,
  gameId,
  mediaAssets,
}: {
  initialQuestions: QuestionDTO[]
  gameId: string
  mediaAssets: MediaAssetDTO[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [points, setPoints] = useState(10)
  const [time, setTime] = useState(30)
  const [answerType, setAnswerType] = useState<'MCQ' | 'MANUAL'>('MCQ')
  const [options, setOptions] = useState<EditableOption[]>(emptyOptions)
  const [expectedAnswer, setExpectedAnswer] = useState('')
  const [mediaAssetId, setMediaAssetId] = useState('')

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const payload: CreateQuestionInput = {
      questionText,
      points,
      timeLimitSeconds: time,
      answerType,
      mediaAssetId: mediaAssetId || undefined,
      expectedAnswer: answerType === 'MANUAL' ? expectedAnswer : undefined,
      options: answerType === 'MCQ' ? options.filter((option) => option.optionText.trim()) : [],
    }
    try {
      const created = await createQuestion(gameId, payload)
      setQuestions((current) => [...current, created])
      setQuestionText('')
      setExpectedAnswer('')
      setOptions(emptyOptions())
      setMediaAssetId('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add question')
    } finally {
      setLoading(false)
    }
  }

  function updateOption(index: number, patch: Partial<EditableOption>) {
    setOptions((current) => current.map((option, optionIndex) => {
      if ('isCorrect' in patch) return { ...option, isCorrect: optionIndex === index }
      return optionIndex === index ? { ...option, ...patch } : option
    }))
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          {questions.length === 0 ? <p className="text-sm text-muted-foreground">No questions added yet.</p> : (
            <ul className="space-y-4">
              {questions.map((question, index) => (
                <li key={question.id} className="flex flex-col rounded-md border bg-background p-4">
                  <span className="font-medium">{index + 1}. {question.questionText}</span>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-1">{question.answerType}</span>
                    <span className="rounded bg-muted px-2 py-1">{question.points} pts</span>
                    <span className="rounded bg-muted px-2 py-1">{question.timeLimitSeconds}s</span>
                    {question.mediaAssetId && <span className="rounded bg-primary/20 px-2 py-1 text-primary">Media attached</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="sticky top-20 h-fit rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-lg font-bold">Add Question</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">Question Text
            <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} required maxLength={2000} className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2 text-sm font-medium">Points
              <input type="number" min={0} max={100000} value={points} onChange={(event) => setPoints(Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <label className="space-y-2 text-sm font-medium">Time (seconds)
              <input type="number" min={0} max={3600} value={time} onChange={(event) => setTime(Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3" />
            </label>
          </div>
          <label className="block space-y-2 text-sm font-medium">Attach Media
            <select value={mediaAssetId} onChange={(event) => setMediaAssetId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3">
              <option value="">No media</option>
              {mediaAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.publicId} ({asset.resourceType})</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium">Answer Type
            <select value={answerType} onChange={(event) => setAnswerType(event.target.value as 'MCQ' | 'MANUAL')} className="h-10 w-full rounded-md border bg-background px-3">
              <option value="MCQ">Multiple Choice</option>
              <option value="MANUAL">Manual / Free Text</option>
            </select>
          </label>
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            {answerType === 'MCQ' ? options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input type="radio" name="correctAnswer" aria-label={`Mark option ${index + 1} correct`} checked={option.isCorrect} onChange={() => updateOption(index, { isCorrect: true })} className="h-5 w-5 accent-primary" />
                <input type="text" value={option.optionText} onChange={(event) => updateOption(index, { optionText: event.target.value })} placeholder={`Option ${index + 1}`} className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
            )) : (
              <label className="block space-y-2 text-sm font-medium">Expected Answer
                <textarea value={expectedAnswer} onChange={(event) => setExpectedAnswer(event.target.value)} maxLength={2000} className="min-h-20 w-full rounded-md border bg-background px-3 py-2" />
              </label>
            )}
          </div>
          <button disabled={loading} type="submit" className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Question'}
          </button>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </div>
  )
}
