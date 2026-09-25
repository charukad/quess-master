import Link from 'next/link'
import { getGames } from '@/actions/games'
import { ArrowRight, Gamepad2, Plus, Radio, Sparkles } from 'lucide-react'
import { EmptyState, PageIntro, StatusPill } from '@/components/ui/quizza'

export default async function DashboardPage() {
  const games = await getGames()
  const groups = [
    { title: 'Live & paused', description: 'Jump back into the action.', games: games.filter((game) => ['LIVE', 'PAUSED'].includes(game.status)), icon: Radio, tone: 'bg-[#fff0f5] text-[#d91b5b]' },
    { title: 'Ready to start', description: 'Everything is set for showtime.', games: games.filter((game) => game.status === 'READY'), icon: Sparkles, tone: 'bg-[#fff6df] text-[#9a5c00]' },
    { title: 'In the works', description: 'Keep shaping these quiz drafts.', games: games.filter((game) => game.status === 'DRAFT'), icon: Gamepad2, tone: 'bg-[#f5edf7] text-[#722777]' },
  ]
  const activeCount = games.filter((game) => ['LIVE', 'PAUSED'].includes(game.status)).length

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageIntro eyebrow="Your command center" title="Welcome to QUIZZA" description="Create brilliant rounds, manage every team, and keep the energy moving." action={<Link href="/games/new" className="quizza-button"><Plus className="h-4 w-4" /> Create quiz</Link>} />

      <section className="relative overflow-hidden rounded-[2rem] bg-[#34123f] p-7 text-white shadow-[0_24px_70px_rgba(52,18,63,0.18)] sm:p-9">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#e31859]/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-[#fcb830]/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/75">Today at a glance</span>
            <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Your next great quiz is one click away.</h2>
          </div>
          <div className="flex gap-8">
            <div><p className="text-3xl font-black text-[#fcb830]">{games.length}</p><p className="text-xs font-semibold text-white/55">Total quizzes</p></div>
            <div><p className="text-3xl font-black text-[#ee4080]">{activeCount}</p><p className="text-xs font-semibold text-white/55">Live now</p></div>
          </div>
        </div>
      </section>

      {games.length === 0 ? <EmptyState title="Your quiz library is empty" description="Create your first quiz, add a few teams and questions, then launch it live." href="/games/new" action="Create your first quiz" /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const GroupIcon = group.icon
          return <section key={group.title} className="quizza-panel p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${group.tone}`}><GroupIcon className="h-5 w-5" /></span>
              <div><h2 className="font-bold tracking-tight">{group.title}</h2><p className="text-xs text-muted-foreground">{group.description}</p></div>
              <span className="ml-auto text-sm font-black text-muted-foreground">{group.games.length}</span>
            </div>
            <div className="space-y-2">
              {group.games.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`} className="group flex items-center gap-3 rounded-2xl border border-transparent bg-[#fbf9fc] p-3.5 transition hover:border-primary/15 hover:bg-primary/[0.035]">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{game.name}</p><p className="mt-1 text-xs text-muted-foreground">{game.teamCount} {game.teamCount === 1 ? 'team' : 'teams'}</p></div>
                  <StatusPill status={game.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
              {group.games.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">Nothing here yet.</p>}
            </div>
          </section>
        })}
      </div>}
    </div>
  )
}
