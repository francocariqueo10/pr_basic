from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .team import TeamSimple


class MatchBase(BaseModel):
    match_number: int
    stage: str
    venue: Optional[str] = None
    city: Optional[str] = None
    kickoff_time: Optional[datetime] = None
    match_day: Optional[int] = None


class MatchCreate(MatchBase):
    group_id: Optional[int] = None
    home_team_id: Optional[int] = None
    away_team_id: Optional[int] = None


class MatchUpdate(BaseModel):
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    home_penalties: Optional[int] = None
    away_penalties: Optional[int] = None
    status: Optional[str] = None
    winner_id: Optional[int] = None
    home_team_id: Optional[int] = None
    away_team_id: Optional[int] = None


class MatchResponse(MatchBase):
    id: int
    group_id: Optional[int] = None
    home_team: Optional[TeamSimple] = None
    away_team: Optional[TeamSimple] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    home_penalties: Optional[int] = None
    away_penalties: Optional[int] = None
    status: str
    winner_id: Optional[int] = None
    bracket_round: Optional[int] = None
    bracket_slot: Optional[int] = None
    next_match_id: Optional[int] = None
    next_match_home: Optional[bool] = None

    model_config = {"from_attributes": True}
