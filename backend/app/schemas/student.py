from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Optional


class StudentBase(BaseModel):
    name: str
    email: EmailStr
    roll_number: str  # <-- Make sure this is str, NOT EmailStr
    mobile_number: str
    enrollment_date: date


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    roll_number: str
    mobile_number: str
    enrollment_date: date

    class Config:
        orm_mode = True
