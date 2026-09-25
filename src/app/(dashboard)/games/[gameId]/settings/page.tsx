import { getGameById, updateGame } from '@/actions/games'
import { Save, Settings2 } from 'lucide-react'
import DeleteGameButton from './DeleteGameButton'

export default async function GameSettingsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const game = await getGameById(gameId)
  const update = updateGame.bind(null, gameId)
  return (
    <div className="max-w-3xl space-y-6">
      <div><p className="quizza-label text-primary">Fine-tune your quiz</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight"><Settings2 className="h-7 w-7 text-primary" /> Game settings</h1><p className="mt-2 text-sm text-muted-foreground">Update the core details players and hosts will see.</p></div>
      <form action={update} className="quizza-panel space-y-5 p-6 sm:p-8">
        <label className="block space-y-2 text-sm font-medium">Game Name
          <input name="name" defaultValue={game.name} required minLength={3} maxLength={100} className="h-12 w-full rounded-xl border bg-white px-4" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Description
          <textarea name="description" defaultValue={game.description} maxLength={500} className="min-h-28 w-full rounded-xl border bg-white px-4 py-3" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Game Type
          <select name="gameType" defaultValue={game.gameType} className="h-12 w-full rounded-xl border bg-white px-4">
            <option value="STANDARD">Standard Turn-Based Quiz</option>
            <option value="ENVELOPE_GRID">Envelope Grid</option>
          </select>
        </label>
        <div className="border-t pt-5"><button type="submit" className="quizza-button"><Save className="h-4 w-4" /> Save settings</button></div>
      </form>
      <section className="quizza-panel border-destructive/10 p-6 sm:p-8">
        <h2 className="font-black text-destructive">Danger zone</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">Delete this game and all of its quiz data when you no longer need it.</p>
        <DeleteGameButton gameId={gameId} gameName={game.name} />
      </section>
    </div>
  )
}
