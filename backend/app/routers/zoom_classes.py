from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.zoom_class import ZoomClass
from app.models.course import Course
from app.models.subject import Subject
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.user import User, Role
from app.database import get_db
from app.schemas.zoom_class import ZoomClassCreate, ZoomClassUpdate, ZoomClassOut
from app.utils.auth import get_current_user, require_role

router = APIRouter()


def _to_out(zc: ZoomClass, db: Session) -> ZoomClassOut:
    subject_name = None
    faculty_name = None
    course_name = None

    if zc.subject_id:
        subject = db.query(Subject).filter(Subject.id == zc.subject_id).first()
        subject_name = subject.name if subject else None
    if zc.faculty_id:
        faculty = db.query(Faculty).filter(Faculty.id == zc.faculty_id).first()
        faculty_name = faculty.name if faculty else None
    if zc.course_id:
        course = db.query(Course).filter(Course.id == zc.course_id).first()
        course_name = course.course_name if course else None

    return ZoomClassOut(
        id=zc.id,
        name=zc.name,
        course_id=zc.course_id,
        subject_id=zc.subject_id,
        faculty_id=zc.faculty_id,
        class_date=zc.class_date,
        start_time=zc.start_time,
        end_time=zc.end_time,
        zoom_url=zc.zoom_url,
        subject_name=subject_name,
        faculty_name=faculty_name,
        course_name=course_name,
        created_at=zc.created_at,
    )


@router.post("/", response_model=ZoomClassOut)
def create_zoom_class(data: ZoomClassCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    zc = ZoomClass(**data.model_dump())
    db.add(zc)
    db.commit()
    db.refresh(zc)
    return _to_out(zc, db)


@router.get("/")
def get_zoom_classes(
    skip: int = 0,
    limit: int = 0,
    search: str = "",
    course_id: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ZoomClass)

    # Students only see classes for courses they're enrolled in
    if current_user.role == Role.STUDENT:
        student = db.query(Student).filter(Student.email == current_user.email).first()
        if student:
            enrolled_course_ids = [c.id for c in student.courses]
            batch_course_ids = [c.id for b in student.batches for c in b.courses]
            all_course_ids = set(enrolled_course_ids + batch_course_ids)
            query = query.filter(ZoomClass.course_id.in_(all_course_ids))
        else:
            query = query.filter(False)

    if course_id:
        query = query.filter(ZoomClass.course_id == course_id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(ZoomClass.name.ilike(search_filter))

    total = query.count()
    query = query.order_by(ZoomClass.class_date.desc(), ZoomClass.start_time.desc())

    if limit > 0:
        query = query.offset(skip).limit(limit)

    items = [_to_out(zc, db) for zc in query.all()]
    return {"items": items, "total": total}


@router.get("/{class_id}", response_model=ZoomClassOut)
def get_zoom_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    zc = db.query(ZoomClass).filter(ZoomClass.id == class_id).first()
    if not zc:
        raise HTTPException(status_code=404, detail="Class not found")
    return _to_out(zc, db)


@router.put("/{class_id}", response_model=ZoomClassOut)
def update_zoom_class(class_id: int, data: ZoomClassUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    zc = db.query(ZoomClass).filter(ZoomClass.id == class_id).first()
    if not zc:
        raise HTTPException(status_code=404, detail="Class not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(zc, key, value)

    db.commit()
    db.refresh(zc)
    return _to_out(zc, db)


@router.delete("/{class_id}")
def delete_zoom_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    zc = db.query(ZoomClass).filter(ZoomClass.id == class_id).first()
    if not zc:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(zc)
    db.commit()
    return {"message": "Class deleted successfully"}
