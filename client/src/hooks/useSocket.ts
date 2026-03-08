import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  CatchUpPayload,
  GameStartPayload,
  RoundStartPayload,
  ProgramsRevealedPayload,
  DiceResultPayload,
  RoundEndPayload,
  GameOverPayload,
  Player,
  Team,
  GameMode,
  ElementId,
  IncidentId,
  Spectator,
} from '../types/game'

export interface SocketHandlers {
  onLobbyUpdate?: (data: { players: Player[]; gameMode: GameMode; teams: Team[] }) => void
  onCatchUp?: (data: CatchUpPayload) => void
  onGameStart?: (data: GameStartPayload) => void
  onRoundStart?: (data: RoundStartPayload) => void
  onProgramsRevealed?: (data: ProgramsRevealedPayload) => void
  onDiceResult?: (data: DiceResultPayload) => void
  onRoundEnd?: (data: RoundEndPayload) => void
  onGameOver?: (data: GameOverPayload) => void
  onSubmissionUpdate?: (data: { submittedCount: number; total: number }) => void
  onError?: (data: { message: string }) => void
  onGameRestart?: () => void
  onTeamSubmitted?: (data: { teamId: string }) => void
  onRoomCreated?: (data: { roomCode: string }) => void
  onJoinedAsSpectator?: (data: { roomCode: string }) => void
  onSpectatorUpdate?: (data: { spectators: Spectator[] }) => void
}

const SOCKET_URL = window.location.origin

let globalSocket: Socket | null = null

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, { autoConnect: false })
  }
  return globalSocket
}

export function useSocket(handlers: SocketHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    if (!socket.connected) socket.connect()

    const onLobbyUpdate = (d: { players: Player[]; gameMode: GameMode; teams: Team[] }) => handlersRef.current.onLobbyUpdate?.(d)
    const onCatchUp = (d: CatchUpPayload) => handlersRef.current.onCatchUp?.(d)
    const onGameStart = (d: GameStartPayload) => handlersRef.current.onGameStart?.(d)
    const onRoundStart = (d: RoundStartPayload) => handlersRef.current.onRoundStart?.(d)
    const onProgramsRevealed = (d: ProgramsRevealedPayload) => handlersRef.current.onProgramsRevealed?.(d)
    const onDiceResult = (d: DiceResultPayload) => handlersRef.current.onDiceResult?.(d)
    const onRoundEnd = (d: RoundEndPayload) => handlersRef.current.onRoundEnd?.(d)
    const onGameOver = (d: GameOverPayload) => handlersRef.current.onGameOver?.(d)
    const onSubmissionUpdate = (d: { submittedCount: number; total: number }) =>
      handlersRef.current.onSubmissionUpdate?.(d)
    const onError = (d: { message: string }) => handlersRef.current.onError?.(d)
    const onGameRestart = () => handlersRef.current.onGameRestart?.()
    const onTeamSubmitted = (d: { teamId: string }) => handlersRef.current.onTeamSubmitted?.(d)
    const onRoomCreated = (d: { roomCode: string }) => handlersRef.current.onRoomCreated?.(d)
    const onJoinedAsSpectator = (d: { roomCode: string }) => handlersRef.current.onJoinedAsSpectator?.(d)
    const onSpectatorUpdate = (d: { spectators: Spectator[] }) => handlersRef.current.onSpectatorUpdate?.(d)

    socket.on('lobby_update', onLobbyUpdate)
    socket.on('catch_up', onCatchUp)
    socket.on('game_start', onGameStart)
    socket.on('round_start', onRoundStart)
    socket.on('programs_revealed', onProgramsRevealed)
    socket.on('dice_result', onDiceResult)
    socket.on('round_end', onRoundEnd)
    socket.on('game_over', onGameOver)
    socket.on('submission_update', onSubmissionUpdate)
    socket.on('error', onError)
    socket.on('game_restart', onGameRestart)
    socket.on('team_submitted', onTeamSubmitted)
    socket.on('room_created', onRoomCreated)
    socket.on('joined_as_spectator', onJoinedAsSpectator)
    socket.on('spectator_update', onSpectatorUpdate)

    return () => {
      socket.off('lobby_update', onLobbyUpdate)
      socket.off('catch_up', onCatchUp)
      socket.off('game_start', onGameStart)
      socket.off('round_start', onRoundStart)
      socket.off('programs_revealed', onProgramsRevealed)
      socket.off('dice_result', onDiceResult)
      socket.off('round_end', onRoundEnd)
      socket.off('game_over', onGameOver)
      socket.off('submission_update', onSubmissionUpdate)
      socket.off('error', onError)
      socket.off('game_restart', onGameRestart)
      socket.off('team_submitted', onTeamSubmitted)
      socket.off('room_created', onRoomCreated)
      socket.off('joined_as_spectator', onJoinedAsSpectator)
      socket.off('spectator_update', onSpectatorUpdate)
    }
  }, [])

  const createRoom = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('create_room')
      socketRef.current?.once('room_created', (data: { roomCode: string }) => {
        resolve(data.roomCode)
      })
    })
  }, [])

  const joinRoom = useCallback((roomCode: string, playerName: string, playerId: string) => {
    socketRef.current?.emit('join_room', { roomCode, playerName, playerId })
  }, [])

  const playerReady = useCallback(() => {
    socketRef.current?.emit('player_ready')
  }, [])

  const submitProgram = useCallback(
    (elementIds: ElementId[], incidentTarget?: { playerId: string; cardId: IncidentId }) => {
      socketRef.current?.emit('submit_program', { elementIds, incidentTarget })
    },
    []
  )

  const nextRound = useCallback(() => {
    socketRef.current?.emit('next_round')
  }, [])

  const restartGame = useCallback(() => {
    socketRef.current?.emit('restart_game')
  }, [])

  const setGameMode = useCallback((mode: GameMode) => {
    socketRef.current?.emit('set_game_mode', { mode })
  }, [])

  const setTeams = useCallback((teams: [string, string][]) => {
    socketRef.current?.emit('set_teams', { teams })
  }, [])

  return { joinRoom, createRoom, playerReady, submitProgram, nextRound, restartGame, setGameMode, setTeams }
}
