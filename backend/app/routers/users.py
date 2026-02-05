from typing import List, Optional
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, Role
# from app.models.student import Student
# from app.models.faculty import Faculty
from app.database import get_db
from pydantic import BaseModel

router = APIRouter(tags=["users"])


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    last_active: Optional[str]

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    role: Optional[str]


def format_utc_datetime(dt):
    """Format datetime as ISO string with UTC timezone indicator."""
    if dt is None:
        return None
    # If datetime is naive (no timezone), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


@router.get("/", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        UserResponse(
            id=user.id,
            name=f"{user.first_name} {user.last_name}",
            email=user.email,
            role=user.role.value,
            last_active=format_utc_datetime(user.last_active)
        )
        for user in users
    ]


@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # if user.role == Role.STUDENT:
    #     student = db.query(Student).filter(Student.user_id == user_id).first()
    #     if student:
    #         db.delete(student)
    # elif user.role == Role.FACULTY:
    #     faculty = db.query(Faculty).filter(Faculty.user_id == user_id).first()
    #     if faculty:
    #         db.delete(faculty)

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_update.first_name:
        user.first_name = user_update.first_name
    if user_update.last_name:
        user.last_name = user_update.last_name
    if user_update.email:
        existing_user = db.query(User).filter(
            User.email == user_update.email, User.id != user_id
        ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
        )
    user.email = user_update.email
    if user_update.role is not None and user_update.role != "":
        if user_update.role not in [role.value for role in Role]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
    user.role = Role(user_update.role)

    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        name=f"{user.first_name} {user.last_name}",
        email=user.email,
        role=user.role.value,
        last_active=format_utc_datetime(user.last_active)
    )
