from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Match, Standing, Goal
from ..services.knockout import generate_knockout_bracket

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class DrawBracketRequest(BaseModel):
    team_ids: List[int]  # ordered draw result from tómbola


@router.post("/reset-results")
def reset_results(db: Session = Depends(get_db)):
    """Clear all match scores and goals, reset everything to scheduled."""
    db.query(Goal).delete()

    for match in db.query(Match).all():
        match.status = "scheduled"
        match.home_score = None
        match.away_score = None
        match.home_penalties = None
        match.away_penalties = None
        match.winner_id = None
        if match.bracket_round and match.bracket_round > 1:
            match.home_team_id = None
            match.away_team_id = None

    for standing in db.query(Standing).all():
        standing.played = standing.won = standing.drawn = standing.lost = 0
        standing.goals_for = standing.goals_against = standing.goal_difference = standing.points = 0
        standing.position = 1
        standing.qualified = False
        standing.eliminated = False

    db.commit()
    return {"message": "Resultados reseteados correctamente"}


@router.post("/draw-bracket")
def draw_bracket(body: DrawBracketRequest, db: Session = Depends(get_db)):
    """Generate bracket using the tómbola draw order."""
    if len(body.team_ids) < 2:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 2 jugadores")
    message = generate_knockout_bracket(db, ordered_ids=body.team_ids)
    return {"message": message}


@router.post("/generate-bracket")
def generate_bracket(db: Session = Depends(get_db)):
    """Regenerate knockout bracket with random order."""
    message = generate_knockout_bracket(db)
    return {"message": message}
