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
  jump:   'from-blue-600/80 to-blue-800/80 border-blue-400/50',
  spin:   'from-purple-600/80 to-purple-800/80 border-purple-400/50',
  step:   'from-teal-600/80 to-teal-800/80 border-teal-400/50',
  choreo: 'from-pink-600/80 to-pink-800/80 border-pink-400/50',
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
          relative bg-gradient-to-br ${colorClass} border rounded-xl p-3 text-left transition-all
          ${isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : ''}
          ${!disabled && (isSelected || canSelect) ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
        `}
      >
        <div className="text-2xl mb-1">{info.emoji}</div>
        <div className="text-white font-semibold text-sm leading-tight">{info.name}</div>
        <div className="text-white/70 text-xs mt-1">
          Base: <span className="text-white font-bold">{info.base}</span>
        </div>
        <div className="text-white/70 text-xs">
          Need: <span className="text-white font-bold">{info.threshold === 0 ? 'Auto' : `${info.threshold}+`}</span>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold text-green-900">
            {selectionOrder + 1}
          </div>
        )}
      </button>
    )
  }

  if (splitAt !== undefined && splitAt > 0 && splitAt < hand.length) {
    const myCards = hand.slice(0, splitAt)
    const partnerCards = hand.slice(splitAt)

    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/70 text-sm">Team Cards</span>
          <span className="text-ice-300 text-sm font-medium">
            {selectedIndices.length}/{max} selected {min === max ? `(exactly ${min})` : `(${min}–${max})`}
          </span>
        </div>
        <div className="text-white/50 text-xs mb-2 uppercase tracking-wider">Your Cards</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {myCards.map((id, idx) => renderCard(id, idx))}
        </div>
        <div className="text-white/50 text-xs mb-2 uppercase tracking-wider">Partner's Cards</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {partnerCards.map((id, idx) => renderCard(id, idx + splitAt))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-white/70 text-sm">Your Cards</span>
        <span className="text-ice-300 text-sm font-medium">
          {selectedIndices.length}/{max} selected {min === max ? `(exactly ${min})` : `(${min}–${max})`}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {hand.map((id, idx) => renderCard(id, idx))}
      </div>
    </div>
  )
}
