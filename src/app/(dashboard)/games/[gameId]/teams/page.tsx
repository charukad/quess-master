import { getTeamsForGame } from '@/actions/teams'
import TeamsList from './TeamsList'

export default async function TeamsPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const teams = await getTeamsForGame(params.gameId)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teams</h2>
      </div>

      <TeamsList initialTeams={teams} gameId={params.gameId} />
    </div>
  )
}
