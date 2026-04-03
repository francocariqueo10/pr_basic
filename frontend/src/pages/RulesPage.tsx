export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-5xl font-black text-ucl-blue">≡</span>
        <h1 className="text-3xl font-black uppercase tracking-wide">Reglamento del Torneo</h1>
        <p className="text-ucl-silver text-sm">Lee con atención antes de comenzar</p>
      </div>

      {/* Regla principal */}
      <div className="bg-ucl-navy border border-ucl-blue/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-ucl-blue uppercase tracking-wide">Condiciones del Torneo</h2>
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
            <li key={text} className="flex items-start gap-3 text-sm text-ucl-silver-l leading-relaxed">
              <span className="flex-shrink-0 mt-0.5">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sistema de puntos */}
      <div className="bg-ucl-navy border border-white/8 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black uppercase tracking-wide">Sistema de Puntos</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-ucl-silver text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Resultado</th>
                <th className="px-4 py-3 text-center">Puntos</th>
                <th className="px-4 py-3 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-semibold text-green-400">Victoria</td>
                <td className="px-4 py-3 text-center font-black text-green-400">+3 pts</td>
                <td className="px-4 py-3 text-ucl-silver">Ganaste el partido</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-yellow-400">Empate</td>
                <td className="px-4 py-3 text-center font-black text-yellow-400">+1 pt</td>
                <td className="px-4 py-3 text-ucl-silver">Resultado igualado</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-400">Derrota</td>
                <td className="px-4 py-3 text-center font-black text-gray-500">0 pts</td>
                <td className="px-4 py-3 text-ucl-silver">Perdiste el partido</td>
              </tr>
              <tr className="hover:bg-[#1e2a4a]/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-red-400">Penalización</td>
                <td className="px-4 py-3 text-center font-black text-red-400">-3 pts</td>
                <td className="px-4 py-3 text-ucl-silver">Cambio de equipo no autorizado</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 text-sm text-ucl-silver leading-relaxed">
          <span className="flex-shrink-0 text-ucl-blue">ℹ</span>
          <span>
            Los puntos se acumulan durante todas las fases. En caso de penalización por cambio de equipo
            no autorizado, se restan 3 puntos.
          </span>
        </div>
      </div>
    </div>
  )
}
