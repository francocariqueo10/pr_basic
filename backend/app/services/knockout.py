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


def _reset_db(db: Session):
    db.query(Goal).delete()
    db.query(Match).delete()
    for s in db.query(Standing).all():
        s.played = s.won = s.drawn = s.lost = 0
        s.goals_for = s.goals_against = s.goal_difference = s.points = 0
        s.position = 1
        s.qualified = False
        s.eliminated = False
    db.flush()


def generate_knockout_bracket(db: Session, ordered_ids: list | None = None) -> str:
    """Generate bracket. If ordered_ids provided, use that order; otherwise shuffle."""
    _reset_db(db)

    teams = db.query(Team).order_by(Team.id).all()
    n = len(teams)
    if n < 2:
        db.commit()
        return "Se necesitan al menos 2 jugadores"

    if ordered_ids:
        team_map = {t.id: t for t in teams}
        shuffled = [team_map[tid] for tid in ordered_ids if tid in team_map]
        included = set(ordered_ids)
        shuffled += [t for t in teams if t.id not in included]
    else:
        shuffled = teams[:]
        random.shuffle(shuffled)

    if n == 10:
        return _generate_10player(db, shuffled)
    else:
        return _generate_generic(db, shuffled, n)


# ── 10-player custom bracket ──────────────────────────────────────────────────
# Structure: R1(5 ties) → QF(3 ties) → SF(2 ties) → Final(1 tie)
# Each tie = 2 matches (leg1: ida, leg2: vuelta with home/away swapped)
# QF slot2 and SF slot1 have open away slot (admin assigns "fewest goals" rival)

def _make_match(db, num, stage, home_id, away_id, round_num, slot, leg):
    m = Match(
        match_number=num,
        stage=stage,
        group_id=None,
        home_team_id=home_id,
        away_team_id=away_id,
        status='scheduled',
        match_day=round_num,
        bracket_round=round_num,
        bracket_slot=slot,
        leg=leg,
        winner_id=None,
    )
    db.add(m)
    db.flush()
    return m


def _generate_10player(db: Session, shuffled: list) -> str:
    total_rounds = 4
    counter = [1]

    def add(home_id, away_id, rnd, slot, leg):
        m = _make_match(db, counter[0], _ko_stage(rnd, total_rounds),
                        home_id, away_id, rnd, slot, leg)
        counter[0] += 1
        return m

    # ── Round 1: 5 ties (all 10 players) ─────────────────────────────────
    r1: list[list[Match]] = []
    for slot in range(5):
        home = shuffled[slot * 2]
        away = shuffled[slot * 2 + 1]
        l1 = add(home.id, away.id, 1, slot, 1)   # ida
        l2 = add(away.id, home.id, 1, slot, 2)   # vuelta (swapped)
        r1.append([l1, l2])

    # ── QF (round 2): 3 ties ──────────────────────────────────────────────
    # slot 0: R1[0] vs R1[1]
    # slot 1: R1[2] vs R1[3]
    # slot 2: R1[4] vs ??? (fewest-goals rival — away left empty, admin assigns)
    r2: list[list[Match]] = []
    for slot in range(3):
        l1 = add(None, None, 2, slot, 1)
        l2 = add(None, None, 2, slot, 2)
        r2.append([l1, l2])

    # ── SF (round 3): 2 ties ──────────────────────────────────────────────
    # slot 0: QF[0] vs QF[1]
    # slot 1: QF[2] vs ??? (fewest-goals rival from QF — admin assigns)
    r3: list[list[Match]] = []
    for slot in range(2):
        l1 = add(None, None, 3, slot, 1)
        l2 = add(None, None, 3, slot, 2)
        r3.append([l1, l2])

    # ── Final (round 4): 1 tie ────────────────────────────────────────────
    f1 = add(None, None, 4, 0, 1)
    f2 = add(None, None, 4, 0, 2)
    r4 = [[f1, f2]]

    # ── Link leg-2 → next-round leg-1 ────────────────────────────────────
    # R1 → QF
    r1_links = [
        (0, 0, True),   # R1[0] winner → QF[0] home
        (1, 0, False),  # R1[1] winner → QF[0] away
        (2, 1, True),   # R1[2] winner → QF[1] home
        (3, 1, False),  # R1[3] winner → QF[1] away
        (4, 2, True),   # R1[4] winner → QF[2] home (open slot)
    ]
    for r1_slot, qf_slot, is_home in r1_links:
        r1[r1_slot][1].next_match_id = r2[qf_slot][0].id
        r1[r1_slot][1].next_match_home = is_home

    # QF → SF
    qf_links = [
        (0, 0, True),   # QF[0] winner → SF[0] home
        (1, 0, False),  # QF[1] winner → SF[0] away
        (2, 1, True),   # QF[2] winner → SF[1] home (open slot)
    ]
    for qf_slot, sf_slot, is_home in qf_links:
        r2[qf_slot][1].next_match_id = r3[sf_slot][0].id
        r2[qf_slot][1].next_match_home = is_home

    # SF → Final
    r3[0][1].next_match_id = r4[0][0].id
    r3[0][1].next_match_home = True
    r3[1][1].next_match_id = r4[0][0].id
    r3[1][1].next_match_home = False

    db.commit()
    return "Bracket generado: 10 jugadores, 22 partidos a disputar (ida y vuelta)"


