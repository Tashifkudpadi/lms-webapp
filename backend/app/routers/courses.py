from app.models.user import Role
from app.utils.auth import get_current_user
from sqlalchemy import or_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.course import Course
from app.models.batch import Batch
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.course_content import CourseContent
from app.schemas.course import CourseCreate, CourseUpdate, CourseOut, SubjectOutNested, TopicOutNested
from app.utils.minio_client import delete_file_from_minio

router = APIRouter()


def build_subjects_with_topics(course, topic_ids: List[int]) -> List[SubjectOutNested]:
    """Build nested subjects with their topics based on course's topic_ids."""
    # Group topics by subject
    subject_topics_map = {}
    for topic in course.topics:
        if topic.subject_id not in subject_topics_map:
            subject_topics_map[topic.subject_id] = []
        subject_topics_map[topic.subject_id].append(topic)

    # Build the nested structure
    subjects_out = []
    for subject in course.subjects:
        topics_for_subject = subject_topics_map.get(subject.id, [])
        subjects_out.append(SubjectOutNested(
            id=subject.id,
            name=subject.name,
            code=subject.code,
            topics=[TopicOutNested(id=t.id, name=t.name, description=t.description) for t in topics_for_subject]
        ))
    return subjects_out


@router.post("/", response_model=CourseOut)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    db_course = Course(
        course_name=course.course_name,
        course_desc=course.course_desc,
        course_img=course.course_img,
        is_active=course.is_active,
        is_public=course.is_public,
    )

    # mappings
    if course.batch_ids:
        db_course.batches = db.query(Batch).filter(
            Batch.id.in_(course.batch_ids)).all()
    if course.student_ids:
        db_course.students = db.query(Student).filter(
            Student.id.in_(course.student_ids)).all()
    if course.faculty_ids:
        db_course.faculties = db.query(Faculty).filter(
            Faculty.id.in_(course.faculty_ids)).all()
    if course.subject_ids:
        db_course.subjects = db.query(Subject).filter(
            Subject.id.in_(course.subject_ids)).all()
    if course.topic_ids:
        db_course.topics = db.query(Topic).filter(
            Topic.id.in_(course.topic_ids)).all()

    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    return CourseOut(
        id=db_course.id,
        course_name=db_course.course_name,
        course_desc=db_course.course_desc,
        course_img=db_course.course_img,
        is_active=db_course.is_active,
        is_public=db_course.is_public,
        created_at=db_course.created_at,
        batch_ids=[b.id for b in db_course.batches],
        student_ids=[s.id for s in db_course.students],
        faculty_ids=[f.id for f in db_course.faculties],
        subject_ids=[s.id for s in db_course.subjects],
        topic_ids=[t.id for t in db_course.topics],
        subjects=build_subjects_with_topics(db_course, [t.id for t in db_course.topics]),
    )


@router.get("/", response_model=List[CourseOut])
def get_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Course)

    # ✅ Admin gets all courses
    if current_user.role == Role.ADMIN:
        courses = query.all()

    else:
        # ✅ Everyone can see public courses
        # plus their own (depending on role)
        base_filter = Course.is_public.is_(True)

        if current_user.role == Role.STUDENT:
            role_filter = or_(
                Course.students.any(Student.email == current_user.email),
                Course.batches.any(Batch.students.any(
                    Student.email == current_user.email)),
            )
            query = query.filter(or_(base_filter, role_filter))

        elif current_user.role == Role.FACULTY:
            role_filter = or_(
                Course.faculties.any(Faculty.email == current_user.email),
                Course.batches.any(Batch.faculties.any(
                    Faculty.email == current_user.email)),
            )
            query = query.filter(or_(base_filter, role_filter))

        else:
            # any other role (e.g., viewer) can see only public
            query = query.filter(base_filter)

        courses = query.distinct().all()

    return [
        CourseOut(
            id=c.id,
            course_name=c.course_name,
            course_desc=c.course_desc,
            course_img=c.course_img,
            is_active=c.is_active,
            is_public=c.is_public,
            created_at=c.created_at,
            batch_ids=[b.id for b in c.batches],
            student_ids=[s.id for s in c.students],
            faculty_ids=[f.id for f in c.faculties],
            subject_ids=[s.id for s in c.subjects],
            topic_ids=[t.id for t in c.topics],
            subjects=build_subjects_with_topics(c, [t.id for t in c.topics]),
        )
        for c in courses
    ]


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Course).filter(Course.id == course_id)

    if current_user.role != Role.ADMIN:
        access_filter = or_(
            Course.is_public.is_(True),
            Course.students.any(Student.email == current_user.email),
            Course.faculties.any(Faculty.email == current_user.email),
            Course.batches.any(Batch.students.any(
                Student.email == current_user.email)),
            Course.batches.any(Batch.faculties.any(
                Faculty.email == current_user.email)),
        )
        query = query.filter(access_filter)

    course = query.first()
    if not course:
        raise HTTPException(
            status_code=404, detail="Course not found or access denied")

    return CourseOut(
        id=course.id,
        course_name=course.course_name,
        course_desc=course.course_desc,
        course_img=course.course_img,
        is_active=course.is_active,
        is_public=course.is_public,
        created_at=course.created_at,
        batch_ids=[b.id for b in course.batches],
        student_ids=[s.id for s in course.students],
        faculty_ids=[f.id for f in course.faculties],
        subject_ids=[s.id for s in course.subjects],
        topic_ids=[t.id for t in course.topics],
        subjects=build_subjects_with_topics(course, [t.id for t in course.topics]),
    )


