from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    COURSE_ADDED = "COURSE_ADDED"
    COURSE_REMOVED = "COURSE_REMOVED"
    TEST_ASSIGNED = "TEST_ASSIGNED"
    TEST_EXPIRY = "TEST_EXPIRY"
    TEST_SUBMITTED = "TEST_SUBMITTED"
    TEST_EVALUATED = "TEST_EVALUATED"
    MESSAGE = "MESSAGE"


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    course_id: Optional[int] = None
    test_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationOut]
    total: int
    unread_count: int


class MessageCreate(BaseModel):
    course_id: int
    recipient_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    course_id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    recipient_name: Optional[str] = None
    course_name: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    other_user_id: int
    other_user_name: str
    course_id: int
    course_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int
