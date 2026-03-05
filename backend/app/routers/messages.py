from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import List

from app.database import get_db
from app.models.message import Message
from app.models.notification import Notification, NotificationTypeEnum
from app.models.user import User, Role
from app.models.course import Course
from app.utils.auth import get_current_user
from app.schemas.notification import MessageCreate, MessageOut, ConversationOut

router = APIRouter()


@router.post("/", response_model=MessageOut)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipient = db.query(User).filter(User.id == data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=400, detail="Recipient not found")

    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    msg = Message(
        course_id=data.course_id,
        sender_id=current_user.id,
        recipient_id=data.recipient_id,
        content=data.content,
    )
    db.add(msg)

    notif = Notification(
        user_id=data.recipient_id,
        type=NotificationTypeEnum.MESSAGE,
        title=f"New message from {current_user.first_name} {current_user.last_name}",
        message=data.content[:100] + ("..." if len(data.content) > 100 else ""),
        course_id=data.course_id,
    )
    db.add(notif)

    db.commit()
    db.refresh(msg)

    return MessageOut(
        id=msg.id,
        course_id=msg.course_id,
        sender_id=msg.sender_id,
        recipient_id=msg.recipient_id,
        content=msg.content,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        recipient_name=f"{recipient.first_name} {recipient.last_name}",
        course_name=course.course_name,
    )


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id,
        )
    ).order_by(desc(Message.created_at)).all()

    conversations = {}
    for msg in messages:
        other_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        key = (other_id, msg.course_id)
        if key not in conversations:
            other_user = db.query(User).filter(User.id == other_id).first()
            course = db.query(Course).filter(Course.id == msg.course_id).first()
            unread = db.query(Message).filter(
                Message.sender_id == other_id,
                Message.recipient_id == current_user.id,
                Message.course_id == msg.course_id,
                Message.is_read == False,
            ).count()
            conversations[key] = ConversationOut(
                other_user_id=other_id,
                other_user_name=f"{other_user.first_name} {other_user.last_name}" if other_user else "Unknown",
                course_id=msg.course_id,
                course_name=course.course_name if course else "Unknown",
                last_message=msg.content[:100],
                last_message_at=msg.created_at,
                unread_count=unread,
            )
    return list(conversations.values())


@router.get("/course/{course_id}/faculty")
def get_course_faculty_for_messaging(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    faculty_list = []
    seen = set()
    for faculty in course.faculties:
        user = db.query(User).filter(User.email == faculty.email).first()
        if user and user.id not in seen:
            seen.add(user.id)
            faculty_list.append({
                "user_id": user.id,
                "faculty_id": faculty.id,
                "name": faculty.name,
                "email": faculty.email,
            })
    return faculty_list


@router.get("/{course_id}/{other_user_id}", response_model=List[MessageOut])
def get_messages(
    course_id: int,
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = db.query(Message).filter(
        Message.course_id == course_id,
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.recipient_id == current_user.id),
        )
    ).order_by(Message.created_at).all()

    for msg in messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        recipient = db.query(User).filter(User.id == msg.recipient_id).first()
        course = db.query(Course).filter(Course.id == msg.course_id).first()
        result.append(MessageOut(
            id=msg.id,
            course_id=msg.course_id,
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=f"{sender.first_name} {sender.last_name}" if sender else None,
            recipient_name=f"{recipient.first_name} {recipient.last_name}" if recipient else None,
            course_name=course.course_name if course else None,
        ))
    return result
