import { NavLink, useLocation } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/bracket', label: 'Bracket' },
  { to: '/rules', label: 'Reglas' },
]

export default function Navbar() {
  const isAdmin = useAdminStore(s => s.isAuthenticated)
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <nav className="bg-ucl-black border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <span className="text-ucl-blue font-black text-base tracking-widest group-hover:text-ucl-blue-l transition-colors">✦</span>
          <span className="text-white font-black text-base tracking-[0.12em] uppercase">
            Torneo <span className="text-ucl-silver font-light">2026</span>
          </span>
        </NavLink>

        {/* Links */}
        <div className="flex items-center gap-1">
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }: { isActive: boolean }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition-all tracking-wide ${
                  isActive
                    ? 'bg-ucl-blue text-white'
                    : 'text-ucl-silver hover:text-white hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to={isAdmin ? '/admin' : '/admin/login'}
            className={`ml-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all tracking-wide ${
              isAdminPage
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-ucl-silver/50 hover:text-ucl-silver hover:bg-white/5'
            }`}
          >
            {isAdmin ? 'Admin' : '···'}
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
