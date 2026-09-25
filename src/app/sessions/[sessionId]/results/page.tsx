import Link from 'next/link'
import { getLiveSession } from '@/actions/sessions'
import { getSessionScores, getSessionStats } from '@/lib/game-engine/core'
import { BarChart3, History, LayoutDashboard, PartyPopper } from 'lucide-react'
import { QuizzaLogo } from '@/components/QuizzaLogo'

export default async function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const [session, scores, stats] = await Promise.all([
    getLiveSession(sessionId),
    getSessionScores(sessionId),
    getSessionStats(sessionId),
  ])
  const teams = [...session.teams].sort((a, b) => (scores[b.teamId] ?? 0) - (scores[a.teamId] ?? 0))

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center space-y-12 p-5 text-center sm:p-8">
      <div className="absolute left-6 top-6"><QuizzaLogo href="/dashboard" compact /></div>
      <div>
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><PartyPopper className="h-7 w-7" /></span>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primary">That’s a wrap</p>
        <h1 className="mb-4 text-5xl font-black tracking-tight brand-text-gradient">Game Completed!</h1>
        <p className="text-xl text-muted-foreground">Final Results for {session.game.name}</p>
      </div>
      <div className="mx-auto grid h-64 max-w-3xl grid-cols-3 items-end gap-8">
        {teams[1] && <div className="relative flex h-4/5 flex-col justify-end rounded-t-2xl bg-muted/50 p-6"><span className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl">🥈</span><h2 className="truncate text-xl font-bold">{teams[1].teamName}</h2><p className="text-2xl font-black">{scores[teams[1].teamId] ?? 0} pts</p></div>}
        {teams[0] && <div className="relative flex h-full flex-col justify-end rounded-t-2xl border-2 border-primary/50 bg-primary/20 p-6"><span className="absolute -top-14 left-1/2 -translate-x-1/2 text-5xl">👑</span><h2 className="truncate text-2xl font-bold text-primary">{teams[0].teamName}</h2><p className="text-4xl font-black text-primary">{scores[teams[0].teamId] ?? 0} pts</p></div>}
        {teams[2] && <div className="relative flex h-3/5 flex-col justify-end rounded-t-2xl bg-muted/30 p-6"><span className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl">🥉</span><h2 className="truncate text-lg font-bold">{teams[2].teamName}</h2><p className="text-xl font-black">{scores[teams[2].teamId] ?? 0} pts</p></div>}
      </div>
      <section className="quizza-panel mx-auto grid w-full max-w-2xl grid-cols-2 gap-8 p-8">
        <div><BarChart3 className="mx-auto mb-3 h-5 w-5 text-[#7b2677]" /><p className="mb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">Attempts</p><p className="text-4xl font-black">{stats.totalAttempts}</p></div>
        <div><PartyPopper className="mx-auto mb-3 h-5 w-5 text-primary" /><p className="mb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">Correct answers</p><p className="text-4xl font-black text-primary">{stats.totalCorrect}</p></div>
      </section>
      <div className="flex justify-center gap-6">
        <Link href={`/sessions/${sessionId}/history`} className="quizza-button-secondary"><History className="h-4 w-4" /> View Event History</Link>
        <Link href="/dashboard" className="quizza-button"><LayoutDashboard className="h-4 w-4" /> Back to Dashboard</Link>
      </div>
    </main>
  )
}
