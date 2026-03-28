from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import Match, Standing
from ..schemas.match import MatchResponse, MatchUpdate
from ..services.standings_calculator import recalculate_group_standings

router = APIRouter(prefix="/api/v1/matches", tags=["matches"])


@router.get("/")
def get_matches(
    stage: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    group_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Match)
    if stage:
        query = query.filter(Match.stage == stage)
    if status:
        query = query.filter(Match.status == status)
    if group_id:
        query = query.filter(Match.group_id == group_id)
    matches = query.order_by(Match.match_number).all()
    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/live")
def get_live_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.status == "live").all()
    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/{match_id}")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return MatchResponse.model_validate(match)


@router.put("/{match_id}")
def update_match(match_id: int, update: MatchUpdate, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(match, field, value)

    # Auto-calculate winner_id when scores are set and status is completed
    if match.status == "completed" and match.home_score is not None and match.away_score is not None:
        if match.home_score > match.away_score:
            match.winner_id = match.home_team_id
        elif match.away_score > match.home_score:
            match.winner_id = match.away_team_id
        else:
            match.winner_id = None  # Draw

    db.commit()
    db.refresh(match)

    if match.stage == "group" and match.group_id and match.status == "completed":
        recalculate_group_standings(db, match.group_id)

    return MatchResponse.model_validate(match)


@router.post("/generate-playoffs")
def generate_playoffs(db: Session = Depends(get_db)):
    """Assign SF teams based on current group standings (top 4 by position)."""
    group_matches = db.query(Match).filter(Match.stage == "group").all()
    total = len(group_matches)
    completed = sum(1 for m in group_matches if m.status == "completed")

    if completed < total:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan {total - completed} partido(s) de grupo por completar"
        )

    # Get standings sorted by position
    standings = (
        db.query(Standing)
        .order_by(Standing.position)
        .all()
    )
    if len(standings) < 4:
        raise HTTPException(status_code=400, detail="No hay suficientes participantes")

    ranked = [s.team_id for s in standings]  # position 1,2,3,4,5...

    sf1 = db.query(Match).filter(Match.match_number == 11).first()
    sf2 = db.query(Match).filter(Match.match_number == 12).first()

    if sf1:
        sf1.home_team_id = ranked[0]  # 1st
        sf1.away_team_id = ranked[3]  # 4th
    if sf2:
        sf2.home_team_id = ranked[1]  # 2nd
        sf2.away_team_id = ranked[2]  # 3rd

    db.commit()
    return {"message": "Playoffs generados exitosamente"}


@router.post("/generate-final")
def generate_final(db: Session = Depends(get_db)):
    """Assign Final and 3rd place teams based on SF results."""
    sf1 = db.query(Match).filter(Match.match_number == 11).first()
    sf2 = db.query(Match).filter(Match.match_number == 12).first()

    if not sf1 or not sf2:
        raise HTTPException(status_code=404, detail="Semifinales no encontradas")
    if sf1.status != "completed" or sf2.status != "completed":
        raise HTTPException(status_code=400, detail="Las semifinales no han terminado")

    # Determine winners and losers
    def get_winner(m: Match):
        if m.home_score is None or m.away_score is None:
            return None, None
        if m.home_score > m.away_score:
            return m.home_team_id, m.away_team_id
        elif m.away_score > m.home_score:
            return m.away_team_id, m.home_team_id
        return m.home_team_id, m.away_team_id  # tiebreak: home advances

    sf1_winner, sf1_loser = get_winner(sf1)
    sf2_winner, sf2_loser = get_winner(sf2)

    third = db.query(Match).filter(Match.match_number == 13).first()
    final = db.query(Match).filter(Match.match_number == 14).first()

    if third:
        third.home_team_id = sf1_loser
        third.away_team_id = sf2_loser
    if final:
        final.home_team_id = sf1_winner
        final.away_team_id = sf2_winner

    db.commit()
    return {"message": "Final generada exitosamente"}
