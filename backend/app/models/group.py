from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    mode = Column(String, default='league')  # 'league' | 'knockout'

    teams = relationship("Team", back_populates="group")
    matches = relationship("Match", back_populates="group")
    standings = relationship("Standing", back_populates="group")
