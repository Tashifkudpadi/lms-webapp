from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
from sqlalchemy.orm import relationship


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    roll_number = Column(String)
    mobile_number = Column(String)  # <-- ✅ change from Integer to String
    enrollment_date = Column(DateTime, nullable=True)
    batches = relationship(
        "Batch", secondary="batch_students", back_populates="students")
    courses = relationship(
        "Course", secondary="course_student", back_populates="students")
    tests = relationship("Test", secondary="test_student",
                         back_populates="students")
