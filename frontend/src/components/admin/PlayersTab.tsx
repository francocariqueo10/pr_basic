import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { Team } from '../../types'
import PlayerProfileModal from './PlayerProfileModal'

// Top clubs from the 5 major European leagues
const LEAGUES: { name: string; clubs: string[] }[] = [
  {
    name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
    clubs: [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
      'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
      'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham',
      'West Ham United', 'Wolverhampton',
    ],
  },
  {
    name: '🇩🇪 Bundesliga',
    clubs: [
      'Bayern Munich', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig',
      'Eintracht Frankfurt', 'VfB Stuttgart', 'SC Freiburg', 'Hoffenheim',
      'Werder Bremen', 'Borussia Mönchengladbach', 'Augsburg', 'Wolfsburg',
      'Union Berlin', 'Mainz', 'Bochum', 'Heidenheim', 'Holstein Kiel', 'St. Pauli',
    ],
  },
  {
    name: '🇮🇹 Serie A',
    clubs: [
      'Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Atalanta',
      'Roma', 'Lazio', 'Fiorentina', 'Bologna', 'Torino',
      'Genoa', 'Cagliari', 'Udinese', 'Sassuolo', 'Lecce',
      'Hellas Verona', 'Monza', 'Como', 'Venezia', 'Parma',
    ],
  },
  {
    name: '🇪🇸 La Liga',
    clubs: [
      'Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Athletic Bilbao',
      'Real Sociedad', 'Villarreal', 'Real Betis', 'Sevilla',
      'Valencia', 'Celta Vigo', 'Girona', 'Osasuna',
      'Getafe', 'Rayo Vallecano', 'Mallorca', 'Deportivo Alavés',
      'Las Palmas', 'Leganés', 'Valladolid', 'Espanyol',
    ],
  },
  {
    name: '🇫🇷 Ligue 1',
    clubs: [
      'Paris Saint-Germain', 'Olympique de Marseille', 'Monaco',
      'Lens', 'Lille', 'Lyon', 'Nice', 'Rennes',
      'Strasbourg', 'Nantes', 'Reims', 'Montpellier',
      'Toulouse', 'Brest', 'Le Havre', 'Auxerre',
      'Angers', 'Saint-Étienne',
    ],
  },
]

const FIFA_TEAMS = LEAGUES.flatMap(l => l.clubs)

const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']

function getColor(team: Team, index: number) {
  return team.flag_url ?? PALETTE[index % PALETTE.length]
}

