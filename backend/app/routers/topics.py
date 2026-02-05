from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.topic import Topic
from app.models.subject import Subject
from app.models.course_content import CourseContent
from app.schemas.topic import TopicCreate, TopicUpdate, TopicOut
from app.utils.minio_client import delete_file_from_minio

router = APIRouter()


@router.post("/", response_model=TopicOut)
def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    # ensure subject exists
    subject = db.query(Subject).filter(Subject.id == topic.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db_topic = Topic(
        name=topic.name,
        description=topic.description,
        subject_id=topic.subject_id
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


@router.get("/", response_model=List[TopicOut])
def get_topics(db: Session = Depends(get_db)):
    return db.query(Topic).all()


@router.get("/by-subject/{subject_id}", response_model=List[TopicOut])
def get_topics_by_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return db.query(Topic).filter(Topic.subject_id == subject_id).all()


@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.put("/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: int, update: TopicUpdate, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.name = update.name
    topic.description = update.description
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    """
    Delete a topic from the system entirely.
    This will also delete all course contents for this topic (including MinIO files).
    Use DELETE /courses/{course_id}/topic/{topic_id} to just remove from a course.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Delete all course contents for this topic and their files from MinIO
    contents = db.query(CourseContent).filter(CourseContent.topic_id == topic_id).all()
    for content in contents:
        if content.file_url:
            delete_file_from_minio(content.file_url)
        db.delete(content)

    # Delete the topic
    db.delete(topic)
    db.commit()
    return {"message": f"Topic and {len(contents)} content(s) deleted successfully"}
