from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GoalCreate(BaseModel):
    match_id: int
    team_id: int
    minute: int = 0
    is_own_goal: bool = False
    is_penalty: bool = False


class GoalResponse(BaseModel):
    id: int
    match_id: int
    team_id: int
    scorer_name: str
    minute: int
    is_own_goal: bool
    is_penalty: bool
    created_at: datetime

    model_config = {"from_attributes": True}
