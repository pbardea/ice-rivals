export type GameMode = 'singles' | 'pairs'

export type ElementId =
  | 'quad_axel'
  | 'triple_axel'
  | 'triple_triple'
  | 'triple_lutz'
  | 'throw_jump'
  | 'double_axel'
  | 'level4_spin'
  | 'level3_spin'
  | 'flying_spin'
  | 'death_spiral'
  | 'step_sequence'
  | 'spiral_sequence'
  | 'ina_bauer'
  | 'choreography'
  | 'lift'
  | 'pairs_spin'
  | 'twist_lift'
  | 'side_by_side'

export type IncidentId =
  | 'loose_blade'
  | 'music_malfunction'
  | 'bad_ice'
  | 'wardrobe_malfunction'
  | 'crowd_boo'
  | 'broken_lace'
  | 'wrong_music'
  | 'slippery_zamboni'
  | 'rival_psych_out'

export type JudgeId =
  | 'technical_judge'
  | 'artistic_judge'
  | 'strict_judge'
  | 'lenient_judge'
  | 'fan_favorite'

export interface ElementCard {
  id: ElementId
  name: string
  base: number
  threshold: number
  fallPenalty: number
  goeBonus: number
  category: 'jump' | 'spin' | 'step' | 'choreo'
  autoSuccess: boolean
}

export interface IncidentCard {
  id: IncidentId
  name: string
  description: string
}

export interface JudgeCard {
  id: JudgeId
  name: string
  description: string
}

export const ELEMENT_CARDS: ElementCard[] = [
  { id: 'quad_axel',       name: 'Quad Axel',        base: 7, threshold: 5, fallPenalty: 2, goeBonus: 2, category: 'jump',   autoSuccess: false },
  { id: 'triple_triple',   name: 'Triple-Triple',    base: 6, threshold: 5, fallPenalty: 2, goeBonus: 2, category: 'jump',   autoSuccess: false },
  { id: 'triple_axel',     name: 'Triple Axel',      base: 5, threshold: 4, fallPenalty: 2, goeBonus: 2, category: 'jump',   autoSuccess: false },
  { id: 'triple_lutz',     name: 'Triple Lutz',      base: 4, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'jump',   autoSuccess: false },
  { id: 'throw_jump',      name: 'Throw Jump',       base: 5, threshold: 4, fallPenalty: 2, goeBonus: 1, category: 'jump',   autoSuccess: false },
  { id: 'double_axel',     name: 'Double Axel',      base: 3, threshold: 2, fallPenalty: 1, goeBonus: 1, category: 'jump',   autoSuccess: false },
  { id: 'level4_spin',     name: 'Level 4 Spin',     base: 3, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'spin',   autoSuccess: false },
  { id: 'level3_spin',     name: 'Level 3 Spin',     base: 2, threshold: 2, fallPenalty: 1, goeBonus: 1, category: 'spin',   autoSuccess: false },
  { id: 'flying_spin',     name: 'Flying Spin',      base: 3, threshold: 4, fallPenalty: 1, goeBonus: 2, category: 'spin',   autoSuccess: false },
  { id: 'death_spiral',    name: 'Death Spiral',     base: 4, threshold: 4, fallPenalty: 2, goeBonus: 2, category: 'spin',   autoSuccess: false },
  { id: 'step_sequence',   name: 'Step Sequence',    base: 2, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'step',   autoSuccess: false },
  { id: 'spiral_sequence', name: 'Spiral Sequence',  base: 3, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'step',   autoSuccess: false },
  { id: 'ina_bauer',       name: 'Ina Bauer',        base: 3, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'choreo', autoSuccess: false },
  { id: 'choreography',    name: 'Choreography',     base: 2, threshold: 1, fallPenalty: 0, goeBonus: 1, category: 'choreo', autoSuccess: true  },
  { id: 'lift',            name: 'Lift',             base: 4, threshold: 4, fallPenalty: 2, goeBonus: 2, category: 'choreo', autoSuccess: false },
  { id: 'pairs_spin',      name: 'Pairs Spin',       base: 3, threshold: 3, fallPenalty: 1, goeBonus: 1, category: 'spin',   autoSuccess: false },
  { id: 'twist_lift',      name: 'Twist Lift',       base: 5, threshold: 4, fallPenalty: 2, goeBonus: 2, category: 'jump',   autoSuccess: false },
  { id: 'side_by_side',    name: 'Side-by-Side Jump',base: 4, threshold: 4, fallPenalty: 2, goeBonus: 1, category: 'jump',   autoSuccess: false },
]

