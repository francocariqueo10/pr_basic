import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import type { Team } from '../../types'

const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']

function teamColor(team: Team, allTeams: Team[]) {
  if (team.flag_url && team.flag_url.startsWith('#')) return team.flag_url
  return PALETTE[allTeams.findIndex(t => t.id === team.id) % PALETTE.length]
}

function Ball({
  team, allTeams, size = 'md', animate = false, waiting = false,
}: {
  team: Team; allTeams: Team[]; size?: 'sm' | 'md' | 'lg'; animate?: boolean; waiting?: boolean
}) {
  const color = teamColor(team, allTeams)
  const sz = size === 'lg' ? 'w-20 h-20 text-xl' : size === 'sm' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm'
  return (
    <div
      className={`${sz} rounded-full flex flex-col items-center justify-center font-black border-2 flex-shrink-0 select-none
        ${animate ? 'animate-ball-pop' : ''}
        ${waiting ? 'animate-ball-wait' : ''}
      `}
      style={{
        backgroundColor: color + '33',
        color,
        borderColor: color,
        boxShadow: `0 0 16px ${color}55`,
      }}
    >
      <span className="leading-none">{team.code.slice(0, 2)}</span>
      <span className="text-xs font-normal opacity-70 leading-none mt-0.5 truncate max-w-full px-1">
        {team.name.split(' ')[0]}
      </span>
    </div>
  )
}

type Pair = [Team, Team | null]
type Step = 1 | 2 | 3

interface Props {
  teams: Team[]
  onClose: () => void
}

