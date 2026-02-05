from sqlalchemy import Column, Integer, String, Date, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# Association tables
batch_student = Table(
    "batch_students",
    Base.metadata,
    Column("batch_id", Integer, ForeignKey("batches.id", ondelete="CASCADE")),
    Column("student_id", Integer, ForeignKey(
        "students.id", ondelete="CASCADE")),
)

batch_faculty = Table(
    "batch_faculties",
    Base.metadata,
    Column("batch_id", Integer, ForeignKey("batches.id", ondelete="CASCADE")),
    Column("faculty_id", Integer, ForeignKey(
        "faculties.id", ondelete="CASCADE")),
)


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(Date)
    end_date = Column(Date)

    students = relationship(
        "Student", secondary=batch_student, back_populates="batches")
    faculties = relationship(
        "Faculty", secondary=batch_faculty, back_populates="batches")
    courses = relationship(
        "Course", secondary="course_batch", back_populates="batches")
