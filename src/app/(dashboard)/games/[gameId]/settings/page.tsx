import { getGameById, updateGame } from '@/actions/games'

export default async function GameSettingsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const game = await getGameById(gameId)
  const update = updateGame.bind(null, gameId)
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Game Settings</h2>
      <form action={update} className="space-y-4 rounded-xl border bg-card p-6">
        <label className="block space-y-2 text-sm font-medium">Game Name
          <input name="name" defaultValue={game.name} required minLength={3} maxLength={100} className="h-10 w-full rounded-md border bg-background px-3" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Description
          <textarea name="description" defaultValue={game.description} maxLength={500} className="min-h-24 w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Game Type
          <select name="gameType" defaultValue={game.gameType} className="h-10 w-full rounded-md border bg-background px-3">
            <option value="STANDARD">Standard Turn-Based Quiz</option>
            <option value="ENVELOPE_GRID">Envelope Grid</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save Settings</button>
      </form>
    </div>
  )
}
