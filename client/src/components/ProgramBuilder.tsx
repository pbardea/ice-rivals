import { useState } from 'react'
import { ElementId, IncidentId, Player, Team, GameMode } from '../types/game'
import { PlayerHand } from './PlayerHand'

const INCIDENT_INFO: Record<IncidentId, { name: string; description: string; emoji: string }> = {
  loose_blade:          { name: 'Loose Blade',          description: 'Target rolls -2 on next element',          emoji: '🔩' },
  music_malfunction:    { name: 'Music Malfunction',    description: 'Target loses step/choreo scores',          emoji: '🎵' },
  bad_ice:              { name: 'Bad Ice',              description: 'Target must do hardest element first',     emoji: '🧊' },
  wardrobe_malfunction: { name: 'Wardrobe Malfunction', description: 'Target loses highest-scoring element',     emoji: '👗' },
  crowd_boo:            { name: 'Crowd Boo',            description: "Target's spins & steps worth half",        emoji: '👎' },
  broken_lace:          { name: 'Broken Lace',          description: "Target's first clean element scores half", emoji: '👟' },
  wrong_music:          { name: 'Wrong Music',          description: "Target's step/choreo elements score -1",   emoji: '🎶' },
  slippery_zamboni:     { name: 'Slippery Zamboni',     description: "All target's thresholds +1 this round",    emoji: '🚜' },
  rival_psych_out:      { name: 'Rival Psych-Out',      description: "Target's hardest element auto-fails",      emoji: '🧠' },
}

interface ProgramBuilderProps {
  hand: ElementId[]
  partnerHand: ElementId[]
  incidentCard: IncidentId
  players: Player[]
  teams: Team[]
  gameMode: GameMode
  myId: string
  round: number
  onSubmit: (elements: ElementId[], incidentTarget?: { playerId: string; cardId: IncidentId }) => void
  submitted: boolean
  submittedCount: number
  totalPlayers: number
}

export function ProgramBuilder({
  hand,
  partnerHand,
  incidentCard,
  players,
  teams,
  gameMode,
  myId,
  round,
  onSubmit,
  submitted,
  submittedCount,
  totalPlayers,
}: ProgramBuilderProps) {
  const isPairs = gameMode === 'pairs'
  const combinedHand = isPairs ? [...hand, ...partnerHand] : hand

  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null)
  const [playIncident, setPlayIncident] = useState(false)

  const raw = round === 1 ? { min: 3, max: 3 } : round === 2 ? { min: 4, max: 6 } : { min: 4, max: 4 }
  const constraints = { min: raw.min, max: Math.min(raw.max, combinedHand.length) }

  // In pairs mode, incident targets the opposing team (by teamId)
  const opponents = isPairs
    ? teams.filter(t => !t.playerIds.includes(myId))
    : players.filter(p => p.id !== myId)

  const canSubmit =
    selectedIndices.length >= constraints.min &&
    selectedIndices.length <= constraints.max &&
    (!playIncident || targetPlayerId !== null)

  function toggleElement(idx: number) {
    setSelectedIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx)
      if (prev.length >= constraints.max) return prev
      return [...prev, idx]
    })
  }

  const selectedIds = selectedIndices.map(i => combinedHand[i])

  function handleSubmit() {
    if (!canSubmit) return
    const incidentTarget =
      playIncident && targetPlayerId
        ? { playerId: targetPlayerId, cardId: incidentCard }
        : undefined
    onSubmit(selectedIds, incidentTarget)
  }

  const incident = INCIDENT_INFO[incidentCard]
  const totalLabel = isPairs ? 'teams' : 'players'

  if (submitted) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-white font-semibold text-lg">Program Submitted!</div>
        <div className="text-ice-300 text-sm mt-1">
          Waiting for others... ({submittedCount}/{totalPlayers} {totalLabel} ready)
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {selectedIds.map((id, i) => (
            <span key={i} className="bg-ice-700/50 text-ice-200 text-xs px-3 py-1 rounded-full">
              {id.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isPairs && (
        <div className="text-center text-ice-300 text-sm">
          Combined team hand ({combinedHand.length} cards)
        </div>
      )}
      <PlayerHand
        hand={combinedHand}
        selectedIndices={selectedIndices}
        onToggle={toggleElement}
        min={constraints.min}
        max={constraints.max}
        splitAt={isPairs ? hand.length : undefined}
      />

      {/* Incident Card */}
      <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{incident.emoji}</span>
            <div>
              <div className="text-orange-300 font-semibold">{incident.name}</div>
              <div className="text-orange-400/80 text-xs">{incident.description}</div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={playIncident}
              onChange={e => {
                setPlayIncident(e.target.checked)
                if (!e.target.checked) setTargetPlayerId(null)
              }}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-orange-300 text-sm">Play this card</span>
          </label>
        </div>

        {playIncident && (
          <div>
            <div className="text-red-400/90 text-xs mb-2 italic">
              Cost: your lowest-scoring element will score 0
            </div>
            <div className="text-orange-300/70 text-xs mb-2">
              Target {isPairs ? 'team' : 'opponent'}:
            </div>
            <div className="flex flex-wrap gap-2">
              {isPairs
                ? opponents.map(team => {
                    const t = team as Team
                    const names = t.playerIds.map(id => players.find(p => p.id === id)?.name ?? '?').join(' & ')
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTargetPlayerId(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          targetPlayerId === t.id
                            ? 'bg-orange-500 border-orange-400 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {names}
                      </button>
                    )
                  })
                : (opponents as Player[]).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setTargetPlayerId(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        targetPlayerId === p.id
                          ? 'bg-orange-500 border-orange-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-ice-500 hover:bg-ice-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
      >
        {canSubmit
          ? `Submit Program (${selectedIndices.length} elements)`
          : `Select ${constraints.min}${constraints.min !== constraints.max ? `–${constraints.max}` : ''} elements`}
      </button>
    </div>
  )
}
