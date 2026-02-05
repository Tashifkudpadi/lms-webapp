from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text


# Association tables
course_batch = Table(
    "course_batch",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("batch_id", Integer, ForeignKey("batches.id", ondelete="CASCADE")),
)

course_student = Table(
    "course_student",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("student_id", Integer, ForeignKey(
        "students.id", ondelete="CASCADE")),
)

course_faculty = Table(
    "course_faculty",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("faculty_id", Integer, ForeignKey(
        "faculties.id", ondelete="CASCADE")),
)

course_subject = Table(
    "course_subject",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("subject_id", Integer, ForeignKey(
        "subjects.id", ondelete="CASCADE")),
)

course_topic = Table(
    "course_topic",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("topic_id", Integer, ForeignKey("topics.id", ondelete="CASCADE")),
)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, index=True)
    course_desc = Column(String, nullable=True)
    course_img = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default=text('now()'))

    # Relationships
    batches = relationship(
        "Batch", secondary=course_batch, back_populates="courses")
    students = relationship(
        "Student", secondary=course_student, back_populates="courses")
    faculties = relationship(
        "Faculty", secondary=course_faculty, back_populates="courses")
    subjects = relationship(
        "Subject", secondary=course_subject, back_populates="courses")
    topics = relationship(
        "Topic", secondary=course_topic, back_populates="courses")

    contents = relationship(
        "CourseContent", back_populates="course", cascade="all, delete")
