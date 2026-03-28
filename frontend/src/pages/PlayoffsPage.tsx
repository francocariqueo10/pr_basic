import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import MatchCard from '../components/match/MatchCard'
import Spinner from '../components/ui/Spinner'
import { useGeneratePlayoffs, useGenerateFinal } from '../hooks/useUpdateMatch'

export default function PlayoffsPage() {
  const { data: groupMatches } = useMatches({ stage: 'group' })
  const { data: sfMatches, isLoading: loadingSF } = useMatches({ stage: 'sf' })
  const { data: thirdMatches } = useMatches({ stage: 'third_place' })
  const { data: finalMatches } = useMatches({ stage: 'final' })
  const { data: groups } = useGroups()

  const generatePlayoffs = useGeneratePlayoffs()
  const generateFinal = useGenerateFinal()

  const groupDone = groupMatches?.every(m => m.status === 'completed') ?? false
  const sfDone = sfMatches?.every(m => m.status === 'completed') ?? false
  const sfGenerated = sfMatches?.some(m => m.home_team !== null) ?? false
  const finalGenerated = finalMatches?.some(m => m.home_team !== null) ?? false

  const standings = groups?.[0]?.standings ?? []

  if (loadingSF) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-[#d4af37]">Playoffs</h1>

      {/* Group standings summary */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Clasificación final de grupos
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {standings.map((s, i) => {
            const medals = ['🥇', '🥈', '🥉', '4°', '5°']
            const colors = ['#d4af37', '#aaa', '#cd7f32', '#666', '#555']
            return (
              <div
                key={s.id}
                className="bg-[#0d1526] border border-[#1e2a4a] rounded-xl p-3 text-center"
              >
                <div className="text-xl mb-1">{medals[i]}</div>
                <div className="font-bold text-sm" style={{ color: colors[i] }}>
                  {s.team.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{s.points} pts</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Semifinals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Semifinales</h2>
          {groupDone && !sfGenerated && (
            <button
              onClick={() => generatePlayoffs.mutate()}
              disabled={generatePlayoffs.isPending}
              className="px-4 py-1.5 bg-[#d4af37] text-[#06091a] text-sm font-bold rounded-lg hover:bg-[#e6c84a] transition-colors disabled:opacity-60"
            >
              {generatePlayoffs.isPending ? 'Generando...' : '⚡ Generar Bracket'}
            </button>
          )}
        </div>

        {generatePlayoffs.isError && (
          <div className="text-red-400 text-sm mb-3">
            {(generatePlayoffs.error as Error)?.message ?? 'Error generando playoffs'}
          </div>
        )}

        {!sfGenerated ? (
          <div className="bg-[#0d1526] border border-dashed border-[#1e2a4a] rounded-xl p-8 text-center text-gray-500 text-sm">
            {groupDone
              ? 'Presiona "Generar Bracket" para crear las semifinales'
              : 'Completa todos los partidos de grupos primero'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sfMatches?.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* Final + 3rd place */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Final y 3er Puesto</h2>
          {sfDone && sfGenerated && !finalGenerated && (
            <button
              onClick={() => generateFinal.mutate()}
              disabled={generateFinal.isPending}
              className="px-4 py-1.5 bg-[#d4af37] text-[#06091a] text-sm font-bold rounded-lg hover:bg-[#e6c84a] transition-colors disabled:opacity-60"
            >
              {generateFinal.isPending ? 'Generando...' : '🏆 Generar Final'}
            </button>
          )}
        </div>

        {!finalGenerated ? (
          <div className="bg-[#0d1526] border border-dashed border-[#1e2a4a] rounded-xl p-8 text-center text-gray-500 text-sm">
            {sfDone && sfGenerated
              ? 'Presiona "Generar Final" para completar el bracket'
              : 'Completa las semifinales primero'}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Final first (highlighted) */}
            {finalMatches?.map(m => <MatchCard key={m.id} match={m} />)}
            {thirdMatches?.map(m => <MatchCard key={m.id} match={m} />)}

            {/* Champion banner */}
            {finalMatches?.[0]?.status === 'completed' && finalMatches[0].winner_id && (
              <ChampionBanner
                name={
                  finalMatches[0].winner_id === finalMatches[0].home_team?.id
                    ? finalMatches[0].home_team!.name
                    : finalMatches[0].away_team!.name
                }
              />
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function ChampionBanner({ name }: { name: string }) {
  return (
    <div className="mt-6 bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/10 to-[#d4af37]/20 border border-[#d4af37]/40 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-3">🏆</div>
      <div className="text-xs text-[#d4af37] uppercase tracking-widest mb-2">Campeón del Torneo</div>
      <div className="text-3xl font-black text-white">{name}</div>
    </div>
  )
}
