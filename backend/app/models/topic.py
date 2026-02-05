from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    # relationship with Subject
    subject = relationship("Subject", back_populates="topics")
    # relationship with Course (many-to-many)
    courses = relationship(
        "Course", secondary="course_topic", back_populates="topics")

    def __repr__(self):
        return f"<Topic id={self.id} name={self.name} subject_id={self.subject_id}>"
