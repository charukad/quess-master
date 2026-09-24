import mongoose, { Schema, Document, Model } from 'mongoose'

// ─── User / Profile ───────────────────────────────────────────────
export interface IUser extends Document {
  email: string
  password: string
  displayName?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String },
}, { timestamps: true })

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

// ─── Game ─────────────────────────────────────────────────────────
export interface IGame extends Document {
  createdBy: mongoose.Types.ObjectId
  name: string
  description?: string
  gameType: 'STANDARD' | 'ENVELOPE_GRID'
  status: string
  teamCount: number
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const GameSchema = new Schema<IGame>({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  gameType: { type: String, default: 'STANDARD', enum: ['STANDARD', 'ENVELOPE_GRID'] },
  status: { type: String, default: 'DRAFT' },
  teamCount: { type: Number, default: 1 },
  settings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export const Game: Model<IGame> = mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema)

// ─── Team ─────────────────────────────────────────────────────────
export interface ITeam extends Document {
  gameId: mongoose.Types.ObjectId
  name: string
  displayOrder: number
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<ITeam>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  name: { type: String, required: true },
  displayOrder: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)

// ─── Media Asset ──────────────────────────────────────────────────
export interface IMediaAsset extends Document {
  createdBy: mongoose.Types.ObjectId
  publicId: string
  secureUrl: string
  resourceType: string
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
  metadata: Record<string, unknown>
  createdAt: Date
}

const MediaAssetSchema = new Schema<IMediaAsset>({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  resourceType: { type: String, required: true },
  format: { type: String },
  bytes: { type: Number },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export const MediaAsset: Model<IMediaAsset> = mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema)

// ─── Question ─────────────────────────────────────────────────────
export interface IQuestionOption {
  optionText: string
  isCorrect: boolean
  displayOrder: number
}

export interface IQuestion extends Document {
  gameId: mongoose.Types.ObjectId
  questionNumber?: number
  questionText: string
  answerType: 'MCQ' | 'MANUAL'
  expectedAnswer?: string
  points: number
  timeLimitSeconds: number
  mediaAssetId?: mongoose.Types.ObjectId
  displayOrder: number
  options: IQuestionOption[]
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const QuestionOptionSchema = new Schema<IQuestionOption>({
  optionText: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  displayOrder: { type: Number, required: true },
}, { _id: true })

const QuestionSchema = new Schema<IQuestion>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  questionNumber: { type: Number },
  questionText: { type: String },
  answerType: { type: String, default: 'MCQ', enum: ['MCQ', 'MANUAL'] },
  expectedAnswer: { type: String },
  points: { type: Number, default: 10 },
  timeLimitSeconds: { type: Number, default: 30 },
  mediaAssetId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
  displayOrder: { type: Number, required: true },
  options: [QuestionOptionSchema],
  settings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema)

// ─── Envelope ─────────────────────────────────────────────────────
export interface IEnvelope extends Document {
  gameId: mongoose.Types.ObjectId
  teamId: mongoose.Types.ObjectId
  questionId: mongoose.Types.ObjectId
  envelopeNumber: number
  title?: string
  message?: string
  displayOrder: number
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const EnvelopeSchema = new Schema<IEnvelope>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  envelopeNumber: { type: Number, required: true },
  title: { type: String },
  message: { type: String },
  displayOrder: { type: Number, required: true },
  settings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

EnvelopeSchema.index({ gameId: 1, teamId: 1, envelopeNumber: 1 }, { unique: true })

export const Envelope: Model<IEnvelope> = mongoose.models.Envelope || mongoose.model<IEnvelope>('Envelope', EnvelopeSchema)

// ─── Game Session ─────────────────────────────────────────────────
export interface IGameSession extends Document {
  gameId: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  status: string
  currentQuestionId?: mongoose.Types.ObjectId
  currentTeamId?: mongoose.Types.ObjectId
  originalQuestionTeamId?: mongoose.Types.ObjectId
  currentTeamPosition?: number
  currentQuestionPosition?: number
  timerStatus?: string
  timerStartedAt?: Date
  timerDurationSeconds?: number
  timerRemainingSeconds?: number
  stateVersion: number
  startedAt?: Date
  pausedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const GameSessionSchema = new Schema<IGameSession>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'CREATED' },
  currentQuestionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  currentTeamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  originalQuestionTeamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  currentTeamPosition: { type: Number },
  currentQuestionPosition: { type: Number },
  timerStatus: { type: String },
  timerStartedAt: { type: Date },
  timerDurationSeconds: { type: Number },
  timerRemainingSeconds: { type: Number },
  stateVersion: { type: Number, default: 1 },
  startedAt: { type: Date },
  pausedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

export const GameSession: Model<IGameSession> = mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema)

// ─── Game Session Teams ───────────────────────────────────────────
export interface IGameSessionTeam extends Document {
  gameSessionId: mongoose.Types.ObjectId
  teamId: mongoose.Types.ObjectId
  teamName: string
  displayOrder: number
  createdAt: Date
}

const GameSessionTeamSchema = new Schema<IGameSessionTeam>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  teamName: { type: String, required: true },
  displayOrder: { type: Number, required: true },
}, { timestamps: true })

export const GameSessionTeam: Model<IGameSessionTeam> = mongoose.models.GameSessionTeam || mongoose.model<IGameSessionTeam>('GameSessionTeam', GameSessionTeamSchema)

// ─── Game Session Questions ───────────────────────────────────────
export interface IGameSessionQuestion extends Document {
  gameSessionId: mongoose.Types.ObjectId
  questionId: mongoose.Types.ObjectId
  displayOrder: number
  points: number
  timeLimitSeconds: number
  status: string
  createdAt: Date
  updatedAt: Date
}

const GameSessionQuestionSchema = new Schema<IGameSessionQuestion>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  displayOrder: { type: Number, required: true },
  points: { type: Number, required: true },
  timeLimitSeconds: { type: Number, required: true },
  status: { type: String, default: 'PENDING' },
}, { timestamps: true })

