import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import Spinner from '../components/ui/Spinner'
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
        isWinner ? 'bg-[#d4af37]/10 border border-[#d4af37]/40' : 'bg-[#0d1526] border border-[#1e2a4a]'
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
          <span className={`text-sm font-semibold ${isWinner ? 'text-[#d4af37]' : 'text-white'}`}>
            {team.name}
          </span>
          {isWinner && <span className="ml-auto text-[#d4af37] text-xs">★</span>}
        </>
      ) : (
        <span className="text-sm text-gray-600 italic">Por definir</span>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const homeWin = match.status === 'completed' && match.winner_id === match.home_team?.id
  const awayWin = match.status === 'completed' && match.winner_id === match.away_team?.id

  return (
    <div className="bg-[#0a0e1a] border border-[#1e2a4a] rounded-xl p-3 w-52 flex-shrink-0">
      <div className="space-y-1.5">
        <div className="relative">
          <TeamSlot team={match.home_team} isWinner={homeWin} />
          {match.status === 'completed' && match.home_score !== null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-sm text-white">
              {match.home_score}
            </span>
          )}
        </div>
        <div className="relative">
          <TeamSlot team={match.away_team} isWinner={awayWin} />
          {match.status === 'completed' && match.away_score !== null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-sm text-white">
              {match.away_score}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        {match.status === 'completed' ? (
          <span className="text-xs text-green-500 font-medium">Finalizado</span>
        ) : (
          <span className="text-xs text-gray-600">Pendiente</span>
        )}
      </div>
    </div>
  )
}

export default function BracketPage() {
  const { data: groups, isLoading: loadingGroups } = useGroups()
  const { data: matches, isLoading: loadingMatches } = useMatches()

  const mode = groups?.[0]?.mode

  const bracketMatches = (matches ?? []).filter(
    m => m.bracket_round !== null && (m.home_team !== null || m.away_team !== null || m.status === 'scheduled')
  )

  // Group by bracket_round
  const rounds = new Map<number, Match[]>()
  for (const m of bracketMatches) {
    if (m.bracket_round === null) continue
    if (!rounds.has(m.bracket_round)) rounds.set(m.bracket_round, [])
    rounds.get(m.bracket_round)!.push(m)
  }

  const sortedRounds = [...rounds.entries()].sort((a, b) => a[0] - b[0])

  const isLoading = loadingGroups || loadingMatches

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

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
          Ve a Admin → Torneo y selecciona el modo Llaves para generar el bracket.
        </p>
      </div>
    )
  }

  // Find the champion
  const finalRound = sortedRounds[sortedRounds.length - 1]
  const finalMatch = finalRound?.[1][0]
  const champion = finalMatch?.status === 'completed'
    ? (finalMatch.winner_id === finalMatch.home_team?.id ? finalMatch.home_team : finalMatch.away_team)
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black mb-1">Bracket de Eliminación</h1>
        <p className="text-gray-400 text-sm">El campeón se corona en la final</p>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/20 to-[#d4af37]/10 border border-[#d4af37]/40 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-sm text-[#d4af37] font-semibold mb-1">CAMPEÓN</div>
          <div className="text-2xl font-black">{champion.name}</div>
        </div>
      )}

      {/* Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max">
          {sortedRounds.map(([roundNum, roundMatches]) => {
            const stageName = roundMatches[0]?.stage ?? ''
            return (
              <div key={roundNum} className="flex flex-col">
                {/* Round label */}
                <div className="text-center mb-4">
                  <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">
                    {stageLabel(stageName)}
                  </span>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-6 justify-around flex-1">
                  {roundMatches
                    .filter(m => m.home_team !== null || m.away_team !== null)
                    .sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))
                    .map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
