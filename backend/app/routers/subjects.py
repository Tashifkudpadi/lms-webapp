from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.faculty_subject import FacultySubject
from app.models.course_content import CourseContent
from app.database import get_db
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectOut
from app.utils.minio_client import delete_file_from_minio
from typing import List

router = APIRouter()


@router.post("/", response_model=SubjectOut)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    db_subject = Subject(
        name=subject.name,
        code=subject.code,
    )
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)

    # Add faculty associations
    for faculty_id in subject.faculty_ids:
        db_assoc = FacultySubject(
            faculty_id=faculty_id,
            subject_id=db_subject.id
        )
        db.add(db_assoc)
    db.commit()

    return SubjectOut(
        id=db_subject.id,
        name=db_subject.name,
        code=db_subject.code,
        faculty_ids=subject.faculty_ids
    )


@router.get("/", response_model=List[SubjectOut])
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    result = []
    for subject in subjects:
        faculty_ids = [assoc.faculty_id for assoc in db.query(
            FacultySubject).filter(FacultySubject.subject_id == subject.id).all()]
        result.append(SubjectOut(
            id=subject.id,
            name=subject.name,
            code=subject.code,
            faculty_ids=faculty_ids,
            topics=subject.topics
        ))
    return result


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    faculty_ids = [assoc.faculty_id for assoc in db.query(
        FacultySubject).filter(FacultySubject.subject_id == subject_id).all()]

    return SubjectOut(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        faculty_ids=faculty_ids,
        topics=subject.topics
    )


@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, update: SubjectUpdate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject.name = update.name
    subject.code = update.code

    # Update faculty associations
    # First, delete all existing associations
    db.query(FacultySubject).filter(
        FacultySubject.subject_id == subject_id).delete()
    # Then add new ones
    for faculty_id in update.faculty_ids:
        db_assoc = FacultySubject(
            faculty_id=faculty_id,
            subject_id=subject_id
        )
        db.add(db_assoc)

    db.commit()
    db.refresh(subject)

    return SubjectOut(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        faculty_ids=update.faculty_ids,
        topics=subject.topics
    )


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    """
    Delete a subject from the system entirely.
    This will also delete all its topics and course contents (including MinIO files).
    Use DELETE /courses/{course_id}/subject/{subject_id} to just remove from a course.
    """
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # 1. Delete all course contents for this subject and their files from MinIO
    contents = db.query(CourseContent).filter(CourseContent.subject_id == subject_id).all()
    contents_count = len(contents)
    for content in contents:
        if content.file_url:
            delete_file_from_minio(content.file_url)
        db.delete(content)

    # 2. Delete all topics for this subject
    topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
    topics_count = len(topics)
    for topic in topics:
        db.delete(topic)

    # 3. Delete faculty associations
    db.query(FacultySubject).filter(
        FacultySubject.subject_id == subject_id).delete()

    # 4. Delete the subject
    db.delete(subject)
    db.commit()
    return {"message": f"Subject, {topics_count} topic(s), and {contents_count} content(s) deleted successfully"}
