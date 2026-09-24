import { getEnvelopesForGame } from '@/actions/envelopes'
import { getTeamsForGame } from '@/actions/teams'
import { getQuestionsForGame } from '@/actions/questions'
import EnvelopeEditor from './EnvelopeEditor'

export default async function EnvelopesPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const envelopes = await getEnvelopesForGame(params.gameId)
  const teams = await getTeamsForGame(params.gameId)
  const questions = await getQuestionsForGame(params.gameId)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Envelope Grid Editor</h2>
      <p className="text-muted-foreground text-sm">
        Map specific questions to envelopes, assign a target team, and add a custom reveal message.
      </p>

      <EnvelopeEditor initialEnvelopes={envelopes} teams={teams} questions={questions} gameId={params.gameId} />
    </div>
  )
}
