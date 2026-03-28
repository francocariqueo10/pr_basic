from sqlalchemy.orm import Session
from ..models import Match, Standing, Team


def recalculate_group_standings(db: Session, group_id: int):
    """Recalculate standings for a group after a match result is updated."""
    completed_matches = (
        db.query(Match)
        .filter(Match.group_id == group_id, Match.status == "completed")
        .all()
    )

    standings = db.query(Standing).filter(Standing.group_id == group_id).all()
    standing_map = {s.team_id: s for s in standings}

    # Reset all stats
    for s in standings:
        s.played = s.won = s.drawn = s.lost = 0
        s.goals_for = s.goals_against = s.goal_difference = s.points = 0

    for match in completed_matches:
        if match.home_score is None or match.away_score is None:
            continue

        home = standing_map.get(match.home_team_id)
        away = standing_map.get(match.away_team_id)

        if not home or not away:
            continue

        home.played += 1
        away.played += 1
        home.goals_for += match.home_score
        home.goals_against += match.away_score
        away.goals_for += match.away_score
        away.goals_against += match.home_score

        if match.home_score > match.away_score:
            home.won += 1
            home.points += 3
            away.lost += 1
        elif match.home_score < match.away_score:
            away.won += 1
            away.points += 3
            home.lost += 1
        else:
            home.drawn += 1
            away.drawn += 1
            home.points += 1
            away.points += 1

    for s in standings:
        s.goal_difference = s.goals_for - s.goals_against

    # Sort by points, then GD, then GF
    sorted_standings = sorted(
        standings,
        key=lambda s: (-s.points, -s.goal_difference, -s.goals_for)
    )

    for i, s in enumerate(sorted_standings):
        s.position = i + 1

    db.commit()
