export type GameMode = 'singles' | 'pairs'

export type ElementId =
  | 'quad_axel'
  | 'triple_axel'
  | 'triple_triple'
  | 'triple_lutz'
  | 'throw_jump'
  | 'double_axel'
  | 'level4_spin'
  | 'level3_spin'
  | 'flying_spin'
  | 'death_spiral'
  | 'step_sequence'
  | 'spiral_sequence'
  | 'ina_bauer'
  | 'choreography'
  | 'lift'
  | 'pairs_spin'
  | 'twist_lift'
  | 'side_by_side'

export type IncidentId =
  | 'loose_blade'
  | 'music_malfunction'
  | 'bad_ice'
  | 'wardrobe_malfunction'
  | 'crowd_boo'
  | 'broken_lace'
  | 'wrong_music'
  | 'slippery_zamboni'
  | 'rival_psych_out'

export type JudgeId =
  | 'technical_judge'
  | 'artistic_judge'
  | 'strict_judge'
  | 'lenient_judge'
  | 'fan_favorite'

export interface ElementCard {
  id: ElementId
  name: string
  base: number
  threshold: number
  fallPenalty: number
  goeBonus: number
  category: 'jump' | 'spin' | 'step' | 'choreo'
  autoSuccess: boolean
}

export interface IncidentCard {
  id: IncidentId
  name: string
  description: string
}

export interface JudgeCard {
  id: JudgeId
  name: string
  description: string
}

export type RoundName = 'Short Program' | 'Free Skate' | 'Championship Skate'

export interface Team {
  id: string
  playerIds: [string, string]
}

export interface Player {
  id: string
  name: string
  ready: boolean
  totalScore: number
  incidentCard: IncidentId | null
  disconnected?: boolean
  teamId?: string
}

export interface IncidentTarget {
  playerId: string
  cardId: IncidentId
}

export interface Program {
  playerId: string
  elementIds: ElementId[]
  incidentTarget?: IncidentTarget
}

export interface DiceResult {
  playerId: string
  elementId: ElementId
  roll: number
  success: boolean
  fell: boolean
  good: boolean
  goe: boolean
  score: number
  quip: string
}

export interface RoundScore {
  playerId: string
  elementScores: DiceResult[]
  roundTotal: number
  incidentApplied?: IncidentId
}

export type GamePhase =
  | 'lobby'
  | 'round_start'
  | 'planning'
  | 'revealing'
  | 'rolling'
  | 'round_end'
  | 'game_over'

export interface GameState {
  roomCode: string
  players: Player[]
  phase: GamePhase
  round: number
  gameMode: GameMode
  teams: Team[]
  judgeCard: JudgeCard | null
  hands: Record<string, ElementId[]>
  incidentCards: Record<string, IncidentId>
  programs: Record<string, Program>
  diceResults: DiceResult[]
  roundScores: RoundScore[]
  leaderboard: { playerId: string; name: string; total: number }[]
}

// Socket event payloads
export interface Spectator {
  id: string
  name: string
}

export interface CatchUpPayload {
  phase: GamePhase
  round: number
  gameMode: GameMode
  teams: Team[]
  judgeCard: JudgeCard | null
  players: Player[]
  leaderboard: { playerId: string; name: string; total: number }[]
  hand: ElementId[]
  partnerHand: ElementId[]
  incidentCard: IncidentId | null
  diceResults: DiceResult[]
  roundScores: RoundScore[]
  alreadySubmitted: boolean
  submittedCount: number
  spectator?: boolean
  spectators?: Spectator[]
}

export interface GameStartPayload {
  initialState: GameState
}

export interface RoundStartPayload {
  round: number
  judgeCard: JudgeCard
  hand: ElementId[]
  partnerHand: ElementId[]
  incidentCard: IncidentId
  gameMode: GameMode
  teams: Team[]
}

export interface ProgramsRevealedPayload {
  allPrograms: Program[]
}

export interface DiceResultPayload extends DiceResult {}

export interface RoundEndPayload {
  scores: RoundScore[]
  leaderboard: { playerId: string; name: string; total: number }[]
}

export interface GameOverPayload {
  finalScores: { playerId: string; name: string; total: number }[]
  winner: { playerId: string; name: string; total: number }
}

