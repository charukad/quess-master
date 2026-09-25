import { getQuestionsForGame } from '@/actions/questions'
import { getMediaAssets } from '@/actions/media'
import QuestionsList from './QuestionsList'
import { CircleHelp } from 'lucide-react'

export default async function QuestionsPage(props: { params: Promise<{ gameId: string }> }) {
  const params = await props.params;
  const [questions, mediaAssets] = await Promise.all([
    getQuestionsForGame(params.gameId),
    getMediaAssets(),
  ])

  return (
    <div className="space-y-6">
      <div><p className="quizza-label text-primary">Build the challenge</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight"><CircleHelp className="h-7 w-7 text-primary" /> Questions</h1><p className="mt-2 text-sm text-muted-foreground">Mix multiple choice, manual answers, timing, and media.</p></div>

      <QuestionsList initialQuestions={questions} gameId={params.gameId} mediaAssets={mediaAssets} />
    </div>
  )
}
