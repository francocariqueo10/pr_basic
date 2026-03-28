import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeams } from '../hooks/useTeams'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import type { Team } from '../types'

const confederations = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC']

export default function TeamsPage() {
  const { data: teams, isLoading, isError } = useTeams()
  const [search, setSearch] = useState('')
  const [conf, setConf] = useState('')

  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />

  const filtered = (teams ?? []).filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase())
    const matchesConf = conf ? t.confederation === conf : true
    return matchesSearch && matchesConf
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#d4af37]">Equipos</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1e2a4a] border border-[#2a3a6a] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
        />
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setConf('')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              conf === '' ? 'bg-[#d4af37] text-[#06091a]' : 'bg-[#1e2a4a] text-gray-300 hover:bg-[#2a3a6a]'
            }`}
          >
            Todas
          </button>
          {confederations.map(c => (
            <button
              key={c}
              onClick={() => setConf(c)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                conf === c ? 'bg-[#d4af37] text-[#06091a]' : 'bg-[#1e2a4a] text-gray-300 hover:bg-[#2a3a6a]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(team => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay equipos con esos filtros</div>
      )}
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="bg-[#0d1526] border border-[#1e2a4a] rounded-lg p-4 hover:border-[#d4af37]/40 transition-colors flex items-center gap-3"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-[#1e2a4a] rounded font-bold text-sm text-[#d4af37] font-mono flex-shrink-0">
        {team.code}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate">{team.name}</div>
        <div className="text-xs text-gray-500">{team.confederation}</div>
        {team.fifa_ranking && (
          <div className="text-xs text-gray-600">Ranking FIFA: #{team.fifa_ranking}</div>
        )}
      </div>
    </Link>
  )
}
