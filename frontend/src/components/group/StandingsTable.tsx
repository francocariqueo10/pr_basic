import type { Standing } from '../../types'

interface Props {
  standings: Standing[]
  groupName: string
}

export default function StandingsTable({ standings, groupName }: Props) {
  return (
    <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-lg overflow-hidden">
      <div className="bg-[#1e2a4a] px-4 py-2 flex items-center gap-2">
        <span className="text-[#d4af37] font-bold text-sm">Grupo {groupName}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-[#1e2a4a]">
            <th className="text-left px-4 py-2 w-6">#</th>
            <th className="text-left px-4 py-2">Equipo</th>
            <th className="px-2 py-2 text-center">PJ</th>
            <th className="px-2 py-2 text-center">G</th>
            <th className="px-2 py-2 text-center">E</th>
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">GF</th>
            <th className="px-2 py-2 text-center">GC</th>
            <th className="px-2 py-2 text-center">DG</th>
            <th className="px-2 py-2 text-center font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b border-[#1e2a4a] last:border-0 ${
                i < 2 ? 'border-l-2 border-l-green-500' : ''
              } ${s.eliminated ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-2.5 text-gray-400">{s.position}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8 font-mono">{s.team.code}</span>
                  <span className="font-medium truncate max-w-[120px]">{s.team.name}</span>
                  {s.qualified && <span className="text-green-400 text-xs">✓</span>}
                </div>
              </td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.played}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.won}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.drawn}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.lost}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.goals_for}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">{s.goals_against}</td>
              <td className="px-2 py-2.5 text-center text-gray-300">
                {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-[#d4af37]">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
