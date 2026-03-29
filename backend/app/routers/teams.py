from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Team, Match, Standing, Goal, Group
from ..models.player import Player
from ..schemas.team import TeamResponse
from ..services.tournament import regenerate_fixtures
from ..services.knockout import generate_knockout_bracket

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])

PLAYER_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
                 "#1abc9c", "#e67e22", "#e91e63", "#00bcd4", "#8bc34a"]


class TeamCreate(BaseModel):
    name: str


class TeamUpdate(BaseModel):
    name: str
    fifa_team: str | None = None


@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).order_by(Team.id).all()
    return [TeamResponse.model_validate(t) for t in teams]


@router.get("/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return TeamResponse.model_validate(team)


@router.get("/{team_id}/matches")
def get_team_matches(team_id: int, db: Session = Depends(get_db)):
    from ..schemas.match import MatchResponse
    matches = (
        db.query(Match)
        .filter((Match.home_team_id == team_id) | (Match.away_team_id == team_id))
        .order_by(Match.match_number)
        .all()
    )
    return [MatchResponse.model_validate(m) for m in matches]


@router.post("/")
def add_player(data: TeamCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")

    if db.query(Team).filter(Team.name == name).first():
        raise HTTPException(status_code=400, detail="Ya existe un jugador con ese nombre")

    # Auto-generate code (first 3 chars uppercase, ensure uniqueness)
    base_code = name[:3].upper()
    code = base_code
    counter = 2
    while db.query(Team).filter(Team.code == code).first():
        code = f"{base_code[:2]}{counter}"
        counter += 1

    # Get the group
    group = db.query(Group).first()
    if not group:
        raise HTTPException(status_code=400, detail="No hay grupo configurado")

    # Pick color based on current team count
    team_count = db.query(Team).count()
    color = PLAYER_COLORS[team_count % len(PLAYER_COLORS)]

    team = Team(
        name=name,
        code=code,
        confederation="TORNEO",
        group_id=group.id,
        flag_url=color,  # reuse flag_url to store color
        fifa_ranking=None,
        coach=None,
    )
    db.add(team)
    db.flush()

    standing = Standing(group_id=group.id, team_id=team.id)
    db.add(standing)

    # Create player avatar for goal attribution
    avatar = Player(name=name, team_id=team.id, position="FWD", number=team_count + 1, nationality="Torneo")
    db.add(avatar)

    db.commit()
    db.refresh(team)

    # Only auto-generate if no matches have been created yet
    has_matches = db.query(Match).count() > 0
    if not has_matches:
        group = db.query(Group).first()
        if group and group.mode == 'knockout':
            generate_knockout_bracket(db)
        else:
            regenerate_fixtures(db)
        db.refresh(team)

    return TeamResponse.model_validate(team)


@router.put("/{team_id}")
def update_player(team_id: int, data: TeamUpdate, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    name = data.name.strip()
    existing = db.query(Team).filter(Team.name == name, Team.id != team_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un jugador con ese nombre")

    team.name = name
    if data.fifa_team is not None:
        team.fifa_team = data.fifa_team or None
    # Also update player avatar name
    avatar = db.query(Player).filter(Player.team_id == team_id).first()
    if avatar:
        avatar.name = name

    db.commit()
    db.refresh(team)
    return TeamResponse.model_validate(team)


@router.delete("/{team_id}")
def delete_player(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    # Delete goals first (FK constraint)
    goals = db.query(Goal).filter(Goal.team_id == team_id).all()
    for g in goals:
        db.delete(g)

    # Delete player avatar goals too
    player = db.query(Player).filter(Player.team_id == team_id).first()
    if player:
        player_goals = db.query(Goal).filter(Goal.player_id == player.id).all()
        for g in player_goals:
            db.delete(g)
        db.delete(player)

    # Remove team from any matches (set to null)
    for match in db.query(Match).filter(
        (Match.home_team_id == team_id) | (Match.away_team_id == team_id)
    ).all():
        if match.home_team_id == team_id:
            match.home_team_id = None
            match.home_score = None
        if match.away_team_id == team_id:
            match.away_team_id = None
            match.away_score = None
        match.status = "scheduled"
        match.winner_id = None

    # Delete standing
    standing = db.query(Standing).filter(Standing.team_id == team_id).first()
    if standing:
        db.delete(standing)

    db.delete(team)
    db.commit()

    # In league mode, regenerate round-robin with remaining players.
    # In knockout mode, leave bracket intact (admin can regenerate manually).
    group = db.query(Group).first()
    if group and group.mode == 'league':
        regenerate_fixtures(db)

    return {"message": "Jugador eliminado"}
