import { getEnvelopesForGame } from '@/actions/envelopes'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'
import EnvelopeEditor from './EnvelopeEditor'
import { Grid3X3 } from 'lucide-react'

export default async function EnvelopesPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const [envelopes, teams, questions] = await Promise.all([
    getEnvelopesForGame(params.gameId),
    getTeamsForGame(params.gameId),
    getQuestionsForGame(params.gameId),
  ])

  return (
    <div className="space-y-6">
      <div><p className="quizza-label text-primary">Build the board</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight"><Grid3X3 className="h-7 w-7 text-primary" /> Envelope grid</h1><p className="mt-2 text-sm text-muted-foreground">Map questions to envelopes, assign a team, and write the big reveal.</p></div>

      <EnvelopeEditor initialEnvelopes={envelopes} teams={teams} questions={questions} gameId={params.gameId} />
    </div>
  )
}