export const GameSessionQuestion: Model<IGameSessionQuestion> = mongoose.models.GameSessionQuestion || mongoose.model<IGameSessionQuestion>('GameSessionQuestion', GameSessionQuestionSchema)

// ─── Question Attempt ─────────────────────────────────────────────
export interface IQuestionAttempt extends Document {
  gameSessionId: mongoose.Types.ObjectId
  questionId: mongoose.Types.ObjectId
  teamId: mongoose.Types.ObjectId
  attemptNumber: number
  selectedOptionId?: mongoose.Types.ObjectId
  answerText?: string
  result: string
  pointsAwarded: number
  answeredAt?: Date
  createdAt: Date
}

const QuestionAttemptSchema = new Schema<IQuestionAttempt>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  attemptNumber: { type: Number, required: true },
  selectedOptionId: { type: Schema.Types.ObjectId },
  answerText: { type: String },
  result: { type: String },
  pointsAwarded: { type: Number, default: 0 },
  answeredAt: { type: Date },
}, { timestamps: true })

export const QuestionAttempt: Model<IQuestionAttempt> = mongoose.models.QuestionAttempt || mongoose.model<IQuestionAttempt>('QuestionAttempt', QuestionAttemptSchema)

// ─── Score Transaction ────────────────────────────────────────────
export interface IScoreTransaction extends Document {
  gameSessionId: mongoose.Types.ObjectId
  teamId: mongoose.Types.ObjectId
  questionId?: mongoose.Types.ObjectId
  points: number
  transactionType: string
  reason?: string
  actionId?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
}

const ScoreTransactionSchema = new Schema<IScoreTransaction>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  points: { type: Number, required: true },
  transactionType: { type: String, required: true },
  reason: { type: String },
  actionId: { type: String, unique: true, sparse: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export const ScoreTransaction: Model<IScoreTransaction> = mongoose.models.ScoreTransaction || mongoose.model<IScoreTransaction>('ScoreTransaction', ScoreTransactionSchema)

// ─── Game Event ───────────────────────────────────────────────────
export interface IGameEvent extends Document {
  gameSessionId: mongoose.Types.ObjectId
  eventType: string
  teamId?: mongoose.Types.ObjectId
  questionId?: mongoose.Types.ObjectId
  actionId?: string
  eventData: Record<string, unknown>
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

const GameEventSchema = new Schema<IGameEvent>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  eventType: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  actionId: { type: String, unique: true, sparse: true },
  eventData: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export const GameEvent: Model<IGameEvent> = mongoose.models.GameEvent || mongoose.model<IGameEvent>('GameEvent', GameEventSchema)

// ─── Session Envelope ─────────────────────────────────────────────
export interface ISessionEnvelope extends Document {
  gameSessionId: mongoose.Types.ObjectId
  envelopeId: mongoose.Types.ObjectId
  status: 'LOCKED' | 'AVAILABLE' | 'OPENED' | 'COMPLETED'
  openedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SessionEnvelopeSchema = new Schema<ISessionEnvelope>({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  envelopeId: { type: Schema.Types.ObjectId, ref: 'Envelope', required: true },
  status: { type: String, default: 'LOCKED', enum: ['LOCKED', 'AVAILABLE', 'OPENED', 'COMPLETED'] },
  openedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

export const SessionEnvelope: Model<ISessionEnvelope> = mongoose.models.SessionEnvelope || mongoose.model<ISessionEnvelope>('SessionEnvelope', SessionEnvelopeSchema)