// Singles deck: 45 cards
export const ELEMENT_DECK: ElementId[] = [
  'quad_axel', 'quad_axel',
  'triple_triple', 'triple_triple', 'triple_triple',
  'triple_axel', 'triple_axel', 'triple_axel',
  'triple_lutz', 'triple_lutz', 'triple_lutz', 'triple_lutz', 'triple_lutz',
  'throw_jump', 'throw_jump', 'throw_jump',
  'double_axel', 'double_axel', 'double_axel', 'double_axel', 'double_axel',
  'level4_spin', 'level4_spin', 'level4_spin',
  'level3_spin', 'level3_spin', 'level3_spin',
  'flying_spin', 'flying_spin', 'flying_spin',
  'death_spiral', 'death_spiral',
  'step_sequence', 'step_sequence', 'step_sequence',
  'spiral_sequence', 'spiral_sequence', 'spiral_sequence',
  'ina_bauer', 'ina_bauer', 'ina_bauer',
  'choreography', 'choreography', 'choreography', 'choreography',
]

// Pairs deck: 45 cards — swap singles-only elements for pairs elements, remove triple_lutz×3 for side_by_side×3
const PAIRS_ELEMENT_DECK: ElementId[] = [
  'quad_axel', 'quad_axel',
  'triple_triple', 'triple_triple', 'triple_triple',
  'triple_axel', 'triple_axel', 'triple_axel',
  'triple_lutz', 'triple_lutz',                          // 2 instead of 5
  'throw_jump', 'throw_jump', 'throw_jump',
  'double_axel', 'double_axel', 'double_axel', 'double_axel', 'double_axel',
  'level4_spin', 'level4_spin', 'level4_spin',
  'level3_spin', 'level3_spin', 'level3_spin',
  'pairs_spin', 'pairs_spin', 'pairs_spin',              // replaces flying_spin
  'death_spiral', 'death_spiral',
  'step_sequence', 'step_sequence', 'step_sequence',
  'lift', 'lift', 'lift',                                 // replaces ina_bauer
  'twist_lift', 'twist_lift', 'twist_lift',               // replaces spiral_sequence
  'side_by_side', 'side_by_side', 'side_by_side',         // replaces 3× triple_lutz
  'choreography', 'choreography', 'choreography', 'choreography',
]

export function getElementDeck(mode: GameMode): ElementId[] {
  return mode === 'pairs' ? [...PAIRS_ELEMENT_DECK] : [...ELEMENT_DECK]
}

export const INCIDENT_CARDS: IncidentCard[] = [
  { id: 'loose_blade',         name: 'Loose Blade',          description: 'Target rolls -2 on their next element.' },
  { id: 'music_malfunction',   name: 'Music Malfunction',    description: 'Target loses scores from step/choreography elements.' },
  { id: 'bad_ice',             name: 'Bad Ice',              description: 'Target must attempt their hardest element first.' },
  { id: 'wardrobe_malfunction',name: 'Wardrobe Malfunction', description: "Target loses their highest-scoring element's score." },
  { id: 'crowd_boo',           name: 'Crowd Boo',            description: "Target's spins and steps worth half." },
  { id: 'broken_lace',         name: 'Broken Lace',          description: "Target's first clean element scores half." },
  { id: 'wrong_music',         name: 'Wrong Music',          description: "Target's step/choreo elements score -1 each." },
  { id: 'slippery_zamboni',    name: 'Slippery Zamboni',     description: "All target's thresholds +1 this round." },
  { id: 'rival_psych_out',     name: 'Rival Psych-Out',      description: "Target's highest-base element auto-fails (scores 0)." },
]

export const JUDGE_CARDS: JudgeCard[] = [
  { id: 'technical_judge', name: 'Technical Judge', description: 'Jumps score +1 each.' },
  { id: 'artistic_judge',  name: 'Artistic Judge',  description: 'Spins and steps score +1 each.' },
  { id: 'strict_judge',    name: 'Strict Judge',    description: 'Fall penalties +1 each.' },
  { id: 'lenient_judge',   name: 'Lenient Judge',   description: 'Fall penalties -1 each (min 0).' },
  { id: 'fan_favorite',    name: 'Fan Favorite',    description: 'Player in last place gets +3 bonus.' },
]

export function getElement(id: ElementId): ElementCard {
  const card = ELEMENT_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Unknown element: ${id}`)
  return card
}

export function getIncident(id: IncidentId): IncidentCard {
  const card = INCIDENT_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Unknown incident: ${id}`)
  return card
}

export function getJudge(id: JudgeId): JudgeCard {
  const card = JUDGE_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Unknown judge: ${id}`)
  return card
}
