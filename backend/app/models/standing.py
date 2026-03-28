from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Standing(Base):
    __tablename__ = "standings"
    __table_args__ = (UniqueConstraint("group_id", "team_id"),)

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    played = Column(Integer, default=0)
    won = Column(Integer, default=0)
    drawn = Column(Integer, default=0)
    lost = Column(Integer, default=0)
    goals_for = Column(Integer, default=0)
    goals_against = Column(Integer, default=0)
    goal_difference = Column(Integer, default=0)
    points = Column(Integer, default=0)
    position = Column(Integer, default=0)
    qualified = Column(Boolean, default=False)
    eliminated = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("Group", back_populates="standings")
    team = relationship("Team", back_populates="standing")
