from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import Role


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: Role


class UserCreate(UserBase):
    password: str
    confirm_password: str


class UserLogin(UserBase):
    id: int
    student_id: Optional[int] = None
    faculty_id: Optional[int] = None
    access_token: str
    token_type: str

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
