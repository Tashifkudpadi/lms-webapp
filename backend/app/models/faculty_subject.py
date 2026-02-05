from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class FacultySubject(Base):
    __tablename__ = "faculty_subject"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
