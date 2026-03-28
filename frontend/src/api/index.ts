import client from './client'
import type { GroupWithStandings, GroupStandings, Match, Team, TopScorer, Goal } from '../types'

export const api = {
  groups: {
    getAll: () => client.get<GroupWithStandings[]>('/groups/').then(r => r.data),
    getById: (id: number) => client.get<GroupStandings>(`/groups/${id}`).then(r => r.data),
  },
  matches: {
    getAll: (params?: { stage?: string; status?: string; group_id?: number }) =>
      client.get<Match[]>('/matches/', { params }).then(r => r.data),
    getById: (id: number) => client.get<Match>(`/matches/${id}`).then(r => r.data),
    getLive: () => client.get<Match[]>('/matches/live').then(r => r.data),
    update: (id: number, data: Partial<Match> & { home_team_id?: number; away_team_id?: number }) =>
      client.put<Match>(`/matches/${id}`, data).then(r => r.data),
    generatePlayoffs: () => client.post('/matches/generate-playoffs').then(r => r.data),
    generateFinal: () => client.post('/matches/generate-final').then(r => r.data),
  },
  teams: {
    getAll: () => client.get<Team[]>('/teams/').then(r => r.data),
    getById: (id: number) => client.get<Team>(`/teams/${id}`).then(r => r.data),
    getMatches: (id: number) => client.get<Match[]>(`/teams/${id}/matches`).then(r => r.data),
  },
  standings: {
    getAll: () => client.get<GroupStandings[]>('/standings/').then(r => r.data),
  },
  scorers: {
    getTop: (limit = 20) => client.get<TopScorer[]>('/scorers/', { params: { limit } }).then(r => r.data),
  },
  goals: {
    getByMatch: (matchId: number) => client.get<Goal[]>(`/goals/match/${matchId}`).then(r => r.data),
    add: (data: { match_id: number; team_id: number; minute: number; is_own_goal?: boolean; is_penalty?: boolean }) =>
      client.post<Goal>('/goals/', data).then(r => r.data),
    delete: (id: number) => client.delete(`/goals/${id}`).then(r => r.data),
  },
  adminTeams: {
    add: (name: string) => client.post<Team>('/teams/', { name }).then(r => r.data),
    update: (id: number, name: string) => client.put<Team>(`/teams/${id}`, { name }).then(r => r.data),
    delete: (id: number) => client.delete(`/teams/${id}`).then(r => r.data),
  },
  admin: {
    resetResults: () => client.post('/admin/reset-results').then(r => r.data),
    regenerate: () => client.post('/admin/regenerate').then(r => r.data),
  },
}
