from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.batch import Batch
from app.models.student import Student
from app.models.faculty import Faculty
from app.schemas.batch import BatchCreate, BatchUpdate, BatchOut

router = APIRouter()


@router.post("/", response_model=BatchOut)
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    db_batch = Batch(
        name=batch.name,
        start_date=batch.start_date,
        end_date=batch.end_date,
    )

    # attach students
    if batch.student_ids:
        students = db.query(Student).filter(
            Student.id.in_(batch.student_ids)).all()
        db_batch.students = students

    # attach faculties
    if batch.faculty_ids:
        faculties = db.query(Faculty).filter(
            Faculty.id.in_(batch.faculty_ids)).all()
        db_batch.faculties = faculties

    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)

    return BatchOut(
        id=db_batch.id,
        name=db_batch.name,
        start_date=db_batch.start_date,
        end_date=db_batch.end_date,
        num_learners=len(db_batch.students),
        student_ids=[s.id for s in db_batch.students],
        faculty_ids=[f.id for f in db_batch.faculties],
    )


@router.get("/", response_model=List[BatchOut])
def get_batches(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    return [
        BatchOut(
            id=b.id,
            name=b.name,
            start_date=b.start_date,
            end_date=b.end_date,
            num_learners=len(b.students),
            student_ids=[s.id for s in b.students],
            faculty_ids=[f.id for f in b.faculties],
        )
        for b in batches
    ]


@router.get("/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return BatchOut(
        id=batch.id,
        name=batch.name,
        start_date=batch.start_date,
        end_date=batch.end_date,
        num_learners=len(batch.students),
        student_ids=[s.id for s in batch.students],
        faculty_ids=[f.id for f in batch.faculties],
    )


@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, update: BatchUpdate, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch.name = update.name
    batch.start_date = update.start_date
    batch.end_date = update.end_date
    batch.num_learners = len(batch.students)

    # reset relationships
    if update.student_ids is not None:
        batch.students = db.query(Student).filter(
            Student.id.in_(update.student_ids)).all()
    if update.faculty_ids is not None:
        batch.faculties = db.query(Faculty).filter(
            Faculty.id.in_(update.faculty_ids)).all()

    db.commit()
    db.refresh(batch)

    return BatchOut(
        id=batch.id,
        name=batch.name,
        start_date=batch.start_date,
        end_date=batch.end_date,
        num_learners=len(batch.students),
        student_ids=[s.id for s in batch.students],
        faculty_ids=[f.id for f in batch.faculties],
    )


@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    db.delete(batch)
    db.commit()
    return {"message": "Batch deleted successfully"}
