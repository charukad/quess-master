import Link from 'next/link'

export default async function GameEditorLayout(props: {
  children: React.ReactNode,
  params: Promise<{ gameId: string }>
}) {
  const params = await props.params;
  const gameId = params.gameId

  return (
    <div className="space-y-6">
      <div className="flex border-b pb-4 gap-6 items-center">
        <Link href={`/games/${gameId}`} className="text-sm font-medium hover:text-primary">Overview</Link>
        <Link href={`/games/${gameId}/teams`} className="text-sm font-medium hover:text-primary text-muted-foreground">Teams</Link>
        <Link href={`/games/${gameId}/questions`} className="text-sm font-medium hover:text-primary text-muted-foreground">Questions</Link>
        <Link href={`/games/${gameId}/envelopes`} className="text-sm font-medium hover:text-primary text-muted-foreground">Envelopes</Link>
        <Link href={`/games/${gameId}/settings`} className="text-sm font-medium hover:text-primary text-muted-foreground">Settings</Link>

        <div className="flex-1 text-right">
          <Link href={`/games/${gameId}/setup`} className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-md hover:bg-primary/20">
            Play Game
          </Link>
        </div>
      </div>
      <div>
        {props.children}
      </div>
    </div>
  )
}
