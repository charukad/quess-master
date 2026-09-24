import type {
  EnvelopeDTO,
  GameDTO,
  MediaAssetDTO,
  QuestionDTO,
  QuestionOptionDTO,
  TeamDTO,
} from '@/lib/types'

type IdLike = { toString(): string }

export function idString(value: IdLike | string | null | undefined): string {
  return value?.toString() ?? ''
}

export function toGameDTO(game: {
  _id: IdLike
  name: string
  description?: string
  gameType: GameDTO['gameType']
  status: string
  teamCount: number
  createdAt: Date
  updatedAt: Date
}): GameDTO {
  return {
    id: idString(game._id),
    name: game.name,
    description: game.description ?? '',
    gameType: game.gameType,
    status: game.status as GameDTO['status'],
    teamCount: game.teamCount,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  }
}

export function toTeamDTO(team: {
  _id: IdLike
  name: string
  displayOrder: number
}): TeamDTO {
  return {
    id: idString(team._id),
    name: team.name,
    displayOrder: team.displayOrder,
  }
}

export function toMediaAssetDTO(asset: {
  _id: IdLike
  publicId: string
  secureUrl: string
  resourceType: string
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
}): MediaAssetDTO {
  return {
    id: idString(asset._id),
    publicId: asset.publicId,
    secureUrl: asset.secureUrl,
    resourceType: asset.resourceType,
    format: asset.format,
    bytes: asset.bytes ?? 0,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  }
}

export function toQuestionDTO(question: {
  _id: IdLike
  questionText: string
  answerType: QuestionDTO['answerType']
  expectedAnswer?: string
  points: number
  timeLimitSeconds: number
  mediaAssetId?: IdLike
  displayOrder: number
  options?: Array<{
    _id?: IdLike
    optionText: string
    isCorrect: boolean
    displayOrder: number
  }>
}, media?: MediaAssetDTO): QuestionDTO {
  const options: QuestionOptionDTO[] = (question.options ?? []).map((option, index) => ({
    id: idString(option._id) || `${idString(question._id)}-${index}`,
    optionText: option.optionText,
    isCorrect: option.isCorrect,
    displayOrder: option.displayOrder,
  }))

  return {
    id: idString(question._id),
    questionText: question.questionText,
    answerType: question.answerType,
    expectedAnswer: question.expectedAnswer ?? '',
    points: question.points,
    timeLimitSeconds: question.timeLimitSeconds,
    mediaAssetId: question.mediaAssetId ? idString(question.mediaAssetId) : undefined,
    media,
    displayOrder: question.displayOrder,
    options,
  }
}

export function toEnvelopeDTO(
  envelope: {
    _id: IdLike
    teamId: IdLike
    questionId: IdLike
    envelopeNumber: number
    title?: string
    message?: string
    displayOrder: number
  },
  teamName: string,
  questionText: string,
): EnvelopeDTO {
  return {
    id: idString(envelope._id),
    teamId: idString(envelope.teamId),
    teamName,
    questionId: idString(envelope.questionId),
    questionText,
    envelopeNumber: envelope.envelopeNumber,
    title: envelope.title ?? '',
    message: envelope.message ?? '',
    displayOrder: envelope.displayOrder,
  }
}
