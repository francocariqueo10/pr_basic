import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { TeamPoolPlayer } from '../../api'

const OFFICIAL_TEAMS = [
  'Real Madrid', 'Manchester City', 'FC Barcelona', 'Liverpool',
  'Paris Saint-Germain', 'Bayern de Múnich', 'Arsenal',
  'Atlético de Madrid', 'Borussia Dortmund', 'Newcastle United',
]

type DrawState = 'idle' | 'drawing' | 'revealed' | 'locked'

export default function TeamDrawTab() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['team-pool'],
    queryFn: () => api.admin.getTeamPool(),
  })

  const [states, setStates] = useState<Record<number, DrawState>>({})
  const [rolling, setRolling] = useState<Record<number, string>>({})
  const intervals = useRef<Record<number, ReturnType<typeof setInterval>>>({})
  const initialized = useRef(false)

  useEffect(() => {
    if (!data || initialized.current) return
    const init: Record<number, DrawState> = {}
    for (const p of data.players) {
      init[p.id] = p.fifa_team ? 'locked' : 'idle'
    }
    setStates(init)
    initialized.current = true
  }, [data])

  const players: TeamPoolPlayer[] = data?.players ?? []
  const available: string[] = data?.available ?? []

  function getState(id: number): DrawState {
    return states[id] ?? 'idle'
  }

  const lockedCount = players.filter(p => getState(p.id) === 'locked').length
  const allAssigned = players.length > 0 && lockedCount === players.length

  async function drawTeam(playerId: number) {
    setStates(prev => ({ ...prev, [playerId]: 'drawing' }))

    intervals.current[playerId] = setInterval(() => {
      setRolling(prev => ({
        ...prev,
        [playerId]: OFFICIAL_TEAMS[Math.floor(Math.random() * OFFICIAL_TEAMS.length)],
      }))
    }, 70)

    try {
      const result = await api.admin.drawTeam(playerId)
      setTimeout(() => {
        clearInterval(intervals.current[playerId])
        setRolling(prev => ({ ...prev, [playerId]: result.fifa_team }))
        setStates(prev => ({ ...prev, [playerId]: 'revealed' }))
        queryClient.invalidateQueries({ queryKey: ['team-pool'] })
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      }, 1400)
    } catch {
      clearInterval(intervals.current[playerId])
      setStates(prev => ({ ...prev, [playerId]: 'idle' }))
    }
  }

  async function redrawTeam(playerId: number) {
    await api.admin.clearTeam(playerId)
    queryClient.invalidateQueries({ queryKey: ['team-pool'] })
    drawTeam(playerId)
  }

  function acceptTeam(playerId: number) {
    setStates(prev => ({ ...prev, [playerId]: 'locked' }))
  }

  async function resetAll() {
    await api.admin.resetTeamPool()
    initialized.current = false
    setStates({})
    setRolling({})
    queryClient.invalidateQueries({ queryKey: ['team-pool'] })
    queryClient.invalidateQueries({ queryKey: ['teams'] })
  }

  if (isLoading) {
    return <div className="text-center text-gray-400 py-10">Cargando...</div>
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Sorteo de Equipos</h2>
          <p className="text-gray-400 text-sm mt-1">
            Cada jugador sortea su club oficial antes de comenzar el torneo.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors whitespace-nowrap mt-1"
        >
          Reiniciar todo
        </button>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Progreso</span>
          <span>{lockedCount} / {players.length} asignados</span>
        </div>
        <div className="bg-[#1e2a4a] rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0c030] rounded-full transition-all duration-500"
            style={{ width: `${players.length > 0 ? (lockedCount / players.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Available pool */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Equipos disponibles ({available.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="text-xs text-gray-600">Todos los equipos han sido asignados</span>
          ) : (
            available.map(t => (
              <span key={t} className="text-xs font-semibold text-gray-300 bg-[#1e2a4a] border border-[#1e2a4a] px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Player cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {players.map(p => {
          const state = getState(p.id)
          const isDrawing = state === 'drawing'
          const isRevealed = state === 'revealed'
          const isLocked = state === 'locked'
          const displayTeam = (isDrawing || isRevealed)
            ? (rolling[p.id] ?? '···')
            : p.fifa_team

          return (
            <div
              key={p.id}
              className={`border rounded-2xl p-4 transition-all duration-300 ${
                isLocked
                  ? 'border-[#d4af37]/40 bg-[#d4af37]/5'
                  : isRevealed
                  ? 'border-[#1e2a4a] bg-[#1e2a4a]/40'
                  : 'border-[#1e2a4a] bg-[#0d1526]'
              }`}
            >
              {/* Player row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: p.color + '22', color: p.color, border: `1px solid ${p.color}44` }}
                >
                  {p.code.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  {isLocked && (
                    <div className="text-xs text-[#d4af37] mt-0.5 font-semibold">✓ Confirmado</div>
                  )}
                </div>
              </div>

              {/* Team slot */}
              <div
                className={`rounded-xl px-3 py-2.5 mb-3 min-h-[42px] flex items-center transition-all ${
                  isDrawing
                    ? 'bg-[#d4af37]/10 border border-[#d4af37]/30'
                    : displayTeam
                    ? 'bg-[#1e2a4a] border border-[#1e2a4a]'
                    : 'bg-[#0a0e1a] border border-[#1e2a4a]'
                }`}
              >
                {isDrawing ? (
                  <span className="text-sm font-black text-[#d4af37] tabular-nums truncate animate-pulse">
                    {rolling[p.id] ?? '···'}
                  </span>
                ) : displayTeam ? (
                  <span className="text-sm font-bold text-white truncate">{displayTeam}</span>
                ) : (
                  <span className="text-sm text-gray-600">Sin equipo</span>
                )}
              </div>

              {/* Actions */}
              {state === 'idle' && (
                <button
                  onClick={() => drawTeam(p.id)}
                  disabled={available.length === 0}
                  className="w-full py-2 rounded-xl text-sm font-bold bg-[#d4af37] text-[#06091a] hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Sortear equipo
                </button>
              )}

              {state === 'drawing' && (
                <div className="w-full py-2 rounded-xl text-sm font-semibold text-center text-[#d4af37]/60 bg-[#d4af37]/5 border border-[#d4af37]/20 select-none">
                  Sorteando···
                </div>
              )}

              {state === 'revealed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptTeam(p.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold bg-[#d4af37] text-[#06091a] hover:brightness-110 transition-all"
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    onClick={() => redrawTeam(p.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border border-[#1e2a4a] text-gray-300 hover:bg-[#1e2a4a] transition-colors"
                  >
                    ↺ Volver a tirar
                  </button>
                </div>
              )}

              {state === 'locked' && (
                <button
                  onClick={() => redrawTeam(p.id)}
                  className="w-full py-1.5 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-[#1e2a4a] transition-colors"
                >
                  Cambiar equipo
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* All assigned CTA */}
      {allAssigned && (
        <div className="border border-[#d4af37]/40 bg-[#d4af37]/5 rounded-2xl p-6 text-center space-y-3">
          <div className="text-[#d4af37] text-lg font-black">🏆 Todos los equipos asignados</div>
          <p className="text-gray-400 text-sm">
            Ve a la pestaña <strong className="text-white">Torneo</strong> para iniciar el sorteo de llaves.
          </p>
        </div>
      )}
    </div>
  )
}
