import { useEffect, useState, useRef } from 'react'
import { DiceResult, Player, Team, GameMode } from '../types/game'

const ELEMENT_NAMES: Record<string, string> = {
  quad_axel:       'Quad Axel',
  triple_axel:     'Triple Axel',
  triple_triple:   'Triple-Triple',
  triple_lutz:     'Triple Lutz',
  throw_jump:      'Throw Jump',
  double_axel:     'Double Axel',
  level4_spin:     'Level 4 Spin',
  level3_spin:     'Level 3 Spin',
  flying_spin:     'Flying Spin',
  death_spiral:    'Death Spiral',
  step_sequence:   'Step Sequence',
  spiral_sequence: 'Spiral Sequence',
  ina_bauer:       'Ina Bauer',
  choreography:    'Choreography',
  lift:            'Lift',
  pairs_spin:      'Pairs Spin',
  twist_lift:      'Twist Lift',
  side_by_side:    'Side-by-Side Jump',
}

const ELEMENT_EMOJIS: Record<string, string> = {
  quad_axel:       '🌪️',
  triple_axel:     '💫',
  triple_triple:   '⭐',
  triple_lutz:     '✨',
  throw_jump:      '🤸',
  double_axel:     '🔄',
  level4_spin:     '🌀',
  level3_spin:     '💨',
  flying_spin:     '🦅',
  death_spiral:    '💀',
  step_sequence:   '👣',
  spiral_sequence: '🌊',
  ina_bauer:       '🧊',
  choreography:    '🎭',
  lift:            '🏋️',
  pairs_spin:      '🔁',
  twist_lift:      '🌟',
  side_by_side:    '👯',
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']


interface DiceRollProps {
  results: DiceResult[]
  players: Player[]
  teams: Team[]
  gameMode: GameMode
}

export function DiceRoll({ results, players, teams, gameMode }: DiceRollProps) {
  function getPlayerName(id: string) {
    if (gameMode === 'pairs') {
      const team = teams.find(t => t.id === id)
      if (team) {
        return team.playerIds.map(pid => players.find(p => p.id === pid)?.name ?? '?').join(' & ')
      }
    }
    return players.find(p => p.id === id)?.name ?? 'Unknown'
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-6xl inline-block" style={{ animation: 'wobble 0.8s infinite' }}>⛸️</div>
        <div className="text-lilac-300 text-xl font-semibold font-body">Judges are watching...</div>
        <div className="text-lilac-400 text-sm animate-pulse font-body">The fate of champions is being decided</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result, idx) => (
        <DiceResultRow
          key={`${result.playerId}-${result.elementId}-${idx}`}
          result={result}
          playerName={getPlayerName(result.playerId)}
        />
      ))}
    </div>
  )
}

type RowPhase = 'spinning' | 'landing' | 'settled'

function DiceResultRow({ result, playerName }: { result: DiceResult; playerName: string }) {
  const [phase, setPhase] = useState<RowPhase>('spinning')
  const [displayFace, setDisplayFace] = useState(DICE_FACES[0])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (result.roll === 0) {
      setDisplayFace('🧠')
      setPhase('settled')
      return
    }

    intervalRef.current = setInterval(() => {
      setDisplayFace(DICE_FACES[Math.floor(Math.random() * 6)])
    }, 80)

    const landTimer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDisplayFace(DICE_FACES[result.roll - 1])
      setPhase('landing')
    }, 1100)

    const settleTimer = setTimeout(() => {
      setPhase('settled')
    }, 1700)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      clearTimeout(landTimer)
      clearTimeout(settleTimer)
    }
  }, [result.roll])

  const borderColor = result.fell
    ? 'border-red-500/60'
    : result.goe
    ? 'border-sparkle-gold/60'
    : result.good
    ? 'border-frost-400/50'
    : 'border-green-400/40'

  const bgColor = result.fell
    ? 'bg-red-950/60'
    : result.goe
    ? 'bg-amber-950/40'
    : result.good
    ? 'bg-frost-900/40'
    : 'bg-green-950/40'

  const scoreColor = result.fell
    ? 'text-red-400'
    : result.goe
    ? 'text-sparkle-gold'
    : result.good
    ? 'text-frost-400'
    : 'text-green-400'

  const quipColor = result.fell
    ? 'text-red-400'
    : result.goe
    ? 'text-sparkle-gold'
    : result.good
    ? 'text-frost-400'
    : 'text-green-400/70'

  return (
    <div
      className={`${bgColor} ${borderColor} border-2 rounded-2xl p-5 flex items-center gap-5`}
      style={{ animation: 'slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
    >
      {/* Dice */}
      <div
        className="text-6xl select-none shrink-0 w-16 text-center"
        style={{
          transition: phase === 'landing' ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          transform: phase === 'landing' ? 'scale(1.4)' : phase === 'settled' ? 'scale(1)' : 'scale(1)',
          filter: phase === 'spinning' ? 'blur(1px)' : 'none',
        }}
      >
        {displayFace}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white/50 text-sm font-body">{playerName}</span>
          <span className="text-white font-bold font-body">
            {ELEMENT_EMOJIS[result.elementId]} {ELEMENT_NAMES[result.elementId]}
          </span>
        </div>

        {/* Quip */}
        <div
          className={`text-sm font-bold ${quipColor} transition-all duration-300 font-body`}
          style={{
            opacity: phase === 'spinning' ? 0 : 1,
            transform: phase === 'spinning' ? 'translateY(4px)' : 'translateY(0)',
          }}
        >
          {result.quip}
        </div>
      </div>

      {/* Score */}
      <div
        className={`text-4xl font-black ${scoreColor} shrink-0`}
        style={{
          opacity: phase === 'settled' ? 1 : 0,
          transform: phase === 'settled' ? 'scale(1)' : 'scale(0.3)',
          transition: 'opacity 0.25s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {result.score >= 0 ? '+' : ''}{result.score}
      </div>
    </div>
  )
}
