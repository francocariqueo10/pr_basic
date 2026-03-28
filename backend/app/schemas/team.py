from pydantic import BaseModel
from typing import Optional


class TeamBase(BaseModel):
    name: str
    code: str
    flag_url: Optional[str] = None
    confederation: str
    coach: Optional[str] = None
    fifa_ranking: Optional[int] = None


class TeamCreate(TeamBase):
    group_id: Optional[int] = None


class TeamResponse(TeamBase):
    id: int
    group_id: Optional[int] = None

    model_config = {"from_attributes": True}


class TeamSimple(BaseModel):
    id: int
    name: str
    code: str
    flag_url: Optional[str] = None

    model_config = {"from_attributes": True}
