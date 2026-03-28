from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Goal, Player, Team

router = APIRouter(prefix="/api/v1/scorers", tags=["scorers"])


@router.get("/")
def get_top_scorers(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    results = (
        db.query(
            Player,
            Team,
            func.count(Goal.id).label("total_goals"),
            func.sum(Goal.is_penalty.cast(int)).label("penalty_goals"),
        )
        .join(Goal, Goal.player_id == Player.id)
        .join(Team, Team.id == Player.team_id)
        .filter(Goal.is_own_goal == False)
        .group_by(Player.id, Team.id)
        .order_by(func.count(Goal.id).desc())
        .limit(limit)
        .all()
    )

    scorers = []
    for rank, (player, team, total, penalties) in enumerate(results, start=1):
        scorers.append({
            "rank": rank,
            "player": {
                "id": player.id,
                "name": player.name,
                "position": player.position,
                "number": player.number,
                "team_id": player.team_id,
            },
            "team_name": team.name,
            "team_code": team.code,
            "team_flag_url": team.flag_url,
            "goals": total,
            "penalty_goals": penalties or 0,
            "matches": 0,
        })

    return scorers
