export function formatMatchDate(dateStr: string | null): string {
  if (!dateStr) return 'Por confirmar'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

export const stageLabels: Record<string, string> = {
  group: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinal',
  third_place: 'Tercer Puesto',
  final: 'FINAL',
}

export const statusLabels: Record<string, string> = {
  scheduled: 'Programado',
  live: 'En vivo',
  completed: 'Finalizado',
  postponed: 'Postpuesto',
}
