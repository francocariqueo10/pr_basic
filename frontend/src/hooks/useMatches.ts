import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Match } from '../types'

export function useMatches(params?: { stage?: string; status?: string; group_id?: number }) {
  return useQuery<Match[]>({
    queryKey: ['matches', params],
    queryFn: () => api.matches.getAll(params),
  })
}

export function useMatch(id: number) {
  return useQuery<Match>({
    queryKey: ['matches', id],
    queryFn: () => api.matches.getById(id),
    enabled: !!id,
  })
}

export function useLiveMatches() {
  return useQuery<Match[]>({
    queryKey: ['matches', 'live'],
    queryFn: () => api.matches.getLive(),
    refetchInterval: 30_000,
  })
}
