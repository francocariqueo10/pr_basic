import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { Match } from '../types'

interface UpdatePayload {
  id: number
  home_score?: number
  away_score?: number
  status?: 'completed' | 'scheduled'
  home_team_id?: number
  away_team_id?: number
}

export function useUpdateMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePayload) => api.matches.update(id, data),
    onSuccess: (_updated: Match) => {
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['standings'] })
    },
  })
}

export function useGeneratePlayoffs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.matches.generatePlayoffs(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  })
}

export function useGenerateFinal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.matches.generateFinal(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  })
}
