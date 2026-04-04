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

  // Init states from DB on first load
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

    // Rolling animation
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
    return <div className="text-center text-ucl-silver py-10">Cargando...</div>
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wide">Sorteo de Equipos</h2>
          <p className="text-ucl-silver text-sm mt-1">
            Cada jugador sortea su equipo antes de comenzar el torneo.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="text-xs text-ucl-silver/40 hover:text-red-400 transition-colors whitespace-nowrap mt-1"
        >
          Reiniciar todo
        </button>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-ucl-silver mb-2">
          <span className="ucl-label">Progreso</span>
          <span>{lockedCount} / {players.length} asignados</span>
        </div>
        <div className="bg-white/8 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-ucl-blue rounded-full transition-all duration-500"
            style={{ width: `${players.length > 0 ? (lockedCount / players.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Available pool */}
      <div className="bg-ucl-navy border border-white/8 rounded-xl p-4">
        <p className="ucl-label mb-3">Equipos disponibles ({available.length})</p>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="text-xs text-ucl-silver/40">Todos los equipos han sido asignados</span>
          ) : (
            available.map(t => (
              <span key={t} className="text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
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
              className={`border rounded-xl p-4 transition-all duration-300 ${
                isLocked
                  ? 'border-ucl-blue/40 bg-ucl-blue/5'
                  : isRevealed
                  ? 'border-white/20 bg-white/5'
                  : 'border-white/8 bg-ucl-navy'
              }`}
            >
              {/* Player row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: p.color + '22', color: p.color, border: `1px solid ${p.color}33` }}
                >
                  {p.code.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  {isLocked && (
                    <div className="text-xs text-ucl-blue mt-0.5 font-semibold">✓ Confirmado</div>
                  )}
                </div>
              </div>

              {/* Team slot */}
              <div
                className={`rounded-lg px-3 py-2.5 mb-3 min-h-[42px] flex items-center transition-all ${
                  isDrawing
                    ? 'bg-ucl-blue/10 border border-ucl-blue/30'
                    : displayTeam
                    ? 'bg-white/8 border border-white/10'
                    : 'bg-white/4 border border-white/8'
                }`}
              >
                {isDrawing ? (
                  <span className="text-sm font-black text-ucl-blue/90 tabular-nums truncate">
                    {rolling[p.id] ?? '···'}
                  </span>
                ) : displayTeam ? (
                  <span className={`text-sm font-bold truncate ${isLocked ? 'text-white' : 'text-white'}`}>
                    {displayTeam}
                  </span>
                ) : (
                  <span className="text-sm text-ucl-silver/40">Sin equipo</span>
                )}
              </div>

              {/* Actions */}
              {state === 'idle' && (
                <button
                  onClick={() => drawTeam(p.id)}
                  disabled={available.length === 0}
                  className="w-full py-2 rounded-lg text-sm font-bold bg-ucl-blue text-white hover:bg-ucl-blue-l transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Sortear equipo
                </button>
              )}

              {state === 'drawing' && (
                <div className="w-full py-2 rounded-lg text-sm font-semibold text-center text-ucl-blue/60 bg-ucl-blue/8 border border-ucl-blue/20 select-none">
                  Sorteando···
                </div>
              )}

              {state === 'revealed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptTeam(p.id)}
                    className="flex-1 py-2 rounded-lg text-sm font-bold bg-white text-ucl-black hover:brightness-95 transition-all"
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    onClick={() => redrawTeam(p.id)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border border-white/20 text-white hover:bg-white/8 transition-colors"
                  >
                    ↺ Volver a tirar
                  </button>
                </div>
              )}

              {state === 'locked' && (
                <button
                  onClick={() => redrawTeam(p.id)}
                  className="w-full py-1.5 rounded-lg text-xs text-ucl-silver/40 hover:text-ucl-silver hover:bg-white/5 transition-colors"
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
        <div className="border border-ucl-blue/40 bg-ucl-blue/5 rounded-xl p-6 text-center space-y-3">
          <div className="text-ucl-blue text-xl font-black">✦ Todos los equipos asignados</div>
          <p className="text-ucl-silver text-sm">
            Ve a la pestaña <strong className="text-white">Torneo</strong> para iniciar el sorteo de llaves.
          </p>
        </div>
      )}
    </div>
  )
}
