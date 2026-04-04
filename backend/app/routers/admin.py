import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Match, Standing, Goal, Team
from ..services.knockout import generate_knockout_bracket

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

OFFICIAL_TEAMS = [
    "Real Madrid",
    "Manchester City",
    "FC Barcelona",
    "Liverpool",
    "Paris Saint-Germain",
    "Bayern de Múnich",
    "Arsenal",
    "Atlético de Madrid",
    "Borussia Dortmund",
    "Newcastle United",
]


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


# ── Team Pool (sorteo de equipos) ─────────────────────────────────────────────

@router.get("/team-pool")
def get_team_pool(db: Session = Depends(get_db)):
    teams = db.query(Team).order_by(Team.id).all()
    assigned_names = {t.fifa_team for t in teams if t.fifa_team and t.fifa_team in OFFICIAL_TEAMS}
    available = [t for t in OFFICIAL_TEAMS if t not in assigned_names]
    players = [
        {
            "id": t.id,
            "name": t.name,
            "code": t.code,
            "color": t.flag_url,
            "fifa_team": t.fifa_team if t.fifa_team in OFFICIAL_TEAMS else None,
        }
        for t in teams
    ]
    return {"available": available, "players": players}


@router.post("/team-pool/draw/{team_id}")
def draw_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    assigned_names = {
        t.fifa_team for t in db.query(Team).filter(Team.id != team_id).all()
        if t.fifa_team and t.fifa_team in OFFICIAL_TEAMS
    }
    available = [t for t in OFFICIAL_TEAMS if t not in assigned_names]
    if not available:
        raise HTTPException(status_code=400, detail="No hay equipos disponibles")
    drawn = random.choice(available)
    team.fifa_team = drawn
    db.commit()
    return {"fifa_team": drawn}


@router.delete("/team-pool/draw/{team_id}")
def clear_team_draw(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    if team.fifa_team in OFFICIAL_TEAMS:
        team.fifa_team = None
        db.commit()
    return {"message": "Equipo liberado"}


@router.post("/team-pool/reset")
def reset_team_pool(db: Session = Depends(get_db)):
    for team in db.query(Team).all():
        if team.fifa_team in OFFICIAL_TEAMS:
            team.fifa_team = None
    db.commit()
    return {"message": "Sorteo reiniciado"}
