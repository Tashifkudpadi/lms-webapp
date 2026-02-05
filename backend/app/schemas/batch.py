# schemas/batch.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional


class BatchCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    student_ids: Optional[List[int]] = []
    faculty_ids: Optional[List[int]] = []


class BatchUpdate(BatchCreate):
    pass


class BatchOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    num_learners: int        # calculated dynamically
    student_ids: List[int] = []
    faculty_ids: List[int] = []

    class Config:
        orm_mode = True