@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, update: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.course_name = update.course_name
    course.course_desc = update.course_desc
    course.course_img = update.course_img
    course.is_active = update.is_active
    course.is_public = update.is_public

    if update.batch_ids is not None:
        course.batches = db.query(Batch).filter(
            Batch.id.in_(update.batch_ids)).all()
    if update.student_ids is not None:
        course.students = db.query(Student).filter(
            Student.id.in_(update.student_ids)).all()
    if update.faculty_ids is not None:
        course.faculties = db.query(Faculty).filter(
            Faculty.id.in_(update.faculty_ids)).all()
    if update.subject_ids is not None:
        course.subjects = db.query(Subject).filter(
            Subject.id.in_(update.subject_ids)).all()
    if update.topic_ids is not None:
        course.topics = db.query(Topic).filter(
            Topic.id.in_(update.topic_ids)).all()

    db.commit()
    db.refresh(course)

    return CourseOut(
        id=course.id,
        course_name=course.course_name,
        course_desc=course.course_desc,
        course_img=course.course_img,
        is_active=course.is_active,
        is_public=course.is_public,
        created_at=course.created_at,
        batch_ids=[b.id for b in course.batches],
        student_ids=[s.id for s in course.students],
        faculty_ids=[f.id for f in course.faculties],
        subject_ids=[s.id for s in course.subjects],
        topic_ids=[t.id for t in course.topics],
        subjects=build_subjects_with_topics(course, [t.id for t in course.topics]),
    )


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}


@router.delete("/{course_id}/subject/{subject_id}")
def remove_subject_from_course(course_id: int, subject_id: int, db: Session = Depends(get_db)):
    """
    Remove a subject from a course:
    1. Delete all course contents for this subject in this course (including MinIO files)
    2. Remove all topics of this subject from the course
    3. Remove the subject from the course
    Note: The subject and topics themselves are NOT deleted from the main tables.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # 1. Delete all course contents for this subject in this course
    contents = db.query(CourseContent).filter(
        CourseContent.course_id == course_id,
        CourseContent.subject_id == subject_id
    ).all()
    contents_count = len(contents)
    for content in contents:
        if content.file_url:
            delete_file_from_minio(content.file_url)
        db.delete(content)

    # 2. Remove all topics of this subject from the course
    topics_to_remove = [t for t in course.topics if t.subject_id == subject_id]
    topics_count = len(topics_to_remove)
    for topic in topics_to_remove:
        course.topics.remove(topic)

    # 3. Remove the subject from the course
    if subject in course.subjects:
        course.subjects.remove(subject)

    db.commit()
    return {"message": f"Removed subject from course. Deleted {contents_count} content(s) and unlinked {topics_count} topic(s)."}


@router.delete("/{course_id}/topic/{topic_id}")
def remove_topic_from_course(course_id: int, topic_id: int, db: Session = Depends(get_db)):
    """
    Remove a topic from a course:
    1. Delete all course contents for this topic in this course (including MinIO files)
    2. Remove the topic from the course
    Note: The topic itself is NOT deleted from the main topics table.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # 1. Delete all course contents for this topic in this course
    contents = db.query(CourseContent).filter(
        CourseContent.course_id == course_id,
        CourseContent.topic_id == topic_id
    ).all()
    contents_count = len(contents)
    for content in contents:
        if content.file_url:
            delete_file_from_minio(content.file_url)
        db.delete(content)

    # 2. Remove the topic from the course
    if topic in course.topics:
        course.topics.remove(topic)

    db.commit()
    return {"message": f"Removed topic from course. Deleted {contents_count} content(s)."}


# ─────────────────────────────────────────────────────────────
# Learners (Students) Management for Course
# ─────────────────────────────────────────────────────────────

from app.models.student import Student
from pydantic import BaseModel
from typing import Optional
from datetime import datetime as dt


class LearnerOut(BaseModel):
    id: int
    name: str
    email: str
    roll_number: Optional[str] = None
    mobile_number: Optional[str] = None
    enrollment_date: Optional[dt] = None
    batch_id: Optional[int] = None
    batch_name: Optional[str] = None
    source: str  # "direct" or "batch"

    class Config:
        from_attributes = True


