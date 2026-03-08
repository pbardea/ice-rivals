import { GameMode } from '../types/game'

interface ScoreBoardProps {
  leaderboard: { playerId: string; name: string; total: number }[]
  myId: string | null
  round: number
  gameMode: GameMode
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣']

export function ScoreBoard({ leaderboard, myId, round, gameMode }: ScoreBoardProps) {
  const isPairs = gameMode === 'pairs'

  return (
    <div className="frosted-glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <span className="text-white font-semibold text-sm font-body">
          {isPairs ? 'Team Leaderboard' : 'Leaderboard'}
        </span>
        {round > 0 && <span className="text-lilac-400 text-xs ml-auto font-body">After Round {round}</span>}
      </div>
      <div className="divide-y divide-white/5">
        {leaderboard.map((entry, idx) => {
          // In pairs mode, playerId is teamId — highlight if myId matches team name pattern
          const isMe = isPairs
            ? entry.name.toLowerCase().includes('you') || false
            : entry.playerId === myId

          return (
            <div
              key={entry.playerId}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isMe ? 'bg-ice-600/20' : ''
              }`}
            >
              <span className="text-lg w-6 text-center">{MEDALS[idx] ?? `${idx + 1}`}</span>
              <span className={`flex-1 font-medium font-body ${isMe ? 'text-lilac-300' : 'text-white/80'}`}>
                {entry.name}
              </span>
              <span className="text-white font-bold text-lg">{entry.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
