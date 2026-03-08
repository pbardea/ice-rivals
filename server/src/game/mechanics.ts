import {
  ElementCard,
  ElementId,
  IncidentId,
  JudgeId,
  GameMode,
  ELEMENT_DECK,
  ELEMENT_CARDS,
  INCIDENT_CARDS,
  JUDGE_CARDS,
  getElement,
  getElementDeck,
  JudgeCard,
} from './cards'
import { DiceResult, GameState, Player, Program, RoundScore, Team } from './state'

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

const FALL_QUIPS = [
  '💀 TIMBER!!',
  "😱 OH NO SHE DIDN'T",
  '🫠 ABSOLUTELY MELTED',
  '🪦 RIP BESTIE',
  '😬 YIKES ON SKIKES',
  '🤸 UNEXPECTED FLOOR ROUTINE',
  '😭 THE ICE BETRAYED THEM',
  '👀 I DID NOT SEE THAT',
  '🍌 SLIPPERY!!',
  '💔 MY HEART',
  '🧊 ATE THE ICE',
  '🦵 KNEES HAVE LEFT THE CHAT',
  '📉 WELL THAT\'S A DEDUCTION',
  '🎪 UNPLANNED ACROBATICS',
  '🪑 SIT DOWN',
  '😵 GRAVITY: 1, SKATER: 0',
  '🫠 TURNED INTO A PUDDLE',
  '🏥 MEDIC ON STANDBY',
  '🫣 I CAN\'T WATCH',
  '🧊 BECAME ONE WITH THE ICE',
]

const GOE_QUIPS = [
  '🔥 PERFECTION ACHIEVED',
  '👑 ABSOLUTE ROYALTY',
  "🤌 CHEF'S KISS",
  '💅 FLAWLESS VICTORY',
  '⭐ THE CROWD GOES WILD',
  '🏆 THIS IS THEIR MOMENT',
  '✨ SEND HELP I\'M CRYING',
  '🥹 POETRY ON ICE',
  '💎 CRYSTALLINE PERFECTION',
  '🫡 THE JUDGES ARE STANDING',
  '🦢 SWAN LAKE WHO??',
  '🎆 FIREWORKS ON ICE',
  '🪄 ACTUAL WIZARDRY',
  '👼 TOUCHED BY AN ANGEL',
  '🌟 GENERATIONAL TALENT',
  '📸 FRAME THAT ONE',
  '🥂 CHAMPAGNE MOMENT',
  '🔔 DING DING DING',
]

const GOOD_QUIPS = [
  '👏 NICE LANDING!',
  '😊 THE JUDGES APPROVE',
  '💪 STRONG EXECUTION',
  '🎯 RIGHT ON THE MONEY',
  '🙌 CROWD APPRECIATES THAT',
  '🤩 LOVELY FORM',
  '💃 GRACEFUL!',
  '🎶 IN THE GROOVE',
  '👌 WELL DONE',
  '🌸 BEAUTIFUL MOMENT',
]

const CLEAN_QUIPS = [
  '✅ SOLID. RESPECTABLE.',
  '👍 YEAH OKAY THAT WORKS',
  '🤷 IT\'LL DO',
  '😌 SMOOTH ENOUGH',
  '📊 TECHNICALLY CORRECT',
  '🧊 COOL AS ICE',
  '🫡 TEXTBOOK EXECUTION',
  '📋 CHECKED THAT BOX',
  '🧮 THE MATH WORKS OUT',
  '🤝 GOOD ENOUGH',
  '😐 THE JUDGES NOD POLITELY',
  '🪵 SOLID AS AN OAK',
  '📏 BY THE BOOK',
  '🧊 COOL AND COLLECTED',
  '🎯 HIT THE MARK',
  '🫥 PERFECTLY ADEQUATE',
]