export default function PlayersTab() {
  const qc = useQueryClient()
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.teams.getAll(),
  })

  const [newName, setNewName] = useState('')
  const [profileTeam, setProfileTeam] = useState<{ team: Team; index: number } | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editFifaTeam, setEditFifaTeam] = useState('')
  const [fifaSearch, setFifaSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  const addMutation = useMutation({
    mutationFn: (name: string) => api.adminTeams.add(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setNewName(''); setApiError('') },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al agregar jugador'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, fifa_team }: { id: number; name: string; fifa_team?: string | null }) =>
      api.adminTeams.update(id, { name, fifa_team }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['matches'] })
      setEditId(null)
      setFifaSearch('')
      setApiError('')
    },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al actualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminTeams.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      setDeleteConfirm(null)
    },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al eliminar'),
  })

  const handleAdd = () => {
    if (!newName.trim()) return
    addMutation.mutate(newName.trim())
  }

  const startEdit = (team: Team) => {
    setEditId(team.id)
    setEditName(team.name)
    setEditFifaTeam(team.fifa_team ?? '')
    setFifaSearch('')
    setApiError('')
    setDeleteConfirm(null)
  }

  const saveEdit = (team: Team) => {
    updateMutation.mutate({
      id: team.id,
      name: editName,
      fifa_team: editFifaTeam || null,
    })
  }

  const filteredTeams = FIFA_TEAMS.filter(t => t.toLowerCase().includes(fifaSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Add player */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-5">
        <h3 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Agregar Jugador</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del jugador"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            maxLength={30}
            className="flex-1 bg-[#1e2a4a] border border-[#2a3a6a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending || !newName.trim()}
            className="px-5 py-2.5 bg-[#d4af37] text-[#06091a] font-bold rounded-xl hover:bg-[#e6c84a] transition-colors disabled:opacity-50 text-sm"
          >
            {addMutation.isPending ? '...' : '+ Agregar'}
          </button>
        </div>
        {apiError && <p className="text-red-400 text-sm mt-2">{apiError}</p>}
      </div>

      {/* Player list */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1e2a4a] text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Jugadores ({teams.length})
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : (
          teams.map((team, i) => {
            const color = getColor(team, i)
            const isEditing = editId === team.id
            const isDeleting = deleteConfirm === team.id

            return (
              <div key={team.id} className="border-b border-[#1e2a4a] last:border-0">
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  {team.avatar_url ? (
                    <img
                      src={team.avatar_url}
                      alt={team.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border"
                      style={{ borderColor: color + '44' }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                    >
                      {team.code.slice(0, 2)}
                    </div>
                  )}

                  {isEditing ? (
                    /* Edit mode */
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && setEditId(null)}
                          placeholder="Nombre del jugador"
                          className="flex-1 bg-[#1e2a4a] border border-[#d4af37] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => saveEdit(team)}
                          disabled={updateMutation.isPending}
                          className="px-3 py-1.5 bg-[#d4af37] text-[#06091a] font-bold rounded-lg text-xs"
                        >
                          ✓ Guardar
                        </button>
                        <button
                          onClick={() => { setEditId(null); setFifaSearch('') }}
                          className="px-3 py-1.5 border border-[#1e2a4a] text-gray-400 rounded-lg text-xs hover:bg-[#1e2a4a]"
                        >
                          ✕
                        </button>
                      </div>

                      {/* FIFA team selector */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Equipo FIFA asignado</label>
                        {editFifaTeam && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-semibold rounded-lg">
                              ⚽ {editFifaTeam}
                            </span>
                            <button
                              onClick={() => setEditFifaTeam('')}
                              className="text-xs text-gray-500 hover:text-red-400"
                            >
                              quitar
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Buscar club..."
                          value={fifaSearch}
                          onChange={e => setFifaSearch(e.target.value)}
                          className="w-full bg-[#1e2a4a] border border-[#2a3a6a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]/60"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                          {(fifaSearch
                            ? [{ name: 'Resultados', clubs: filteredTeams }]
                            : LEAGUES
                          ).map(league => (
                            <div key={league.name}>
                              <div className="text-xs text-gray-500 font-semibold mb-1.5 sticky top-0 bg-[#0d1526] py-0.5">
                                {league.name}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {league.clubs.map(ft => (
                                  <button
                                    key={ft}
                                    onClick={() => { setEditFifaTeam(ft); setFifaSearch('') }}
                                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                                      editFifaTeam === ft
                                        ? 'bg-[#d4af37]/20 border-[#d4af37]/60 text-[#d4af37]'
                                        : 'bg-[#0a0e1a] border-[#1e2a4a] text-gray-400 hover:border-gray-500 hover:text-white'
                                    }`}
                                  >
                                    {ft}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm text-red-400">¿Eliminar a {team.name}?</span>
                      <button
                        onClick={() => deleteMutation.mutate(team.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1.5 bg-red-700 text-white font-bold rounded-lg text-xs"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 border border-[#1e2a4a] text-gray-400 rounded-lg text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    /* Normal view */
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">
                          {team.name}
                          {team.nickname && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">"{team.nickname}"</span>
                          )}
                        </div>
                        {team.fifa_team ? (
                          <div className="text-xs text-[#d4af37]/80 mt-0.5">⚽ {team.fifa_team}</div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-0.5 italic">Sin equipo asignado</div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setProfileTeam({ team, index: i })}
                          className="px-3 py-1.5 border border-[#d4af37]/30 text-[#d4af37] rounded-lg text-xs hover:bg-[#d4af37]/10 transition-colors"
                        >
                          👤 Perfil
                        </button>
                        <button
                          onClick={() => startEdit(team)}
                          className="px-3 py-1.5 border border-[#1e2a4a] text-gray-400 rounded-lg text-xs hover:bg-[#1e2a4a] hover:text-white transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => { setDeleteConfirm(team.id); setApiError('') }}
                          className="px-3 py-1.5 border border-red-900/50 text-red-500 rounded-lg text-xs hover:bg-red-900/30 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {profileTeam && (
        <PlayerProfileModal
          team={profileTeam.team}
          colorIndex={profileTeam.index}
          onClose={() => setProfileTeam(null)}
        />
      )}
    </div>
  )
}
