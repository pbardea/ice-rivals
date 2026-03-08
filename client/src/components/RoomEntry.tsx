import { useState } from 'react'

interface RoomEntryProps {
  onCreateRoom: () => Promise<string>
  onJoinRoom: (roomCode: string) => void
  error: string | null
}

export function RoomEntry({ onCreateRoom, onJoinRoom, error }: RoomEntryProps) {
  const [roomCode, setRoomCode] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    try {
      const code = await onCreateRoom()
      const url = new URL(window.location.href)
      url.searchParams.set('room', code)
      window.history.pushState({}, '', url.toString())
      onJoinRoom(code)
    } finally {
      setCreating(false)
    }
  }

  function handleJoin() {
    const code = roomCode.trim().toUpperCase()
    if (!code) return
    const url = new URL(window.location.href)
    url.searchParams.set('room', code)
    window.history.pushState({}, '', url.toString())
    onJoinRoom(code)
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

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2 mb-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="glow-button w-full text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : '✨ Create Room'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-lilac-400 text-sm font-body">or join existing</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter room code"
              maxLength={10}
              autoFocus
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-lilac-400/60 focus:outline-none focus:border-lilac-400/60 focus:shadow-[0_0_20px_rgba(45,212,191,0.15)] text-center text-xl tracking-widest uppercase font-body transition-all"
            />
            <button
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              className="w-full bg-white/8 hover:bg-white/15 border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all text-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