function randomQuip(fell: boolean, good: boolean, goe: boolean): string {
  const pool = fell ? FALL_QUIPS : goe ? GOE_QUIPS : good ? GOOD_QUIPS : CLEAN_QUIPS
  return pool[Math.floor(Math.random() * pool.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealHands(playerIds: string[], mode: GameMode = 'singles', teams: Team[] = []): {
  hands: Record<string, ElementId[]>
  incidentCards: Record<string, IncidentId>
} {
  const deck = shuffle(getElementDeck(mode))
  const hands: Record<string, ElementId[]> = {}

  for (const pid of playerIds) {
    const hand: ElementId[] = []
    const usedTypes = new Set<ElementId>()

    // Draw 6 unique element types
    for (let i = 0; i < deck.length && hand.length < 6; i++) {
      if (!usedTypes.has(deck[i])) {
        usedTypes.add(deck[i])
        hand.push(deck[i])
      }
    }

    // Remove dealt cards from deck
    for (const cardId of hand) {
      const idx = deck.indexOf(cardId)
      if (idx !== -1) deck.splice(idx, 1)
    }

    hands[pid] = hand
  }

  // In pairs mode, each team gets one incident card (assigned to first player of team)
  const incidentDeck = shuffle([...INCIDENT_CARDS.map(c => c.id)])
  const incidentCards: Record<string, IncidentId> = {}

  if (mode === 'pairs' && teams.length > 0) {
    teams.forEach((team, idx) => {
      const card = incidentDeck[idx % incidentDeck.length]
      // Both players on the team share the same incident card
      for (const pid of team.playerIds) {
        incidentCards[pid] = card
      }
    })
  } else {
    for (const pid of playerIds) {
      incidentCards[pid] = incidentDeck[playerIds.indexOf(pid) % incidentDeck.length]
    }
  }

  return { hands, incidentCards }
}

export function pickJudge(usedJudges: JudgeId[]): JudgeCard {
  const available = JUDGE_CARDS.filter(j => !usedJudges.includes(j.id))
  if (available.length === 0) {
    return JUDGE_CARDS[Math.floor(Math.random() * JUDGE_CARDS.length)]
  }
  return available[Math.floor(Math.random() * available.length)]
}

export function getRoundConstraints(round: number): { min: number; max: number } {
  if (round === 1) return { min: 3, max: 3 }
  if (round === 2) return { min: 4, max: 6 }
  return { min: 4, max: 4 } // Championship
}

function sortByDifficulty(elementIds: ElementId[]): ElementId[] {
  return [...elementIds].sort((a, b) => getElement(b).base - getElement(a).base)
}

function applyBadIce(elementIds: ElementId[]): ElementId[] {
  return sortByDifficulty(elementIds)
}

export function scoreElement(
  card: ElementCard,
  roll: number,
  context: { judgeId: JudgeId | null; isChampionship: boolean; looseBlade: boolean; zamboniThreshold: boolean }
): { success: boolean; fell: boolean; good: boolean; goe: boolean; rawScore: number } {
  const { judgeId, isChampionship, looseBlade, zamboniThreshold } = context

  let effectiveRoll = roll
  if (looseBlade) {
    effectiveRoll = Math.max(1, roll - 2)
  }

  let effectiveThreshold = card.threshold
  if (zamboniThreshold && !card.autoSuccess) {
    effectiveThreshold = card.threshold + 1
  }

  let success: boolean
  let fell: boolean
  let good: boolean
  let goe: boolean

  if (card.autoSuccess) {
    success = true
    fell = false
    goe = roll === 6
    good = !goe && roll >= 4
  } else {
    fell = effectiveRoll < effectiveThreshold
    goe = !fell && roll === 6
    // "good" = rolled well above threshold (roll >= threshold + 2) but not GOE
    good = !fell && !goe && roll >= effectiveThreshold + 2
    success = !fell
  }

  let rawScore = 0
  if (fell) {
    let penalty = card.fallPenalty
    if (judgeId === 'strict_judge') penalty = penalty + 1
    if (judgeId === 'lenient_judge') penalty = Math.max(0, penalty - 1)
    rawScore = -penalty
  } else {
    rawScore = card.base
    if (goe) {
      rawScore += card.goeBonus
    } else if (good) {
      rawScore += 1
    }

    // Additive judge bonuses
    if (judgeId === 'technical_judge' && card.category === 'jump') {
      rawScore += 1
    }
    if (judgeId === 'artistic_judge' && (card.category === 'spin' || card.category === 'step')) {
      rawScore += 1
    }
  }

  if (isChampionship) rawScore = Math.round(rawScore * 1.5)

  return { success, fell, good, goe, rawScore }
}

// Roll a single element
export function rollSingleElement(
  elementId: ElementId,
  playerId: string,
  context: {
    judgeId: JudgeId | null
    isChampionship: boolean
    looseBlade: boolean
    zamboniThreshold: boolean
    psychOutElementId: ElementId | null
  }
): DiceResult {
  const card = getElement(elementId)

  // Rival Psych-Out: highest-base element auto-fails (scores 0)
  if (context.psychOutElementId === elementId) {
    return {
      playerId,
      elementId,
      roll: 0,
      success: false,
      fell: true,
      good: false,
      goe: false,
      score: 0,
      quip: '🧠 PSYCHED OUT! AUTO-FAIL!',
    }
  }

  const roll = rollD6()
  const { success, fell, good, goe, rawScore } = scoreElement(card, roll, {
    judgeId: context.judgeId,
    isChampionship: context.isChampionship,
    looseBlade: context.looseBlade,
    zamboniThreshold: context.zamboniThreshold,
  })

  return {
    playerId,
    elementId,
    roll,
    success,
    fell,
    good,
    goe,
    score: rawScore,
    quip: randomQuip(fell, good, goe),
  }
}

// Apply post-roll incidents and incident cost
export function applyPostRollEffects(
  results: DiceResult[],
  incidentOnTarget: IncidentId | null,
  playedIncident: boolean,
): { results: DiceResult[]; incidentApplied?: IncidentId } {
  let modified = [...results]
  let incidentApplied: IncidentId | undefined

  if (incidentOnTarget === 'music_malfunction') {
    modified = modified.map(r => {
      const card = getElement(r.elementId)
      if (card.category === 'step' || card.category === 'choreo') {
        return { ...r, score: 0 }
      }
      return r
    })
    incidentApplied = 'music_malfunction'
  }

  if (incidentOnTarget === 'crowd_boo') {
    modified = modified.map(r => {
      const card = getElement(r.elementId)
      if (card.category === 'spin' || card.category === 'step') {
        return { ...r, score: Math.ceil(r.score / 2) }
      }
      return r
    })
    incidentApplied = 'crowd_boo'
  }

  if (incidentOnTarget === 'wardrobe_malfunction') {
    let maxIdx = 0
    let maxScore = -Infinity
    modified.forEach((r, idx) => {
      if (r.score > maxScore) {
        maxScore = r.score
        maxIdx = idx
      }
    })
    if (modified.length > 0) {
      modified[maxIdx] = { ...modified[maxIdx], score: 0 }
    }
    incidentApplied = 'wardrobe_malfunction'
  }

  if (incidentOnTarget === 'broken_lace') {
    const firstCleanIdx = modified.findIndex(r => r.success && !r.fell)
    if (firstCleanIdx !== -1) {
      const r = modified[firstCleanIdx]
      modified[firstCleanIdx] = { ...r, score: Math.ceil(r.score / 2) }
    }
    incidentApplied = 'broken_lace'
  }

  if (incidentOnTarget === 'wrong_music') {
    modified = modified.map(r => {
      const card = getElement(r.elementId)
      if (card.category === 'step' || card.category === 'choreo') {
        return { ...r, score: r.score - 1 }
      }
      return r
    })
    incidentApplied = 'wrong_music'
  }

  // Incident cost: if this player played an incident, zero their lowest-scoring positive element
  if (playedIncident) {
    let minIdx = -1
    let minScore = Infinity
    modified.forEach((r, idx) => {
      if (r.score > 0 && r.score < minScore) {
        minScore = r.score
        minIdx = idx
      }
    })
    if (minIdx !== -1) {
      modified[minIdx] = {
        ...modified[minIdx],
        score: 0,
        quip: '🫣 SACRIFICED FOR SABOTAGE',
      }
    }
  }

  return { results: modified, incidentApplied }
}

export function computeLeaderboard(
  players: Player[],
  teams?: Team[]
): { playerId: string; name: string; total: number }[] {
  if (teams && teams.length > 0) {
    return computeTeamLeaderboard(players, teams)
  }
  return [...players]
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(p => ({ playerId: p.id, name: p.name, total: p.totalScore }))
}

export function computeTeamLeaderboard(
  players: Player[],
  teams: Team[]
): { playerId: string; name: string; total: number }[] {
  return teams
    .map(team => {
      const teamPlayers = players.filter(p => team.playerIds.includes(p.id))
      const total = teamPlayers.reduce((sum, p) => sum + p.totalScore, 0)
      const names = teamPlayers.map(p => p.name).join(' & ')
      return { playerId: team.id, name: names, total }
    })
    .sort((a, b) => b.total - a.total)
}

export function getLastPlacePlayerId(players: Player[]): string | null {
  if (players.length === 0) return null
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore)
  return sorted[0].id
}

export function getLastPlaceTeamId(players: Player[], teams: Team[]): string | null {
  if (teams.length === 0) return null
  const teamScores = teams.map(team => {
    const total = players.filter(p => team.playerIds.includes(p.id)).reduce((sum, p) => sum + p.totalScore, 0)
    return { teamId: team.id, total }
  })
  teamScores.sort((a, b) => a.total - b.total)
  return teamScores[0].teamId
}

// Determine pre-roll context for a player
export function getPlayerRollContext(
  program: Program,
  incidentOnTarget: IncidentId | null,
  judgeId: JudgeId | null,
  isChampionship: boolean,
): {
  elementIds: ElementId[]
  looseBlade: boolean
  zamboniThreshold: boolean
  psychOutElementId: ElementId | null
  incidentApplied?: IncidentId
} {
  let elementIds = [...program.elementIds]
  let looseBlade = false
  let zamboniThreshold = false
  let psychOutElementId: ElementId | null = null
  let incidentApplied: IncidentId | undefined

  if (incidentOnTarget === 'bad_ice') {
    elementIds = applyBadIce(elementIds)
    incidentApplied = 'bad_ice'
  }

  if (incidentOnTarget === 'loose_blade') {
    looseBlade = true
    incidentApplied = 'loose_blade'
  }

  if (incidentOnTarget === 'slippery_zamboni') {
    zamboniThreshold = true
    incidentApplied = 'slippery_zamboni'
  }

  if (incidentOnTarget === 'rival_psych_out') {
    let maxBase = -1
    let maxId: ElementId | null = null
    for (const eid of elementIds) {
      const card = getElement(eid)
      if (card.base > maxBase) {
        maxBase = card.base
        maxId = eid
      }
    }
    psychOutElementId = maxId
    incidentApplied = 'rival_psych_out'
  }

  return { elementIds, looseBlade, zamboniThreshold, psychOutElementId, incidentApplied }
}
