import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { GroupWithStandings, GroupStandings } from '../types'

export function useGroups() {
  return useQuery<GroupWithStandings[]>({
    queryKey: ['groups'],
    queryFn: () => api.groups.getAll(),
  })
}

export function useGroup(id: number) {
  return useQuery<GroupStandings>({
    queryKey: ['groups', id],
    queryFn: () => api.groups.getById(id),
    enabled: !!id,
  })
}
