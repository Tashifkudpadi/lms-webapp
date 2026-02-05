from pydantic import BaseModel, EmailStr
from typing import List, Optional


class FacultyBase(BaseModel):
    name: str
    email: EmailStr
    mobile_number: str
    subject_ids: List[int] = []


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(FacultyBase):
    pass


class FacultyOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    mobile_number: str
    subject_ids: List[int] = []

    class Config:
        orm_mode = True
