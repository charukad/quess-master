import { createGame } from '@/actions/games'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Grid3X3, ListChecks, Sparkles } from 'lucide-react'

export default function NewGamePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <Link href="/games" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to games</Link>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary">Create something memorable</p>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Start a new quiz</h1>
        <p className="mt-2 text-muted-foreground">Give it a name and choose how your audience will play.</p>
      </div>

      <form action={createGame} className="quizza-panel space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold">Game Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="flex h-12 w-full rounded-xl border border-input bg-white px-4 py-2 text-sm"
            placeholder="e.g. Friday Night Trivia"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-bold">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
          <textarea
            id="description"
            name="description"
            className="flex min-h-28 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm"
            placeholder="A short description of the event..."
          />
        </div>

        <div className="space-y-3">
          <label htmlFor="gameType" className="text-sm font-bold">Game Type</label>
          <select
            id="gameType"
            name="gameType"
            className="flex h-12 w-full rounded-xl border border-input bg-white px-4 py-2 text-sm"
          >
            <option value="STANDARD">Standard Turn-Based Quiz</option>
            <option value="ENVELOPE_GRID">Envelope Grid</option>
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f1f8] p-4"><ListChecks className="mb-2 h-5 w-5 text-[#7b2677]" /><p className="text-sm font-bold">Standard</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Teams answer questions in sequence.</p></div>
            <div className="rounded-2xl bg-[#fff5e5] p-4"><Grid3X3 className="mb-2 h-5 w-5 text-[#e76b18]" /><p className="text-sm font-bold">Envelope grid</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Reveal mapped challenges from a live grid.</p></div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex"><Sparkles className="h-4 w-4 text-[#f99522]" /> You can change these later</span>
          <button
            type="submit"
            className="quizza-button"
          >
            Create Game <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
