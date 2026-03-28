from sqlalchemy.orm import Session
from ..models import Group, Team, Standing, Match
from ..models.player import Player


PLAYERS = [
    {"name": "Jaime",   "code": "JAI", "color": "#e74c3c"},
    {"name": "Erick",   "code": "ERI", "color": "#3498db"},
    {"name": "Kike",    "code": "KIK", "color": "#2ecc71"},
    {"name": "Esteban", "code": "EST", "color": "#f39c12"},
    {"name": "Franco",  "code": "FRA", "color": "#9b59b6"},
]

# Round-robin fixtures (10 matches, 5 rounds, each player plays exactly 4 times)
# Indices 0=Jaime, 1=Erick, 2=Kike, 3=Esteban, 4=Franco
ROUND_ROBIN = [
    # (home_idx, away_idx, match_day)
    (0, 1, 1),  # Jaime vs Erick
    (2, 3, 1),  # Kike vs Esteban   — Franco libre
    (0, 2, 2),  # Jaime vs Kike
    (1, 4, 2),  # Erick vs Franco   — Esteban libre
    (0, 3, 3),  # Jaime vs Esteban
    (2, 4, 3),  # Kike vs Franco    — Erick libre
    (0, 4, 4),  # Jaime vs Franco
    (1, 3, 4),  # Erick vs Esteban  — Kike libre
    (1, 2, 5),  # Erick vs Kike
    (3, 4, 5),  # Esteban vs Franco — Jaime libre
]

# Playoff placeholder matches (teams TBD after group phase)
PLAYOFFS = [
    {"match_number": 11, "stage": "sf",          "match_day": 6, "label": "Semifinal 1: 1° vs 4°"},
    {"match_number": 12, "stage": "sf",          "match_day": 6, "label": "Semifinal 2: 2° vs 3°"},
    {"match_number": 13, "stage": "third_place", "match_day": 7, "label": "3er Puesto"},
    {"match_number": 14, "stage": "final",       "match_day": 7, "label": "Gran Final"},
]


def seed_database(db: Session):
    """Seed the database with the friends tournament data."""
    if db.query(Group).count() > 0:
        return  # Already seeded

    # Create single group
    group = Group(name="Liga")
    db.add(group)
    db.flush()

    # Create players as teams
    teams = []
    for i, p in enumerate(PLAYERS):
        team = Team(
            name=p["name"],
            code=p["code"],
            confederation="TORNEO",
            group_id=group.id,
            flag_url=None,
            fifa_ranking=None,
            coach=None,
        )
        db.add(team)
        db.flush()
        teams.append(team)

        standing = Standing(group_id=group.id, team_id=team.id)
        db.add(standing)

        # Create a player "avatar" so goal attribution works
        avatar = Player(name=p["name"], team_id=team.id, position="FWD", number=i + 1, nationality="Torneo")
        db.add(avatar)

    db.flush()

    # Create round-robin matches
    for home_idx, away_idx, match_day in ROUND_ROBIN:
        match_num = ROUND_ROBIN.index((home_idx, away_idx, match_day)) + 1
        match = Match(
            match_number=match_num,
            stage="group",
            group_id=group.id,
            home_team_id=teams[home_idx].id,
            away_team_id=teams[away_idx].id,
            status="scheduled",
            match_day=match_day,
            venue=None,
            city=None,
            kickoff_time=None,
        )
        db.add(match)

    # Create playoff placeholder matches (no teams yet)
    for p in PLAYOFFS:
        match = Match(
            match_number=p["match_number"],
            stage=p["stage"],
            group_id=None,
            home_team_id=None,
            away_team_id=None,
            status="scheduled",
            match_day=p["match_day"],
            venue=None,
            city=None,
            kickoff_time=None,
        )
        db.add(match)

    db.commit()
    print("Tournament seeded: 5 players, 10 group matches + 4 playoff slots")
