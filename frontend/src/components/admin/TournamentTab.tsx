import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { useAdminStore } from '../../store/adminStore'
import { useNavigate } from 'react-router-dom'
import { useMatches } from '../../hooks/useMatches'
import TombolaModal from './TombolaModal'
import type { Team } from '../../types'

export default function TournamentTab() {
  const qc = useQueryClient()
  const logout = useAdminStore(s => s.logout)
  const navigate = useNavigate()
  const [resetConfirm, setResetConfirm] = useState(false)
  const [showTombola, setShowTombola] = useState(false)
  const [message, setMessage] = useState('')

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.teams.getAll(),
  })
  const { data: matches = [] } = useMatches()
  const hasBracket = matches.some(m => m.bracket_round !== null)

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['matches'] })
    qc.invalidateQueries({ queryKey: ['groups'] })
    qc.invalidateQueries({ queryKey: ['standings'] })
    qc.invalidateQueries({ queryKey: ['teams'] })
  }

  const resetMutation = useMutation({
    mutationFn: () => api.admin.resetResults(),
    onSuccess: (data: any) => { invalidateAll(); setMessage(data.message); setResetConfirm(false) },
  })

  return (
    <div className="space-y-4 max-w-lg">
      {message && (
        <div className="bg-green-900/30 border border-green-700/40 text-green-400 text-sm rounded-xl px-4 py-3">
          ✓ {message}
        </div>
      )}

      {/* Tómbola / generate bracket */}
      <div className="bg-[#0d1526] border border-[#d4af37]/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span>🎱</span>
              <h3 className="font-bold">Tómbola del Torneo</h3>
            </div>
            <p className="text-sm text-gray-500">
              {hasBracket
                ? 'Ya hay un bracket generado. Puedes generar uno nuevo haciendo la tómbola de nuevo.'
                : 'Realiza el sorteo uno por uno para definir los enfrentamientos del bracket.'}
            </p>
            <p className="text-xs text-gray-600 mt-1">{teams.length} jugadores registrados</p>
          </div>
          <button
            onClick={() => setShowTombola(true)}
            disabled={teams.length < 2}
            className="flex-shrink-0 px-4 py-2 bg-[#d4af37] text-[#06091a] font-bold rounded-xl text-sm hover:bg-[#e6c84a] transition-colors disabled:opacity-40"
          >
            {hasBracket ? '🔄 Nuevo sorteo' : '🎱 Iniciar'}
          </button>
        </div>
      </div>

      {/* Reset results */}
      <ActionCard
        title="Resetear Resultados"
        icon="🗑️"
        description="Borra todos los puntajes y goles. Los partidos vuelven a 'Sin jugar'. El bracket y los jugadores se mantienen."
        danger
        confirmActive={resetConfirm}
        onRequest={() => { setResetConfirm(true); setMessage('') }}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setResetConfirm(false)}
        isPending={resetMutation.isPending}
        confirmLabel="Sí, resetear resultados"
      />

      {/* Logout */}
      <div className="mt-8 pt-6 border-t border-[#1e2a4a]">
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full py-3 border border-[#1e2a4a] text-gray-400 rounded-xl text-sm hover:bg-[#1e2a4a] hover:text-white transition-colors"
        >
          🔒 Cerrar sesión de administrador
        </button>
      </div>

      {showTombola && (
        <TombolaModal
          teams={teams}
          onClose={() => { setShowTombola(false); invalidateAll() }}
        />
      )}
    </div>
  )
}

function ActionCard({
  title, icon, description, danger, confirmActive,
  onRequest, onConfirm, onCancel, isPending, confirmLabel,
}: {
  title: string; icon: string; description: string; danger?: boolean
  confirmActive: boolean; onRequest: () => void; onConfirm: () => void
  onCancel: () => void; isPending: boolean; confirmLabel: string
}) {
  return (
    <div className={`bg-[#0d1526] border rounded-2xl p-5 ${danger ? 'border-red-900/40' : 'border-[#1e2a4a]'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span>{icon}</span>
            <h3 className="font-bold">{title}</h3>
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {!confirmActive && (
          <button
            onClick={onRequest}
            className="flex-shrink-0 px-4 py-2 border border-red-800/60 text-red-400 rounded-xl text-sm hover:bg-red-900/20 transition-colors"
          >
            Ejecutar
          </button>
        )}
      </div>
      {confirmActive && (
        <div className="mt-4 pt-4 border-t border-red-900/30 flex gap-3 items-center">
          <p className="flex-1 text-sm text-red-400">Esta acción no se puede deshacer.</p>
          <button onClick={onCancel} className="px-4 py-2 border border-[#1e2a4a] text-gray-400 rounded-xl text-sm hover:bg-[#1e2a4a]">Cancelar</button>
          <button onClick={onConfirm} disabled={isPending} className="px-4 py-2 bg-red-700 text-white font-bold rounded-xl text-sm hover:bg-red-600 disabled:opacity-50">
            {isPending ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      )}
    </div>
  )
}
