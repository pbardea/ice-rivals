import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import path from 'path'
import cors from 'cors'
import {
  getRoom, setRoom, addPlayer, findPlayer,
  disconnectPlayer, reconnectPlayer, setPlayerReady,
  allPlayersReady, setGameMode, setTeams,
  createRoom, findRoomByPlayerId, addSpectator, removeSpectator,
} from './game/rooms'
import {
  dealHands, pickJudge, computeLeaderboard, getLastPlacePlayerId, getLastPlaceTeamId,
  rollSingleElement, applyPostRollEffects, getPlayerRollContext,
} from './game/mechanics'
import { Program, GameState, GameMode, DiceResult, createInitialState, Team } from './game/state'
import { ElementId, IncidentId } from './game/cards'

const app = express()
const httpServer = createServer(app)
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3001']

const io = new Server(httpServer, { cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] } })

app.use(cors())
app.use(express.json())

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))

const PORT = process.env.PORT || 3001

const socketToPlayerId = new Map<string, string>()
const playerIdToSocket = new Map<string, string>()
const socketToRoom = new Map<string, string>()

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function emitToPlayer(playerId: string, event: string, data: unknown) {
  const socketId = playerIdToSocket.get(playerId)
  if (socketId) io.to(socketId).emit(event, data)
}

function getRoomForSocket(socket: Socket): string | undefined {
  return socketToRoom.get(socket.id)
}

function getPartnerHand(state: GameState, playerId: string): ElementId[] {
  if (state.gameMode !== 'pairs') return []
  const team = state.teams.find(t => t.playerIds.includes(playerId))
  if (!team) return []
  const partnerId = team.playerIds.find(id => id !== playerId)
  return partnerId ? (state.hands[partnerId] ?? []) : []
}

function getTeamIdForPlayer(state: GameState, playerId: string): string | undefined {
  return state.teams.find(t => t.playerIds.includes(playerId))?.id
}

function isSubmittedInMode(state: GameState, playerId: string): boolean {
  if (state.gameMode === 'pairs') {
    const teamId = getTeamIdForPlayer(state, playerId)
    return teamId ? !!state.programs[teamId] : false
  }
  return !!state.programs[playerId]
}

function getSubmittedCount(state: GameState): number {
  return Object.keys(state.programs).length
}

function getTotalExpected(state: GameState): number {
  return state.gameMode === 'pairs' ? state.teams.length : state.players.length
}

function sendCatchUp(playerId: string, roomCode: string, opts?: { spectator?: boolean }) {
  const state = getRoom(roomCode)
  if (!state) return
  if (opts?.spectator) {
    emitToPlayer(playerId, 'catch_up', {
      spectator: true,
      phase: state.phase,
      round: state.round,
      gameMode: state.gameMode,
      teams: state.teams,
      judgeCard: state.judgeCard,
      players: state.players,
      leaderboard: state.leaderboard,
      hand: [],
      partnerHand: [],
      incidentCard: null,
      diceResults: state.diceResults,
      roundScores: state.roundScores,
      alreadySubmitted: false,
      submittedCount: getSubmittedCount(state),
    })
  } else {
    emitToPlayer(playerId, 'catch_up', {
      phase: state.phase,
      round: state.round,
      gameMode: state.gameMode,
      teams: state.teams,
      judgeCard: state.judgeCard,
      players: state.players,
      leaderboard: state.leaderboard,
      hand: state.hands[playerId] ?? [],
      partnerHand: getPartnerHand(state, playerId),
      incidentCard: state.incidentCards[playerId] ?? null,
      diceResults: state.diceResults,
      roundScores: state.roundScores,
      alreadySubmitted: isSubmittedInMode(state, playerId),
      submittedCount: getSubmittedCount(state),
    })
  }
}

async function runRound(state: GameState): Promise<void> {
  const roomCode = state.roomCode
  const round = state.round
  const judgeCard = pickJudge(state.judgesUsed)
  state.judgesUsed.push(judgeCard.id)
  state.judgeCard = judgeCard

  const playerIds = state.players.map(p => p.id)
  const { hands, incidentCards } = dealHands(playerIds, state.gameMode, state.teams)
  state.hands = hands
  state.incidentCards = incidentCards
  for (const p of state.players) p.incidentCard = incidentCards[p.id] ?? null

  state.phase = 'planning'
  state.programs = {}
  state.diceResults = []
  state.roundScores = []
  state.incidentMap = {}
  setRoom(roomCode, state)

  for (const player of state.players) {
    emitToPlayer(player.id, 'round_start', {
      round,
      judgeCard,
      hand: hands[player.id],
      partnerHand: getPartnerHand(state, player.id),
      incidentCard: incidentCards[player.id],
      gameMode: state.gameMode,
      teams: state.teams,
    })
  }
}

