import { JudgeCard } from '../types/game'

const JUDGE_ICONS: Record<string, string> = {
  technical_judge: '⚙️',
  artistic_judge: '🎨',
  strict_judge: '😤',
  lenient_judge: '😌',
  fan_favorite: '🌟',
}

const JUDGE_COLORS: Record<string, string> = {
  technical_judge: 'from-blue-600 to-blue-800',
  artistic_judge: 'from-purple-600 to-purple-800',
  strict_judge: 'from-red-600 to-red-800',
  lenient_judge: 'from-green-600 to-green-800',
  fan_favorite: 'from-yellow-500 to-orange-600',
}

interface JudgePanelProps {
  judgeCard: JudgeCard
  round: number
}

const ROUND_NAMES = ['', 'Short Program', 'Free Skate', 'Championship Skate']

export function JudgePanel({ judgeCard, round }: JudgePanelProps) {
  return (
    <div className={`bg-gradient-to-r ${JUDGE_COLORS[judgeCard.id] ?? 'from-gray-600 to-gray-800'} rounded-xl p-4 border border-white/20`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{JUDGE_ICONS[judgeCard.id] ?? '👨‍⚖️'}</div>
        <div>
          <div className="text-white/70 text-xs uppercase tracking-wider">
            Round {round} — {ROUND_NAMES[round]}
          </div>
          <div className="text-white font-bold text-lg">{judgeCard.name}</div>
          <div className="text-white/80 text-sm">{judgeCard.description}</div>
        </div>
      </div>
    </div>
  )
}
