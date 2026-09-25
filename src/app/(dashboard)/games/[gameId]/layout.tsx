import { GameEditorNav } from '@/components/GameEditorNav'

export default async function GameEditorLayout(props: {
  children: React.ReactNode,
  params: Promise<{ gameId: string }>
}) {
  const params = await props.params;
  const gameId = params.gameId

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <GameEditorNav gameId={gameId} />
      <div>
        {props.children}
      </div>
    </div>
  )
}