export default function TombolaModal({ teams, onClose }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [remaining, setRemaining] = useState<Team[]>([])
  const [waiting, setWaiting] = useState<Team | null>(null)
  const [pairs, setPairs] = useState<Pair[]>([])
  const [justDrawn, setJustDrawn] = useState<Team | null>(null)
  const [drawing, setDrawing] = useState(false)

  const drawMutation = useMutation({
    mutationFn: (ids: number[]) => api.admin.drawBracket(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      navigate('/bracket')
      onClose()
    },
  })

  const startDraw = () => {
    setRemaining([...teams])
    setWaiting(null)
    setPairs([])
    setJustDrawn(null)
    setStep(2)
  }

  const drawOne = useCallback(() => {
    if (drawing || remaining.length === 0) return
    setDrawing(true)

    const idx = Math.floor(Math.random() * remaining.length)
    const drawn = remaining[idx]
    const newRemaining = remaining.filter((_, i) => i !== idx)

    setJustDrawn(drawn)

    setTimeout(() => {
      setJustDrawn(null)

      let newWaiting: Team | null
      let newPairs: Pair[]

      if (waiting === null) {
        newWaiting = drawn
        newPairs = pairs
      } else {
        newWaiting = null
        newPairs = [...pairs, [waiting, drawn]]
      }

      setWaiting(newWaiting)
      setRemaining(newRemaining)
      setPairs(newPairs)

      if (newRemaining.length === 0) {
        // Odd number: last player gets a bye
        const finalPairs = newWaiting ? [...newPairs, [newWaiting, null] as Pair] : newPairs
        if (newWaiting) {
          setPairs(finalPairs)
          setWaiting(null)
        }
        setTimeout(() => setStep(3), 400)
      }

      setDrawing(false)
    }, 600)
  }, [drawing, remaining, waiting, pairs])

  const allDrawn = step === 2 && remaining.length === 0 && !drawing && !justDrawn

  // Build ordered IDs: pair1_home, pair1_away, pair2_home, pair2_away ...
  // Bye player is sent alone (backend pads to power-of-2)
  const orderedIds = pairs.flatMap(([a, b]) => b ? [a.id, b.id] : [a.id])

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header with steps */}
        <div className="px-6 pt-6 pb-4 border-b border-[#1e2a4a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl">🎱 Tómbola del Torneo</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2 text-xs">
            {[
              { n: 1, label: 'Jugadores' },
              { n: 2, label: 'Sorteo' },
              { n: 3, label: 'Confirmar' },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-6 ${step > i ? 'bg-[#d4af37]' : 'bg-[#1e2a4a]'}`} />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs ${
                    step === n ? 'bg-[#d4af37] text-[#06091a]' : step > n ? 'bg-green-600 text-white' : 'bg-[#1e2a4a] text-gray-500'
                  }`}>
                    {step > n ? '✓' : n}
                  </div>
                  <span className={step === n ? 'text-[#d4af37] font-semibold' : 'text-gray-500'}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">

          {/* ── STEP 1: Jugadores ── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-400">
                Se sortearán los enfrentamientos para <strong className="text-white">{teams.length} jugadores</strong>.
                Cada bola se saca una por una hasta formar todas las parejas.
              </p>
              <div className="flex flex-wrap gap-3 justify-center py-4">
                {teams.map(t => <Ball key={t.id} team={t} allTeams={teams} size="md" />)}
              </div>
              <button
                onClick={startDraw}
                disabled={teams.length < 2}
                className="w-full py-3.5 bg-[#d4af37] text-[#06091a] font-black rounded-xl hover:bg-[#e6c84a] transition-colors disabled:opacity-40 text-base"
              >
                🎱 Iniciar Sorteo
              </button>
            </div>
          )}

          {/* ── STEP 2: Sorteo ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Bowl */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  En el bolillero ({remaining.length})
                </p>
                <div className="min-h-16 bg-[#0a0e1a] rounded-2xl border border-[#1e2a4a] p-4 flex flex-wrap gap-3 justify-center items-center">
                  {remaining.length === 0 ? (
                    <span className="text-gray-600 text-sm italic">Bolillero vacío</span>
                  ) : (
                    remaining.map(t => <Ball key={t.id} team={t} allTeams={teams} size="sm" />)
                  )}
                </div>
              </div>

              {/* Just drawn animation */}
              {justDrawn && (
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-[#d4af37] uppercase tracking-wider font-bold">¡Salió!</p>
                    <Ball team={justDrawn} allTeams={teams} size="lg" animate />
                  </div>
                </div>
              )}

              {/* Waiting */}
              {waiting && !justDrawn && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-yellow-400 uppercase tracking-wider font-bold">Esperando rival...</p>
                  <Ball team={waiting} allTeams={teams} size="lg" waiting />
                </div>
              )}

              {/* Pairs so far */}
              {pairs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Encuentros</p>
                  <div className="space-y-2">
                    {pairs.map(([a, b], i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#0a0e1a] rounded-xl px-4 py-2.5 border border-[#1e2a4a]">
                        <Ball team={a} allTeams={teams} size="sm" />
                        <span className="text-sm font-semibold flex-1">{a.name}</span>
                        <span className="text-gray-600 font-bold text-xs">vs</span>
                        {b ? (
                          <>
                            <span className="text-sm font-semibold flex-1 text-right">{b.name}</span>
                            <Ball team={b} allTeams={teams} size="sm" />
                          </>
                        ) : (
                          <span className="text-gray-600 text-sm italic flex-1 text-right">BYE</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draw button */}
              {!allDrawn && (
                <button
                  onClick={drawOne}
                  disabled={drawing || remaining.length === 0}
                  className="w-full py-4 bg-[#d4af37] text-[#06091a] font-black rounded-xl hover:bg-[#e6c84a] transition-colors disabled:opacity-50 text-lg"
                >
                  {drawing ? '...' : '🎱 Sacar bola'}
                </button>
              )}
            </div>
          )}

          {/* ── STEP 3: Confirmar ── */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-400">
                Revisa los enfrentamientos antes de generar las llaves.
              </p>
              <div className="space-y-2">
                {pairs.map(([a, b], i) => {
                  const colorA = teamColor(a, teams)
                  const colorB = b ? teamColor(b, teams) : '#666'
                  return (
                    <div key={i} className="flex items-center gap-3 bg-[#0a0e1a] rounded-xl px-4 py-3 border border-[#1e2a4a]">
                      <span className="text-gray-500 text-xs font-mono w-4">{i + 1}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ backgroundColor: colorA + '33', color: colorA, border: `1px solid ${colorA}66` }}>
                          {a.code.slice(0, 2)}
                        </div>
                        <span className="font-semibold text-sm">{a.name}</span>
                      </div>
                      <span className="text-gray-600 font-bold text-xs">vs</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {b ? (
                          <>
                            <span className="font-semibold text-sm">{b.name}</span>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ backgroundColor: colorB + '33', color: colorB, border: `1px solid ${colorB}66` }}>
                              {b.code.slice(0, 2)}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-600 text-sm italic">BYE (pasa directo)</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep(2); setRemaining([...teams]); setWaiting(null); setPairs([]); setJustDrawn(null) }}
                  className="px-4 py-3 border border-[#1e2a4a] text-gray-400 rounded-xl text-sm hover:bg-[#1e2a4a] transition-colors"
                >
                  🔄 Volver a sortear
                </button>
                <button
                  onClick={() => drawMutation.mutate(orderedIds)}
                  disabled={drawMutation.isPending}
                  className="flex-1 py-3 bg-[#d4af37] text-[#06091a] font-black rounded-xl hover:bg-[#e6c84a] transition-colors disabled:opacity-50 text-sm"
                >
                  {drawMutation.isPending ? 'Generando...' : '🏆 Generar Llaves'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
