import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import type { Match } from '../../types'
import { useUpdateMatch } from '../../hooks/useUpdateMatch'
import GoalEditor from './GoalEditor'

const STAGE_LABELS: Record<string, string> = {
  group: 'Grupos',
  sf: 'Semifinal',
  third_place: 'Tercer Puesto',
  final: 'Gran Final',
}

const STAGE_ORDER = ['group', 'sf', 'third_place', 'final']

export default function MatchesTab() {
  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: () => api.matches.getAll(),
  })

  const grouped = STAGE_ORDER.reduce<Record<string, Match[]>>((acc, s) => {
    const list = matches.filter(m => m.stage === s)
    if (list.length) acc[s] = list
    return acc
  }, {})

  if (isLoading) return <div className="text-gray-500 py-8 text-center">Cargando partidos...</div>

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([stage, list]) => (
        <div key={stage}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {STAGE_LABELS[stage] ?? stage}
          </h3>
          <div className="space-y-2">
            {list.map(m => <AdminMatchRow key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminMatchRow({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const { mutate, isPending } = useUpdateMatch()

  const hasBothTeams = match.home_team && match.away_team
  const isCompleted = match.status === 'completed'

  const handleSave = () => {
    mutate({ id: match.id, home_score: homeScore, away_score: awayScore, status: 'completed' })
  }

  const handleReset = () => {
    mutate(
      { id: match.id, home_score: 0, away_score: 0, status: 'scheduled' },
      { onSuccess: () => { setHomeScore(0); setAwayScore(0) } }
    )
  }

  return (
    <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1e2a4a]/40 transition-colors"
        onClick={() => hasBothTeams && setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs text-gray-500 w-16 flex-shrink-0">
            {match.stage === 'group' ? `J${match.match_day}` : STAGE_LABELS[match.stage]}
          </span>
          <span className="font-semibold text-sm truncate">
            {match.home_team?.name ?? '—'} vs {match.away_team?.name ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <span className="font-black text-base text-[#d4af37]">
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-xs text-gray-600">Sin jugar</span>
          )}
          {hasBothTeams && (
            <span className="text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && hasBothTeams && (
        <div className="px-4 pb-4 border-t border-[#1e2a4a] pt-4">
          {/* Score editor */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-2">{match.home_team!.name}</div>
              <ScoreInput value={homeScore} onChange={setHomeScore} />
            </div>
            <div className="text-gray-600 font-bold text-xl">–</div>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-2">{match.away_team!.name}</div>
              <ScoreInput value={awayScore} onChange={setAwayScore} />
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            {isCompleted && (
              <button
                onClick={handleReset}
                disabled={isPending}
                className="px-4 py-2 border border-red-900/50 text-red-400 rounded-xl text-sm hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                Resetear
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2 bg-[#d4af37] text-[#06091a] font-bold rounded-xl text-sm hover:bg-[#e6c84a] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : '✓ Guardar Resultado'}
            </button>
          </div>

          {/* Goal editor */}
          <GoalEditor match={match} />
        </div>
      )}
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 rounded-lg bg-[#1e2a4a] text-white font-bold hover:bg-[#2a3a6a] transition-colors">−</button>
      <span className="w-10 text-center text-2xl font-black text-[#d4af37]">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-lg bg-[#1e2a4a] text-white font-bold hover:bg-[#2a3a6a] transition-colors">+</button>
    </div>
  )
}
