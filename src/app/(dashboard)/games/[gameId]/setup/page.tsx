import Link from 'next/link'
import { getGameById } from '@/actions/games'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'
import { getEnvelopesForGame } from '@/actions/envelopes'
import StartGameForm from './StartGameForm'
import { Check, Circle, Play, UsersRound } from 'lucide-react'

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
    <div className="mx-auto max-w-2xl space-y-8 py-5 sm:py-10">
      <div className="text-center space-y-2">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Play className="h-6 w-6 fill-current" /></span>
        <p className="pt-3 text-xs font-black uppercase tracking-[0.22em] text-primary">Final check</p>
        <h1 className="text-4xl font-black tracking-tight">{game.name}</h1>
        <p className="text-muted-foreground">Make sure everything is ready for showtime.</p>
      </div>

      <div className="quizza-panel space-y-7 p-6 sm:p-8">
        <div>
          <h3 className="mb-3 text-lg font-black">Start requirements</h3>
          <ul className="space-y-2.5">
            {requirements.map((requirement) => (
              <li key={requirement.label} className={`flex items-center justify-between rounded-2xl border p-4 text-sm ${requirement.ready ? 'border-[#7b2677]/10 bg-[#f7f1f8]' : 'border-[#e31859]/15 bg-[#fff3f7]'}`}>
                <span className={`flex items-center gap-3 font-semibold ${requirement.ready ? 'text-foreground' : 'text-destructive'}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${requirement.ready ? 'bg-[#7b2677] text-white' : 'bg-white text-destructive'}`}>{requirement.ready ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</span>
                  {requirement.label} <span className="text-muted-foreground">({requirement.count})</span>
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
          <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><UsersRound className="h-5 w-5 text-primary" /> Team order</h3>
          <ul className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams configured yet.</p>
            ) : (
              teams.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl border bg-white p-3 font-semibold">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-xs font-black text-accent-foreground">{i + 1}</span>{t.name}
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
