from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserLogin
from app.utils.auth import get_password_hash, verify_password, create_access_token
from app.database import get_db
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone


router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Role


@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    # db_user = User(
    #     first_name=user.first_name,
    #     last_name=user.last_name,
    #     email=user.email,
    #     hashed_password=hashed_password,  # This is the field in your SQLAlchemy model
    #     role=user.role,
    #     last_active=datetime.utcnow()
    # )
    db_user = User(
        **user.model_dump(exclude={"password", "confirm_password"}),
        hashed_password=hashed_password,
        last_active=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": db_user.id,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "email": db_user.email,
        "role": db_user.role.value
    }


@router.post("/login", response_model=UserLogin)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.email == request.email, User.role == request.role).first()
    if not db_user or not verify_password(request.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email, password, or role",
            headers={"WWW-Authenticate": "Bearer"},
        )
     # Update last_active timestamp
    db_user.last_active = datetime.now(timezone.utc)
    db.add(db_user)
    db.commit()
    access_token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role.value})
    return {
        "id": db_user.id,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "email": db_user.email,
        "role": db_user.role.value,
        "access_token": access_token,
        "token_type": "bearer",
    }
