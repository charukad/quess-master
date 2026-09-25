import { getGameById } from '@/actions/games'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'
import Link from 'next/link'
import { ArrowRight, CircleHelp, Play, Settings2, UsersRound } from 'lucide-react'
import { MetricCard, StatusPill } from '@/components/ui/quizza'

export default async function GameOverviewPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const [game, teams, questions] = await Promise.all([
    getGameById(params.gameId),
    getTeamsForGame(params.gameId),
    getQuestionsForGame(params.gameId),
  ])

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div><div className="mb-3 flex items-center gap-3"><StatusPill status={game.status} /><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{game.gameType === 'ENVELOPE_GRID' ? 'Envelope grid' : 'Standard quiz'}</span></div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{game.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{game.description || 'Add a description in settings to give your quiz more context.'}</p></div>
        <Link href={`/games/${game.id}/setup`} className="quizza-button"><Play className="h-4 w-4 fill-current" /> Launch quiz</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Status" value={game.status} hint="Current quiz state" tone="rose" />
        <MetricCard label="Teams" value={teams.length} hint="Configured and ready" tone="purple" />
        <MetricCard label="Questions" value={questions.length} hint="In this round" tone="amber" />
      </div>

      <section className="quizza-panel p-6">
        <h2 className="text-lg font-black">Build checklist</h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need before showtime.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { label: 'Set up teams', ariaLabel: 'Configure players', value: `${teams.length} added`, href: `/games/${game.id}/teams`, icon: UsersRound },
            { label: 'Write questions', ariaLabel: 'Edit challenge list', value: `${questions.length} created`, href: `/games/${game.id}/questions`, icon: CircleHelp },
            { label: 'Tune settings', ariaLabel: 'Edit quiz details', value: 'Name, type & details', href: `/games/${game.id}/settings`, icon: Settings2 },
          ].map(({ label, ariaLabel, value, href, icon: Icon }) => <Link key={label} href={href} aria-label={ariaLabel} className="group flex items-center gap-3 rounded-2xl border bg-[#fbf9fc] p-4 transition hover:border-primary/20 hover:bg-primary/[0.03]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm"><Icon className="h-5 w-5" /></span><span><span className="block text-sm font-bold">{label}</span><span className="text-xs text-muted-foreground">{value}</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></Link>)}
        </div>
      </section>
      </div>
  )
}
