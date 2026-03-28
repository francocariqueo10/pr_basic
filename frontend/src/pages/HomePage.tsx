import { Link } from 'react-router-dom'
import { useGroups } from '../hooks/useGroups'
import { useMatches } from '../hooks/useMatches'
import MatchCard from '../components/match/MatchCard'
import Spinner from '../components/ui/Spinner'

const COLORS: Record<string, string> = {
  JAI: '#e74c3c',
  ERI: '#3498db',
  KIK: '#2ecc71',
  EST: '#f39c12',
  FRA: '#9b59b6',
}

export default function HomePage() {
  const { data: groups, isLoading: loadingGroups } = useGroups()
  const { data: matches, isLoading: loadingMatches } = useMatches({ stage: 'group' })

  const standings = groups?.[0]?.standings ?? []
  const completedMatches = matches?.filter(m => m.status === 'completed') ?? []
  const pendingMatches = matches?.filter(m => m.status === 'scheduled') ?? []
  const recentMatches = [...completedMatches].reverse().slice(0, 4)
  const nextMatches = pendingMatches.slice(0, 4)

  const totalMatches = matches?.length ?? 10
  const completed = completedMatches.length
  const progress = Math.round((completed / totalMatches) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center pt-6 pb-2">
        <h1 className="text-4xl font-black tracking-tight mb-1">
          <span className="text-[#d4af37]">FIFA</span> TORNEO
        </h1>
        <p className="text-gray-500 text-sm">Jaime · Erick · Kike · Esteban · Franco</p>
      </div>

      {/* Progress bar */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-5">
        <div className="flex justify-between text-sm mb-3">
          <span className="font-semibold">Progreso del torneo</span>
          <span className="text-[#d4af37] font-bold">{completed}/{totalMatches} partidos</span>
        </div>
        <div className="bg-[#1e2a4a] rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0c030] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2 text-right">{progress}% completado</div>
      </div>

      {/* Standings preview */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Tabla</h2>
          <Link to="/standings" className="text-sm text-[#d4af37] hover:underline">Ver completa →</Link>
        </div>
        {loadingGroups ? <Spinner size="sm" /> : (
          <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl overflow-hidden">
            {standings.map((s, i) => {
              const color = COLORS[s.team.code] ?? '#888'
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3 border-b border-[#1e2a4a] last:border-0 hover:bg-[#1e2a4a]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono w-4 text-sm">{i + 1}</span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                    >
                      {s.team.code.slice(0, 2)}
                    </div>
                    <span className="font-semibold">{s.team.name}</span>
                  </div>
                  <div className="flex items-center gap-5 text-sm text-gray-400">
                    <span>{s.played} PJ</span>
                    <span className="text-gray-500">
                      {s.goal_difference >= 0 ? '+' : ''}{s.goal_difference} DG
                    </span>
                    <span className="text-[#d4af37] font-black text-base w-6 text-right">{s.points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent results */}
        {recentMatches.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Últimos resultados</h2>
              <Link to="/matches" className="text-xs text-[#d4af37] hover:underline">Ver todos →</Link>
            </div>
            {loadingMatches ? <Spinner size="sm" /> : (
              <div className="space-y-2">
                {recentMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </section>
        )}

        {/* Upcoming matches */}
        {nextMatches.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Próximos partidos</h2>
              <Link to="/matches" className="text-xs text-[#d4af37] hover:underline">Ver todos →</Link>
            </div>
            {loadingMatches ? <Spinner size="sm" /> : (
              <div className="space-y-2">
                {nextMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Quick nav */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { to: '/standings', icon: '📊', label: 'Tabla' },
          { to: '/matches', icon: '⚽', label: 'Partidos' },
          { to: '/playoffs', icon: '🏆', label: 'Playoffs' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-5 text-center hover:border-[#d4af37]/40 hover:bg-[#1e2a4a]/30 transition-colors"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-sm font-semibold text-gray-300">{item.label}</div>
          </Link>
        ))}
      </section>
    </div>
  )
}
