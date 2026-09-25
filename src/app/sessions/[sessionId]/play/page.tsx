import { endSession, getLiveSession } from '@/actions/sessions'
import { getSessionScores, getQuestionAttempts } from '@/lib/game-engine/core'
import GameController from './GameController'
import GridController from './GridController'
import { redirect } from 'next/navigation'
import { SoundToggle } from '@/components/SoundToggle'
import { QuizzaLogo } from '@/components/QuizzaLogo'
import { Square } from 'lucide-react'

export default async function LiveSessionPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const [session, scores] = await Promise.all([
    getLiveSession(params.sessionId),
    getSessionScores(params.sessionId),
  ])
  const attempts = session.currentQuestionId
    ? await getQuestionAttempts(session.id, session.currentQuestionId)
    : []

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4"><QuizzaLogo compact /><span className="h-7 w-px bg-border" /><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Live game</p><h1 className="text-xl font-black tracking-tight sm:text-2xl">{session.game.name}</h1></div></div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-black text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />{session.status}</span>
          <SoundToggle />
          <form action={async () => {
            'use server'
            await endSession(session.id)
            redirect(`/sessions/${session.id}/results`)
          }}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold text-muted-foreground hover:border-destructive/30 hover:text-destructive"><Square className="h-3.5 w-3.5 fill-current" /> End game</button>
          </form>
        </div>
      </div>

      {session.game.gameType === 'ENVELOPE_GRID' ? (
        <GridController session={session} scores={scores} />
      ) : (
        <GameController session={session} scores={scores} attempts={attempts} />
      )}
    </main>
  )
}
