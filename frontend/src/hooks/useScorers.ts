import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { TopScorer } from '../types'

export function useTopScorers(limit = 20) {
  return useQuery<TopScorer[]>({
    queryKey: ['scorers', limit],
    queryFn: () => api.scorers.getTop(limit),
  })
}
