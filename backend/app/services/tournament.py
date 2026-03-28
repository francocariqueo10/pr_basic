from sqlalchemy.orm import Session
from ..models import Match, Standing, Goal, Team


def regenerate_fixtures(db: Session) -> str:
    """Delete all matches/goals and regenerate round-robin for current players."""
    db.query(Goal).delete()
    db.query(Match).delete()

    for standing in db.query(Standing).all():
        standing.played = standing.won = standing.drawn = standing.lost = 0
        standing.goals_for = standing.goals_against = standing.goal_difference = standing.points = 0
        standing.position = 1
        standing.qualified = False
        standing.eliminated = False

    db.flush()

    teams = db.query(Team).order_by(Team.id).all()
    n = len(teams)

    if n < 2:
        db.commit()
        return "Se necesitan al menos 2 jugadores"

    fixtures = _round_robin(list(range(n)))
    match_num = 1

    for home_idx, away_idx, match_day in fixtures:
        db.add(Match(
            match_number=match_num,
            stage="group",
            group_id=teams[0].group_id,
            home_team_id=teams[home_idx].id,
            away_team_id=teams[away_idx].id,
            status="scheduled",
            match_day=match_day,
        ))
        match_num += 1

    last_day = fixtures[-1][2] if fixtures else 1
    for stage, offset in [("sf", 1), ("sf", 1), ("third_place", 2), ("final", 2)]:
        db.add(Match(
            match_number=match_num,
            stage=stage,
            group_id=None,
            status="scheduled",
            match_day=last_day + offset,
        ))
        match_num += 1

    db.commit()
    total = len(fixtures)
    return f"Torneo regenerado: {n} jugadores, {total} partidos de grupo"


def _round_robin(indices: list) -> list:
    n = len(indices)
    if n % 2 == 1:
        indices = indices + [-1]
        n += 1

    fixtures = []
    for round_num in range(n - 1):
        for i in range(n // 2):
            home, away = indices[i], indices[n - 1 - i]
            if home != -1 and away != -1:
                fixtures.append((home, away, round_num + 1))
        fixed = indices[0]
        indices = [fixed] + [indices[-1]] + indices[1:-1]

    return fixtures
