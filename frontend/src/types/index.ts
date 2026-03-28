export interface TeamSimple {
  id: number
  name: string
  code: string
  flag_url: string | null
}

export interface Team extends TeamSimple {
  confederation: string
  group_id: number | null
  coach: string | null
  fifa_ranking: number | null
}

export interface Standing {
  id: number
  group_id: number
  team: TeamSimple
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  position: number
  qualified: boolean
  eliminated: boolean
}

export interface GroupStandings {
  group_name: string
  standings: Standing[]
}

export interface GroupWithStandings {
  id: number
  name: string
  mode: string
  standings: Standing[]
}

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed'
export type MatchStage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final'

export interface Match {
  id: number
  match_number: number
  stage: MatchStage
  group_id: number | null
  home_team: TeamSimple | null
  away_team: TeamSimple | null
  home_score: number | null
  away_score: number | null
  home_penalties: number | null
  away_penalties: number | null
  status: MatchStatus
  venue: string | null
  city: string | null
  kickoff_time: string | null
  match_day: number | null
  winner_id: number | null
  bracket_round: number | null
  bracket_slot: number | null
  next_match_id: number | null
  next_match_home: boolean | null
}

export interface Player {
  id: number
  name: string
  team_id: number
  position: string
  number: number | null
  nationality: string | null
}

export interface Goal {
  id: number
  match_id: number
  team_id: number
  scorer_name: string
  minute: number
  is_own_goal: boolean
  is_penalty: boolean
  created_at: string
}

export interface TopScorer {
  rank: number
  player: Player
  team_name: string
  team_code: string
  team_flag_url: string | null
  goals: number
  penalty_goals: number
  matches: number
}
