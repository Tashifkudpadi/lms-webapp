from pydantic import BaseModel
from typing import Optional
from pydantic import ConfigDict


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None


class TopicCreate(TopicBase):
    subject_id: int   # required to associate topic with subject


class TopicUpdate(TopicBase):
    pass


class TopicOut(TopicBase):
    id: int
    subject_id: int
    model_config = ConfigDict(from_attributes=True)
