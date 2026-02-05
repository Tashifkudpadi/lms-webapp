from pydantic import BaseModel
from typing import Optional


class CourseContentBase(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    youtube_link: Optional[str] = None
    subject_id: int
    topic_id: int


class CourseContentCreate(CourseContentBase):
    pass


class CourseContentOut(CourseContentBase):
    id: int

    class Config:
        orm_mode = True


class CourseContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    youtube_link: Optional[str] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
