import { createGame } from '@/actions/games'

export default function NewGamePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create New Game</h1>

      <form action={createGame} className="space-y-4 bg-card p-6 border rounded-xl shadow-sm">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Game Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="e.g. Friday Night Trivia"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="A short description of the event..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gameType" className="text-sm font-medium">Game Type</label>
          <select
            id="gameType"
            name="gameType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="STANDARD">Standard Turn-Based Quiz</option>
            <option value="ENVELOPE_GRID">Envelope Grid</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Game
          </button>
        </div>
      </form>
    </div>
  )
}
