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
    <div className="min-h-screen bg-gradient-to-br from-ice-900 via-ice-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⛸️</div>
          <h1 className="text-3xl font-bold text-white">Ice Rivals</h1>
          <p className="text-ice-300 mt-1">Figure Skating Board Game</p>
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
            className="w-full bg-ice-500 hover:bg-ice-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-ice-400 text-sm">or join existing</span>
            <div className="flex-1 h-px bg-white/20" />
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
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-ice-400 focus:outline-none focus:border-ice-400 text-center text-xl tracking-widest uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-lg"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
