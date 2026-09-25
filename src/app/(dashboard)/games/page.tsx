import { getGames } from '@/actions/games'
import Link from 'next/link'
import { ArrowRight, Gamepad2, Plus, UsersRound } from 'lucide-react'
import { EmptyState, PageIntro, StatusPill } from '@/components/ui/quizza'

export default async function GamesPage() {
  const games = await getGames()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageIntro eyebrow="Quiz library" title="Your games" description="Every draft, live game, and finished round in one place." action={<Link href="/games/new" className="quizza-button"><Plus className="h-4 w-4" /> New quiz</Link>} />

      {games.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <Link key={game.id} href={`/games/${game.id}`} className="group quizza-panel overflow-hidden p-1 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(74,28,85,0.13)]">
            <div className="brand-gradient h-1.5 rounded-full opacity-80" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Gamepad2 className="h-5 w-5" /></span><StatusPill status={game.status} /></div>
              <h3 className="mt-5 text-xl font-black tracking-tight">{game.name}</h3>
              <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">{game.description || 'Ready for you to add the details.'}</p>
              <div className="mt-6 flex items-center border-t pt-4 text-sm">
                <span className="flex items-center gap-2 font-semibold text-muted-foreground"><UsersRound className="h-4 w-4" />{game.teamCount} {game.teamCount === 1 ? 'team' : 'teams'}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-primary transition group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div> : <EmptyState title="No games yet" description="Create a quiz and turn a blank canvas into your next live event." href="/games/new" action="Create a quiz" />}
    </div>
  )
}
