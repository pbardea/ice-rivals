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
  const expectedTeams = Math.floor(players.length / 2)
  const teamsAssigned = isPairs && teams.length === expectedTeams && expectedTeams > 0
  const needsEvenPlayers = isPairs && players.length % 2 !== 0

  function handleAutoAssignTeams() {
    if (players.length < 4 || players.length % 2 !== 0) return
    const ids = players.map(p => p.id)
    const pairs: [string, string][] = []
    for (let i = 0; i < ids.length; i += 2) {
      pairs.push([ids[i], ids[i + 1]])
    }
    onSetTeams(pairs)
  }

  function handleShuffleTeams() {
    if (players.length < 4 || players.length % 2 !== 0) return
    const ids = players.map(p => p.id)
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]]
    }
    const pairs: [string, string][] = []
    for (let i = 0; i < ids.length; i += 2) {
      pairs.push([ids[i], ids[i + 1]])
    }
    onSetTeams(pairs)
  }

  function getTeamLabel(playerId: string): string | null {
    const teamIdx = teams.findIndex(t => t.playerIds.includes(playerId))
    return teamIdx >= 0 ? `Team ${teamIdx + 1}` : null
  }

  const TEAM_COLORS = ['text-frost-400', 'text-sparkle-rose', 'text-green-400', 'text-sparkle-gold']

  function getTeamColor(playerId: string): string {
    const teamIdx = teams.findIndex(t => t.playerIds.includes(playerId))
    return teamIdx >= 0 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-900 via-ice-800 to-frost-900 flex items-center justify-center p-4">
      <div className="frosted-glass rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-float">⛸️</div>
          <h1 className="font-display text-4xl text-white drop-shadow-lg">Ice Rivals</h1>
          <p className="text-lilac-300 mt-2 font-body text-sm tracking-wide">Figure Skating Board Game</p>
          <div className="mt-3 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-sparkle-gold/40 to-transparent" />
        </div>

        {roomCode && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="frosted-glass rounded-xl px-4 py-2 flex items-center gap-3">
              <span className="text-lilac-300 text-sm">Room:</span>
              <span className="text-sparkle-gold font-bold text-lg tracking-widest font-body">{roomCode}</span>
              <button
                onClick={handleCopyLink}
                className="ml-1 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-lilac-300 text-sm transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
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
              <label className="text-lilac-300 text-sm block mb-1 font-body">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); localStorage.setItem('ice_rivals_name', e.target.value) }}
                onKeyDown={e => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-lilac-400/50 focus:outline-none focus:border-lilac-400/60 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] font-body transition-all [color-scheme:dark]"
              />
            </div>
            <button
              onClick={() => name.trim() && onJoin(name.trim())}
              disabled={!name.trim()}
              className="glow-button w-full text-white font-bold py-3 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    !isPairs ? 'bg-gradient-to-r from-ice-600 to-lilac-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/8 text-white/60 hover:bg-white/15'
                  }`}
                >
                  Singles
                </button>
                <button
                  onClick={() => onSetGameMode('pairs')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isPairs ? 'bg-gradient-to-r from-ice-600 to-lilac-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/8 text-white/60 hover:bg-white/15'
                  }`}
                >
                  Pairs
                </button>
              </div>
            )}
            {!isHost && (
              <div className="text-center text-lilac-300 text-sm mb-2 font-body">
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
                    className="flex items-center justify-between frosted-glass rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ice-500/60 to-lilac-500/40 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium font-body">
                        {p.name}{p.id === myId && <span className="text-lilac-300 text-sm ml-1">(you)</span>}
                        {teamLabel && <span className={`text-xs ml-2 ${teamColor}`}>{teamLabel}</span>}
                      </span>
                    </div>
                    {p.disconnected
                      ? <span className="text-red-400 text-sm">Disconnected</span>
                      : p.ready
                      ? <span className="text-green-400 text-sm font-semibold">✓ Ready</span>
                      : <span className="text-lilac-400 text-sm">Waiting...</span>}
                  </div>
                )
              })}
              <div className="text-lilac-400 text-sm text-center py-2 font-body">
                {players.length < 2
                  ? `Waiting for players (${players.length}/8)...`
                  : isPairs && needsEvenPlayers
                  ? `Need an even number of players for Pairs (${players.length} joined)`
                  : players.length < 8
                  ? `${players.length} players joined (up to 8)`
                  : 'Room full!'}
              </div>
            </div>

            {/* Team Assignment (Pairs mode, host, enough even players) */}
            {isPairs && isHost && players.length >= 4 && !needsEvenPlayers && (
              <div className="frosted-glass rounded-xl p-4 space-y-3">
                <div className="text-white font-semibold text-sm text-center font-body">Team Assignment</div>
                {!teamsAssigned ? (
                  <button
                    onClick={handleAutoAssignTeams}
                    className="glow-button w-full text-white font-semibold py-2 rounded-xl text-sm"
                  >
                    Assign Teams
                  </button>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team, idx) => {
                      const teamPlayers = team.playerIds.map(id => players.find(p => p.id === id))
                      const TEAM_BORDER_COLORS = [
                        'border-frost-500/50 bg-frost-900/20',
                        'border-pink-500/50 bg-pink-900/20',
                        'border-green-500/50 bg-green-900/20',
                        'border-sparkle-gold/50 bg-yellow-900/20',
                      ]
                      const color = TEAM_BORDER_COLORS[idx % TEAM_BORDER_COLORS.length]
                      return (
                        <div key={team.id} className={`rounded-xl p-3 border ${color}`}>
                          <div className={`text-xs font-semibold mb-1 ${TEAM_COLORS[idx % TEAM_COLORS.length]}`}>
                            Team {idx + 1}
                          </div>
                          <div className="text-white text-sm font-body">
                            {teamPlayers.map(p => p?.name ?? '?').join(' & ')}
                          </div>
                        </div>
                      )
                    })}
                    <button
                      onClick={handleShuffleTeams}
                      className="w-full bg-white/8 hover:bg-white/15 text-white/70 font-semibold py-2 rounded-xl transition-all text-sm hover:shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                    >
                      Shuffle Teams
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pairs mode, non-host, show teams if assigned */}
            {isPairs && !isHost && teamsAssigned && (
              <div className="frosted-glass rounded-xl p-4 space-y-2">
                <div className="text-white font-semibold text-sm text-center font-body">Teams</div>
                {teams.map((team, idx) => {
                  const teamPlayers = team.playerIds.map(id => players.find(p => p.id === id))
                  return (
                    <div key={team.id} className={`text-sm text-center font-body ${TEAM_COLORS[idx % TEAM_COLORS.length]}`}>
                      Team {idx + 1}: {teamPlayers.map(p => p?.name ?? '?').join(' & ')}
                    </div>
                  )
                })}
              </div>
            )}

            {myPlayer && !myPlayer.ready && (
              <button
                onClick={onReady}
                disabled={isPairs && (!teamsAssigned || players.length < 4 || needsEvenPlayers)}
                className="glow-button w-full text-white font-bold py-3 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✨ Ready Up!
              </button>
            )}
            {myPlayer?.ready && !allReady && (
              <div className="text-center text-lilac-300 text-sm font-body">
                Waiting for other players to ready up...
              </div>
            )}
            {allReady && (
              <div className="text-center text-sparkle-gold font-semibold animate-pulse font-body">
                All ready! Starting game...
              </div>
            )}

            {spectators.length > 0 && (
              <div className="frosted-glass rounded-xl p-4">
                <div className="text-lilac-400 text-xs uppercase tracking-wider mb-2 font-body">Spectators ({spectators.length})</div>
                <div className="flex flex-wrap gap-2">
                  {spectators.map(s => (
                    <span key={s.id} className="bg-white/10 rounded-full px-3 py-1 text-lilac-300 text-sm font-body">
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
