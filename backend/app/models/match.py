from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    match_number = Column(Integer, unique=True, nullable=False)
    stage = Column(String, nullable=False)  # group, r32, r16, qf, sf, third_place, final
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    home_penalties = Column(Integer, nullable=True)
    away_penalties = Column(Integer, nullable=True)
    status = Column(String, default="scheduled")  # scheduled, live, completed, postponed
    venue = Column(String, nullable=True)
    city = Column(String, nullable=True)
    kickoff_time = Column(DateTime, nullable=True)
    match_day = Column(Integer, nullable=True)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("Group", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    goals = relationship("Goal", back_populates="match")
