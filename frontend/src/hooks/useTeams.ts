import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Team, Match } from '../types'

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.teams.getAll(),
  })
}

export function useTeam(id: number) {
  return useQuery<Team>({
    queryKey: ['teams', id],
    queryFn: () => api.teams.getById(id),
    enabled: !!id,
  })
}

export function useTeamMatches(id: number) {
  return useQuery<Match[]>({
    queryKey: ['teams', id, 'matches'],
    queryFn: () => api.teams.getMatches(id),
    enabled: !!id,
  })
}
