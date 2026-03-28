import { useState } from 'react'
import type { Match } from '../../types'
import ScoreModal from './ScoreModal'

interface Props {
  match: Match
  showEdit?: boolean
}

const PLAYER_COLORS: Record<string, string> = {
  JAI: '#e74c3c',
  ERI: '#3498db',
  KIK: '#2ecc71',
  EST: '#f39c12',
  FRA: '#9b59b6',
}

export default function MatchCard({ match, showEdit = true }: Props) {
  const [editing, setEditing] = useState(false)

  const isCompleted = match.status === 'completed'
  const isLive = match.status === 'live'
  const hasBothTeams = match.home_team && match.away_team

  const stageLabel: Record<string, string> = {
    group: `Jornada ${match.match_day}`,
    sf: 'Semifinal',
    third_place: 'Tercer Puesto',
    final: '⭐ GRAN FINAL',
  }

  return (
    <>
      <div
        className={`bg-[#0d1526] border rounded-xl p-4 transition-all ${
          showEdit && hasBothTeams
            ? 'cursor-pointer hover:border-[#d4af37]/60 hover:bg-[#1e2a4a]/40'
            : 'border-[#1e2a4a]'
        } ${match.stage === 'final' ? 'border-[#d4af37]/30' : 'border-[#1e2a4a]'}`}
        onClick={() => showEdit && hasBothTeams && setEditing(true)}
      >
        {/* Stage label */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 tracking-wider uppercase">
            {stageLabel[match.stage] ?? match.stage}
          </span>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                EN VIVO
              </span>
            )}
            {isCompleted && (
              <span className="text-xs text-green-500">✓ Finalizado</span>
            )}
            {showEdit && hasBothTeams && (
              <span className="text-xs text-gray-600">
                {isCompleted ? '✏️' : '+ resultado'}
              </span>
            )}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center gap-3">
          <TeamBlock
            name={match.home_team?.name ?? 'Por definir'}
            code={match.home_team?.code}
            isWinner={!!match.winner_id && match.winner_id === match.home_team?.id}
            isLoser={!!match.winner_id && match.winner_id !== match.home_team?.id && isCompleted}
          />

          <div className="text-center flex-shrink-0 w-20">
            {isCompleted || isLive ? (
              <div className="text-2xl font-black tracking-tight">
                <span className={match.winner_id === match.home_team?.id ? 'text-white' : 'text-gray-500'}>
                  {match.home_score}
                </span>
                <span className="text-gray-600 mx-1.5">–</span>
                <span className={match.winner_id === match.away_team?.id ? 'text-white' : 'text-gray-500'}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <div className="text-gray-600 font-bold text-xl">vs</div>
            )}
          </div>

          <TeamBlock
            name={match.away_team?.name ?? 'Por definir'}
            code={match.away_team?.code}
            isWinner={!!match.winner_id && match.winner_id === match.away_team?.id}
            isLoser={!!match.winner_id && match.winner_id !== match.away_team?.id && isCompleted}
            reverse
          />
        </div>
      </div>

      {editing && (
        <ScoreModal match={match} onClose={() => setEditing(false)} />
      )}
    </>
  )
}

function TeamBlock({
  name, code, isWinner, isLoser, reverse = false,
}: {
  name: string
  code?: string | null
  isWinner: boolean
  isLoser: boolean
  reverse?: boolean
}) {
  const color = code ? PLAYER_COLORS[code] : '#888'

  return (
    <div className={`flex-1 flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ backgroundColor: color + '33', color, border: `1px solid ${color}55` }}
      >
        {code?.slice(0, 2) ?? '??'}
      </div>
      <span className={`font-semibold text-sm leading-tight ${
        isWinner ? 'text-white' : isLoser ? 'text-gray-600' : 'text-gray-300'
      } ${reverse ? 'text-right' : ''}`}>
        {name}
      </span>
    </div>
  )
}
