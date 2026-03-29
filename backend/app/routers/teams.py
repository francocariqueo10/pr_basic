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
    nickname: str | None = None
    email: str | None = None
    avatar_url: str | None = None


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
    if data.nickname is not None:
        team.nickname = data.nickname or None
    if data.email is not None:
        team.email = data.email or None
    if data.avatar_url is not None:
        team.avatar_url = data.avatar_url or None
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


@router.post("/{team_id}/invite")
def send_invite(team_id: int, db: Session = Depends(get_db)):
    """Send a motivational invitation email to the player."""
    import smtplib
    import os
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    if not team.email:
        raise HTTPException(status_code=400, detail="El jugador no tiene email registrado")

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("FROM_EMAIL", smtp_user)
    app_url = os.getenv("APP_URL", "http://localhost:5173")

    if not smtp_user or not smtp_pass:
        raise HTTPException(status_code=500, detail="Email no configurado. Configura SMTP_USER y SMTP_PASSWORD.")

    display_name = team.nickname or team.name
    club = team.fifa_team or "tu equipo"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1526 0%,#111d35 50%,#0a0e1a 100%);border:1px solid #1e2a4a;border-radius:20px 20px 0 0;padding:48px 40px;text-align:center;">
            <div style="font-size:64px;margin-bottom:16px;">🏆</div>
            <h1 style="margin:0 0 8px;color:#d4af37;font-size:32px;font-weight:900;letter-spacing:-1px;">CAMPEONATO FIFA 2026</h1>
            <p style="margin:0;color:#9ca3af;font-size:16px;">El torneo más épico del año</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#0d1526;border-left:1px solid #1e2a4a;border-right:1px solid #1e2a4a;padding:40px;">
            <p style="color:#d1d5db;font-size:18px;margin:0 0 24px;">¡Hola, <strong style="color:#ffffff;">{display_name}</strong>! 👋</p>
            <p style="color:#9ca3af;font-size:16px;line-height:1.6;margin:0 0 32px;">
              Ha llegado tu momento. El <strong style="color:#d4af37;">Campeonato FIFA 2026</strong> está a punto de comenzar
              y tu lugar ya está reservado. Cinco guerreros. Un único campeón. ¿Tienes lo que se necesita?
            </p>

            <!-- Highlight box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#d4af37/10,#1e2a4a);border:1px solid #d4af3744;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;color:#d4af37;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Tu equipo</p>
                  <p style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">⚽ {club}</p>
                </td>
              </tr>
            </table>

            <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 32px;">
              Entra ya, revisa el bracket, conoce a tus rivales y prepárate para la gloria.
              Cada partido cuenta. Cada gol importa. La leyenda se escribe en la cancha.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="{app_url}" style="display:inline-block;background:#d4af37;color:#06091a;font-size:16px;font-weight:900;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.5px;">
                    ⚽ ENTRAR AL TORNEO →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#06091a;border:1px solid #1e2a4a;border-top:none;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:13px;">FIFA Torneo 2026 · Que gane el mejor 🏆</p>
            <p style="margin:8px 0 0;color:#374151;font-size:12px;">Recibiste este email porque fuiste invitado al campeonato.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🏆 {display_name}, tu lugar en el Campeonato FIFA 2026 te espera"
        msg["From"] = f"FIFA Torneo 2026 <{from_email}>"
        msg["To"] = team.email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, team.email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar email: {str(e)}")

    return {"message": f"Invitación enviada a {team.email}"}
