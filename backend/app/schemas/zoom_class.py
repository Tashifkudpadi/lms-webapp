from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, time, datetime


class ZoomClassCreate(BaseModel):
    name: str
    course_id: int
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    class_date: date
    start_time: time
    end_time: time
    zoom_url: str


class ZoomClassUpdate(BaseModel):
    name: Optional[str] = None
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    class_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    zoom_url: Optional[str] = None


class ZoomClassOut(BaseModel):
    id: int
    name: str
    course_id: int
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    class_date: date
    start_time: time
    end_time: time
    zoom_url: str
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    course_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
