from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Group, Standing
from ..schemas.standing import GroupStandingsResponse, StandingResponse

router = APIRouter(prefix="/api/v1/standings", tags=["standings"])


@router.get("/")
def get_all_standings(db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.name).all()
    result = []
    for group in groups:
        standings = (
            db.query(Standing)
            .filter(Standing.group_id == group.id)
            .order_by(Standing.points.desc(), Standing.goal_difference.desc(), Standing.goals_for.desc())
            .all()
        )
        result.append(
            GroupStandingsResponse(
                group_name=group.name,
                standings=[StandingResponse.model_validate(s) for s in standings],
            )
        )
    return result
