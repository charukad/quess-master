import { getGames } from '@/actions/games'
import Link from 'next/link'

export default async function GamesPage() {
  const games = await getGames()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <Link
          href="/games/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Game
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Link key={game.id} href={`/games/${game.id}`}>
            <div className="rounded-xl border bg-card p-6 shadow hover:border-primary cursor-pointer transition-colors">
              <h3 className="font-semibold text-lg">{game.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{game.description || 'No description'}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="bg-muted px-2 py-1 rounded-md text-xs">{game.status}</span>
                <span className="text-muted-foreground">{game.teamCount} Teams</span>
              </div>
            </div>
          </Link>
        ))}
        {games.length === 0 && (
          <div className="col-span-full p-12 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">No games found. Create your first game to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