@router.get("/{course_id}/learners", response_model=List[LearnerOut])
def get_course_learners(course_id: int, db: Session = Depends(get_db)):
    """
    Get all learners (students) for a course.
    Returns students directly added to course + students from linked batches.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    learners = []
    seen_student_ids = set()

    # 1. Get students from batches linked to the course
    for batch in course.batches:
        for student in batch.students:
            if student.id not in seen_student_ids:
                seen_student_ids.add(student.id)
                learners.append(LearnerOut(
                    id=student.id,
                    name=student.name,
                    email=student.email,
                    roll_number=student.roll_number,
                    mobile_number=student.mobile_number,
                    enrollment_date=student.enrollment_date,
                    batch_id=batch.id,
                    batch_name=batch.name,
                    source="batch"
                ))

    # 2. Get students directly added to the course
    for student in course.students:
        if student.id not in seen_student_ids:
            seen_student_ids.add(student.id)
            learners.append(LearnerOut(
                id=student.id,
                name=student.name,
                email=student.email,
                roll_number=student.roll_number,
                mobile_number=student.mobile_number,
                enrollment_date=student.enrollment_date,
                batch_id=None,
                batch_name=None,
                source="direct"
            ))

    return learners


@router.post("/{course_id}/learners/{student_id}")
def add_learner_to_course(course_id: int, student_id: int, db: Session = Depends(get_db)):
    """
    Add a student directly to the course.
    Validates that the student is not already in a batch linked to the course.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if student is already directly added to the course
    if student in course.students:
        raise HTTPException(status_code=400, detail="Student is already added to this course")

    # Check if student is in any batch linked to the course
    for batch in course.batches:
        if student in batch.students:
            raise HTTPException(
                status_code=400,
                detail=f"Student is already in batch '{batch.name}' which is linked to this course"
            )

    # Add student to course
    course.students.append(student)
    db.commit()
    return {"message": f"Student '{student.name}' added to course successfully"}


@router.delete("/{course_id}/learners/{student_id}")
def remove_learner_from_course(
    course_id: int,
    student_id: int,
    batch_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Remove a student from the course.
    - If source is 'direct' (batch_id is None): remove from course.students
    - If source is 'batch' (batch_id provided): remove student from that batch
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if batch_id:
        # Remove student from the batch
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        if student not in batch.students:
            raise HTTPException(status_code=400, detail="Student is not in this batch")
        batch.students.remove(student)
        db.commit()
        return {"message": f"Student '{student.name}' removed from batch '{batch.name}'"}
    else:
        # Remove student from course directly
        if student not in course.students:
            raise HTTPException(status_code=400, detail="Student is not directly added to this course")
        course.students.remove(student)
        db.commit()
        return {"message": f"Student '{student.name}' removed from course"}


# ─────────────────────────────────────────────────────────────
# Batches Management for Course
# ─────────────────────────────────────────────────────────────

class CourseBatchOut(BaseModel):
    id: int
    name: str
    start_date: Optional[dt] = None
    end_date: Optional[dt] = None
    num_learners: int
    num_faculties: int

    class Config:
        from_attributes = True


@router.get("/{course_id}/batches", response_model=List[CourseBatchOut])
def get_course_batches(course_id: int, db: Session = Depends(get_db)):
    """
    Get all batches linked to a course with learner and faculty counts.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    batches = []
    for batch in course.batches:
        batches.append(CourseBatchOut(
            id=batch.id,
            name=batch.name,
            start_date=batch.start_date,
            end_date=batch.end_date,
            num_learners=len(batch.students),
            num_faculties=len(batch.faculties),
        ))
    return batches


@router.post("/{course_id}/batches/{batch_id}")
def add_batch_to_course(course_id: int, batch_id: int, db: Session = Depends(get_db)):
    """
    Add a batch to the course.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch in course.batches:
        raise HTTPException(status_code=400, detail="Batch is already linked to this course")

    # Check if any students from this batch are already directly added to the course
    direct_student_ids = {s.id for s in course.students}
    batch_student_ids = {s.id for s in batch.students}
    overlapping = direct_student_ids & batch_student_ids

    if overlapping:
        # Get names of overlapping students for the error message
        overlapping_names = [s.name for s in batch.students if s.id in overlapping]
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add batch. Students already directly in course: {', '.join(overlapping_names[:3])}{'...' if len(overlapping_names) > 3 else ''}"
        )

    course.batches.append(batch)
    db.commit()
    return {"message": f"Batch '{batch.name}' added to course successfully"}


@router.delete("/{course_id}/batches/{batch_id}")
def remove_batch_from_course(course_id: int, batch_id: int, db: Session = Depends(get_db)):
    """
    Remove a batch from the course.
    This only unlinks the batch - students remain in the batch.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch not in course.batches:
        raise HTTPException(status_code=400, detail="Batch is not linked to this course")

    course.batches.remove(batch)
    db.commit()
    return {"message": f"Batch '{batch.name}' removed from course"}
