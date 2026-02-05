from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class CourseContent(Base):
    __tablename__ = "course_contents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # pdf, image, video, excel, etc.
    file_type = Column(String, nullable=True)
    file_url = Column(String, nullable=True)       # uploaded file path
    youtube_link = Column(String, nullable=True)   # separate field for YT link
    # New relations
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    course = relationship("Course", back_populates="contents")
    # Optional relationships (no back_populates defined on Subject/Topic for contents)
    subject = relationship("Subject")
    topic = relationship("Topic")
