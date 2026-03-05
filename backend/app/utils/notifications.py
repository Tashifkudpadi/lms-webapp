from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationTypeEnum
from app.models.user import User
from typing import List, Optional


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    course_id: Optional[int] = None,
    test_id: Optional[int] = None,
):
    notif = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        course_id=course_id,
        test_id=test_id,
    )
    db.add(notif)
    return notif


def create_notifications_for_students(
    db: Session,
    student_emails: List[str],
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    course_id: Optional[int] = None,
    test_id: Optional[int] = None,
):
    if not student_emails:
        return
    users = db.query(User).filter(User.email.in_(student_emails)).all()
    for user in users:
        create_notification(db, user.id, notification_type, title, message, course_id, test_id)


def create_notifications_for_faculty(
    db: Session,
    faculty_emails: List[str],
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    course_id: Optional[int] = None,
    test_id: Optional[int] = None,
):
    if not faculty_emails:
        return
    users = db.query(User).filter(User.email.in_(faculty_emails)).all()
    for user in users:
        create_notification(db, user.id, notification_type, title, message, course_id, test_id)
