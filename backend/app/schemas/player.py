from pydantic import BaseModel
from typing import Optional


class PlayerResponse(BaseModel):
    id: int
    name: str
    team_id: int
    position: str
    number: Optional[int] = None
    nationality: Optional[str] = None

    model_config = {"from_attributes": True}


class TopScorerResponse(BaseModel):
    rank: int
    player: PlayerResponse
    team_name: str
    team_code: str
    team_flag_url: Optional[str] = None
    goals: int
    penalty_goals: int
    matches: int
