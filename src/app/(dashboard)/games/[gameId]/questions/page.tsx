import { getQuestionsForGame } from '@/actions/questions'
import { getMediaAssets } from '@/actions/media'
import QuestionsList from './QuestionsList'

export default async function QuestionsPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const questions = await getQuestionsForGame(params.gameId)
  const mediaAssets = await getMediaAssets()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Questions</h2>
      </div>

      <QuestionsList initialQuestions={questions} gameId={params.gameId} mediaAssets={mediaAssets} />
    </div>
  )
}
