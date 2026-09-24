import Link from 'next/link'
import { getGames } from '@/actions/games'

export default async function DashboardPage() {
  const games = await getGames()
  const groups = [
    { title: 'Live / Paused Games', description: 'Games currently in progress.', games: games.filter((game) => ['LIVE', 'PAUSED'].includes(game.status)) },
    { title: 'Ready to Start', description: 'Games configured and ready.', games: games.filter((game) => game.status === 'READY') },
    { title: 'Drafts', description: 'Incomplete game templates.', games: games.filter((game) => game.status === 'DRAFT') },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/games/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
          + Create Game
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title} className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <h2 className="font-semibold leading-none tracking-tight">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="space-y-2 p-6 pt-0">
              {group.games.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`} className="block rounded-md border p-3 text-sm hover:border-primary">
                  <span className="font-medium">{game.name}</span>
                  <span className="float-right text-muted-foreground">{game.teamCount} teams</span>
                </Link>
              ))}
              {group.games.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
