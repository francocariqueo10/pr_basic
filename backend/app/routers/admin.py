from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Match, Standing, Goal, Group
from ..services.tournament import regenerate_fixtures
from ..services.knockout import generate_knockout_bracket

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class SetModeRequest(BaseModel):
    mode: str  # 'league' or 'knockout'


@router.post("/reset-results")
def reset_results(db: Session = Depends(get_db)):
    """Clear all match scores and goals, reset everything to scheduled."""
    # Delete all goals
    db.query(Goal).delete()

    # Reset all matches
    for match in db.query(Match).all():
        match.status = "scheduled"
        match.home_score = None
        match.away_score = None
        match.home_penalties = None
        match.away_penalties = None
        match.winner_id = None
        # Reset playoff teams too
        if match.stage != "group":
            match.home_team_id = None
            match.away_team_id = None

    # Reset all standings
    for standing in db.query(Standing).all():
        standing.played = standing.won = standing.drawn = standing.lost = 0
        standing.goals_for = standing.goals_against = standing.goal_difference = standing.points = 0
        standing.position = 1
        standing.qualified = False
        standing.eliminated = False

    db.commit()
    return {"message": "Resultados reseteados correctamente"}


@router.post("/regenerate")
def regenerate_tournament(db: Session = Depends(get_db)):
    """Delete all matches and regenerate round-robin for current players."""
    message = regenerate_fixtures(db)
    return {"message": message}


@router.post("/generate-bracket")
def generate_bracket(db: Session = Depends(get_db)):
    """Regenerate knockout bracket, clearing existing matches and results."""
    group = db.query(Group).first()
    if not group:
        raise HTTPException(status_code=404, detail="No group found")
    if group.mode != 'knockout':
        raise HTTPException(status_code=400, detail="El torneo no está en modo llaves")
    message = generate_knockout_bracket(db)
    return {"message": message}


@router.post("/set-mode")
def set_mode(body: SetModeRequest, db: Session = Depends(get_db)):
    """Switch tournament mode between league and knockout, regenerating fixtures."""
    if body.mode not in ("league", "knockout"):
        raise HTTPException(status_code=400, detail="mode must be 'league' or 'knockout'")

    group = db.query(Group).first()
    if not group:
        raise HTTPException(status_code=404, detail="No group found")

    group.mode = body.mode
    db.commit()

    if body.mode == "knockout":
        message = generate_knockout_bracket(db)
    else:
        message = regenerate_fixtures(db)

    return {"message": message, "mode": body.mode}
