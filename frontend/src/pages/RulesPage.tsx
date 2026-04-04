export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">📋</div>
        <h1 className="text-3xl font-black">Reglamento del Torneo</h1>
        <p className="text-gray-400 text-sm">Lee con atención antes de comenzar</p>
      </div>

      {/* Regla principal */}
      <div className="bg-[#0d1526] border border-[#d4af37]/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-xl font-black text-[#d4af37]">Condiciones del Torneo</h2>
        </div>
        <h3 className="font-bold text-lg">Regla Principal: Un Equipo Hasta la Final</h3>
        <ul className="space-y-3">
          {[
            { icon: '🎯', text: 'Cada jugador debe seleccionar UN SOLO EQUIPO al inicio del torneo.' },
            { icon: '🔒', text: 'El equipo seleccionado DEBE SER EL MISMO durante toda la fase de grupos y semifinales.' },
            { icon: '🏆', text: 'Solo en la FINAL (si accedes) puedes cambiar de equipo.' },
            { icon: '🚫', text: 'Está prohibido cambiar de equipo entre partidos de la fase regular.' },
            { icon: '⚠️', text: 'Si cambias de equipo fuera de la final, pierdes 3 puntos adicionales (penalización).' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
              <span className="flex-shrink-0 mt-0.5">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sistema de puntos */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl font-black">Sistema de Puntos</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#1e2a4a]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1e2a4a] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Resultado</th>
                <th className="px-4 py-3 text-center">Puntos</th>
                <th className="px-4 py-3 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-green-400">Victoria</td>
                <td className="px-4 py-3 text-center font-black text-green-400">+3 pts</td>
                <td className="px-4 py-3 text-gray-400">Ganaste el partido</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-yellow-400">Empate</td>
                <td className="px-4 py-3 text-center font-black text-yellow-400">+1 pt</td>
                <td className="px-4 py-3 text-gray-400">Resultado igualado</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-400">Derrota</td>
                <td className="px-4 py-3 text-center font-black text-gray-500">0 pts</td>
                <td className="px-4 py-3 text-gray-400">Perdiste el partido</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-red-400">Penalización</td>
                <td className="px-4 py-3 text-center font-black text-red-400">-3 pts</td>
                <td className="px-4 py-3 text-gray-400">Cambio de equipo no autorizado</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-3 bg-[#1e2a4a]/40 rounded-xl px-4 py-3 text-sm text-gray-400 leading-relaxed">
          <span className="flex-shrink-0 text-[#d4af37]">ℹ️</span>
          <span>
            Los puntos se acumulan durante todas las fases. En caso de penalización por cambio de equipo
            no autorizado, se restan 3 puntos.
          </span>
        </div>
      </div>

      {/* Reglas de la casa */}
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍺</span>
          <h2 className="text-xl font-black">Reglas de la Casa</h2>
        </div>
        <p className="text-gray-400 text-sm">Estas reglas aplican durante todos los partidos. Sin excepciones.</p>
        <div className="space-y-2">
          {[
            { icon: '⚽', event: 'Gol',              rule: 'Un sorbo de trago.' },
            { icon: '🟡', event: 'Tarjeta amarilla',  rule: 'El jugador debe tomar medio trago.' },
            { icon: '🔴', event: 'Tarjeta roja',      rule: 'El jugador debe tomar el trago al seco.' },
            { icon: '✅', event: 'Penal convertido',  rule: 'El jugador elige a quién regalarle un trago al seco.' },
            { icon: '❌', event: 'Penal errado',       rule: 'El jugador debe tomar su trago al seco.' },
          ].map(({ icon, event, rule }) => (
            <div key={event} className="flex items-start gap-3 bg-[#1e2a4a]/40 border border-[#1e2a4a] rounded-xl px-4 py-3 hover:bg-[#1e2a4a]/60 transition-colors">
              <span className="flex-shrink-0 text-lg mt-0.5">{icon}</span>
              <div className="min-w-0">
                <span className="text-sm font-bold text-white">{event} — </span>
                <span className="text-sm text-gray-400">{rule}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
