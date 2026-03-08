import { useState, useCallback, useEffect, useRef } from 'react'
import { useSocket } from './hooks/useSocket'
import { Lobby } from './components/Lobby'
import { GameBoard } from './components/GameBoard'
import { RoomEntry } from './components/RoomEntry'
import {
  Player,
  Team,
  GameMode,
  GamePhase,
  JudgeCard,
  DiceResult,
  RoundScore,
  ElementId,
  IncidentId,
  Spectator,
} from './types/game'

function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || null
}

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('ice_rivals_player_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ice_rivals_player_id', id)
  }
  return id
}

interface AppState {
  joined: boolean
  myId: string | null
  roomCode: string | null
  isSpectator: boolean
  spectators: Spectator[]
  players: Player[]
  gameMode: GameMode
  teams: Team[]
  phase: GamePhase
  round: number
  judgeCard: JudgeCard | null
  hand: ElementId[]
  partnerHand: ElementId[]
  incidentCard: IncidentId | null
  diceResults: DiceResult[]
  roundScores: RoundScore[]
  leaderboard: { playerId: string; name: string; total: number }[]
  submittedCount: number
  mySubmitted: boolean
  winner: { playerId: string; name: string; total: number } | null
  finalScores: { playerId: string; name: string; total: number }[]
  error: string | null
}

