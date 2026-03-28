from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Group, Standing
from ..schemas.standing import GroupStandingsResponse, StandingResponse

router = APIRouter(prefix="/api/v1/groups", tags=["groups"])


@router.get("/")
def get_all_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.name).all()
    result = []
    for group in groups:
        standings = (
            db.query(Standing)
            .filter(Standing.group_id == group.id)
            .order_by(Standing.position, Standing.points.desc())
            .all()
        )
        result.append({
            "id": group.id,
            "name": group.name,
            "standings": [StandingResponse.model_validate(s) for s in standings],
        })
    return result


@router.get("/{group_id}")
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    standings = (
        db.query(Standing)
        .filter(Standing.group_id == group_id)
        .order_by(Standing.points.desc(), Standing.goal_difference.desc())
        .all()
    )

    return GroupStandingsResponse(
        group_name=group.name,
        standings=[StandingResponse.model_validate(s) for s in standings],
    )
