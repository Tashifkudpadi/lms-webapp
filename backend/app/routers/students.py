from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.student import Student
from app.models.user import User, Role
from app.database import get_db
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.utils.auth import get_current_user, require_role
from typing import List

router = APIRouter()


@router.post("/", response_model=StudentOut)
def create_student(student: StudentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A student with this email already exists")

    db_student = Student(
        name=student.name,
        email=student.email,
        roll_number=student.roll_number,
        mobile_number=student.mobile_number,
        enrollment_date=student.enrollment_date
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return StudentOut(
        id=db_student.id,
        name=db_student.name,
        email=db_student.email,
        roll_number=db_student.roll_number,
        mobile_number=db_student.mobile_number,
        enrollment_date=db_student.enrollment_date,
    )


@router.get("/")
def get_students(skip: int = 0, limit: int = 0, search: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Student)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_filter),
                Student.email.ilike(search_filter),
                Student.roll_number.ilike(search_filter),
            )
        )

    total = query.count()

    if limit > 0:
        query = query.offset(skip).limit(limit)

    students = query.all()
    return {
        "items": [
            StudentOut(
                id=s.id,
                name=s.name,
                email=s.email,
                roll_number=s.roll_number,
                mobile_number=s.mobile_number,
                enrollment_date=s.enrollment_date,
            ) for s in students
        ],
        "total": total,
    }


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentOut(
        id=student.id,
        name=student.name,
        email=student.email,
        roll_number=student.roll_number,
        mobile_number=student.mobile_number,
        enrollment_date=student.enrollment_date,
    )


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, update: StudentUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if update.email != student.email:
        existing = db.query(Student).filter(Student.email == update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="A student with this email already exists")

    student.name = update.name
    student.email = update.email
    student.roll_number = update.roll_number
    student.mobile_number = update.mobile_number
    student.enrollment_date = update.enrollment_date

    db.commit()
    db.refresh(student)
    return StudentOut(
        id=student.id,
        name=student.name,
        email=student.email,
        roll_number=student.roll_number,
        mobile_number=student.mobile_number,
        enrollment_date=student.enrollment_date,
    )


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.ADMIN))):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}