# ── Generic bracket (power-of-2, two-legged) ─────────────────────────────────

def _generate_generic(db: Session, shuffled: list, n: int) -> str:
    size = 1
    while size < n:
        size *= 2
    total_rounds = int(math.log2(size))

    slots_ids = [t.id for t in shuffled] + [None] * (size - n)
    counter = [1]

    def add(home_id, away_id, rnd, slot, leg):
        is_bye = (home_id is None) != (away_id is None)
        m = _make_match(db, counter[0], _ko_stage(rnd, total_rounds),
                        home_id, away_id, rnd, slot, leg)
        if is_bye:
            m.status = 'completed'
            m.winner_id = home_id or away_id
        counter[0] += 1
        return m

    match_table: list[list[list[Match]]] = []  # [round_idx][slot] = [leg1, leg2]

    # Round 1
    r1 = []
    for p in range(size // 2):
        home_id = slots_ids[2 * p]
        away_id = slots_ids[2 * p + 1]
        l1 = add(home_id, away_id, 1, p, 1)
        l2 = add(away_id, home_id, 1, p, 2)
        if l1.status == 'completed':
            l2.status = 'completed'
            l2.winner_id = l1.winner_id
        r1.append([l1, l2])
    match_table.append(r1)

    # Subsequent rounds
    for r in range(2, total_rounds + 1):
        prev = match_table[r - 2]
        this_round = []
        for p in range(len(prev) // 2):
            feed_home = prev[2 * p][1]   # leg2 of feeder
            feed_away = prev[2 * p + 1][1]
            home_id = feed_home.winner_id if feed_home.status == 'completed' else None
            away_id = feed_away.winner_id if feed_away.status == 'completed' else None
            l1 = add(home_id, away_id, r, p, 1)
            l2 = add(away_id, home_id, r, p, 2)
            if home_id and away_id:
                pass  # normal match
            elif home_id or away_id:
                l1.status = 'completed'
                l1.winner_id = home_id or away_id
                l2.status = 'completed'
                l2.winner_id = home_id or away_id
            this_round.append([l1, l2])
        match_table.append(this_round)

    # Link leg2 → next round leg1
    for r_idx in range(len(match_table) - 1):
        for slot, tie in enumerate(match_table[r_idx]):
            nxt_leg1 = match_table[r_idx + 1][slot // 2][0]
            tie[1].next_match_id = nxt_leg1.id
            tie[1].next_match_home = (slot % 2 == 0)

    db.commit()

    real = sum(
        1 for rnd in match_table for tie in rnd
        if tie[0].status == 'scheduled'
    )
    return f"Bracket generado: {n} jugadores, {real * 2} partidos a disputar (ida y vuelta)"
