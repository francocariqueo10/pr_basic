import { useParams, Link } from 'react-router-dom'
import { useTeam, useTeamMatches } from '../hooks/useTeams'
import MatchCard from '../components/match/MatchCard'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)

  const { data: team, isLoading: loadingTeam, isError: errorTeam } = useTeam(teamId)
  const { data: matches, isLoading: loadingMatches } = useTeamMatches(teamId)

  if (loadingTeam) return <Spinner />
  if (errorTeam || !team) return <ErrorMessage message="Equipo no encontrado" />

  const played = matches?.filter(m => m.status === 'completed') ?? []
  const upcoming = matches?.filter(m => m.status === 'scheduled') ?? []

  return (
    <div>
      <div className="mb-6">
        <Link to="/teams" className="text-gray-500 hover:text-[#d4af37] text-sm">← Equipos</Link>
      </div>

      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-xl p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[#1e2a4a] rounded-xl flex items-center justify-center font-bold text-2xl text-[#d4af37] font-mono flex-shrink-0">
            {team.code}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">{team.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span>{team.confederation}</span>
              {team.fifa_ranking && <span>Ranking FIFA: #{team.fifa_ranking}</span>}
              {team.coach && <span>DT: {team.coach}</span>}
            </div>
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-3">Próximos partidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {loadingMatches && <Spinner size="sm" />}

      {played.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-400 mb-3">Partidos jugados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {played.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {!loadingMatches && matches?.length === 0 && (
        <div className="text-center py-8 text-gray-500">No hay partidos registrados</div>
      )}
    </div>
  )
}
