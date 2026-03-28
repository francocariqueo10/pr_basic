import math
import random
from sqlalchemy.orm import Session
from ..models import Match, Standing, Goal, Team, Group


def _ko_stage(round_num: int, total_rounds: int) -> str:
    from_end = total_rounds - round_num
    if from_end == 0:
        return 'final'
    elif from_end == 1:
        return 'sf'
    elif from_end == 2:
        return 'qf'
    else:
        return f'ko_r{round_num}'


def generate_knockout_bracket(db: Session) -> str:
    # Clear all matches, goals and reset standings
    db.query(Goal).delete()
    db.query(Match).delete()

    for s in db.query(Standing).all():
        s.played = s.won = s.drawn = s.lost = 0
        s.goals_for = s.goals_against = s.goal_difference = s.points = 0
        s.position = 1
        s.qualified = False
        s.eliminated = False

    db.flush()

    teams = db.query(Team).order_by(Team.id).all()
    n = len(teams)
    if n < 2:
        db.commit()
        return "Se necesitan al menos 2 jugadores"

    shuffled = teams[:]
    random.shuffle(shuffled)

    # Pad to next power of 2 with None (byes)
    size = 1
    while size < n:
        size *= 2

    slots = [t.id for t in shuffled] + [None] * (size - n)
    num_rounds = int(math.log2(size))

    match_num = 1
    # match_table[r][p]: Match at round r (0-indexed), slot p
    match_table: list[list] = []

    # --- Round 1 ---
    r1 = []
    for p in range(size // 2):
        home_id = slots[2 * p]
        away_id = slots[2 * p + 1]
        is_bye = home_id is None or away_id is None

        m = Match(
            match_number=match_num,
            stage=_ko_stage(1, num_rounds),
            group_id=None,
            home_team_id=home_id,
            away_team_id=away_id,
            status='completed' if is_bye else 'scheduled',
            match_day=1,
            bracket_round=1,
            bracket_slot=p,
            winner_id=(home_id or away_id) if is_bye else None,
        )
        db.add(m)
        db.flush()
        r1.append(m)
        match_num += 1

    match_table.append(r1)

    # --- Subsequent rounds ---
    for r in range(2, num_rounds + 1):
        prev = match_table[r - 2]
        this_round = []
        for p in range(len(prev) // 2):
            feed_home = prev[2 * p]
            feed_away = prev[2 * p + 1]

            # Pre-fill teams if feeder match was a bye (already completed)
            home_id = feed_home.winner_id if feed_home.status == 'completed' else None
            away_id = feed_away.winner_id if feed_away.status == 'completed' else None

            # If BOTH feeders are completed and one produced None somehow, skip
            is_bye = (feed_home.status == 'completed' and feed_away.status == 'completed'
                      and (home_id is None or away_id is None))

            m = Match(
                match_number=match_num,
                stage=_ko_stage(r, num_rounds),
                group_id=None,
                home_team_id=home_id,
                away_team_id=away_id,
                status='completed' if is_bye else 'scheduled',
                match_day=r,
                bracket_round=r,
                bracket_slot=p,
                winner_id=(home_id or away_id) if is_bye else None,
            )
            db.add(m)
            db.flush()
            this_round.append(m)
            match_num += 1

        match_table.append(this_round)

    # --- Link each match to the next one ---
    for r_idx in range(len(match_table) - 1):
        for p, m in enumerate(match_table[r_idx]):
            nxt = match_table[r_idx + 1][p // 2]
            m.next_match_id = nxt.id
            m.next_match_home = (p % 2 == 0)

    db.commit()

    real = sum(
        1 for rnd in match_table for m in rnd
        if m.status == 'scheduled'
    )
    return f"Bracket generado: {n} jugadores, {real} partidos a disputar"
