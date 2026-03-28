from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    position = Column(String, nullable=False)  # GK, DEF, MID, FWD
    number = Column(Integer, nullable=True)
    nationality = Column(String, nullable=True)

    team = relationship("Team", back_populates="players")
    goals = relationship("Goal", back_populates="player")
