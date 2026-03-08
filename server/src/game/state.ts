import { ElementId, IncidentId, JudgeId, JudgeCard, GameMode } from './cards'

export { GameMode }

export type GamePhase =
  | 'lobby'
  | 'round_start'
  | 'planning'
  | 'revealing'
  | 'rolling'
  | 'round_end'
  | 'game_over'

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

export interface Spectator {
  id: string
  name: string
}

export interface GameState {
  roomCode: string
  players: Player[]
  spectators: Spectator[]
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
  judgesUsed: JudgeId[]
  incidentMap: Record<string, IncidentId>
}

export function createInitialState(roomCode: string): GameState {
  return {
    roomCode,
    players: [],
    spectators: [],
    phase: 'lobby',
    round: 0,
    gameMode: 'singles',
    teams: [],
    judgeCard: null,
    hands: {},
    incidentCards: {},
    programs: {},
    diceResults: [],
    roundScores: [],
    leaderboard: [],
    judgesUsed: [],
    incidentMap: {},
  }
}
