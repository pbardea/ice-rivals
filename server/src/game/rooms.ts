import { GameState, GameMode, createInitialState, Player, Team, Spectator } from './state'

const rooms = new Map<string, GameState>()

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code: string
  do {
    code = ''
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  } while (rooms.has(code))
  return code
}

export function createRoom(): string {
  const code = generateRoomCode()
  rooms.set(code, createInitialState(code))
  return code
}

export function findRoomByPlayerId(playerId: string): GameState | undefined {
  for (const state of rooms.values()) {
    if (state.players.some(p => p.id === playerId)) return state
    if (state.spectators.some(s => s.id === playerId)) return state
  }
  return undefined
}

export function getRoom(code: string): GameState | undefined {
  return rooms.get(code)
}

export function setRoom(code: string, state: GameState): void {
  rooms.set(code, state)
}

export function addSpectator(roomCode: string, spectator: Spectator): GameState | null {
  const state = rooms.get(roomCode)
  if (!state) return null
  if (!state.spectators.some(s => s.id === spectator.id)) {
    state.spectators.push(spectator)
  }
  return state
}

export function removeSpectator(roomCode: string, spectatorId: string): GameState | null {
  const state = rooms.get(roomCode)
  if (!state) return null
  state.spectators = state.spectators.filter(s => s.id !== spectatorId)
  return state
}

export function getSpectators(roomCode: string): Spectator[] {
  const state = rooms.get(roomCode)
  return state?.spectators ?? []
}

export function addPlayer(roomCode: string, playerId: string, playerName: string): GameState | null {
  const state = rooms.get(roomCode)
  if (!state) return null
  if (state.players.filter(p => !p.disconnected).length >= 8) return null
  if (state.phase !== 'lobby') return null

  const player: Player = {
    id: playerId,
    name: playerName,
    ready: false,
    totalScore: 0,
    incidentCard: null,
  }
  state.players.push(player)
  return state
}

// Returns the player if found (for reconnect), null otherwise
export function findPlayer(roomCode: string, playerId: string): Player | null {
  return getRoom(roomCode)?.players.find(p => p.id === playerId) ?? null
}

// Mark disconnected during game; remove entirely from lobby
export function disconnectPlayer(roomCode: string, playerId: string): { state: GameState | null; removed: boolean } {
  const state = rooms.get(roomCode)
  if (!state) return { state: null, removed: false }

  if (state.phase === 'lobby') {
    state.players = state.players.filter(p => p.id !== playerId)
    if (state.players.length === 0) {
      rooms.delete(roomCode)
      return { state: null, removed: true }
    }
    return { state, removed: true }
  }

  // Game in progress — keep them, just mark disconnected
  const player = state.players.find(p => p.id === playerId)
  if (player) player.disconnected = true
  return { state, removed: false }
}

export function reconnectPlayer(roomCode: string, playerId: string): Player | null {
  const state = rooms.get(roomCode)
  if (!state) return null
  const player = state.players.find(p => p.id === playerId)
  if (!player) return null
  player.disconnected = false
  return player
}

export function setPlayerReady(roomCode: string, playerId: string): GameState | null {
  const state = rooms.get(roomCode)
  if (!state) return null
  const player = state.players.find(p => p.id === playerId)
  if (player) player.ready = true
  return state
}

export function allPlayersReady(state: GameState): boolean {
  const active = state.players.filter(p => !p.disconnected)
  if (state.gameMode === 'pairs') {
    return active.length >= 4 && active.length % 2 === 0 && active.every(p => p.ready) && state.teams.length === active.length / 2
  }
  return active.length >= 2 && active.every(p => p.ready)
}

export function setGameMode(roomCode: string, mode: GameMode): GameState | null {
  const state = rooms.get(roomCode)
  if (!state || state.phase !== 'lobby') return null
  state.gameMode = mode
  if (mode === 'singles') {
    state.teams = []
    for (const p of state.players) p.teamId = undefined
  }
  return state
}

export function setTeams(roomCode: string, teamPairs: [string, string][]): GameState | null {
  const state = rooms.get(roomCode)
  if (!state || state.phase !== 'lobby' || state.gameMode !== 'pairs') return null

  state.teams = teamPairs.map((pair, idx) => ({
    id: `team_${idx + 1}`,
    playerIds: pair,
  }))

  for (const team of state.teams) {
    for (const pid of team.playerIds) {
      const player = state.players.find(p => p.id === pid)
      if (player) player.teamId = team.id
    }
  }

  return state
}

export function resetRoom(roomCode: string): void {
  rooms.set(roomCode, createInitialState(roomCode))
}
