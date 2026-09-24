export type GameType = 'STANDARD' | 'ENVELOPE_GRID'
export type GameStatus = 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED'
export type AnswerType = 'MCQ' | 'MANUAL'
export type SessionStatus = 'CREATED' | 'LIVE' | 'PAUSED' | 'COMPLETED'
export type EnvelopeStatus = 'LOCKED' | 'AVAILABLE' | 'OPENED' | 'COMPLETED'

export interface GameDTO {
  id: string
  name: string
  description: string
  gameType: GameType
  status: GameStatus
  teamCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamDTO {
  id: string
  name: string
  displayOrder: number
}

export interface QuestionOptionDTO {
  id: string
  optionText: string
  isCorrect: boolean
  displayOrder: number
}

export interface MediaAssetDTO {
  id: string
  publicId: string
  secureUrl: string
  resourceType: string
  format?: string
  bytes: number
  width?: number
  height?: number
  duration?: number
}

export interface QuestionDTO {
  id: string
  questionText: string
  answerType: AnswerType
  expectedAnswer: string
  points: number
  timeLimitSeconds: number
  mediaAssetId?: string
  media?: MediaAssetDTO
  displayOrder: number
  options: QuestionOptionDTO[]
}

export interface EnvelopeDTO {
  id: string
  teamId: string
  teamName: string
  questionId: string
  questionText: string
  envelopeNumber: number
  title: string
  message: string
  displayOrder: number
}

export interface SessionTeamDTO {
  id: string
  teamId: string
  teamName: string
  displayOrder: number
}

export interface SessionQuestionDTO extends QuestionDTO {
  sessionQuestionId: string
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
}

export interface SessionEnvelopeDTO {
  id: string
  envelopeId: string
  status: EnvelopeStatus
  envelope: EnvelopeDTO
}

export interface LiveSessionDTO {
  id: string
  status: SessionStatus
  game: Pick<GameDTO, 'id' | 'name' | 'gameType'>
  currentQuestionId?: string
  currentTeamId?: string
  originalQuestionTeamId?: string
  currentQuestionPosition: number
  currentTeamPosition: number
  timerStatus?: string
  timerDurationSeconds?: number
  timerRemainingSeconds?: number
  stateVersion: number
  startedAt?: string
  completedAt?: string
  teams: SessionTeamDTO[]
  questions: SessionQuestionDTO[]
  envelopes: SessionEnvelopeDTO[]
}

export interface SessionAttemptDTO {
  id: string
  questionId: string
  teamId: string
  attemptNumber: number
  result: 'CORRECT' | 'WRONG'
  pointsAwarded: number
  answeredAt: string
}

export interface HistoryEntryDTO {
  id: string
  kind: 'EVENT' | 'SCORE'
  type: string
  reason: string
  points?: number
  teamName?: string
  questionText?: string
  createdAt: string
}

export type ScoreMap = Record<string, number>
