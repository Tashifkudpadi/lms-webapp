from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    mobile_number = Column(String)

    subjects = relationship(
        "Subject", secondary="faculty_subject", back_populates="faculties")
    batches = relationship(
        "Batch", secondary="batch_faculties", back_populates="faculties")
    courses = relationship(
        "Course", secondary="course_faculty", back_populates="faculties")
    tests = relationship("Test", secondary="test_faculty",
                         back_populates="faculties")
