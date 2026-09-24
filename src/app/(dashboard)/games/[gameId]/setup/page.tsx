import { getGameById } from '@/actions/games'
import { getTeamsForGame } from '@/actions/teams'
import { createSessionAndStart } from '@/actions/sessions'

export default async function GameSetupPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const game = await getGameById(params.gameId)
  const teams = await getTeamsForGame(params.gameId)

  return (
    <div className="max-w-xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{game.name}</h1>
        <p className="text-muted-foreground text-lg">Ready to start?</p>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        <div>
          <h3 className="font-semibold text-lg mb-2">Team Order</h3>
          <ul className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams configured yet.</p>
            ) : (
              teams.map((t, i) => (
                <li key={t.id} className="p-3 border rounded-md bg-muted/30 font-medium">
                  {i + 1}. {t.name}
                </li>
              ))
            )}
          </ul>
        </div>

        <form action={async () => {
          'use server'
          await createSessionAndStart(params.gameId)
        }}>
          <button
            type="submit"
            disabled={teams.length === 0}
            className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            ▶ Start Game Session
          </button>
        </form>
      </div>
    </div>
  )
}
