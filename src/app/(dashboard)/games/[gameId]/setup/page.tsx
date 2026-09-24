import Link from 'next/link'
import { getGameById } from '@/actions/games'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'
import { getEnvelopesForGame } from '@/actions/envelopes'
import StartGameForm from './StartGameForm'

export default async function GameSetupPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params
  const [game, teams, questions, envelopes] = await Promise.all([
    getGameById(params.gameId),
    getTeamsForGame(params.gameId),
    getQuestionsForGame(params.gameId),
    getEnvelopesForGame(params.gameId),
  ])
  const requirements = [
    {
      label: 'At least one team',
      count: teams.length,
      ready: teams.length > 0,
      href: `/games/${params.gameId}/teams`,
      action: 'Add team',
    },
    {
      label: 'At least one question',
      count: questions.length,
      ready: questions.length > 0,
      href: `/games/${params.gameId}/questions`,
      action: 'Add question',
    },
    ...(game.gameType === 'ENVELOPE_GRID' ? [{
      label: 'At least one envelope',
      count: envelopes.length,
      ready: envelopes.length > 0,
      href: `/games/${params.gameId}/envelopes`,
      action: 'Add envelope',
    }] : []),
  ]
  const canStart = requirements.every((requirement) => requirement.ready)

  return (
    <div className="max-w-xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{game.name}</h1>
        <p className="text-muted-foreground text-lg">Ready to start?</p>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        <div>
          <h3 className="font-semibold text-lg mb-2">Start requirements</h3>
          <ul className="space-y-2">
            {requirements.map((requirement) => (
              <li key={requirement.label} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className={requirement.ready ? 'text-foreground' : 'text-destructive'}>
                  {requirement.ready ? '✓' : '○'} {requirement.label} ({requirement.count})
                </span>
                {!requirement.ready && (
                  <Link href={requirement.href} className="font-medium text-primary hover:underline">
                    {requirement.action}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {!canStart && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Complete the missing requirements before starting the game.
            </p>
          )}
        </div>

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

        <StartGameForm gameId={params.gameId} canStart={canStart} />
      </div>
    </div>
  )
}
