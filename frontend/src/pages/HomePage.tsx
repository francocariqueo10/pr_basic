import { Link } from 'react-router-dom'
import { useGroups } from '../hooks/useGroups'
import { useMatches } from '../hooks/useMatches'

const COLORS: Record<string, string> = {
  JAI: '#e74c3c',
  ERI: '#3498db',
  KIK: '#2ecc71',
  EST: '#f39c12',
  FRA: '#9b59b6',
}
const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']

export default function HomePage() {
  const { data: groups } = useGroups()
  const { data: matches } = useMatches()

  const standings = groups?.[0]?.standings ?? []
  const bracketMatches = (matches ?? []).filter(m => m.bracket_round !== null)
  const completedMatches = bracketMatches.filter(m => m.status === 'completed')
  const totalMatches = bracketMatches.filter(m => m.home_team && m.away_team).length
  const completed = completedMatches.length
  const progress = totalMatches > 0 ? Math.round((completed / totalMatches) * 100) : 0

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

      {/* Sponsors carousel */}
      <section>
        <p className="text-xs text-gray-400 text-center uppercase tracking-widest mb-4">Patrocinadores</p>
        <div className="relative overflow-hidden bg-white rounded-2xl py-5 px-2 shadow-sm">
          <div className="flex animate-marquee gap-16 items-center w-max">
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center justify-center h-10 px-4 opacity-70 hover:opacity-100 transition-opacity"
                title={s.name}
              >
                <img src={s.logo} alt={s.name} className="h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* Players grid */}
      <section>
        <h2 className="font-bold text-lg mb-3">Participantes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {standings.map((s, i) => {
            const color = COLORS[s.team.code] ?? PALETTE[i % PALETTE.length]
            return (
              <div
                key={s.id}
                className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-4 flex items-center gap-3 hover:border-[#1e2a4a]/80 transition-colors"
              >
                {s.team.avatar_url ? (
                  <img src={s.team.avatar_url} alt={s.team.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${color}44` }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}>
                    {s.team.code.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{s.team.name}</div>
                  {s.team.fifa_team && <div className="text-xs text-[#d4af37]/60 truncate">{s.team.fifa_team}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quick nav */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { to: '/bracket', icon: '🏆', label: 'Ver Bracket' },
          { to: '/rules', icon: '📋', label: 'Reglas' },
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
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP7xBmbfZsKPaxJer2nIj7x8AV-wVsL6ME6g&s',
  },
  {
    name: 'Betano',
    logo: 'https://logos-world.net/wp-content/uploads/2024/10/Betano-Logo-New.png',
  },
  {
    name: 'Cristal',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-_QCngXTp2Y5RFql__ZCr0lZzy5O8vBJ5mQ&s',
  },
  {
    name: 'Adidas',
    logo: 'https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg',
  },
]
