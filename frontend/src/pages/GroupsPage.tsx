import { useGroups } from '../hooks/useGroups'
import StandingsTable from '../components/group/StandingsTable'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function GroupsPage() {
  const { data: groups, isLoading, isError } = useGroups()

  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#d4af37]">Fase de Grupos</h1>
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-l-2 border-l-green-500 bg-transparent" />
          <span>Clasificados (2 primeros)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-400">✓</span>
          <span>Clasificado confirmado</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups?.map(group => (
          <StandingsTable
            key={group.id}
            standings={group.standings}
            groupName={group.name}
          />
        ))}
      </div>
    </div>
  )
}
