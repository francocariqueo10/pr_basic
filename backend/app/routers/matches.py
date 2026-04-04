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


def _sync_leg2_teams(db: Session, match: Match):
    """When leg-1 teams are both set, mirror them swapped into leg-2."""
    if match.leg != 1 or match.bracket_round is None:
        return
    if match.home_team_id is None or match.away_team_id is None:
        return
    leg2 = db.query(Match).filter(
        Match.bracket_round == match.bracket_round,
        Match.bracket_slot == match.bracket_slot,
        Match.leg == 2,
    ).first()
    if leg2 and leg2.status == 'scheduled':
        leg2.home_team_id = match.away_team_id
        leg2.away_team_id = match.home_team_id


def _advance_winner(db: Session, match: Match):
    """Advance the aggregate winner to the next bracket match (leg-2 only)."""
    if not (match.leg == 2 and match.winner_id and match.next_match_id):
        return
    next_leg1 = db.query(Match).filter(Match.id == match.next_match_id).first()
    if not next_leg1:
        return
    if match.next_match_home:
        next_leg1.home_team_id = match.winner_id
    else:
        next_leg1.away_team_id = match.winner_id
    _sync_leg2_teams(db, next_leg1)


def _compute_winner(match: Match, db: Session):
    """Set match.winner_id based on leg type."""
    if match.home_score is None or match.away_score is None:
        return

    is_two_legged_leg2 = (match.leg == 2 and match.bracket_round is not None)

    if is_two_legged_leg2:
        # Aggregate: find leg1
        leg1 = db.query(Match).filter(
            Match.bracket_round == match.bracket_round,
            Match.bracket_slot == match.bracket_slot,
            Match.leg == 1,
        ).first()

        if leg1 and leg1.status == 'completed' and leg1.home_score is not None:
            # leg1: team_A (home) vs team_B (away)
            # leg2: team_B (home) vs team_A (away)
            team_a = leg1.home_team_id
            team_b = leg1.away_team_id
            goals_a = (leg1.home_score or 0) + (match.away_score or 0)
            goals_b = (leg1.away_score or 0) + (match.home_score or 0)

            if goals_a > goals_b:
                match.winner_id = team_a
            elif goals_b > goals_a:
                match.winner_id = team_b
            elif match.home_penalties is not None and match.away_penalties is not None:
                # Penalties decided at leg-2 venue
                if match.home_penalties > match.away_penalties:
                    match.winner_id = team_b  # leg2 home = team_B
                elif match.away_penalties > match.home_penalties:
                    match.winner_id = team_a  # leg2 away = team_A
            else:
                match.winner_id = None  # aggregate draw — need penalties
        else:
            # leg1 not yet complete or single-leg fallback
            if match.home_score > match.away_score:
                match.winner_id = match.home_team_id
            elif match.away_score > match.home_score:
                match.winner_id = match.away_team_id
    else:
        # Leg 1 or single-leg: compute individual match winner (display only)
        if match.home_score > match.away_score:
            match.winner_id = match.home_team_id
        elif match.away_score > match.home_score:
            match.winner_id = match.away_team_id
        elif match.home_penalties is not None and match.away_penalties is not None:
            if match.home_penalties > match.away_penalties:
                match.winner_id = match.home_team_id
            elif match.away_penalties > match.home_penalties:
                match.winner_id = match.away_team_id
        else:
            match.winner_id = None


@router.put("/{match_id}")
def update_match(match_id: int, update: MatchUpdate, db: Session = Depends(get_db)):
    import traceback as _tb
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    try:
        updated_fields = update.model_dump(exclude_unset=True)
        for field, value in updated_fields.items():
            setattr(match, field, value)

        # Sync leg-2 teams when leg-1 rivals are edited
        if 'home_team_id' in updated_fields or 'away_team_id' in updated_fields:
            _sync_leg2_teams(db, match)

        # Compute winner when scoring
        if match.status == 'completed' and match.home_score is not None and match.away_score is not None:
            _compute_winner(match, db)

        # Advance winner to next round (leg-2 only)
        if match.status == 'completed' and match.winner_id:
            _advance_winner(match, db)

        db.commit()
        db.refresh(match)

        if match.stage == "group" and match.group_id and match.status == "completed":
            recalculate_group_standings(db, match.group_id)

        return MatchResponse.model_validate(match)

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail=_tb.format_exc())


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

    standings = (
        db.query(Standing)
        .order_by(Standing.position)
        .all()
    )
    if len(standings) < 4:
        raise HTTPException(status_code=400, detail="No hay suficientes participantes")

    ranked = [s.team_id for s in standings]

    sf1 = db.query(Match).filter(Match.match_number == 11).first()
    sf2 = db.query(Match).filter(Match.match_number == 12).first()

    if sf1:
        sf1.home_team_id = ranked[0]
        sf1.away_team_id = ranked[3]
    if sf2:
        sf2.home_team_id = ranked[1]
        sf2.away_team_id = ranked[2]

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

    def get_winner(m: Match):
        if m.home_score is None or m.away_score is None:
            return None, None
        if m.home_score > m.away_score:
            return m.home_team_id, m.away_team_id
        elif m.away_score > m.home_score:
            return m.away_team_id, m.home_team_id
        return m.home_team_id, m.away_team_id

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
