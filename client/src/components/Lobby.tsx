import { useState } from 'react'
import { Player, GameMode, Team, Spectator } from '../types/game'

interface LobbyProps {
  players: Player[]
  joined: boolean
  myId: string | null
  gameMode: GameMode
  teams: Team[]
  roomCode: string
  spectators: Spectator[]
  onJoin: (name: string) => void
  onReady: () => void
  onSetGameMode: (mode: GameMode) => void
  onSetTeams: (teams: [string, string][]) => void
  error: string | null
}

export function Lobby({ players, joined, myId, gameMode, teams, roomCode, spectators, onJoin, onReady, onSetGameMode, onSetTeams, error }: LobbyProps) {
  const [name, setName] = useState(() => localStorage.getItem('ice_rivals_name') ?? '')
  const [copied, setCopied] = useState(false)

  function handleCopyLink() {
    const url = `${window.location.origin}?room=${roomCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const myPlayer = players.find(p => p.id === myId)
  const allReady = players.length >= 2 && players.every(p => p.ready)
  const isHost = players.length > 0 && players[0].id === myId
  const isPairs = gameMode === 'pairs'
  const teamsAssigned = teams.length === 2

  function handleAutoAssignTeams() {
    if (players.length < 4) return
    const ids = players.map(p => p.id)
    onSetTeams([[ids[0], ids[1]], [ids[2], ids[3]]])
  }

  function handleSwapTeams() {
    if (players.length < 4 || teams.length < 2) return
    // Swap: move second player of team 1 to team 2 and vice versa
    const t1 = teams[0].playerIds
    const t2 = teams[1].playerIds
    onSetTeams([[t1[0], t2[1]], [t2[0], t1[1]]])
  }

  function getTeamLabel(playerId: string): string | null {
    const teamIdx = teams.findIndex(t => t.playerIds.includes(playerId))
    return teamIdx >= 0 ? `Team ${teamIdx + 1}` : null
  }

  function getTeamColor(playerId: string): string {
    const teamIdx = teams.findIndex(t => t.playerIds.includes(playerId))
    return teamIdx === 0 ? 'text-blue-400' : teamIdx === 1 ? 'text-pink-400' : ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-900 via-ice-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⛸️</div>
          <h1 className="text-3xl font-bold text-white">Ice Rivals</h1>
          <p className="text-ice-300 mt-1">Figure Skating Board Game</p>
        </div>

        {roomCode && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-ice-300 text-sm">Room:</span>
            <span className="text-white font-mono font-bold text-lg tracking-widest">{roomCode}</span>
            <button
              onClick={handleCopyLink}
              className="ml-1 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-ice-300 text-sm transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2 mb-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!joined ? (
          <div className="space-y-4">
            <div>
              <label className="text-ice-200 text-sm block mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); localStorage.setItem('ice_rivals_name', e.target.value) }}
                onKeyDown={e => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-ice-400 focus:outline-none focus:border-ice-400"
              />
            </div>
            <button
              onClick={() => name.trim() && onJoin(name.trim())}
              disabled={!name.trim()}
              className="w-full bg-ice-500 hover:bg-ice-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-lg"
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Toggle (host only) */}
            {isHost && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => onSetGameMode('singles')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !isPairs ? 'bg-ice-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Singles
                </button>
                <button
                  onClick={() => onSetGameMode('pairs')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isPairs ? 'bg-ice-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Pairs
                </button>
              </div>
            )}
            {!isHost && (
              <div className="text-center text-ice-300 text-sm mb-2">
                Mode: <span className="font-semibold text-white">{isPairs ? 'Pairs' : 'Singles'}</span>
              </div>
            )}

            <div className="space-y-2">
              {players.map(p => {
                const teamLabel = isPairs ? getTeamLabel(p.id) : null
                const teamColor = isPairs ? getTeamColor(p.id) : ''
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ice-500/40 flex items-center justify-center text-white font-bold text-sm">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium">
                        {p.name}{p.id === myId && <span className="text-ice-300 text-sm ml-1">(you)</span>}
                        {teamLabel && <span className={`text-xs ml-2 ${teamColor}`}>{teamLabel}</span>}
                      </span>
                    </div>
                    {p.disconnected
                      ? <span className="text-red-400 text-sm">Disconnected</span>
                      : p.ready
                      ? <span className="text-green-400 text-sm font-semibold">✓ Ready</span>
                      : <span className="text-ice-400 text-sm">Waiting...</span>}
                  </div>
                )
              })}
              <div className="text-ice-400 text-sm text-center py-2">
                {isPairs
                  ? `Waiting for 4 players (${players.length}/4)...`
                  : players.length < 4
                  ? `Waiting for players (${players.length}/4)...`
                  : null}
              </div>
            </div>

            {/* Team Assignment (Pairs mode, host, 4 players) */}
            {isPairs && isHost && players.length >= 4 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="text-white font-semibold text-sm text-center">Team Assignment</div>
                {!teamsAssigned ? (
                  <button
                    onClick={handleAutoAssignTeams}
                    className="w-full bg-ice-600 hover:bg-ice-500 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                  >
                    Assign Teams
                  </button>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team, idx) => {
                      const teamPlayers = team.playerIds.map(id => players.find(p => p.id === id))
                      const color = idx === 0 ? 'border-blue-500/50 bg-blue-900/20' : 'border-pink-500/50 bg-pink-900/20'
                      return (
                        <div key={team.id} className={`rounded-lg p-3 border ${color}`}>
                          <div className={`text-xs font-semibold mb-1 ${idx === 0 ? 'text-blue-400' : 'text-pink-400'}`}>
                            Team {idx + 1}
                          </div>
                          <div className="text-white text-sm">
                            {teamPlayers.map(p => p?.name ?? '?').join(' & ')}
                          </div>
                        </div>
                      )
                    })}
                    <button
                      onClick={handleSwapTeams}
                      className="w-full bg-white/10 hover:bg-white/20 text-white/70 font-semibold py-2 rounded-lg transition-colors text-sm"
                    >
                      Swap Partners
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pairs mode, non-host, show teams if assigned */}
            {isPairs && !isHost && teamsAssigned && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <div className="text-white font-semibold text-sm text-center">Teams</div>
                {teams.map((team, idx) => {
                  const teamPlayers = team.playerIds.map(id => players.find(p => p.id === id))
                  return (
                    <div key={team.id} className={`text-sm text-center ${idx === 0 ? 'text-blue-400' : 'text-pink-400'}`}>
                      Team {idx + 1}: {teamPlayers.map(p => p?.name ?? '?').join(' & ')}
                    </div>
                  )
                })}
              </div>
            )}

            {myPlayer && !myPlayer.ready && (
              <button
                onClick={onReady}
                disabled={isPairs && (!teamsAssigned || players.length < 4)}
                className="w-full bg-ice-500 hover:bg-ice-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-lg"
              >
                Ready Up!
              </button>
            )}
            {myPlayer?.ready && !allReady && (
              <div className="text-center text-ice-300 text-sm">
                Waiting for other players to ready up...
              </div>
            )}
            {allReady && (
              <div className="text-center text-green-400 font-semibold animate-pulse">
                All ready! Starting game...
              </div>
            )}

            {spectators.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-ice-400 text-xs uppercase tracking-wider mb-2">Spectators ({spectators.length})</div>
                <div className="flex flex-wrap gap-2">
                  {spectators.map(s => (
                    <span key={s.id} className="bg-white/10 rounded-full px-3 py-1 text-ice-300 text-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
