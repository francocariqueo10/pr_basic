from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String(3), unique=True, nullable=False)
    flag_url = Column(String, nullable=True)
    confederation = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    coach = Column(String, nullable=True)
    fifa_ranking = Column(Integer, nullable=True)

    group = relationship("Group", back_populates="teams")
    players = relationship("Player", back_populates="team")
    standing = relationship("Standing", back_populates="team", uselist=False)
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
