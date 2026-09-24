import Link from 'next/link'
import { getSessionHistory } from '@/lib/game-engine/core'

export default async function HistoryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const entries = await getSessionHistory(sessionId)
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/sessions/${sessionId}/results`} className="text-muted-foreground hover:text-foreground">← Back to Results</Link>
        <h1 className="text-3xl font-bold">Event History Ledger</h1>
      </div>
      <div className="space-y-4">
        {entries.map((entry) => (
          <article key={`${entry.kind}-${entry.id}`} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <strong className="text-foreground">{entry.kind === 'SCORE' ? '💰' : '📝'} {entry.type}</strong>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
            </div>
            <p className="text-sm text-muted-foreground">{entry.reason}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {entry.teamName && <span className="rounded bg-muted px-2 py-1">Team: {entry.teamName}</span>}
              {entry.questionText && <span className="rounded bg-muted px-2 py-1">Question: {entry.questionText}</span>}
              {entry.points !== undefined && <span className={`rounded px-2 py-1 font-bold ${entry.points >= 0 ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>{entry.points > 0 ? '+' : ''}{entry.points} pts</span>}
            </div>
          </article>
        ))}
        {entries.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No events recorded.</p>}
      </div>
    </main>
  )
}
