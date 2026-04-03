import { Link } from 'react-router-dom'
import { useGroups } from '../hooks/useGroups'
import { useMatches } from '../hooks/useMatches'

const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']
const COLORS: Record<string, string> = {
  JAI: '#e74c3c', ERI: '#3498db', KIK: '#2ecc71', EST: '#f39c12', FRA: '#9b59b6',
}

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
    <div className="max-w-3xl mx-auto space-y-10">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ucl-stars-bg border border-white/8" style={{ background: 'linear-gradient(160deg, #0F2B80 0%, #03071E 70%)' }}>
        {/* Star decorations */}
        <div className="absolute top-6 right-8 text-ucl-blue/30 text-4xl font-black pointer-events-none select-none">✦</div>
        <div className="absolute bottom-8 left-6 text-ucl-blue/20 text-2xl font-black pointer-events-none select-none">✦</div>
        <div className="absolute top-1/2 right-1/4 text-white/5 text-6xl font-black pointer-events-none select-none">✦</div>

        <div className="relative px-8 py-14 text-center">
          {/* Label */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="text-ucl-blue text-xs">✦</span>
            <span className="text-xs font-bold text-ucl-silver uppercase tracking-[0.25em]">Campeonato Amigos</span>
            <span className="text-ucl-blue text-xs">✦</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-4 leading-none uppercase">
            FIFA<br />
            <span className="text-ucl-blue">2026</span>
          </h1>
          <p className="text-ucl-silver text-base font-medium mb-2">
            La gloria no se regala. Se conquista.
          </p>
          <p className="text-ucl-silver/60 text-sm max-w-sm mx-auto leading-relaxed">
            Diez participantes. Un solo campeón. Que comience el torneo.
          </p>

          {/* Player tags */}
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {['Jaime', 'Erick', 'Kike', 'Esteban', 'Franco', 'Jorge', 'Oliver', 'Jonathan', 'Gerardo', 'Iván'].map((name, i) => {
              const c = PALETTE[i % PALETTE.length]
              return (
                <span
                  key={name}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: c + '18', color: c, border: `1px solid ${c}33` }}
                >
                  {name}
                </span>
              )
            })}
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/bracket" className="ucl-btn-blue text-sm">
              Ver Bracket
            </Link>
            <Link to="/rules" className="ucl-btn-secondary text-sm">
              Reglas
            </Link>
          </div>
        </div>
      </div>

      {/* Sponsors */}
      <section>
        <p className="ucl-label text-center mb-4">Patrocinadores</p>
        <div className="relative overflow-hidden bg-white rounded-xl py-4 px-2">
          <div className="flex animate-marquee gap-16 items-center w-max">
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <div key={i} className="flex-shrink-0 flex items-center justify-center h-9 px-4 opacity-60 hover:opacity-100 transition-opacity" title={s.name}>
                <img src={s.logo} alt={s.name} className="h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament progress */}
      <div className="border border-white/8 rounded-xl p-6 bg-ucl-navy">
        <div className="flex items-center justify-between mb-1">
          <span className="ucl-label">Progreso del Torneo</span>
          <span className="text-sm font-black text-white">{completed}<span className="text-ucl-silver font-normal">/{totalMatches}</span></span>
        </div>
        <div className="text-xs text-ucl-silver mb-4">partidos disputados</div>
        <div className="bg-white/8 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-ucl-blue rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-ucl-silver/50 mt-2 text-right">{progress}% completado</div>
      </div>

      {/* Participants */}
      <section>
        <p className="ucl-label mb-4">Participantes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {standings.map((s, i) => {
            const color = COLORS[s.team.code] ?? PALETTE[i % PALETTE.length]
            return (
              <div
                key={s.id}
                className="bg-ucl-navy border border-white/8 rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 hover:border-white/15 transition-all"
              >
                {s.team.avatar_url ? (
                  <img src={s.team.avatar_url} alt={s.team.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${color}44` }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ backgroundColor: color + '18', color, border: `1px solid ${color}33` }}>
                    {s.team.code.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate text-white">{s.team.name}</div>
                  {s.team.fifa_team && <div className="text-xs text-ucl-silver truncate mt-0.5">{s.team.fifa_team}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quick nav */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { to: '/bracket', icon: '✦', label: 'Ver Bracket', sub: 'Eliminación directa' },
          { to: '/rules', icon: '≡', label: 'Reglas', sub: 'Reglamento oficial' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-ucl-navy border border-white/8 rounded-xl p-5 hover:bg-white/5 hover:border-ucl-blue/40 transition-all group"
          >
            <div className="text-ucl-blue text-2xl font-black mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
            <div className="text-sm font-bold text-white">{item.label}</div>
            <div className="text-xs text-ucl-silver mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </section>

      {/* Spotify */}
      <section className="border border-white/8 rounded-xl overflow-hidden bg-ucl-navy">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <span className="text-green-400 font-black">♫</span>
          <span className="ucl-label">Playlist del Torneo</span>
          <a
            href="https://open.spotify.com/playlist/5I64H3Bw78wAL13AcwuKeh?si=4250f2fe95e84772"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-green-400 hover:text-green-300 transition-colors"
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
  { name: 'Coca-Cola', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP7xBmbfZsKPaxJer2nIj7x8AV-wVsL6ME6g&s' },
  { name: 'Betano', logo: 'https://logos-world.net/wp-content/uploads/2024/10/Betano-Logo-New.png' },
  { name: 'Cristal', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-_QCngXTp2Y5RFql__ZCr0lZzy5O8vBJ5mQ&s' },
  { name: 'Adidas', logo: 'https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg' },
]