async function resolveRound(state: GameState): Promise<void> {
  const roomCode = state.roomCode
  const isChampionship = state.round === 3
  const isPairs = state.gameMode === 'pairs'
  const judgeId = state.judgeCard?.id ?? null

  // Determine last place for fan_favorite
  let lastPlaceId: string | null = null
  if (isPairs) {
    lastPlaceId = state.teams.length > 1 ? getLastPlaceTeamId(state.players, state.teams) : null
  } else {
    lastPlaceId = state.players.length > 1 ? getLastPlacePlayerId(state.players) : null
  }

  state.phase = 'revealing'
  setRoom(roomCode, state)
  io.to(roomCode).emit('programs_revealed', { allPrograms: Object.values(state.programs) })

  await delay(1500)
  state.phase = 'rolling'
  setRoom(roomCode, state)

  // Build incident map: in pairs mode, incidents target a team (stored by teamId)
  const incidentMap: Record<string, IncidentId> = {}
  for (const program of Object.values(state.programs)) {
    if (program.incidentTarget) {
      incidentMap[program.incidentTarget.playerId] = program.incidentTarget.cardId
    }
  }

  const roundScores: typeof state.roundScores = []

  for (const program of Object.values(state.programs)) {
    const pid = program.playerId // In pairs mode, this is the teamId
    const incident = incidentMap[pid] ?? null
    const ctx = getPlayerRollContext(program, incident, judgeId, isChampionship)
    const playedIncident = !!program.incidentTarget

    const diceResults: DiceResult[] = []
    let looseBladeFired = false

    for (let i = 0; i < ctx.elementIds.length; i++) {
      const elementId = ctx.elementIds[i]
      const applyLoose = ctx.looseBlade && !looseBladeFired
      if (applyLoose) looseBladeFired = true

      const result = rollSingleElement(elementId, pid, {
        judgeId,
        isChampionship,
        looseBlade: applyLoose,
        zamboniThreshold: ctx.zamboniThreshold,
        psychOutElementId: ctx.psychOutElementId,
      })

      diceResults.push(result)
      state.diceResults.push(result)

      await delay(2200)
      io.to(roomCode).emit('dice_result', result)
    }

    const { results, incidentApplied } = applyPostRollEffects(diceResults, incident, playedIncident)
    let roundTotal = results.reduce((sum, r) => sum + r.score, 0)

    // Fan favorite: in pairs mode, check team; in singles, check player
    if (judgeId === 'fan_favorite' && lastPlaceId === pid) {
      roundTotal += 3
    }

    roundScores.push({
      playerId: pid,
      elementScores: results,
      roundTotal,
      incidentApplied: incidentApplied || ctx.incidentApplied,
    })
  }

  // Update scores: in pairs mode, split round total evenly across team players
  if (isPairs) {
    for (const rs of roundScores) {
      const team = state.teams.find(t => t.id === rs.playerId)
      if (team) {
        const perPlayer = Math.round(rs.roundTotal / 2)
        for (const pid of team.playerIds) {
          const player = state.players.find(p => p.id === pid)
          if (player) player.totalScore += perPlayer
        }
      }
    }
  } else {
    for (const rs of roundScores) {
      const player = state.players.find(p => p.id === rs.playerId)
      if (player) player.totalScore += rs.roundTotal
    }
  }

  state.roundScores = roundScores
  state.leaderboard = computeLeaderboard(state.players, isPairs ? state.teams : undefined)
  await delay(1000)

  if (state.round >= 3) {
    state.phase = 'game_over'
    setRoom(roomCode, state)
    io.to(roomCode).emit('game_over', { finalScores: state.leaderboard, winner: state.leaderboard[0] })
  } else {
    state.phase = 'round_end'
    setRoom(roomCode, state)
    io.to(roomCode).emit('round_end', { scores: roundScores, leaderboard: state.leaderboard })
  }
}

