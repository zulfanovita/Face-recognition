from sqlalchemy import Column, Integer, String, LargeBinary
from .database import Base

class Face(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    encoding = Column(LargeBinary)
