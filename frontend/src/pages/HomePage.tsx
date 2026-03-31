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
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0d1526] via-[#111d35] to-[#0a0e1a] border border-[#1e2a4a] px-8 py-12 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#d4af37]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black tracking-tight mb-3 leading-tight">
            Bienvenidos al<br />
            <span className="text-[#d4af37]">Campeonato FIFA 2026</span>
          </h1>
          <p className="text-gray-300 text-lg font-medium mb-2">
            El momento ha llegado. La gloria te espera.
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Cinco guerreros. Un solo campeón. Cada partido es una batalla, cada gol
            una declaración. ¿Tienes lo que se necesita para alzar el trofeo?
          </p>

          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            {['Jaime', 'Erick', 'Kike', 'Esteban', 'Franco'].map((name, i) => {
              const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6']
              const c = colors[i]
              return (
                <span
                  key={name}
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: c + '22', color: c, border: `1px solid ${c}44` }}
                >
                  {name}
                </span>
              )
            })}
          </div>
        </div>
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
                    <div>
                      <div className="font-semibold">{s.team.name}</div>
                      {s.team.fifa_team && (
                        <div className="text-xs text-[#d4af37]/60">{s.team.fifa_team}</div>
                      )}
                    </div>
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

      {/* Sponsors carousel */}
      <section>
        <p className="text-xs text-gray-600 text-center uppercase tracking-widest mb-4">Patrocinadores</p>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee gap-12 items-center w-max">
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center justify-center h-10 px-2 opacity-40 hover:opacity-80 transition-opacity"
                title={s.name}
              >
                <img src={s.logo} alt={s.name} className="h-full object-contain grayscale hover:grayscale-0 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotify playlist */}
      <section className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center gap-2">
          <span className="text-green-400 text-lg">♫</span>
          <span className="font-bold text-sm">Playlist del Torneo</span>
          <a
            href="https://open.spotify.com/playlist/5I64H3Bw78wAL13AcwuKeh?si=4250f2fe95e84772"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-green-400 hover:underline"
          >
            Abrir en Spotify ↗
          </a>
        </div>
        <iframe
          src="https://open.spotify.com/embed/playlist/5I64H3Bw78wAL13AcwuKeh?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block"
        />
      </section>
    </div>
  )
}

const SPONSORS = [
  {
    name: 'Coca-Cola',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/320px-Coca-Cola_logo.svg.png',
  },
  {
    name: 'Betano',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Betano_logo.svg/320px-Betano_logo.svg.png',
  },
  {
    name: 'Cristal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Cristal_Logo.svg/320px-Cristal_Logo.svg.png',
  },
  {
    name: 'Adidas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/320px-Adidas_Logo.svg.png',
  },
]
