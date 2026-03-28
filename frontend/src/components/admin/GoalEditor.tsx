import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { Match, Goal, Team } from '../../types'

interface Props {
  match: Match
}

export default function GoalEditor({ match }: Props) {
  const qc = useQueryClient()
  const [minute, setMinute] = useState(1)
  const [teamId, setTeamId] = useState<number>(match.home_team?.id ?? 0)
  const [isPenalty, setIsPenalty] = useState(false)
  const [isOwnGoal, setIsOwnGoal] = useState(false)

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals', match.id],
    queryFn: () => api.goals.getByMatch(match.id),
    enabled: match.status === 'completed',
  })

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.teams.getAll(),
  })

  const addGoal = useMutation({
    mutationFn: () => api.goals.add({ match_id: match.id, team_id: teamId, minute, is_penalty: isPenalty, is_own_goal: isOwnGoal }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals', match.id] }); qc.invalidateQueries({ queryKey: ['scorers'] }) },
  })

  const deleteGoal = useMutation({
    mutationFn: (id: number) => api.goals.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals', match.id] }); qc.invalidateQueries({ queryKey: ['scorers'] }) },
  })

  if (match.status !== 'completed') {
    return <p className="text-xs text-gray-600 mt-3">Registra el resultado primero para agregar goles.</p>
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#1e2a4a]">
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Goles del partido</h4>

      {/* Existing goals */}
      {goals.length > 0 && (
        <div className="space-y-1 mb-4">
          {goals.map(g => (
            <div key={g.id} className="flex items-center justify-between bg-[#0a0e1a] rounded-lg px-3 py-2">
              <span className="text-sm">
                <span className="text-[#d4af37] font-mono font-bold w-8 inline-block">{g.minute}'</span>
                <span className="font-semibold">{g.scorer_name}</span>
                {g.is_penalty && <span className="text-xs text-gray-500 ml-1">(pen)</span>}
                {g.is_own_goal && <span className="text-xs text-orange-400 ml-1">(autogol)</span>}
              </span>
              <button
                onClick={() => deleteGoal.mutate(g.id)}
                className="text-gray-600 hover:text-red-400 transition-colors text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add goal form */}
      <div className="bg-[#0a0e1a] rounded-xl p-3 space-y-3">
        <p className="text-xs text-gray-500 font-semibold">+ Agregar gol</p>
        <div className="flex gap-2 flex-wrap">
          {/* Scorer */}
          <select
            value={teamId}
            onChange={e => setTeamId(Number(e.target.value))}
            className="flex-1 min-w-[120px] bg-[#1e2a4a] border border-[#2a3a6a] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Minute */}
          <div className="flex items-center gap-1">
            <button onClick={() => setMinute(m => Math.max(1, m - 1))} className="w-7 h-7 rounded bg-[#1e2a4a] text-white text-sm hover:bg-[#2a3a6a]">−</button>
            <span className="w-10 text-center text-sm font-mono text-[#d4af37] font-bold">{minute}'</span>
            <button onClick={() => setMinute(m => Math.min(120, m + 1))} className="w-7 h-7 rounded bg-[#1e2a4a] text-white text-sm hover:bg-[#2a3a6a]">+</button>
          </div>

          {/* Type toggles */}
          <button
            onClick={() => { setIsPenalty(v => !v); setIsOwnGoal(false) }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isPenalty ? 'bg-blue-700 text-white' : 'bg-[#1e2a4a] text-gray-400 hover:bg-[#2a3a6a]'}`}
          >
            Penal
          </button>
          <button
            onClick={() => { setIsOwnGoal(v => !v); setIsPenalty(false) }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isOwnGoal ? 'bg-orange-700 text-white' : 'bg-[#1e2a4a] text-gray-400 hover:bg-[#2a3a6a]'}`}
          >
            Autogol
          </button>

          <button
            onClick={() => addGoal.mutate()}
            disabled={addGoal.isPending || !teamId}
            className="px-3 py-1.5 bg-[#d4af37] text-[#06091a] font-bold rounded-lg text-xs hover:bg-[#e6c84a] transition-colors disabled:opacity-50"
          >
            ⚽ Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
