import { NavLink, useLocation } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { useGroups } from '../../hooks/useGroups'

export default function Navbar() {
  const isAdmin = useAdminStore(s => s.isAuthenticated)
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')
  const { data: groups } = useGroups()
  const mode = groups?.[0]?.mode ?? 'league'

  const links = [
    { to: '/', label: '🏠 Inicio', end: true },
    { to: '/standings', label: '📊 Tabla' },
    { to: '/matches', label: '⚽ Partidos' },
    mode === 'knockout'
      ? { to: '/bracket', label: '🏆 Bracket' }
      : { to: '/playoffs', label: '🏆 Playoffs' },
  ]

  return (
    <nav className="border-b border-[#1e2a4a] bg-[#06091a]">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-[#d4af37] tracking-tight">
            FIFA <span className="text-white">TORNEO</span>
          </span>
        </div>
        <div className="flex gap-1 items-center">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#d4af37] text-[#06091a]'
                    : 'text-gray-300 hover:text-white hover:bg-[#1e2a4a]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to={isAdmin ? '/admin' : '/admin/login'}
            className={`ml-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAdminPage
                ? 'bg-purple-700 text-white'
                : 'text-gray-500 hover:text-white hover:bg-[#1e2a4a]'
            }`}
          >
            {isAdmin ? '⚙️ Admin' : '🔒'}
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
