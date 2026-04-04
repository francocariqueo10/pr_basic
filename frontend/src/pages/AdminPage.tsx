import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import PlayersTab from '../components/admin/PlayersTab'
import MatchesTab from '../components/admin/MatchesTab'
import TournamentTab from '../components/admin/TournamentTab'
import TeamDrawTab from '../components/admin/TeamDrawTab'

type Tab = 'draw' | 'players' | 'matches' | 'tournament'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'draw',       label: 'Equipos',   icon: '🎱' },
  { id: 'players',    label: 'Jugadores', icon: '👥' },
  { id: 'matches',    label: 'Partidos',  icon: '⚽' },
  { id: 'tournament', label: 'Torneo',    icon: '⚙️' },
]

export default function AdminPage() {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('draw')

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login', { replace: true })
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-2xl font-bold">Panel de Administrador</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? 'bg-[#d4af37] text-[#06091a]'
                : 'text-gray-400 hover:text-white hover:bg-[#1e2a4a]'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'draw'       && <TeamDrawTab />}
      {activeTab === 'players'    && <PlayersTab />}
      {activeTab === 'matches'    && <MatchesTab />}
      {activeTab === 'tournament' && <TournamentTab />}
    </div>
  )
}
