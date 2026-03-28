import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { Team } from '../../types'

const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']

function getColor(team: Team, index: number) {
  // flag_url stores color for tournament teams
  return team.flag_url ?? PALETTE[index % PALETTE.length]
}

export default function PlayersTab() {
  const qc = useQueryClient()
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.teams.getAll(),
  })

  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  const addMutation = useMutation({
    mutationFn: (name: string) => api.adminTeams.add(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setNewName(''); setApiError('') },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al agregar jugador'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.adminTeams.update(id, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setEditId(null); setApiError('') },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al actualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.adminTeams.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); qc.invalidateQueries({ queryKey: ['matches'] }); qc.invalidateQueries({ queryKey: ['groups'] }); setDeleteConfirm(null) },
    onError: (e: any) => setApiError(e.response?.data?.detail ?? 'Error al eliminar'),
  })

  const handleAdd = () => {
    if (!newName.trim()) return
    addMutation.mutate(newName.trim())
  }

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
        <p className="text-xs text-gray-600 mt-3">
          Los partidos se regeneran automáticamente al agregar o eliminar jugadores.
        </p>
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
              <div
                key={team.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-[#1e2a4a] last:border-0"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                >
                  {team.code.slice(0, 2)}
                </div>

                {isEditing ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') updateMutation.mutate({ id: team.id, name: editName })
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      className="flex-1 bg-[#1e2a4a] border border-[#d4af37] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={() => updateMutation.mutate({ id: team.id, name: editName })}
                      disabled={updateMutation.isPending}
                      className="px-3 py-1.5 bg-[#d4af37] text-[#06091a] font-bold rounded-lg text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-3 py-1.5 border border-[#1e2a4a] text-gray-400 rounded-lg text-xs hover:bg-[#1e2a4a]"
                    >
                      ✕
                    </button>
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
                  <>
                    <span className="flex-1 font-semibold">{team.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditId(team.id); setEditName(team.name); setApiError('') }}
                        className="px-3 py-1.5 border border-[#1e2a4a] text-gray-400 rounded-lg text-xs hover:bg-[#1e2a4a] hover:text-white transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => { setDeleteConfirm(team.id); setApiError('') }}
                        className="px-3 py-1.5 border border-red-900/50 text-red-500 rounded-lg text-xs hover:bg-red-900/30 transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
