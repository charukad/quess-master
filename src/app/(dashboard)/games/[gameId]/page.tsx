import { getGameById } from '@/actions/games'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'

export default async function GameOverviewPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const game = await getGameById(params.gameId)
  const teams = await getTeamsForGame(params.gameId)
  const questions = await getQuestionsForGame(params.gameId)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{game.name} Overview</h2>
      <p className="text-muted-foreground">{game.description}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-2xl font-bold">{game.status}</p>
        </div>
        <div className="p-4 border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Teams Configured</p>
          <p className="text-2xl font-bold">{teams.length} / {game.teamCount}</p>
        </div>
        <div className="p-4 border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Questions Created</p>
          <p className="text-2xl font-bold">{questions.length}</p>
        </div>
      </div>
    </div>
  )
}
