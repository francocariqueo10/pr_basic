import { useState, useMemo, useEffect } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Spinner from '../components/ui/Spinner'
import ScoreModal from '../components/match/ScoreModal'
import EditRivalsModal from '../components/match/EditRivalsModal'
import type { Match, TeamSimple } from '../types'
import { api } from '../api'
import { useAdminStore } from '../store/adminStore'

const TEAM_COLORS: Record<string, string> = {
  JAI: '#e74c3c', ERI: '#3498db', KIK: '#2ecc71',
  EST: '#f39c12', FRA: '#9b59b6',
}

const STAGE_LABELS: Record<string, string> = {
  final: 'FINAL', sf: 'Semifinal', qf: 'Cuartos de Final',
}

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage.replace('ko_r', 'Ronda ')
}

// Tie = two legs grouped
interface Tie {
  round: number; slot: number; stage: string
  leg1: Match | null; leg2: Match | null
  teamA: TeamSimple | null; teamB: TeamSimple | null
  goalsA: number | null; goalsB: number | null
  winner: TeamSimple | null; needsPenalties: boolean; bothComplete: boolean
}

function buildTies(matches: Match[]): Tie[] {
  const map = new Map<string, Tie>()
  for (const m of matches) {
    if (m.bracket_round === null || m.bracket_slot === null) continue
    const key = `${m.bracket_round}-${m.bracket_slot}`
    if (!map.has(key)) {
      map.set(key, {
        round: m.bracket_round, slot: m.bracket_slot, stage: m.stage,
        leg1: null, leg2: null, teamA: null, teamB: null,
        goalsA: null, goalsB: null, winner: null, needsPenalties: false, bothComplete: false,
      })
    }
    const tie = map.get(key)!
    if ((m.leg ?? 1) === 1) tie.leg1 = m; else tie.leg2 = m
  }
  for (const tie of map.values()) {
    const l1 = tie.leg1; const l2 = tie.leg2
    tie.teamA = l1?.home_team ?? null
    tie.teamB = l1?.away_team ?? null
    const l1done = l1?.status === 'completed' && l1.home_score !== null
    const l2done = l2?.status === 'completed' && l2?.home_score !== null
    tie.bothComplete = !!(l1done && l2done)
    if (l1done && l2done && l1 && l2) {
      tie.goalsA = (l1.home_score ?? 0) + (l2.away_score ?? 0)
      tie.goalsB = (l1.away_score ?? 0) + (l2.home_score ?? 0)
      if (tie.goalsA > tie.goalsB) tie.winner = tie.teamA
      else if (tie.goalsB > tie.goalsA) tie.winner = tie.teamB
      else if (l2.winner_id) tie.winner = l2.winner_id === tie.teamA?.id ? tie.teamA : tie.teamB
      else tie.needsPenalties = true
    } else if (l1done && !l2 && l1) {
      tie.goalsA = l1.home_score; tie.goalsB = l1.away_score
      if (l1.winner_id) tie.winner = l1.winner_id === tie.teamA?.id ? tie.teamA : tie.teamB
    }
  }
  return [...map.values()].sort((a, b) => a.round - b.round || a.slot - b.slot)
}

function fewestGoalsWinners(ties: Tie[], round: number) {
  const roundTies = ties.filter(t => t.round === round && t.bothComplete && t.winner)
  const received: Record<number, { team: TeamSimple; goals: number }> = {}
  for (const tie of roundTies) {
    if (!tie.winner || !tie.teamA) continue
    const isA = tie.winner.id === tie.teamA.id
    const goals = isA
      ? (tie.leg1?.away_score ?? 0) + (tie.leg2?.home_score ?? 0)
      : (tie.leg1?.home_score ?? 0) + (tie.leg2?.away_score ?? 0)
    received[tie.winner.id] = { team: tie.winner, goals }
  }
  const all = Object.values(received)
  if (!all.length) return []
  const min = Math.min(...all.map(x => x.goals))
  return all.filter(x => x.goals === min)
}

