import { useState, useEffect } from 'react'
import type { Match } from '../../types'
import { useUpdateMatch } from '../../hooks/useUpdateMatch'

interface Props {
  match: Match
  onClose: () => void
}

export default function ScoreModal({ match, onClose }: Props) {
  const [home, setHome] = useState(match.home_score ?? 0)
  const [away, setAway] = useState(match.away_score ?? 0)
  const { mutate, isPending } = useUpdateMatch()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = () => {
    mutate(
      { id: match.id, home_score: home, away_score: away, status: 'completed' },
      { onSuccess: onClose }
    )
  }

  const handleReset = () => {
    mutate(
      { id: match.id, home_score: 0, away_score: 0, status: 'scheduled' },
      { onSuccess: onClose }
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-center text-sm text-gray-400 mb-6 uppercase tracking-widest">
          Registrar Resultado
        </h2>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-mono">
              {match.home_team?.code}
            </div>
            <div className="text-lg font-bold mb-3">{match.home_team?.name ?? 'TBD'}</div>
            <ScoreInput value={home} onChange={setHome} />
          </div>

          <div className="text-2xl text-gray-600 font-bold flex-shrink-0">–</div>

          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-mono">
              {match.away_team?.code}
            </div>
            <div className="text-lg font-bold mb-3">{match.away_team?.name ?? 'TBD'}</div>
            <ScoreInput value={away} onChange={setAway} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#1e2a4a] text-gray-400 hover:bg-[#1e2a4a] transition-colors text-sm"
          >
            Cancelar
          </button>
          {match.status === 'completed' && (
            <button
              onClick={handleReset}
              disabled={isPending}
              className="px-4 py-2.5 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors text-sm"
            >
              Resetear
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#d4af37] text-[#06091a] font-bold hover:bg-[#e6c84a] transition-colors text-sm disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a6a] text-white font-bold transition-colors"
      >
        −
      </button>
      <span className="w-10 text-center text-3xl font-bold text-[#d4af37]">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a6a] text-white font-bold transition-colors"
      >
        +
      </button>
    </div>
  )
}
