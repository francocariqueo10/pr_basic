import { useTopScorers } from '../hooks/useScorers'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function ScorersPage() {
  const { data: scorers, isLoading, isError } = useTopScorers(50)

  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#d4af37]">Tabla de Goleadores</h1>

      {scorers?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay goles registrados aún. Los goleadores aparecerán aquí cuando comience el torneo.
        </div>
      ) : (
        <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs bg-[#1e2a4a] border-b border-[#1e2a4a]">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Jugador</th>
                <th className="text-left px-4 py-3">Equipo</th>
                <th className="px-4 py-3 text-center">PJ</th>
                <th className="px-4 py-3 text-center font-bold text-white">Goles</th>
                <th className="px-4 py-3 text-center">Penales</th>
              </tr>
            </thead>
            <tbody>
              {scorers?.map(s => (
                <tr
                  key={s.player.id}
                  className="border-b border-[#1e2a4a] last:border-0 hover:bg-[#1e2a4a]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400 font-mono">
                    {s.rank <= 3 ? (
                      <span>{['🥇', '🥈', '🥉'][s.rank - 1]}</span>
                    ) : (
                      s.rank
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.player.name}</div>
                    <div className="text-xs text-gray-500">{s.player.position}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-8">{s.team_code}</span>
                      <span className="text-gray-300">{s.team_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{s.matches}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[#d4af37] font-bold text-base">{s.goals}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {s.penalty_goals > 0 ? `(${s.penalty_goals} pen)` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
