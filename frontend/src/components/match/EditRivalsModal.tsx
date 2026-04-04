import { useState, useEffect } from 'react'
import type { Match, TeamSimple } from '../../types'
import { useUpdateMatch } from '../../hooks/useUpdateMatch'

interface Props {
  match: Match       // leg-1 of the tie to edit
  teams: TeamSimple[]
  onClose: () => void
}

export default function EditRivalsModal({ match, teams, onClose }: Props) {
  const [homeId, setHomeId] = useState<number | ''>(match.home_team?.id ?? '')
  const [awayId, setAwayId] = useState<number | ''>(match.away_team?.id ?? '')
  const { mutate, isPending } = useUpdateMatch()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = () => {
    mutate(
      {
        id: match.id,
        home_team_id: homeId === '' ? undefined : (homeId as number),
        away_team_id: awayId === '' ? undefined : (awayId as number),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-center text-sm text-gray-400 mb-1 uppercase tracking-widest">
          Editar Rivales
        </h2>
        <p className="text-center text-xs text-gray-600 mb-6">
          Los cambios también se aplican al partido de vuelta
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Local (Ida)
            </label>
            <select
              value={homeId}
              onChange={e => setHomeId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#1e2a4a] border border-[#1e2a4a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">— Sin asignar —</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Visitante (Ida)
            </label>
            <select
              value={awayId}
              onChange={e => setAwayId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#1e2a4a] border border-[#1e2a4a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">— Sin asignar —</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#1e2a4a] text-gray-400 hover:bg-[#1e2a4a] transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#d4af37] text-[#06091a] font-bold hover:brightness-110 transition-all text-sm disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
