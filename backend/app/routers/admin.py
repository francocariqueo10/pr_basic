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


@router.post("/assign-fewest-goals/{round_num}")
def assign_fewest_goals(round_num: int, db: Session = Depends(get_db)):
    """Auto-assign the fewest-goals winner from round_num-1 to the open slot in round_num."""
    prev_round = round_num - 1

    # Completed leg-2 matches from previous round
    prev_leg2s = db.query(Match).filter(
        Match.bracket_round == prev_round,
        Match.leg == 2,
        Match.status == 'completed',
    ).all()

    if not prev_leg2s:
        raise HTTPException(status_code=400, detail="No hay partidos completados en la ronda anterior")

    # Compute goals received per winner across both legs
    goals_received: dict[int, int] = {}
    for leg2 in prev_leg2s:
        if not leg2.winner_id:
            continue
        leg1 = db.query(Match).filter(
            Match.bracket_round == leg2.bracket_round,
            Match.bracket_slot == leg2.bracket_slot,
            Match.leg == 1,
        ).first()
        if not leg1 or leg1.home_score is None or leg2.home_score is None:
            continue

        winner = leg2.winner_id
        if leg1.home_team_id == winner:
            # Team A was home in leg1, away in leg2
            received = (leg1.away_score or 0) + (leg2.home_score or 0)
        else:
            # Team B was away in leg1, home in leg2
            received = (leg1.home_score or 0) + (leg2.away_score or 0)
        goals_received[winner] = received

    if not goals_received:
        raise HTTPException(status_code=400, detail="No se pueden calcular goles recibidos")

    fewest_id = min(goals_received, key=lambda k: goals_received[k])

    # Find open slot in current round (leg1 with home set, away empty)
    open_match = db.query(Match).filter(
        Match.bracket_round == round_num,
        Match.leg == 1,
        Match.away_team_id == None,
        Match.home_team_id != None,
    ).first()

    if not open_match:
        raise HTTPException(status_code=400, detail="No hay partido abierto en esta ronda")

    open_match.away_team_id = fewest_id

    # Sync leg-2 of that slot
    leg2 = db.query(Match).filter(
        Match.bracket_round == open_match.bracket_round,
        Match.bracket_slot == open_match.bracket_slot,
        Match.leg == 2,
    ).first()
    if leg2 and leg2.status == 'scheduled':
        leg2.home_team_id = fewest_id
        leg2.away_team_id = open_match.home_team_id

    db.commit()

    team = db.query(Team).filter(Team.id == fewest_id).first()
    goals = goals_received[fewest_id]
    return {
        "message": f"{team.name} asignado (menos goles recibidos: {goals})",
        "team_id": fewest_id,
        "goals_received": goals,
    }


@router.post("/team-pool/reset")
def reset_team_pool(db: Session = Depends(get_db)):
    for team in db.query(Team).all():
        if team.fifa_team in OFFICIAL_TEAMS:
            team.fifa_team = None
    db.commit()
    return {"message": "Sorteo reiniciado"}
