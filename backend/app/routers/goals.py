from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Goal, Team
from ..models.player import Player
from ..schemas.goal import GoalCreate, GoalResponse

router = APIRouter(prefix="/api/v1/goals", tags=["goals"])


def _to_response(goal: Goal, db: Session) -> dict:
    team = db.query(Team).filter(Team.id == goal.team_id).first()
    return {
        "id": goal.id,
        "match_id": goal.match_id,
        "team_id": goal.team_id,
        "scorer_name": team.name if team else "Desconocido",
        "minute": goal.minute,
        "is_own_goal": goal.is_own_goal,
        "is_penalty": goal.is_penalty,
        "created_at": goal.created_at,
    }


@router.get("/match/{match_id}")
def get_match_goals(match_id: int, db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.match_id == match_id).order_by(Goal.minute).all()
    return [_to_response(g, db) for g in goals]


@router.post("/")
def add_goal(data: GoalCreate, db: Session = Depends(get_db)):
    # Find the player avatar for this team
    player = db.query(Player).filter(Player.team_id == data.team_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado para este equipo")

    goal = Goal(
        match_id=data.match_id,
        player_id=player.id,
        team_id=data.team_id,
        minute=data.minute,
        is_own_goal=data.is_own_goal,
        is_penalty=data.is_penalty,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal, db)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Gol no encontrado")
    db.delete(goal)
    db.commit()
    return {"message": "Gol eliminado"}
