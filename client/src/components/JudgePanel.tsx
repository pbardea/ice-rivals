import { JudgeCard } from '../types/game'

const JUDGE_ICONS: Record<string, string> = {
  technical_judge: '⚙️',
  artistic_judge: '🎨',
  strict_judge: '😤',
  lenient_judge: '😌',
  fan_favorite: '🌟',
}

const JUDGE_COLORS: Record<string, string> = {
  technical_judge: 'from-frost-600 to-frost-800 border-frost-400/30',
  artistic_judge: 'from-lilac-500 to-purple-800 border-lilac-300/30',
  strict_judge: 'from-red-600 to-red-900 border-red-400/30',
  lenient_judge: 'from-emerald-600 to-emerald-900 border-emerald-400/30',
  fan_favorite: 'from-amber-500 to-orange-700 border-sparkle-gold/40',
}

interface JudgePanelProps {
  judgeCard: JudgeCard
  round: number
}

const ROUND_NAMES = ['', 'Short Program', 'Free Skate', 'Championship Skate']

export function JudgePanel({ judgeCard, round }: JudgePanelProps) {
  return (
    <div className={`bg-gradient-to-r ${JUDGE_COLORS[judgeCard.id] ?? 'from-gray-600 to-gray-800 border-gray-400/30'} rounded-2xl p-4 border shadow-[0_4px_20px_rgba(0,0,0,0.3)]`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl animate-float">{JUDGE_ICONS[judgeCard.id] ?? '👨‍⚖️'}</div>
        <div>
          <div className="text-white/60 text-xs uppercase tracking-wider font-body">
            Round {round} — {ROUND_NAMES[round]}
          </div>
          <div className="text-white font-bold text-lg font-body">{judgeCard.name}</div>
          <div className="text-white/80 text-sm font-body">{judgeCard.description}</div>
        </div>
      </div>
    </div>
  )
}
