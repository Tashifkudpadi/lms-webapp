from pydantic import BaseModel
from typing import List
from app.schemas.topic import TopicOut
from pydantic import ConfigDict


class SubjectBase(BaseModel):
    name: str
    code: str


class SubjectCreate(SubjectBase):
    faculty_ids: List[int] = []


class SubjectUpdate(SubjectBase):
    faculty_ids: List[int] = []


class SubjectOut(SubjectBase):
    id: int
    faculty_ids: List[int] = []
    topics: List[TopicOut] = []
    model_config = ConfigDict(from_attributes=True)
