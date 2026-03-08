import { ElementId } from '../types/game'

const ELEMENT_INFO: Record<ElementId, { name: string; base: number; threshold: number; category: string; emoji: string }> = {
  quad_axel:       { name: 'Quad Axel',      base: 7, threshold: 5, category: 'jump',   emoji: '🌪️' },
  triple_triple:   { name: 'Triple-Triple',  base: 6, threshold: 5, category: 'jump',   emoji: '⭐' },
  triple_axel:     { name: 'Triple Axel',    base: 5, threshold: 4, category: 'jump',   emoji: '💫' },
  triple_lutz:     { name: 'Triple Lutz',    base: 4, threshold: 3, category: 'jump',   emoji: '✨' },
  throw_jump:      { name: 'Throw Jump',     base: 5, threshold: 4, category: 'jump',   emoji: '🤸' },
  double_axel:     { name: 'Double Axel',    base: 3, threshold: 2, category: 'jump',   emoji: '🔄' },
  level4_spin:     { name: 'Lvl 4 Spin',     base: 3, threshold: 3, category: 'spin',   emoji: '🌀' },
  level3_spin:     { name: 'Lvl 3 Spin',     base: 2, threshold: 2, category: 'spin',   emoji: '💨' },
  flying_spin:     { name: 'Flying Spin',    base: 3, threshold: 4, category: 'spin',   emoji: '🦅' },
  death_spiral:    { name: 'Death Spiral',   base: 4, threshold: 4, category: 'spin',   emoji: '💀' },
  step_sequence:   { name: 'Step Seq.',      base: 2, threshold: 3, category: 'step',   emoji: '👣' },
  spiral_sequence: { name: 'Spiral Seq.',    base: 3, threshold: 3, category: 'step',   emoji: '🌊' },
  ina_bauer:       { name: 'Ina Bauer',      base: 3, threshold: 3, category: 'choreo', emoji: '🧊' },
  choreography:    { name: 'Choreography',   base: 2, threshold: 0, category: 'choreo', emoji: '🎭' },
  lift:            { name: 'Lift',            base: 4, threshold: 4, category: 'choreo', emoji: '🏋️' },
  pairs_spin:      { name: 'Pairs Spin',     base: 3, threshold: 3, category: 'spin',   emoji: '🔁' },
  twist_lift:      { name: 'Twist Lift',     base: 5, threshold: 4, category: 'jump',   emoji: '🌟' },
  side_by_side:    { name: 'Side-by-Side',   base: 4, threshold: 4, category: 'jump',   emoji: '👯' },
}

const CATEGORY_COLORS: Record<string, string> = {
  jump:   'from-indigo-500/80 to-frost-700/80 border-frost-400/50',
  spin:   'from-lilac-500/80 to-purple-800/80 border-lilac-300/50',
  step:   'from-teal-500/80 to-teal-800/80 border-teal-300/50',
  choreo: 'from-pink-500/80 to-rose-800/80 border-pink-300/50',
}

interface PlayerHandProps {
  hand: ElementId[]
  selectedIndices: number[]
  onToggle: (idx: number) => void
  min: number
  max: number
  disabled?: boolean
  splitAt?: number // If set, show a divider between "your cards" and "partner's cards"
}

export function PlayerHand({ hand, selectedIndices, onToggle, min, max, disabled, splitAt }: PlayerHandProps) {
  const renderCard = (id: ElementId, idx: number) => {
    const info = ELEMENT_INFO[id]
    const isSelected = selectedIndices.includes(idx)
    const canSelect = !isSelected && selectedIndices.length < max
    const colorClass = CATEGORY_COLORS[info.category]
    const selectionOrder = selectedIndices.indexOf(idx)

    return (
      <button
        key={idx}
        onClick={() => !disabled && onToggle(idx)}
        disabled={disabled || (!isSelected && !canSelect)}
        className={`
          relative bg-gradient-to-br ${colorClass} border rounded-2xl p-3 text-left transition-all
          ${isSelected ? 'sparkle-ring scale-105 shadow-lg' : ''}
          ${!disabled && (isSelected || canSelect) ? 'hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] cursor-pointer' : 'opacity-50 cursor-not-allowed'}
        `}
        style={isSelected ? { boxShadow: '0 0 0 2px rgba(251,191,36,0.6), 0 0 16px rgba(251,191,36,0.3), 0 0 30px rgba(251,191,36,0.1)' } : undefined}
      >
        <div className="text-2xl mb-1">{info.emoji}</div>
        <div className="text-white font-semibold text-sm leading-tight font-body">{info.name}</div>
        <div className="text-white/70 text-xs mt-1 font-body">
          Base: <span className="text-sparkle-gold font-bold">{info.base}</span>
        </div>
        <div className="text-white/70 text-xs font-body">
          Need: <span className="text-white font-bold">{info.threshold === 0 ? 'Auto' : `${info.threshold}+`}</span>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-sparkle-gold to-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-amber-900 shadow-[0_0_8px_rgba(251,191,36,0.5)]">
            {selectionOrder + 1}
          </div>
        )}
        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 rounded-2xl shimmer pointer-events-none opacity-30" />
      </button>
    )
  }

  if (splitAt !== undefined && splitAt > 0 && splitAt < hand.length) {
    const myCards = hand.slice(0, splitAt)
    const partnerCards = hand.slice(splitAt)

    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/70 text-sm font-body">Team Cards</span>
          <span className="text-lilac-300 text-sm font-medium font-body">
            {selectedIndices.length}/{max} selected {min === max ? `(exactly ${min})` : `(${min}–${max})`}
          </span>
        </div>
        <div className="text-lilac-400/70 text-xs mb-2 uppercase tracking-wider font-body">Your Cards</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {myCards.map((id, idx) => renderCard(id, idx))}
        </div>
        <div className="text-lilac-400/70 text-xs mb-2 uppercase tracking-wider font-body">Partner's Cards</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {partnerCards.map((id, idx) => renderCard(id, idx + splitAt))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-white/70 text-sm font-body">Your Cards</span>
        <span className="text-lilac-300 text-sm font-medium font-body">
          {selectedIndices.length}/{max} selected {min === max ? `(exactly ${min})` : `(${min}–${max})`}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {hand.map((id, idx) => renderCard(id, idx))}
      </div>
    </div>
  )
}
