import { Navigate } from 'react-router-dom'
import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import MatchCard from '../components/match/MatchCard'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import type { Match } from '../types'

export default function MatchesPage() {
  const { data: groups, isLoading: loadingGroups } = useGroups()
  const mode = groups?.[0]?.mode ?? 'league'

  // In knockout mode, redirect to the bracket page (which handles scoring)
  if (!loadingGroups && mode === 'knockout') {
    return <Navigate to="/bracket" replace />
  }

  return <LeagueMatchesPage />
}

function LeagueMatchesPage() {
  const { data: matches, isLoading, isError } = useMatches({ stage: 'group' })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />

  const byRound = groupByRound(matches ?? [])
  const totalCompleted = matches?.filter(m => m.status === 'completed').length ?? 0
  const total = matches?.length ?? 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#d4af37]">Partidos</h1>
        <span className="text-sm text-gray-500">{totalCompleted}/{total} completados</span>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Toca cualquier partido para registrar el resultado.
      </p>

      {Object.entries(byRound).map(([round, list]) => (
        <div key={round} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Jornada {round}
            </span>
            <div className="flex-1 h-px bg-[#1e2a4a]" />
            <span className="text-xs text-gray-600">
              {list.filter(m => m.status === 'completed').length}/{list.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByRound(matches: Match[]) {
  const map: Record<number, Match[]> = {}
  for (const m of matches) {
    const day = m.match_day ?? 0
    if (!map[day]) map[day] = []
    map[day].push(m)
  }
  return map
}
