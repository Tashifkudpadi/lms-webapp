from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.faculty import Faculty
from app.models.faculty_subject import FacultySubject
from app.database import get_db
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyOut
from typing import List

router = APIRouter()


@router.post("/", response_model=FacultyOut)
def create_faculty(faculty: FacultyCreate, db: Session = Depends(get_db)):
    db_faculty = Faculty(
        name=faculty.name,
        email=faculty.email,
        mobile_number=faculty.mobile_number,
    )
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)

    # Add subject associations
    for subject_id in faculty.subject_ids:
        db_assoc = FacultySubject(
            faculty_id=db_faculty.id,
            subject_id=subject_id
        )
        db.add(db_assoc)
    db.commit()

    return FacultyOut(
        id=db_faculty.id,
        name=db_faculty.name,
        email=db_faculty.email,
        mobile_number=db_faculty.mobile_number,
        subject_ids=faculty.subject_ids
    )


@router.get("/", response_model=List[FacultyOut])
def get_faculties(db: Session = Depends(get_db)):
    faculties = db.query(Faculty).all()
    result = []
    for faculty in faculties:
        subject_ids = [assoc.subject_id for assoc in db.query(
            FacultySubject).filter(FacultySubject.faculty_id == faculty.id).all()]
        result.append(FacultyOut(
            id=faculty.id,
            name=faculty.name,
            email=faculty.email,
            mobile_number=faculty.mobile_number,
            subject_ids=subject_ids
        ))
    return result


@router.get("/{faculty_id}", response_model=FacultyOut)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    subject_ids = [assoc.subject_id for assoc in db.query(
        FacultySubject).filter(FacultySubject.faculty_id == faculty_id).all()]

    return FacultyOut(
        id=faculty.id,
        name=faculty.name,
        email=faculty.email,
        mobile_number=faculty.mobile_number,
        subject_ids=subject_ids
    )


@router.put("/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: int, update: FacultyUpdate, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    faculty.name = update.name
    faculty.email = update.email
    faculty.mobile_number = update.mobile_number

    # Update subject associations
    # First, delete all existing associations
    db.query(FacultySubject).filter(
        FacultySubject.faculty_id == faculty_id).delete()
    # Then add new ones
    for subject_id in update.subject_ids:
        db_assoc = FacultySubject(
            faculty_id=faculty_id,
            subject_id=subject_id
        )
        db.add(db_assoc)

    db.commit()
    db.refresh(faculty)
    return FacultyOut(
        id=faculty.id,
        name=faculty.name,
        email=faculty.email,
        mobile_number=faculty.mobile_number,
        subject_ids=update.subject_ids
    )


@router.delete("/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    # Delete associations first
    db.query(FacultySubject).filter(
        FacultySubject.faculty_id == faculty_id).delete()
    db.delete(faculty)
    db.commit()
    return {"message": "Faculty deleted successfully"}
