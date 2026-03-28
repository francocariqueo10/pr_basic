import { useGroups } from '../hooks/useGroups'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'

const COLORS: Record<string, string> = {
  JAI: '#e74c3c',
  ERI: '#3498db',
  KIK: '#2ecc71',
  EST: '#f39c12',
  FRA: '#9b59b6',
}

export default function StandingsPage() {
  const { data: groups, isLoading, isError } = useGroups()

  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />

  const standings = groups?.[0]?.standings ?? []
  const totalMatches = standings.reduce((sum, s) => sum + s.played, 0) / 2

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#d4af37]">Tabla de Posiciones</h1>
        <span className="text-sm text-gray-500">{totalMatches}/10 partidos jugados</span>
      </div>

      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs bg-[#0a0e1a] border-b border-[#1e2a4a]">
              <th className="px-5 py-3 text-left w-8">#</th>
              <th className="px-3 py-3 text-left">Jugador</th>
              <th className="px-3 py-3 text-center">PJ</th>
              <th className="px-3 py-3 text-center">G</th>
              <th className="px-3 py-3 text-center">E</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GC</th>
              <th className="px-3 py-3 text-center">DG</th>
              <th className="px-4 py-3 text-center font-bold text-white">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const color = COLORS[s.team.code] ?? '#888'
              const isTop4 = i < 4
              return (
                <tr
                  key={s.id}
                  className="border-b border-[#1e2a4a] last:border-0 hover:bg-[#1e2a4a]/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {isTop4 && <span className="w-0.5 h-5 rounded-full" style={{ backgroundColor: color }} />}
                      <span className={`font-mono text-sm ${isTop4 ? 'text-white' : 'text-gray-500'}`}>
                        {i + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black"
                        style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                      >
                        {s.team.code.slice(0, 2)}
                      </div>
                      <span className="font-semibold">{s.team.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center text-gray-400">{s.played}</td>
                  <td className="px-3 py-4 text-center text-green-400">{s.won}</td>
                  <td className="px-3 py-4 text-center text-yellow-500">{s.drawn}</td>
                  <td className="px-3 py-4 text-center text-red-400">{s.lost}</td>
                  <td className="px-3 py-4 text-center text-gray-300">{s.goals_for}</td>
                  <td className="px-3 py-4 text-center text-gray-400">{s.goals_against}</td>
                  <td className="px-3 py-4 text-center text-gray-300">
                    {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-black text-lg text-[#d4af37]">{s.points}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-center">
        <span>G: Ganados · E: Empatados · P: Perdidos</span>
        <span>GF: Goles a favor · GC: En contra · DG: Diferencia</span>
      </div>

      {standings.length === 0 && (
        <div className="text-center py-12 text-gray-500">Cargando tabla...</div>
      )}
    </div>
  )
}
