from sqlalchemy.orm import Session
from ..models import Group, Team, Standing
from ..models.player import Player


PLAYERS = [
    {"name": "Jaime",   "code": "JAI", "color": "#e74c3c"},
    {"name": "Erick",   "code": "ERI", "color": "#3498db"},
    {"name": "Kike",    "code": "KIK", "color": "#2ecc71"},
    {"name": "Esteban", "code": "EST", "color": "#f39c12"},
    {"name": "Franco",  "code": "FRA", "color": "#9b59b6"},
]


def seed_database(db: Session):
    """Seed the database with players. No matches — bracket is generated via tómbola."""
    if db.query(Group).count() > 0:
        return  # Already seeded

    group = Group(name="Torneo", mode="knockout")
    db.add(group)
    db.flush()

    for i, p in enumerate(PLAYERS):
        team = Team(
            name=p["name"],
            code=p["code"],
            confederation="TORNEO",
            group_id=group.id,
            flag_url=p["color"],
            fifa_ranking=None,
            coach=None,
        )
        db.add(team)
        db.flush()

        standing = Standing(group_id=group.id, team_id=team.id)
        db.add(standing)

        avatar = Player(name=p["name"], team_id=team.id, position="FWD", number=i + 1, nationality="Torneo")
        db.add(avatar)

    db.commit()
    print("Seeded: 5 players. Run tómbola from admin to generate the bracket.")
