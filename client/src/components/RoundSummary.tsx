import { RoundScore, Player, Team, GameMode, DiceResult } from '../types/game'
import { ScoreBoard } from './ScoreBoard'

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

const INCIDENT_NAMES: Record<string, string> = {
  loose_blade:          '🔩 Loose Blade',
  music_malfunction:    '🎵 Music Malfunction',
  bad_ice:              '🧊 Bad Ice',
  wardrobe_malfunction: '👗 Wardrobe Malfunction',
  crowd_boo:            '👎 Crowd Boo',
  broken_lace:          '👟 Broken Lace',
  wrong_music:          '🎶 Wrong Music',
  slippery_zamboni:     '🚜 Slippery Zamboni',
  rival_psych_out:      '🧠 Rival Psych-Out',
}

interface RoundSummaryProps {
  scores: RoundScore[]
  leaderboard: { playerId: string; name: string; total: number }[]
  players: Player[]
  teams: Team[]
  gameMode: GameMode
  myId: string | null
  round: number
  isLastRound: boolean
  onNextRound: () => void
}

export function RoundSummary({ scores, leaderboard, players, teams, gameMode, myId, round, isLastRound, onNextRound }: RoundSummaryProps) {
  function getPlayerName(id: string) {
    if (gameMode === 'pairs') {
      const team = teams.find(t => t.id === id)
      if (team) {
        return team.playerIds.map(pid => players.find(p => p.id === pid)?.name ?? '?').join(' & ')
      }
    }
    return players.find(p => p.id === id)?.name ?? 'Unknown'
  }

  function isMe(id: string) {
    if (gameMode === 'pairs') {
      const team = teams.find(t => t.id === id)
      return team ? team.playerIds.includes(myId ?? '') : false
    }
    return id === myId
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-3xl mb-1">📊</div>
        <h2 className="text-white font-bold text-xl font-body">Round {round} Results</h2>
      </div>

      {/* Per-player breakdown */}
      <div className="space-y-4">
        {scores.map(rs => (
          <div key={rs.playerId} className={`rounded-2xl border overflow-hidden ${isMe(rs.playerId) ? 'border-ice-500/50 bg-ice-900/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold font-body">
                  {getPlayerName(rs.playerId)}
                  {isMe(rs.playerId) && <span className="text-lilac-400 text-xs ml-1">(you)</span>}
                </span>
                {rs.incidentApplied && (
                  <span className="text-sparkle-gold text-xs bg-amber-900/30 px-2 py-0.5 rounded-full border border-sparkle-gold/20 font-body">
                    {INCIDENT_NAMES[rs.incidentApplied] ?? rs.incidentApplied}
                  </span>
                )}
              </div>
              <div className={`font-bold text-xl ${rs.roundTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {rs.roundTotal >= 0 ? '+' : ''}{rs.roundTotal}
              </div>
            </div>
            <div className="px-4 py-2 space-y-1">
              {rs.elementScores.map((r: DiceResult, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm font-body">
                  <span className="text-white/50 text-xs w-4">{i + 1}.</span>
                  <span className="text-white/80 flex-1">{ELEMENT_NAMES[r.elementId] ?? r.elementId}</span>
                  <span className="text-white/50 text-xs">🎲{r.roll}</span>
                  {r.fell && <span className="text-red-400 text-xs">FALL</span>}
                  {r.good && <span className="text-frost-400 text-xs">GOOD</span>}
                  {r.goe && <span className="text-sparkle-gold text-xs">GOE</span>}
                  <span className={`font-semibold w-8 text-right ${r.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.score >= 0 ? '+' : ''}{r.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ScoreBoard leaderboard={leaderboard} myId={myId} round={round} gameMode={gameMode} />

      {!isLastRound && (
        <button
          onClick={onNextRound}
          className="glow-button w-full text-white font-bold py-4 rounded-2xl text-lg"
        >
          Next Round →
        </button>
      )}
    </div>
  )
}
