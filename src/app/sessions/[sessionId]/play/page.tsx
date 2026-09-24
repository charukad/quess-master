import { endSession, getLiveSession } from '@/actions/sessions'
import { getSessionScores, getQuestionAttempts } from '@/lib/game-engine/core'
import GameController from './GameController'
import GridController from './GridController'
import { redirect } from 'next/navigation'
import { SoundToggle } from '@/components/SoundToggle'

export default async function LiveSessionPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const session = await getLiveSession(params.sessionId)
  const scores = await getSessionScores(params.sessionId)
  const attempts = session.currentQuestionId
    ? await getQuestionAttempts(session.id, session.currentQuestionId)
    : []

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-center border-b pb-4 mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider">{session.game.name}</h1>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full">{session.status}</span>
          <SoundToggle />
          <form action={async () => {
            'use server'
            await endSession(session.id)
            redirect(`/sessions/${session.id}/results`)
          }}>
            <button type="submit" className="font-bold text-muted-foreground hover:text-foreground">End Game</button>
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
