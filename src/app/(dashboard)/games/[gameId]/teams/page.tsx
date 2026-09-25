import { getTeamsForGame } from '@/actions/teams'
import TeamsList from './TeamsList'
import { UsersRound } from 'lucide-react'

export default async function TeamsPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const teams = await getTeamsForGame(params.gameId)

  return (
    <div className="max-w-3xl space-y-6">
      <div><p className="quizza-label text-primary">The contenders</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight"><UsersRound className="h-7 w-7 text-primary" /> Teams</h1><p className="mt-2 text-sm text-muted-foreground">Add teams and set the order they will play.</p></div>

      <TeamsList initialTeams={teams} gameId={params.gameId} />
    </div>
  )
}