function checkAndResolve(state: GameState) {
  const submittedIds = new Set(Object.keys(state.programs))

  if (state.gameMode === 'pairs') {
    // In pairs mode, check by team. Auto-submit empty program for teams where both players disconnected.
    for (const team of state.teams) {
      if (!submittedIds.has(team.id)) {
        const bothDisconnected = team.playerIds.every(pid => {
          const p = state.players.find(pl => pl.id === pid)
          return p?.disconnected
        })
        if (bothDisconnected) {
          state.programs[team.id] = { playerId: team.id, elementIds: [] }
          submittedIds.add(team.id)
        }
      }
    }
    const allDone = state.teams.every(t => submittedIds.has(t.id))
    if (allDone) resolveRound(state)
  } else {
    for (const player of state.players) {
      if (player.disconnected && !submittedIds.has(player.id)) {
        state.programs[player.id] = { playerId: player.id, elementIds: [] }
        submittedIds.add(player.id)
      }
    }
    const allDone = state.players.every(p => submittedIds.has(p.id))
    if (allDone) resolveRound(state)
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[+] ${socket.id} connected`)

  socket.on('create_room', (callback?: (data: { roomCode: string }) => void) => {
    const roomCode = createRoom()
    console.log(`[Room] Created ${roomCode}`)
    if (callback) callback({ roomCode })
    else socket.emit('room_created', { roomCode })
  })

  socket.on('join_room', ({ roomCode, playerName, playerId }: { roomCode: string; playerName: string; playerId: string }) => {
    const state = getRoom(roomCode)
    if (!state) {
      socket.emit('error', { message: 'Room not found.' })
      return
    }

    // Check if this player was already in the room (reconnect)
    const existing = findPlayer(roomCode, playerId)
    if (existing) {
      const oldSocket = playerIdToSocket.get(playerId)
      if (oldSocket) {
        socketToPlayerId.delete(oldSocket)
        socketToRoom.delete(oldSocket)
      }
      playerIdToSocket.set(playerId, socket.id)
      socketToPlayerId.set(socket.id, playerId)
      socketToRoom.set(socket.id, roomCode)
      reconnectPlayer(roomCode, playerId)
      socket.join(roomCode)

      const updated = getRoom(roomCode)!
      io.to(roomCode).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Reconnect] ${existing.name} (${playerId}) in room ${roomCode}`)

      if (state.phase === 'lobby') {
        socket.emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      } else {
        sendCatchUp(playerId, roomCode)
      }
      return
    }

    // Room in lobby phase — join as player
    if (state.phase === 'lobby') {
      if (state.players.filter(p => !p.disconnected).length >= 4) {
        socket.emit('error', { message: 'Game is full (4 players max).' })
        return
      }

      addPlayer(roomCode, playerId, playerName)
      playerIdToSocket.set(playerId, socket.id)
      socketToPlayerId.set(socket.id, playerId)
      socketToRoom.set(socket.id, roomCode)
      socket.join(roomCode)

      const updated = getRoom(roomCode)!
      io.to(roomCode).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Join] ${playerName} (${playerId}) in room ${roomCode}`)
      return
    }

    // Game in progress, new player — join as spectator
    addSpectator(roomCode, { id: playerId, name: playerName })
    playerIdToSocket.set(playerId, socket.id)
    socketToPlayerId.set(socket.id, playerId)
    socketToRoom.set(socket.id, roomCode)
    socket.join(roomCode)

    socket.emit('joined_as_spectator', { roomCode })
    sendCatchUp(playerId, roomCode, { spectator: true })
    console.log(`[Spectator] ${playerName} (${playerId}) in room ${roomCode}`)
  })

  socket.on('player_ready', () => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = setPlayerReady(roomCode, playerId)
    if (!state) return
    setRoom(roomCode, state)
    io.to(roomCode).emit('lobby_update', { players: state.players, gameMode: state.gameMode, teams: state.teams })

    if (allPlayersReady(state)) {
      state.round = 1
      state.phase = 'round_start'
      setRoom(roomCode, state)
      io.to(roomCode).emit('game_start', { initialState: state })
      delay(1500).then(() => runRound(state))
    }
  })

  socket.on('set_game_mode', ({ mode }: { mode: GameMode }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = getRoom(roomCode)
    if (!state || state.phase !== 'lobby') return
    // Only the host (first player) can set mode
    if (state.players.length === 0 || state.players[0].id !== playerId) return

    const updated = setGameMode(roomCode, mode)
    if (updated) {
      io.to(roomCode).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Mode] Set to ${mode} by ${playerId}`)
    }
  })

  socket.on('set_teams', ({ teams: teamPairs }: { teams: [string, string][] }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = getRoom(roomCode)
    if (!state || state.phase !== 'lobby' || state.gameMode !== 'pairs') return
    if (state.players.length === 0 || state.players[0].id !== playerId) return

    const updated = setTeams(roomCode, teamPairs)
    if (updated) {
      io.to(roomCode).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Teams] Set by ${playerId}`)
    }
  })

  socket.on('submit_program', ({ elementIds, incidentTarget }: {
    elementIds: ElementId[]
    incidentTarget?: { playerId: string; cardId: IncidentId }
  }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = getRoom(roomCode)
    if (!state || state.phase !== 'planning') return

    if (state.gameMode === 'pairs') {
      const teamId = getTeamIdForPlayer(state, playerId)
      if (!teamId) return
      // If team already submitted, ignore
      if (state.programs[teamId]) return
      state.programs[teamId] = { playerId: teamId, elementIds, incidentTarget } as Program
      setRoom(roomCode, state)

      const submittedCount = getSubmittedCount(state)
      const total = getTotalExpected(state)
      io.to(roomCode).emit('submission_update', { submittedCount, total })

      // Notify both teammates
      const team = state.teams.find(t => t.id === teamId)
      if (team) {
        for (const pid of team.playerIds) {
          emitToPlayer(pid, 'team_submitted', { teamId })
        }
      }
      console.log(`[Submit] Team ${teamId} by ${playerId} (${submittedCount}/${total})`)
    } else {
      state.programs[playerId] = { playerId, elementIds, incidentTarget } as Program
      setRoom(roomCode, state)

      const submittedCount = getSubmittedCount(state)
      const total = getTotalExpected(state)
      io.to(roomCode).emit('submission_update', { submittedCount, total })
      console.log(`[Submit] ${playerId} (${submittedCount}/${total})`)
    }

    checkAndResolve(state)
  })

  socket.on('next_round', () => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = getRoom(roomCode)
    if (!state || state.phase !== 'round_end') return

    state.round += 1
    state.phase = 'round_start'
    for (const p of state.players) p.ready = false
    setRoom(roomCode, state)
    delay(500).then(() => runRound(state))
  })

  socket.on('restart_game', () => {
    const roomCode = getRoomForSocket(socket)
    if (!roomCode) return
    const state = getRoom(roomCode)
    if (!state || state.phase !== 'game_over') return

    const newState = createInitialState(roomCode)
    newState.gameMode = state.gameMode
    newState.teams = state.teams
    for (const p of state.players) {
      newState.players.push({
        id: p.id,
        name: p.name,
        ready: false,
        totalScore: 0,
        incidentCard: null,
        disconnected: p.disconnected,
        teamId: p.teamId,
      })
    }

    // Convert spectators to players if there's space (max 4)
    for (const spec of state.spectators) {
      if (newState.players.filter(p => !p.disconnected).length < 4) {
        newState.players.push({
          id: spec.id,
          name: spec.name,
          ready: false,
          totalScore: 0,
          incidentCard: null,
        })
      }
    }
    // Clear spectators since they're now players (or stayed spectators if full)
    newState.spectators = []

    setRoom(roomCode, newState)
    io.to(roomCode).emit('game_restart', {})
    io.to(roomCode).emit('lobby_update', { players: newState.players, gameMode: newState.gameMode, teams: newState.teams })
    console.log(`[Restart] Game reset to lobby in room ${roomCode}`)
  })

  socket.on('disconnect', () => {
    const playerId = socketToPlayerId.get(socket.id)
    const roomCode = getRoomForSocket(socket)

    if (playerId && roomCode) {
      // Check if this is a spectator
      const state = getRoom(roomCode)
      if (state) {
        const isSpectator = state.spectators.some(s => s.id === playerId)
        if (isSpectator) {
          removeSpectator(roomCode, playerId)
          playerIdToSocket.delete(playerId)
          socketToPlayerId.delete(socket.id)
          socketToRoom.delete(socket.id)
          console.log(`[-] Spectator ${playerId} disconnected from room ${roomCode}`)
          return
        }
      }

      const { state: updatedState, removed } = disconnectPlayer(roomCode, playerId)
      playerIdToSocket.delete(playerId)
      socketToPlayerId.delete(socket.id)
      socketToRoom.delete(socket.id)

      if (!updatedState) {
        // Room was deleted (all players gone from lobby)
        console.log(`[Reset] Room ${roomCode} deleted — all players gone`)
      } else {
        io.to(roomCode).emit('lobby_update', { players: updatedState.players, gameMode: updatedState.gameMode, teams: updatedState.teams })

        if (updatedState.phase === 'planning' && !removed) {
          checkAndResolve(updatedState)
        }
      }
    }
    console.log(`[-] ${socket.id} disconnected`)
  })
})

httpServer.listen(PORT, () => console.log(`Ice Rivals server running on port ${PORT}`))
