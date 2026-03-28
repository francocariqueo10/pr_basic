from pydantic import BaseModel
from typing import Optional
from .team import TeamSimple


class StandingResponse(BaseModel):
    id: int
    group_id: int
    team: TeamSimple
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    position: int
    qualified: bool
    eliminated: bool

    model_config = {"from_attributes": True}


class GroupStandingsResponse(BaseModel):
    group_name: str
    standings: list[StandingResponse]
