import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationTypeEnum(str, enum.Enum):
    COURSE_ADDED = "COURSE_ADDED"
    COURSE_REMOVED = "COURSE_REMOVED"
    TEST_ASSIGNED = "TEST_ASSIGNED"
    TEST_EXPIRY = "TEST_EXPIRY"
    TEST_SUBMITTED = "TEST_SUBMITTED"
    TEST_EVALUATED = "TEST_EVALUATED"
    MESSAGE = "MESSAGE"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SQLEnum(NotificationTypeEnum), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user = relationship("User", backref="notifications")