const INITIAL_STATE: AppState = {
  joined: false,
  myId: null,
  roomCode: getRoomCodeFromUrl(),
  isSpectator: false,
  spectators: [],
  players: [],
  gameMode: 'singles',
  teams: [],
  phase: 'lobby',
  round: 0,
  judgeCard: null,
  hand: [],
  partnerHand: [],
  incidentCard: null,
  diceResults: [],
  roundScores: [],
  leaderboard: [],
  submittedCount: 0,
  mySubmitted: false,
  winner: null,
  finalScores: [],
  error: null,
}

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE)
  const myPlayerId = getOrCreatePlayerId()

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const { joinRoom, createRoom, playerReady, submitProgram, nextRound, restartGame, setGameMode, setTeams, leaveRoom } = useSocket({
    getRejoinInfo: () => {
      const name = localStorage.getItem('ice_rivals_name')
      const roomCode = getRoomCodeFromUrl()
      if (name && roomCode) return { roomCode, playerName: name, playerId: myPlayerId }
      return null
    },
    onLobbyUpdate: data => {
      updateState({ players: data.players, gameMode: data.gameMode, teams: data.teams, myId: myPlayerId, error: null })
    },
    onCatchUp: data => {
      setState(prev => ({
        ...prev,
        joined: true,
        myId: myPlayerId,
        phase: data.phase,
        round: data.round,
        gameMode: data.gameMode,
        teams: data.teams,
        judgeCard: data.judgeCard,
        players: data.players,
        leaderboard: data.leaderboard,
        hand: data.hand,
        partnerHand: data.partnerHand,
        incidentCard: data.incidentCard,
        diceResults: data.diceResults,
        roundScores: data.roundScores,
        mySubmitted: data.alreadySubmitted,
        submittedCount: data.submittedCount,
        isSpectator: data.spectator ?? false,
        spectators: data.spectators ?? prev.spectators,
      }))
    },
    onGameStart: data => {
      updateState({
        phase: data.initialState.phase,
        round: data.initialState.round,
        leaderboard: data.initialState.leaderboard,
        diceResults: [],
        roundScores: [],
      })
    },
    onRoundStart: data => {
      updateState({
        phase: 'planning',
        round: data.round,
        judgeCard: data.judgeCard,
        hand: data.hand,
        partnerHand: data.partnerHand,
        incidentCard: data.incidentCard,
        gameMode: data.gameMode,
        teams: data.teams,
        diceResults: [],
        roundScores: [],
        mySubmitted: false,
        submittedCount: 0,
      })
    },
    onProgramsRevealed: () => {
      updateState({ phase: 'revealing', diceResults: [] })
    },
    onDiceResult: data => {
      setState(prev => ({ ...prev, phase: 'rolling', diceResults: [...prev.diceResults, data] }))
    },
    onRoundEnd: data => {
      setState(prev => ({
        ...prev,
        phase: 'round_end',
        roundScores: data.scores,
        leaderboard: data.leaderboard,
        players: prev.players.map(p => {
          const entry = data.leaderboard.find(e => e.playerId === p.id)
          return entry ? { ...p, totalScore: entry.total } : p
        }),
      }))
    },
    onGameOver: data => {
      setState(prev => ({
        ...prev,
        phase: 'game_over',
        finalScores: data.finalScores,
        winner: data.winner,
        leaderboard: data.finalScores,
        players: prev.players.map(p => {
          const entry = data.finalScores.find(e => e.playerId === p.id)
          return entry ? { ...p, totalScore: entry.total } : p
        }),
      }))
    },
    onSubmissionUpdate: data => {
      updateState({ submittedCount: data.submittedCount })
    },
    onError: data => {
      updateState({ error: data.message })
    },
    onTeamSubmitted: () => {
      setState(prev => ({ ...prev, mySubmitted: true }))
    },
    onGameRestart: () => {
      setState(prev => ({
        ...INITIAL_STATE,
        joined: true,
        myId: prev.myId,
        roomCode: prev.roomCode,
        players: prev.players,
      }))
    },
    onJoinedAsSpectator: (_data) => {
      updateState({ isSpectator: true, joined: true, myId: myPlayerId })
    },
    onSpectatorUpdate: data => {
      updateState({ spectators: data.spectators })
    },
    onLeftRoom: () => {
      setState({ ...INITIAL_STATE, roomCode: null })
      window.history.pushState({}, '', window.location.pathname)
    },
  })

  // Auto-rejoin on page refresh if we have a room code and stored name
  const autoJoinedRef = useRef(false)
  useEffect(() => {
    if (autoJoinedRef.current) return
    const urlRoom = getRoomCodeFromUrl()
    const storedName = localStorage.getItem('ice_rivals_name')
    if (urlRoom && storedName) {
      autoJoinedRef.current = true
      joinRoom(urlRoom, storedName, myPlayerId)
      updateState({ joined: true, myId: myPlayerId, roomCode: urlRoom })
    }
  }, [joinRoom, myPlayerId, updateState])

  function handleJoin(name: string) {
    if (state.roomCode) {
      joinRoom(state.roomCode, name, myPlayerId)
    }
    updateState({ joined: true, myId: myPlayerId })
  }

  function handleSetRoomCode(roomCode: string) {
    updateState({ roomCode })
  }

  async function handleCreateRoom(): Promise<string> {
    const code = await createRoom()
    updateState({ roomCode: code })
    return code
  }

  function handleSubmit(elements: ElementId[], incidentTarget?: { playerId: string; cardId: IncidentId }) {
    submitProgram(elements, incidentTarget)
    setState(prev => ({ ...prev, mySubmitted: true }))
  }

  function handleNextRound() {
    nextRound()
    updateState({ phase: 'round_start' })
  }

  function handleLeave() {
    leaveRoom()
    window.history.pushState({}, '', window.location.pathname)
    setState({ ...INITIAL_STATE, roomCode: null })
  }

  function handleRestart() {
    restartGame()
  }

  if (!state.roomCode) {
    return (
      <RoomEntry
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleSetRoomCode}
        error={state.error}
      />
    )
  }

  if (state.phase === 'lobby') {
    return (
      <Lobby
        players={state.players}
        joined={state.joined}
        myId={state.myId}
        gameMode={state.gameMode}
        teams={state.teams}
        roomCode={state.roomCode}
        spectators={state.spectators}
        onJoin={handleJoin}
        onReady={playerReady}
        onSetGameMode={setGameMode}
        onSetTeams={setTeams}
        onLeave={handleLeave}
        error={state.error}
      />
    )
  }

  return (
    <GameBoard
      phase={state.phase}
      round={state.round}
      gameMode={state.gameMode}
      teams={state.teams}
      judgeCard={state.judgeCard}
      hand={state.hand}
      partnerHand={state.partnerHand}
      incidentCard={state.incidentCard}
      players={state.players}
      myId={state.myId}
      diceResults={state.diceResults}
      roundScores={state.roundScores}
      leaderboard={state.leaderboard}
      submittedCount={state.submittedCount}
      mySubmitted={state.mySubmitted}
      winner={state.winner}
      finalScores={state.finalScores}
      isSpectator={state.isSpectator}
      onSubmit={handleSubmit}
      onNextRound={handleNextRound}
      onRestart={handleRestart}
    />
  )
}
