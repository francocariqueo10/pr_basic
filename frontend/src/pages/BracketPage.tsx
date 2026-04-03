import { useState } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import Spinner from '../components/ui/Spinner'
import ScoreModal from '../components/match/ScoreModal'
import type { Match, TeamSimple } from '../types'

const TEAM_COLORS: Record<string, string> = {
  JAI: '#e74c3c',
  ERI: '#3498db',
  KIK: '#2ecc71',
  EST: '#f39c12',
  FRA: '#9b59b6',
}

const STAGE_LABELS: Record<string, string> = {
  final: 'Final',
  sf: 'Semifinal',
  qf: 'Cuartos de Final',
}

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage.replace('ko_r', 'Ronda ')
}

function TeamSlot({ team, isWinner }: { team: TeamSimple | null; isWinner: boolean }) {
  const color = team ? (TEAM_COLORS[team.code] ?? '#888') : '#374151'
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isWinner ? 'bg-white/8 border border-ucl-blue/50' : 'bg-ucl-black border border-white/8'
      }`}
    >
      {team ? (
        <>
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
          >
            {team.code.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-semibold ${isWinner ? 'text-white font-black' : 'text-white'} truncate`}>
              {team.name}
            </div>
            {team.fifa_team && (
              <div className="text-xs text-gray-500 truncate">{team.fifa_team}</div>
            )}
          </div>
          {isWinner && <span className="ml-auto text-ucl-blue text-xs flex-shrink-0">★</span>}
        </>
      ) : (
        <span className="text-sm text-gray-600 italic">Por definir</span>
      )}
    </div>
  )
}

function BracketMatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const homeWin = match.status === 'completed' && match.winner_id === match.home_team?.id
  const awayWin = match.status === 'completed' && match.winner_id === match.away_team?.id
  const hasBothTeams = match.home_team && match.away_team
  const canEdit = hasBothTeams

  return (
    <div
      className={`bg-ucl-navy border rounded-xl p-3 w-56 flex-shrink-0 transition-all ${
        canEdit
          ? 'cursor-pointer hover:border-ucl-blue/50 hover:bg-white/3'
          : 'border-white/8'
      } ${match.status === 'completed' ? 'border-green-900/40' : 'border-white/8'}`}
      onClick={() => canEdit && onClick()}
    >
      <div className="space-y-1.5">
        <div className="relative">
          <TeamSlot team={match.home_team} isWinner={homeWin} />
          {match.status === 'completed' && match.home_score !== null && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-black text-base text-white">
              {match.home_score}
            </span>
          )}
        </div>
        <div className="relative">
          <TeamSlot team={match.away_team} isWinner={awayWin} />
          {match.status === 'completed' && match.away_score !== null && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-black text-base text-white">
              {match.away_score}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center flex items-center justify-center gap-2">
        {match.status === 'completed' ? (
          <span className="text-xs text-green-500 font-medium">✓ Finalizado</span>
        ) : hasBothTeams ? (
          <span className="text-xs text-ucl-silver">Toca para anotar resultado</span>
        ) : (
          <span className="text-xs text-ucl-silver/40">Pendiente</span>
        )}
      </div>
    </div>
  )
}

export default function BracketPage() {
  const { data: groups, isLoading: loadingGroups } = useGroups()
  const { data: matches, isLoading: loadingMatches } = useMatches()
  const [editMatch, setEditMatch] = useState<Match | null>(null)

  const mode = groups?.[0]?.mode

  const bracketMatches = (matches ?? []).filter(m => m.bracket_round !== null)

  // Group by bracket_round
  const rounds = new Map<number, Match[]>()
  for (const m of bracketMatches) {
    if (m.bracket_round === null) continue
    if (!rounds.has(m.bracket_round)) rounds.set(m.bracket_round, [])
    rounds.get(m.bracket_round)!.push(m)
  }

  const sortedRounds = [...rounds.entries()].sort((a, b) => a[0] - b[0])

  const isLoading = loadingGroups || loadingMatches

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  if (mode !== 'knockout') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-black">Bracket no activo</h2>
        <p className="text-gray-400">
          El torneo está en modo liga. Ve a Admin → Torneo para cambiar al modo de eliminación directa.
        </p>
      </div>
    )
  }

  if (sortedRounds.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-black">Sin bracket generado</h2>
        <p className="text-gray-400">
          Ve a Admin → Torneo y haz clic en <strong>Generar Partidos</strong> para sortear las llaves.
        </p>
      </div>
    )
  }

  const finalRound = sortedRounds[sortedRounds.length - 1]
  const finalMatch = finalRound?.[1][0]
  const champion = finalMatch?.status === 'completed'
    ? (finalMatch.winner_id === finalMatch.home_team?.id ? finalMatch.home_team : finalMatch.away_team)
    : null

  const totalPlayed = bracketMatches.filter(m => m.status === 'completed').length
  const totalReal = bracketMatches.filter(m => m.home_team && m.away_team).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide">Bracket de Eliminación</h1>
          <p className="text-sm text-ucl-silver mt-1">Toca un partido para registrar el resultado</p>
        </div>
        <span className="text-sm text-ucl-silver">{totalPlayed}/{totalReal} jugados</span>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="bg-gradient-to-r from-ucl-blue/20 via-ucl-blue/30 to-ucl-blue/20 border border-ucl-blue/40 rounded-2xl p-6 text-center">
          <div className="text-sm text-ucl-blue uppercase tracking-widest font-semibold mb-1">CAMPEÓN</div>
          <div className="text-white font-black text-3xl uppercase">{champion.name}</div>
          {champion.fifa_team && <div className="text-ucl-silver text-sm mt-1">{champion.fifa_team}</div>}
        </div>
      )}

      {/* Bracket columns */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-10 min-w-max items-start">
          {sortedRounds.map(([roundNum, roundMatches]) => {
            const stageName = roundMatches[0]?.stage ?? ''
            const visibleMatches = roundMatches
              .filter(m => m.home_team !== null || m.away_team !== null)
              .sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))

            if (visibleMatches.length === 0) return null

            return (
              <div key={roundNum} className="flex flex-col">
                {/* Round label */}
                <div className="text-center mb-4">
                  <span className="text-xs font-bold text-ucl-blue uppercase tracking-widest">
                    {stageLabel(stageName)}
                  </span>
                </div>

                {/* Matches */}
                <div className="flex flex-col gap-6">
                  {visibleMatches.map(m => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      onClick={() => setEditMatch(m)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Score modal */}
      {editMatch && (
        <ScoreModal
          match={editMatch}
          onClose={() => setEditMatch(null)}
        />
      )}
    </div>
  )
}
