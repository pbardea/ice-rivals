import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import path from 'path'
import cors from 'cors'
import {
  getRoom, setRoom, addPlayer, findPlayer,
  disconnectPlayer, reconnectPlayer, setPlayerReady,
  allPlayersReady, resetRoom, setGameMode, setTeams,
} from './game/rooms'
import {
  dealHands, pickJudge, computeLeaderboard, getLastPlacePlayerId, getLastPlaceTeamId,
  rollSingleElement, applyPostRollEffects, getPlayerRollContext,
} from './game/mechanics'
import { Program, GameState, GameMode, DiceResult, createInitialState, Team } from './game/state'
import { ElementId, IncidentId } from './game/cards'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })

app.use(cors())
app.use(express.json())

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))

const PORT = process.env.PORT || 3001
const ROOM = 'GLOBAL'

setRoom(ROOM, createInitialState(ROOM))

const socketToPlayerId = new Map<string, string>()
const playerIdToSocket = new Map<string, string>()

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function emitToPlayer(playerId: string, event: string, data: unknown) {
  const socketId = playerIdToSocket.get(playerId)
  if (socketId) io.to(socketId).emit(event, data)
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

function sendCatchUp(playerId: string) {
  const state = getRoom(ROOM)
  if (!state) return
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

async function runRound(state: GameState): Promise<void> {
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
  setRoom(ROOM, state)

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
  setRoom(ROOM, state)
  io.to(ROOM).emit('programs_revealed', { allPrograms: Object.values(state.programs) })

  await delay(1500)
  state.phase = 'rolling'
  setRoom(ROOM, state)

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
      io.to(ROOM).emit('dice_result', result)
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
    setRoom(ROOM, state)
    io.to(ROOM).emit('game_over', { finalScores: state.leaderboard, winner: state.leaderboard[0] })
  } else {
    state.phase = 'round_end'
    setRoom(ROOM, state)
    io.to(ROOM).emit('round_end', { scores: roundScores, leaderboard: state.leaderboard })
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

  socket.on('join_game', ({ playerName, playerId }: { playerName: string; playerId: string }) => {
    const state = getRoom(ROOM)!

    const existing = findPlayer(ROOM, playerId)
    if (existing) {
      const oldSocket = playerIdToSocket.get(playerId)
      if (oldSocket) socketToPlayerId.delete(oldSocket)
      playerIdToSocket.set(playerId, socket.id)
      socketToPlayerId.set(socket.id, playerId)
      reconnectPlayer(ROOM, playerId)
      socket.join(ROOM)

      const updated = getRoom(ROOM)!
      io.to(ROOM).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Reconnect] ${existing.name} (${playerId})`)

      if (state.phase === 'lobby') {
        socket.emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      } else {
        sendCatchUp(playerId)
      }
      return
    }

    if (state.players.filter(p => !p.disconnected).length >= 4) {
      socket.emit('error', { message: 'Game is full (4 players max).' })
      return
    }
    if (state.phase !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress.' })
      return
    }

    addPlayer(ROOM, playerId, playerName)
    playerIdToSocket.set(playerId, socket.id)
    socketToPlayerId.set(socket.id, playerId)
    socket.join(ROOM)

    const updated = getRoom(ROOM)!
    io.to(ROOM).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
    console.log(`[Join] ${playerName} (${playerId})`)
  })

  socket.on('player_ready', () => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const state = setPlayerReady(ROOM, playerId)
    if (!state) return
    setRoom(ROOM, state)
    io.to(ROOM).emit('lobby_update', { players: state.players, gameMode: state.gameMode, teams: state.teams })

    if (allPlayersReady(state)) {
      state.round = 1
      state.phase = 'round_start'
      setRoom(ROOM, state)
      io.to(ROOM).emit('game_start', { initialState: state })
      delay(1500).then(() => runRound(state))
    }
  })

  socket.on('set_game_mode', ({ mode }: { mode: GameMode }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const state = getRoom(ROOM)
    if (!state || state.phase !== 'lobby') return
    // Only the host (first player) can set mode
    if (state.players.length === 0 || state.players[0].id !== playerId) return

    const updated = setGameMode(ROOM, mode)
    if (updated) {
      io.to(ROOM).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Mode] Set to ${mode} by ${playerId}`)
    }
  })

  socket.on('set_teams', ({ teams: teamPairs }: { teams: [string, string][] }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const state = getRoom(ROOM)
    if (!state || state.phase !== 'lobby' || state.gameMode !== 'pairs') return
    if (state.players.length === 0 || state.players[0].id !== playerId) return

    const updated = setTeams(ROOM, teamPairs)
    if (updated) {
      io.to(ROOM).emit('lobby_update', { players: updated.players, gameMode: updated.gameMode, teams: updated.teams })
      console.log(`[Teams] Set by ${playerId}`)
    }
  })

  socket.on('submit_program', ({ elementIds, incidentTarget }: {
    elementIds: ElementId[]
    incidentTarget?: { playerId: string; cardId: IncidentId }
  }) => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const state = getRoom(ROOM)
    if (!state || state.phase !== 'planning') return

    if (state.gameMode === 'pairs') {
      const teamId = getTeamIdForPlayer(state, playerId)
      if (!teamId) return
      // If team already submitted, ignore
      if (state.programs[teamId]) return
      state.programs[teamId] = { playerId: teamId, elementIds, incidentTarget } as Program
      setRoom(ROOM, state)

      const submittedCount = getSubmittedCount(state)
      const total = getTotalExpected(state)
      io.to(ROOM).emit('submission_update', { submittedCount, total })

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
      setRoom(ROOM, state)

      const submittedCount = getSubmittedCount(state)
      const total = getTotalExpected(state)
      io.to(ROOM).emit('submission_update', { submittedCount, total })
      console.log(`[Submit] ${playerId} (${submittedCount}/${total})`)
    }

    checkAndResolve(state)
  })

  socket.on('next_round', () => {
    const playerId = socketToPlayerId.get(socket.id)
    if (!playerId) return
    const state = getRoom(ROOM)
    if (!state || state.phase !== 'round_end') return

    state.round += 1
    state.phase = 'round_start'
    for (const p of state.players) p.ready = false
    setRoom(ROOM, state)
    delay(500).then(() => runRound(state))
  })

  socket.on('restart_game', () => {
    const state = getRoom(ROOM)
    if (!state || state.phase !== 'game_over') return

    const newState = createInitialState(ROOM)
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
    setRoom(ROOM, newState)
    io.to(ROOM).emit('game_restart', {})
    io.to(ROOM).emit('lobby_update', { players: newState.players, gameMode: newState.gameMode, teams: newState.teams })
    console.log('[Restart] Game reset to lobby')
  })

  socket.on('disconnect', () => {
    const playerId = socketToPlayerId.get(socket.id)
    if (playerId) {
      const { state, removed } = disconnectPlayer(ROOM, playerId)
      playerIdToSocket.delete(playerId)
      socketToPlayerId.delete(socket.id)

      if (!state) {
        setRoom(ROOM, createInitialState(ROOM))
        console.log('[Reset] All players gone')
      } else {
        io.to(ROOM).emit('lobby_update', { players: state.players, gameMode: state.gameMode, teams: state.teams })

        if (state.phase === 'planning' && !removed) {
          checkAndResolve(state)
        }
      }
    }
    console.log(`[-] ${socket.id} disconnected`)
  })
})

httpServer.listen(PORT, () => console.log(`Ice Rivals server running on port ${PORT}`))
