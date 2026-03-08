import { JudgeCard, DiceResult, RoundScore, Player, Team, GameMode, ElementId, IncidentId, GamePhase } from '../types/game'
import { JudgePanel } from './JudgePanel'
import { ProgramBuilder } from './ProgramBuilder'
import { DiceRoll } from './DiceRoll'
import { RoundSummary } from './RoundSummary'
import { ScoreBoard } from './ScoreBoard'

interface GameBoardProps {
  phase: GamePhase
  round: number
  gameMode: GameMode
  teams: Team[]
  judgeCard: JudgeCard | null
  hand: ElementId[]
  partnerHand: ElementId[]
  incidentCard: IncidentId | null
  players: Player[]
  myId: string | null
  diceResults: DiceResult[]
  roundScores: RoundScore[]
  leaderboard: { playerId: string; name: string; total: number }[]
  submittedCount: number
  mySubmitted: boolean
  winner: { playerId: string; name: string; total: number } | null
  finalScores: { playerId: string; name: string; total: number }[]
  isSpectator?: boolean
  onSubmit: (elements: ElementId[], incidentTarget?: { playerId: string; cardId: IncidentId }) => void
  onNextRound: () => void
  onRestart: () => void
}

const ROUND_NAMES = ['', 'Short Program', 'Free Skate', 'Championship Skate']
const PHASE_LABELS: Record<GamePhase, string> = {
  lobby:       'Lobby',
  round_start: 'Starting Round...',
  planning:    'Build Your Program',
  revealing:   'Revealing Programs',
  rolling:     'Rolling Dice',
  round_end:   'Round Complete',
  game_over:   'Game Over',
}

export function GameBoard({
  phase,
  round,
  gameMode,
  teams,
  judgeCard,
  hand,
  partnerHand,
  incidentCard,
  players,
  myId,
  diceResults,
  roundScores,
  leaderboard,
  submittedCount,
  mySubmitted,
  winner,
  finalScores,
  isSpectator,
  onSubmit,
  onNextRound,
  onRestart,
}: GameBoardProps) {
  const isPairs = gameMode === 'pairs'
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-900 via-ice-800 to-frost-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Spectator Banner */}
        {isSpectator && (
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl px-4 py-3 text-center">
            <span className="text-amber-300 font-semibold">Spectating</span>
            <span className="text-amber-400/80 text-sm ml-2">— you'll join the next game</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white drop-shadow-lg">⛸️ Ice Rivals {isPairs && <span className="text-lilac-300 text-sm font-body font-normal ml-1">Pairs</span>}</h1>
            <div className="text-lilac-400 text-sm font-body">
              {round > 0 ? `Round ${round}: ${ROUND_NAMES[round]}` : 'Starting...'}
              {round === 3 && <span className="text-sparkle-gold ml-2">⚡ Scores x1.5!</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lilac-300 text-xs uppercase tracking-wider font-body">Phase</div>
            <div className="text-white text-sm font-semibold font-body">{PHASE_LABELS[phase]}</div>
          </div>
        </div>

        {/* Judge Panel */}
        {judgeCard && <JudgePanel judgeCard={judgeCard} round={round} />}

        {/* Main content by phase */}
        {(phase === 'round_start') && (
          <div className="text-center py-12">
            <div className="text-5xl animate-bounce mb-4">🎬</div>
            <div className="text-white text-xl font-semibold font-body">Get ready for {ROUND_NAMES[round]}!</div>
            <div className="text-lilac-400 mt-2 font-body">Dealing cards...</div>
          </div>
        )}

        {phase === 'planning' && hand.length > 0 && incidentCard && !isSpectator && (
          <ProgramBuilder
            hand={hand}
            partnerHand={isPairs ? partnerHand : []}
            incidentCard={incidentCard}
            players={players}
            teams={teams}
            gameMode={gameMode}
            myId={myId ?? ''}
            round={round}
            onSubmit={onSubmit}
            submitted={mySubmitted}
            submittedCount={submittedCount}
            totalPlayers={isPairs ? teams.length : players.length}
          />
        )}

        {(phase === 'revealing' || phase === 'rolling') && (
          <div className="space-y-4">
            <div className="text-center text-lilac-300 text-sm animate-pulse font-body">
              {phase === 'revealing' ? 'All programs revealed! Rolling dice...' : 'Rolling...'}
            </div>
            <DiceRoll results={diceResults} players={players} teams={teams} gameMode={gameMode} />
          </div>
        )}

        {phase === 'round_end' && (
          <RoundSummary
            scores={roundScores}
            leaderboard={leaderboard}
            players={players}
            teams={teams}
            gameMode={gameMode}
            myId={myId}
            round={round}
            isLastRound={false}
            onNextRound={onNextRound}
          />
        )}

        {phase === 'game_over' && winner && (
          <div className="space-y-4">
            <div className="text-center frosted-glass rounded-3xl p-6 border border-sparkle-gold/30 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
              <div className="text-5xl mb-3 animate-float">🏆</div>
              <div className="font-display text-3xl text-white drop-shadow-lg">{winner.name} Wins!</div>
              <div className="text-sparkle-gold text-lg mt-2 font-body font-bold">Final Score: {winner.total}</div>
              {winner.playerId === myId && (
                <div className="text-sparkle-gold text-sm mt-2 animate-bounce font-body">That's you! Congratulations!</div>
              )}
            </div>
            <RoundSummary
              scores={roundScores}
              leaderboard={finalScores}
              players={players}
              teams={teams}
              gameMode={gameMode}
              myId={myId}
              round={round}
              isLastRound={true}
              onNextRound={onNextRound}
            />
            <button
              onClick={onRestart}
              className="glow-button w-full text-white font-bold py-4 rounded-2xl text-lg"
            >
              ✨ Play Again
            </button>
          </div>
        )}

        {/* Always show scoreboard during planning and rolling */}
        {(phase === 'planning' || phase === 'rolling' || phase === 'revealing') && leaderboard.length > 0 && (
          <ScoreBoard leaderboard={leaderboard} myId={myId} round={round} gameMode={gameMode} />
        )}
      </div>
    </div>
  )
}
