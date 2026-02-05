from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String)

    faculties = relationship(
        "Faculty", secondary="faculty_subject", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject",
                          cascade="all, delete-orphan")
    courses = relationship(
        "Course", secondary="course_subject", back_populates="subjects")