const CONFETTI_COLORS = ['#d4af37','#f0c030','#ffffff','#e74c3c','#3498db','#2ecc71','#f39c12']

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left: `${(i / 60) * 100}%`,
      delay: `${(i * 0.06) % 2}s`,
      duration: `${2.5 + (i % 5) * 0.3}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: `${5 + (i % 4) * 3}px`,
      borderRadius: i % 3 === 0 ? '0%' : i % 3 === 1 ? '2px' : '50%',
    })), [])
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <div key={i} className="absolute top-0 animate-confetti-fall"
          style={{ left: p.left, width: p.size, height: p.size,
            backgroundColor: p.color, borderRadius: p.borderRadius,
            animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
    </div>
  )
}

function TeamBadge({ team, isWinner }: { team: TeamSimple | null; isWinner: boolean }) {
  if (!team) return <span className="text-sm text-gray-600 italic">Por definir</span>
  const color = TEAM_COLORS[team.code] ?? '#888'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}>
        {team.code.slice(0, 2)}
      </div>
      <span className={`text-sm font-semibold truncate ${isWinner ? 'text-[#d4af37]' : 'text-white'}`}>
        {team.name}
      </span>
    </div>
  )
}

function TieCard({ tie, isAdmin, onScoreLeg1, onScoreLeg2, onEditRivals }: {
  tie: Tie; isAdmin: boolean
  onScoreLeg1: () => void; onScoreLeg2: () => void; onEditRivals: () => void
}) {
  const { leg1, leg2, teamA, teamB, goalsA, goalsB, winner, needsPenalties, bothComplete } = tie
  const hasTeams = !!(teamA && teamB)
  const leg1done = leg1?.status === 'completed'
  const leg2done = leg2?.status === 'completed'

  return (
    <div className={`bg-[#0a0e1a] border rounded-xl p-3 w-64 flex-shrink-0 transition-all ${
      winner ? 'border-green-900/40' : needsPenalties ? 'border-yellow-800/40' : 'border-[#1e2a4a]'
    }`}>
      {/* Teams + aggregate */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between gap-2">
          <TeamBadge team={teamA} isWinner={winner?.id === teamA?.id} />
          {bothComplete && goalsA !== null && <span className="font-black text-base text-white flex-shrink-0">{goalsA}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <TeamBadge team={teamB} isWinner={winner?.id === teamB?.id} />
          {bothComplete && goalsB !== null && <span className="font-black text-base text-white flex-shrink-0">{goalsB}</span>}
        </div>
      </div>

      <div className="border-t border-[#1e2a4a] my-2" />

      {/* Legs */}
      <div className="space-y-1">
        <div onClick={() => hasTeams && onScoreLeg1()}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${hasTeams ? 'cursor-pointer hover:bg-[#1e2a4a]/60' : ''} ${leg1done ? 'bg-[#1e2a4a]/30' : ''}`}>
          <span className="text-gray-500 font-semibold w-12 flex-shrink-0">Ida</span>
          {leg1done && leg1 ? (
            <span className="text-gray-300 font-mono">{leg1.home_score} – {leg1.away_score}</span>
          ) : (
            <span className="text-gray-700">{hasTeams ? 'Tocar para anotar' : 'Pendiente'}</span>
          )}
          {leg1done && <span className="text-green-600 ml-1">✓</span>}
        </div>
        <div onClick={() => hasTeams && leg1done && onScoreLeg2()}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${hasTeams && leg1done ? 'cursor-pointer hover:bg-[#1e2a4a]/60' : ''} ${leg2done ? 'bg-[#1e2a4a]/30' : ''}`}>
          <span className="text-gray-500 font-semibold w-12 flex-shrink-0">Vuelta</span>
          {leg2done && leg2 ? (
            <span className="text-gray-300 font-mono">{leg2.home_score} – {leg2.away_score}</span>
          ) : (
            <span className="text-gray-700">{!hasTeams ? 'Pendiente' : !leg1done ? 'Jugar ida primero' : 'Tocar para anotar'}</span>
          )}
          {leg2done && <span className="text-green-600 ml-1">✓</span>}
        </div>
      </div>

      <div className="mt-2 text-center text-xs">
        {winner ? <span className="text-green-500 font-semibold">✓ {winner.name} avanza</span>
          : needsPenalties ? <span className="text-yellow-500">Empate global — penales en vuelta</span>
          : !hasTeams ? <span className="text-gray-700">Por definir</span>
          : null}
      </div>

      {isAdmin && (
        <button onClick={onEditRivals}
          className="mt-2 w-full py-1 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-[#1e2a4a] transition-colors">
          ✎ Editar rivales
        </button>
      )}
    </div>
  )
}

export default function BracketPage() {
  const { data: groups, isLoading: loadingGroups } = useGroups()
  const { data: matches, isLoading: loadingMatches } = useMatches()
  const queryClient = useQueryClient()
  const isAdmin = useAdminStore(s => s.isAuthenticated)

  const [scoringMatch, setScoringMatch] = useState<Match | null>(null)
  const [editingTie, setEditingTie] = useState<Tie | null>(null)
  const [assigning, setAssigning] = useState(false)

  const mode = groups?.[0]?.mode
  const bracketMatches = useMemo(() => (matches ?? []).filter(m => m.bracket_round !== null), [matches])
  const ties = useMemo(() => buildTies(bracketMatches), [bracketMatches])
  const rounds = useMemo(() => {
    const rMap = new Map<number, Tie[]>()
    for (const t of ties) {
      if (!rMap.has(t.round)) rMap.set(t.round, [])
      rMap.get(t.round)!.push(t)
    }
    return [...rMap.entries()].sort((a, b) => a[0] - b[0])
  }, [ties])

  const { data: teamsData } = useQuery({ queryKey: ['teams'], queryFn: () => api.teams.getAll() })
  const allTeams = teamsData ?? []
  const finalTie = ties.find(t => t.stage === 'final')
  const champion = finalTie?.winner ?? null

  const [showConfetti, setShowConfetti] = useState(false)
  useEffect(() => { if (champion) setShowConfetti(true) }, [champion?.id])

  const isLoading = loadingGroups || loadingMatches
  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  if (mode !== 'knockout') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-black">Bracket no activo</h2>
        <p className="text-gray-400">Ve a Admin → Torneo para sortear las llaves.</p>
      </div>
    )
  }
  if (ties.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-black">Sin bracket generado</h2>
        <p className="text-gray-400">Ve a Admin → Torneo y haz clic en <strong>Generar Partidos</strong>.</p>
      </div>
    )
  }

  const completedBracket = bracketMatches.filter(m => m.status === 'completed').length
  const totalReal = bracketMatches.filter(m => m.home_team && m.away_team).length

  async function handleAssignFewestGoals(roundNum: number) {
    setAssigning(true)
    try {
      await api.admin.assignFewestGoals(roundNum)
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error'
      alert(msg)
    } finally { setAssigning(false) }
  }

  return (
    <div className="space-y-8">
      {showConfetti && <Confetti />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Bracket de Eliminación</h1>
          <p className="text-sm text-gray-400 mt-1">Ida y vuelta — ganador por marcador global</p>
        </div>
        <span className="text-sm text-gray-500">{completedBracket}/{totalReal} partidos jugados</span>
      </div>

      {champion && (
        <div className="animate-champion-pop bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/20 to-[#d4af37]/10 border border-[#d4af37]/40 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mb-1">CAMPEÓN</div>
          <div className="text-3xl font-black">{champion.name}</div>
          {champion.fifa_team && <div className="text-[#d4af37]/60 text-sm mt-2">{champion.fifa_team}</div>}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-10 min-w-max items-start">
          {rounds.map(([roundNum, roundTies]) => {
            const stageName = roundTies[0]?.stage ?? ''
            const fewest = fewestGoalsWinners(ties, roundNum)
            const allRoundDone = roundTies.every(t => t.bothComplete)
            const nextRound = roundNum + 1
            const nextTies = rounds.find(([r]) => r === nextRound)?.[1] ?? []
            const nextHasOpen = nextTies.some(t => t.teamA && !t.teamB)

            return (
              <div key={roundNum} className="flex flex-col gap-2">
                <div className="text-center mb-2">
                  <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">
                    {stageLabel(stageName)}
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  {roundTies.map(tie => (
                    <TieCard key={`${tie.round}-${tie.slot}`} tie={tie} isAdmin={isAdmin}
                      onScoreLeg1={() => tie.leg1 && setScoringMatch(tie.leg1)}
                      onScoreLeg2={() => tie.leg2 && setScoringMatch(tie.leg2)}
                      onEditRivals={() => setEditingTie(tie)} />
                  ))}
                </div>
                {allRoundDone && fewest.length > 0 && (
                  <div className="mt-2 bg-[#0d1526] border border-[#1e2a4a] rounded-xl px-3 py-2.5 w-64">
                    <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Menos goles recibidos</p>
                    {fewest.map(f => (
                      <div key={f.team.id} className="text-xs font-semibold text-[#d4af37]">
                        🛡 {f.team.name} ({f.goals} gol{f.goals !== 1 ? 'es' : ''})
                      </div>
                    ))}
                    {isAdmin && nextHasOpen && (
                      <button onClick={() => handleAssignFewestGoals(nextRound)} disabled={assigning}
                        className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-[#d4af37] text-[#06091a] hover:brightness-110 transition-all disabled:opacity-50">
                        {assigning ? '...' : '⚡ Asignar como rival (menos goles)'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {scoringMatch && <ScoreModal match={scoringMatch} onClose={() => setScoringMatch(null)} />}
      {editingTie?.leg1 && (
        <EditRivalsModal match={editingTie.leg1} teams={allTeams} onClose={() => setEditingTie(null)} />
      )}
    </div>
  )
}
