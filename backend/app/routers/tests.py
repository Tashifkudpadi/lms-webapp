from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import io
import json

from app.database import get_db
from app.models.test import (
    Test, TestSubCategory, TestQuestion, TestQuestionOption,
    TestAttempt, TestAnswer, ExamTypeEnum, TestCategoryEnum,
    TestStatusEnum, AttemptStatusEnum
)
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.batch import Batch
from app.models.course import Course
from app.models.user import User, Role
from app.utils.auth import get_current_user
from app.schemas.test import (
    TestCreate, TestUpdate, TestOut, TestListOut, TestPreview,
    TestSubCategoryCreate, TestSubCategoryUpdate, TestSubCategoryOut,
    TestQuestionCreate, TestQuestionUpdate, TestQuestionOut,
    TestAttemptCreate, TestAttemptSubmit, TestAttemptOut, TestAttemptWithAnswers,
    TestResultSummary, MainsEvaluationCreate, QuestionImportResult, TestStatistics,
    StudentWithAttemptStatus,
    ExamType, TestCategory, TestStatus, AttemptStatus
)

router = APIRouter()


# ============ Helper Functions ============
def build_test_out(test: Test) -> TestOut:
    return TestOut(
        id=test.id,
        test_name=test.test_name,
        description=test.description,
        exam_type=ExamType(test.exam_type.value),
        category=TestCategory(test.category.value),
        sub_category_id=test.sub_category_id,
        sub_category_name=test.sub_category.name if test.sub_category else None,
        status=TestStatus(test.status.value),
        duration_minutes=test.duration_minutes,
        total_marks=test.total_marks,
        passing_marks=test.passing_marks,
        negative_marking=test.negative_marking,
        start_datetime=test.start_datetime,
        end_datetime=test.end_datetime,
        instructions=test.instructions,
        question_file_url=test.question_file_url,
        question_file_name=test.question_file_name,
        created_by=test.created_by,
        created_at=test.created_at,
        updated_at=test.updated_at,
        student_ids=[s.id for s in test.students],
        faculty_ids=[f.id for f in test.faculties],
        batch_ids=[b.id for b in test.batches],
        course_ids=[c.id for c in test.courses],
        question_count=len(test.questions),
    )


def build_test_list_out(test: Test) -> TestListOut:
    return TestListOut(
        id=test.id,
        test_name=test.test_name,
        exam_type=ExamType(test.exam_type.value),
        category=TestCategory(test.category.value),
        sub_category_name=test.sub_category.name if test.sub_category else None,
        status=TestStatus(test.status.value),
        duration_minutes=test.duration_minutes,
        total_marks=test.total_marks,
        question_count=len(test.questions),
        start_datetime=test.start_datetime,
        end_datetime=test.end_datetime,
        created_at=test.created_at,
        course_ids=[c.id for c in test.courses],
        batch_ids=[b.id for b in test.batches],
    )


def build_question_out(question: TestQuestion) -> TestQuestionOut:
    return TestQuestionOut(
        id=question.id,
        test_id=question.test_id,
        question_number=question.question_number,
        question_text=question.question_text,
        question_image_url=question.question_image_url,
        correct_option=question.correct_option,
        marks=question.marks,
        solution=question.solution,
        solution_image_url=question.solution_image_url,
        created_at=question.created_at,
        options=[{
            "id": opt.id,
            "option_number": opt.option_number,
            "option_text": opt.option_text,
            "option_image_url": opt.option_image_url,
        } for opt in sorted(question.options, key=lambda x: x.option_number)]
    )


# ============ Test Sub Category Endpoints ============
@router.get("/sub-categories", response_model=List[TestSubCategoryOut])
def get_sub_categories(
    exam_type: Optional[ExamType] = None,
    db: Session = Depends(get_db)
):
    """Get all test sub-categories, optionally filtered by exam type"""
    query = db.query(TestSubCategory)
    if exam_type:
        query = query.filter(TestSubCategory.exam_type == ExamTypeEnum(exam_type.value))
    sub_cats = query.all()

    result = []
    for sc in sub_cats:
        result.append(TestSubCategoryOut(
            id=sc.id,
            name=sc.name,
            description=sc.description,
            exam_type=ExamType(sc.exam_type.value),
            is_active=sc.is_active,
            created_at=sc.created_at,
            test_count=len(sc.tests),
        ))
    return result


@router.post("/sub-categories", response_model=TestSubCategoryOut)
def create_sub_category(data: TestSubCategoryCreate, db: Session = Depends(get_db)):
    """Create a new test sub-category"""
    sub_cat = TestSubCategory(
        name=data.name,
        description=data.description,
        exam_type=ExamTypeEnum(data.exam_type.value),
        is_active=data.is_active,
    )
    db.add(sub_cat)
    db.commit()
    db.refresh(sub_cat)

    return TestSubCategoryOut(
        id=sub_cat.id,
        name=sub_cat.name,
        description=sub_cat.description,
        exam_type=ExamType(sub_cat.exam_type.value),
        is_active=sub_cat.is_active,
        created_at=sub_cat.created_at,
        test_count=0,
    )


@router.put("/sub-categories/{sub_cat_id}", response_model=TestSubCategoryOut)
def update_sub_category(
    sub_cat_id: int,
    data: TestSubCategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a test sub-category"""
    sub_cat = db.query(TestSubCategory).filter(TestSubCategory.id == sub_cat_id).first()
    if not sub_cat:
        raise HTTPException(status_code=404, detail="Sub-category not found")

    if data.name is not None:
        sub_cat.name = data.name
    if data.description is not None:
        sub_cat.description = data.description
    if data.is_active is not None:
        sub_cat.is_active = data.is_active

    db.commit()
    db.refresh(sub_cat)

    return TestSubCategoryOut(
        id=sub_cat.id,
        name=sub_cat.name,
        description=sub_cat.description,
        exam_type=ExamType(sub_cat.exam_type.value),
        is_active=sub_cat.is_active,
        created_at=sub_cat.created_at,
        test_count=len(sub_cat.tests),
    )


@router.delete("/sub-categories/{sub_cat_id}")
def delete_sub_category(sub_cat_id: int, db: Session = Depends(get_db)):
    """Delete a test sub-category"""
    sub_cat = db.query(TestSubCategory).filter(TestSubCategory.id == sub_cat_id).first()
    if not sub_cat:
        raise HTTPException(status_code=404, detail="Sub-category not found")

    if sub_cat.tests:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete sub-category with existing tests"
        )

    db.delete(sub_cat)
    db.commit()
    return {"message": "Sub-category deleted successfully"}


# ============ Test CRUD Endpoints ============
@router.get("/", response_model=List[TestListOut])
def get_tests(
    exam_type: Optional[ExamType] = None,
    category: Optional[TestCategory] = None,
    sub_category_id: Optional[int] = None,
    status: Optional[TestStatus] = None,
    student_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get all tests with optional filters

    Visibility rules when student_id or faculty_id is provided:
    - Show tests where user is in a batch assigned to the test
    - Show tests where user is directly assigned (in student_ids or faculty_ids)
    - If filtering by course_id: only show tests where user is enrolled in that course
    """
    query = db.query(Test)

    if exam_type:
        query = query.filter(Test.exam_type == ExamTypeEnum(exam_type.value))
    if category:
        query = query.filter(Test.category == TestCategoryEnum(category.value))
    if sub_category_id:
        query = query.filter(Test.sub_category_id == sub_category_id)
    if status:
        query = query.filter(Test.status == TestStatusEnum(status.value))
    if course_id:
        query = query.filter(Test.courses.any(Course.id == course_id))

    tests = query.order_by(Test.created_at.desc()).all()

    # Apply user-specific filtering for students/faculties
    if student_id or faculty_id:
        filtered_tests = []
        for test in tests:
            show_test = False

            if student_id:
                # Get student's batches and courses
                student = db.query(Student).filter(Student.id == student_id).first()
                if student:
                    student_batch_ids = [b.id for b in student.batches]
                    student_course_ids = [c.id for c in student.courses]
                    test_course_ids = [c.id for c in test.courses]

                    # Rule 1: Show if student is in a batch assigned to the test
                    test_batch_ids = [b.id for b in test.batches]
                    if any(batch_id in test_batch_ids for batch_id in student_batch_ids):
                        show_test = True

                    # Rule 2: Show if student is directly assigned to the test
                    elif any(s.id == student_id for s in test.students):
                        # But only if test is not in a course, or student is enrolled in that course
                        if not test_course_ids:
                            show_test = True
                        elif any(course_id in student_course_ids for course_id in test_course_ids):
                            show_test = True

            elif faculty_id:
                # Get faculty's courses
                faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
                if faculty:
                    faculty_course_ids = [c.id for c in faculty.courses]
                    test_course_ids = [c.id for c in test.courses]

                    # Rule 1: Show if faculty is directly assigned to the test
                    if any(f.id == faculty_id for f in test.faculties):
                        # But only if test is not in a course, or faculty teaches that course
                        if not test_course_ids:
                            show_test = True
                        elif any(course_id in faculty_course_ids for course_id in test_course_ids):
                            show_test = True

            if show_test:
                filtered_tests.append(test)

        tests = filtered_tests

    return [build_test_list_out(t) for t in tests]


@router.get("/my-tests", response_model=List[TestListOut])
def get_my_tests(
    exam_type: Optional[ExamType] = None,
    category: Optional[TestCategory] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get tests visible to the current logged-in user

    Visibility rules:
    - ADMIN: See all tests
    - STUDENT: See tests where:
      * Student is in a batch assigned to the test, OR
      * Student is directly assigned to the test AND (test not in course OR student enrolled in that course)
    - FACULTY: See tests where:
      * Faculty is in a batch assigned to the test, OR
      * Faculty is directly assigned to the test AND (test not in course OR faculty teaches that course)
    """
    query = db.query(Test)

    if exam_type:
        query = query.filter(Test.exam_type == ExamTypeEnum(exam_type.value))
    if category:
        query = query.filter(Test.category == TestCategoryEnum(category.value))
    if course_id:
        query = query.filter(Test.courses.any(Course.id == course_id))

    # Admin sees all tests
    if current_user.role == Role.ADMIN:
        tests = query.order_by(Test.created_at.desc()).all()
        return [build_test_list_out(t) for t in tests]

    # For students and faculties, apply visibility rules
    tests = query.order_by(Test.created_at.desc()).all()
    filtered_tests = []

    for test in tests:
        show_test = False

        if current_user.role == Role.STUDENT:
            # Find student by email (assuming email matches)
            student = db.query(Student).filter(Student.email == current_user.email).first()
            if student:
                student_batch_ids = [b.id for b in student.batches]
                student_course_ids = [c.id for c in student.courses]
                test_course_ids = [c.id for c in test.courses]
                test_batch_ids = [b.id for b in test.batches]

                # Rule 1: Show if student is in a batch assigned to the test
                if any(batch_id in test_batch_ids for batch_id in student_batch_ids):
                    show_test = True

                # Rule 2: Show if student is directly assigned to the test
                elif any(s.id == student.id for s in test.students):
                    # But only if test is not in a course, or student is enrolled in that course
                    if not test_course_ids:
                        show_test = True
                    elif any(course_id in student_course_ids for course_id in test_course_ids):
                        show_test = True

        elif current_user.role == Role.FACULTY:
            # Find faculty by email (assuming email matches)
            faculty = db.query(Faculty).filter(Faculty.email == current_user.email).first()
            if faculty:
                faculty_batch_ids = [b.id for b in faculty.batches]
                faculty_course_ids = [c.id for c in faculty.courses]
                test_course_ids = [c.id for c in test.courses]
                test_batch_ids = [b.id for b in test.batches]

                # Rule 1: Show if faculty is in a batch assigned to the test
                if any(batch_id in test_batch_ids for batch_id in faculty_batch_ids):
                    show_test = True

                # Rule 2: Show if faculty is directly assigned to the test
                elif any(f.id == faculty.id for f in test.faculties):
                    # But only if test is not in a course, or faculty teaches that course
                    if not test_course_ids:
                        show_test = True
                    elif any(course_id in faculty_course_ids for course_id in test_course_ids):
                        show_test = True

        if show_test:
            filtered_tests.append(test)

    return [build_test_list_out(t) for t in filtered_tests]


@router.post("/", response_model=TestOut)
def create_test(test: TestCreate, db: Session = Depends(get_db)):
    """Create a new test"""
    db_test = Test(
        test_name=test.test_name,
        description=test.description,
        exam_type=ExamTypeEnum(test.exam_type.value),
        category=TestCategoryEnum(test.category.value),
        sub_category_id=test.sub_category_id,
        duration_minutes=test.duration_minutes,
        total_marks=test.total_marks,
        passing_marks=test.passing_marks,
        negative_marking=test.negative_marking,
        start_datetime=test.start_datetime,
        end_datetime=test.end_datetime,
        instructions=test.instructions,
        question_file_url=test.question_file_url,
        question_file_name=test.question_file_name,
    )

    # Add relationships
    if test.student_ids:
        db_test.students = db.query(Student).filter(Student.id.in_(test.student_ids)).all()
    if test.faculty_ids:
        db_test.faculties = db.query(Faculty).filter(Faculty.id.in_(test.faculty_ids)).all()
    if test.batch_ids:
        db_test.batches = db.query(Batch).filter(Batch.id.in_(test.batch_ids)).all()
    if test.course_ids:
        db_test.courses = db.query(Course).filter(Course.id.in_(test.course_ids)).all()

    db.add(db_test)
    db.commit()
    db.refresh(db_test)

    return build_test_out(db_test)


@router.get("/{test_id}", response_model=TestOut)
def get_test(test_id: int, db: Session = Depends(get_db)):
    """Get a specific test by ID"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return build_test_out(test)


@router.get("/{test_id}/preview", response_model=TestPreview)
def get_test_preview(test_id: int, db: Session = Depends(get_db)):
    """Get test with all questions for preview (admin/faculty only)"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    test_out = build_test_out(test)
    questions = [build_question_out(q) for q in sorted(test.questions, key=lambda x: x.question_number)]

    return TestPreview(
        **test_out.model_dump(),
        questions=questions
    )


@router.put("/{test_id}", response_model=TestOut)
def update_test(test_id: int, update: TestUpdate, db: Session = Depends(get_db)):
    """Update a test"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Update fields
    if update.test_name is not None:
        test.test_name = update.test_name
    if update.description is not None:
        test.description = update.description
    if update.sub_category_id is not None:
        test.sub_category_id = update.sub_category_id
    if update.status is not None:
        test.status = TestStatusEnum(update.status.value)
    if update.duration_minutes is not None:
        test.duration_minutes = update.duration_minutes
    if update.total_marks is not None:
        test.total_marks = update.total_marks
    if update.passing_marks is not None:
        test.passing_marks = update.passing_marks
    if update.negative_marking is not None:
        test.negative_marking = update.negative_marking
    if update.start_datetime is not None:
        test.start_datetime = update.start_datetime
    if update.end_datetime is not None:
        test.end_datetime = update.end_datetime
    if update.instructions is not None:
        test.instructions = update.instructions
    if update.question_file_url is not None:
        test.question_file_url = update.question_file_url
    if update.question_file_name is not None:
        test.question_file_name = update.question_file_name

    # Update relationships
    if update.student_ids is not None:
        test.students = db.query(Student).filter(Student.id.in_(update.student_ids)).all()
    if update.faculty_ids is not None:
        test.faculties = db.query(Faculty).filter(Faculty.id.in_(update.faculty_ids)).all()
    if update.batch_ids is not None:
        test.batches = db.query(Batch).filter(Batch.id.in_(update.batch_ids)).all()
    if update.course_ids is not None:
        test.courses = db.query(Course).filter(Course.id.in_(update.course_ids)).all()

    db.commit()
    db.refresh(test)

    return build_test_out(test)


@router.delete("/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db)):
    """Delete a test"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    db.delete(test)
    db.commit()
    return {"message": "Test deleted successfully"}


# ============ Question Management Endpoints ============
@router.get("/{test_id}/questions", response_model=List[TestQuestionOut])
def get_test_questions(test_id: int, db: Session = Depends(get_db)):
    """Get all questions for a test"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    return [build_question_out(q) for q in sorted(test.questions, key=lambda x: x.question_number)]


@router.post("/{test_id}/questions", response_model=TestQuestionOut)
def add_question(test_id: int, data: TestQuestionCreate, db: Session = Depends(get_db)):
    """Add a question to a test"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if test.category != TestCategoryEnum.PRELIMS:
        raise HTTPException(
            status_code=400,
            detail="Questions can only be added to Prelims tests"
        )

    if len(data.options) != 4:
        raise HTTPException(
            status_code=400,
            detail="Exactly 4 options are required for each question"
        )

    question = TestQuestion(
        test_id=test_id,
        question_number=data.question_number,
        question_text=data.question_text,
        question_image_url=data.question_image_url,
        correct_option=data.correct_option,
        marks=data.marks,
        solution=data.solution,
        solution_image_url=data.solution_image_url,
    )
    db.add(question)
    db.flush()  # Get the question ID

    # Add options
    for opt_data in data.options:
        option = TestQuestionOption(
            question_id=question.id,
            option_number=opt_data.option_number,
            option_text=opt_data.option_text,
            option_image_url=opt_data.option_image_url,
        )
        db.add(option)

    # Update total marks
    test.total_marks = sum(q.marks for q in test.questions) + data.marks

    db.commit()
    db.refresh(question)

    return build_question_out(question)


@router.put("/{test_id}/questions/{question_id}", response_model=TestQuestionOut)
def update_question(
    test_id: int,
    question_id: int,
    data: TestQuestionUpdate,
    db: Session = Depends(get_db)
):
    """Update a question"""
    question = db.query(TestQuestion).filter(
        TestQuestion.id == question_id,
        TestQuestion.test_id == test_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if data.question_number is not None:
        question.question_number = data.question_number
    if data.question_text is not None:
        question.question_text = data.question_text
    if data.question_image_url is not None:
        question.question_image_url = data.question_image_url
    if data.correct_option is not None:
        question.correct_option = data.correct_option
    if data.marks is not None:
        question.marks = data.marks
    if data.solution is not None:
        question.solution = data.solution
    if data.solution_image_url is not None:
        question.solution_image_url = data.solution_image_url

    # Update options if provided
    if data.options is not None:
        # Delete existing options
        db.query(TestQuestionOption).filter(
            TestQuestionOption.question_id == question_id
        ).delete()

        # Add new options
        for opt_data in data.options:
            option = TestQuestionOption(
                question_id=question_id,
                option_number=opt_data.option_number,
                option_text=opt_data.option_text,
                option_image_url=opt_data.option_image_url,
            )
            db.add(option)

    # Update total marks
    test = question.test
    test.total_marks = sum(q.marks for q in test.questions)

    db.commit()
    db.refresh(question)

    return build_question_out(question)


@router.delete("/{test_id}/questions/{question_id}")
def delete_question(test_id: int, question_id: int, db: Session = Depends(get_db)):
    """Delete a question"""
    question = db.query(TestQuestion).filter(
        TestQuestion.id == question_id,
        TestQuestion.test_id == test_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    test = question.test
    marks_to_remove = question.marks

    db.delete(question)

    # Update total marks
    test.total_marks = max(0, test.total_marks - marks_to_remove)

    db.commit()
    return {"message": "Question deleted successfully"}


@router.post("/{test_id}/questions/import", response_model=QuestionImportResult)
async def import_questions(
    test_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import questions from Excel or JSON file"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if test.category != TestCategoryEnum.PRELIMS:
        raise HTTPException(
            status_code=400,
            detail="Questions can only be imported to Prelims tests"
        )

    content = await file.read()
    filename = file.filename.lower() if file.filename else ""

    questions_data = []
    errors = []

    try:
        if filename.endswith('.json'):
            # JSON import
            questions_data = json.loads(content.decode('utf-8'))
        elif filename.endswith(('.xlsx', '.xls')):
            # Excel import
            try:
                import pandas as pd
                df = pd.read_excel(io.BytesIO(content))
                questions_data = df.to_dict('records')
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="pandas and openpyxl required for Excel import"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Use .json or .xlsx"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Get the next question number
    max_q_num = db.query(func.max(TestQuestion.question_number)).filter(
        TestQuestion.test_id == test_id
    ).scalar() or 0

    imported_count = 0
    total_marks_added = 0

    for idx, q_data in enumerate(questions_data):
        try:
            q_num = q_data.get('question_number', max_q_num + idx + 1)
            q_text = q_data.get('question_text', q_data.get('question', ''))

            # Parse correct_option - handle both numeric and "option_N" formats
            correct_opt_raw = str(q_data.get('correct_option', q_data.get('answer', 1)))
            if correct_opt_raw.lower().startswith('option_') or correct_opt_raw.lower().startswith('option'):
                # Extract number from "option_2" or "option2"
                correct_opt = int(''.join(filter(str.isdigit, correct_opt_raw)))
            else:
                correct_opt = int(correct_opt_raw)

            marks = float(q_data.get('marks', 1))
            solution = q_data.get('solution', '')

            if not q_text:
                errors.append(f"Row {idx + 1}: Missing question text")
                continue

            # Get options
            opt_1 = q_data.get('option_1', q_data.get('option1', q_data.get('a', '')))
            opt_2 = q_data.get('option_2', q_data.get('option2', q_data.get('b', '')))
            opt_3 = q_data.get('option_3', q_data.get('option3', q_data.get('c', '')))
            opt_4 = q_data.get('option_4', q_data.get('option4', q_data.get('d', '')))

            if not all([opt_1, opt_2, opt_3, opt_4]):
                errors.append(f"Row {idx + 1}: Missing options")
                continue

            if correct_opt not in [1, 2, 3, 4]:
                errors.append(f"Row {idx + 1}: Invalid correct_option (must be 1-4)")
                continue

            question = TestQuestion(
                test_id=test_id,
                question_number=q_num,
                question_text=q_text,
                correct_option=correct_opt,
                marks=marks,
                solution=solution,
            )
            db.add(question)
            db.flush()

            # Add options
            for i, opt_text in enumerate([opt_1, opt_2, opt_3, opt_4], 1):
                option = TestQuestionOption(
                    question_id=question.id,
                    option_number=i,
                    option_text=str(opt_text),
                )
                db.add(option)

            imported_count += 1
            total_marks_added += marks
            max_q_num = max(max_q_num, q_num)

        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")

    # Update total marks
    test.total_marks += total_marks_added

    db.commit()

    return QuestionImportResult(
        total_imported=imported_count,
        failed_count=len(errors),
        errors=errors[:10]  # Return first 10 errors
    )


# ============ Test Attempt Endpoints ============
@router.post("/{test_id}/start", response_model=TestAttemptOut)
def start_test_attempt(test_id: int, student_id: int, db: Session = Depends(get_db)):
    """Start a test attempt for a student"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if test.status != TestStatusEnum.PUBLISHED:
        raise HTTPException(status_code=400, detail="Test is not published")

    # Check if student has access
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check existing attempt
    existing = db.query(TestAttempt).filter(
        TestAttempt.test_id == test_id,
        TestAttempt.student_id == student_id
    ).first()

    if existing:
        if existing.status == AttemptStatusEnum.SUBMITTED:
            raise HTTPException(status_code=400, detail="Test already submitted")
        if existing.status == AttemptStatusEnum.EVALUATED:
            raise HTTPException(status_code=400, detail="Test already evaluated")
        # Return existing in-progress attempt
        return TestAttemptOut(
            id=existing.id,
            test_id=existing.test_id,
            student_id=existing.student_id,
            status=AttemptStatus(existing.status.value),
            started_at=existing.started_at,
            submitted_at=existing.submitted_at,
            time_taken_seconds=existing.time_taken_seconds,
            answer_file_url=existing.answer_file_url,
            answer_file_name=existing.answer_file_name,
            total_questions=existing.total_questions,
            attempted_questions=existing.attempted_questions,
            correct_answers=existing.correct_answers,
            wrong_answers=existing.wrong_answers,
            score=existing.score,
            percentage=existing.percentage,
            evaluated_by=existing.evaluated_by,
            evaluated_at=existing.evaluated_at,
            evaluation_remarks=existing.evaluation_remarks,
            created_at=existing.created_at,
        )

    # Create new attempt
    attempt = TestAttempt(
        test_id=test_id,
        student_id=student_id,
        status=AttemptStatusEnum.IN_PROGRESS,
        started_at=datetime.utcnow(),
        total_questions=len(test.questions) if test.category == TestCategoryEnum.PRELIMS else None,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return TestAttemptOut(
        id=attempt.id,
        test_id=attempt.test_id,
        student_id=attempt.student_id,
        status=AttemptStatus(attempt.status.value),
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=attempt.time_taken_seconds,
        answer_file_url=attempt.answer_file_url,
        answer_file_name=attempt.answer_file_name,
        total_questions=attempt.total_questions,
        attempted_questions=attempt.attempted_questions,
        correct_answers=attempt.correct_answers,
        wrong_answers=attempt.wrong_answers,
        score=attempt.score,
        percentage=attempt.percentage,
        evaluated_by=attempt.evaluated_by,
        evaluated_at=attempt.evaluated_at,
        evaluation_remarks=attempt.evaluation_remarks,
        created_at=attempt.created_at,
    )


@router.post("/{test_id}/submit/{attempt_id}", response_model=TestAttemptOut)
def submit_test_attempt(
    test_id: int,
    attempt_id: int,
    data: TestAttemptSubmit,
    db: Session = Depends(get_db)
):
    """Submit a test attempt"""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.test_id == test_id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.status != AttemptStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt already submitted")

    test = attempt.test
    now = datetime.utcnow()

    # Calculate time taken
    time_taken = int((now - attempt.started_at).total_seconds()) if attempt.started_at else 0

    attempt.submitted_at = now
    attempt.time_taken_seconds = time_taken
    attempt.status = AttemptStatusEnum.SUBMITTED

    if test.category == TestCategoryEnum.PRELIMS:
        # Process MCQ answers
        correct = 0
        wrong = 0
        attempted = 0
        total_score = 0.0

        # Create a map of question_id -> question for quick lookup
        questions_map = {q.id: q for q in test.questions}

        for ans_data in data.answers:
            if ans_data.question_id not in questions_map:
                continue

            question = questions_map[ans_data.question_id]
            is_correct = ans_data.selected_option == question.correct_option if ans_data.selected_option else None
            marks_obtained = 0.0

            if ans_data.selected_option is not None:
                attempted += 1
                if is_correct:
                    correct += 1
                    marks_obtained = question.marks
                else:
                    wrong += 1
                    marks_obtained = -test.negative_marking

            total_score += marks_obtained

            # Save answer
            answer = TestAnswer(
                attempt_id=attempt_id,
                question_id=ans_data.question_id,
                selected_option=ans_data.selected_option,
                is_correct=is_correct,
                marks_obtained=marks_obtained,
                answered_at=now,
            )
            db.add(answer)

        attempt.attempted_questions = attempted
        attempt.correct_answers = correct
        attempt.wrong_answers = wrong
        attempt.score = max(0, total_score)
        attempt.percentage = (attempt.score / test.total_marks * 100) if test.total_marks > 0 else 0
        attempt.status = AttemptStatusEnum.EVALUATED  # Auto-evaluate prelims

    else:
        # Mains - just save the answer file
        if data.answer_file_url:
            attempt.answer_file_url = data.answer_file_url
            attempt.answer_file_name = data.answer_file_name

    db.commit()
    db.refresh(attempt)

    return TestAttemptOut(
        id=attempt.id,
        test_id=attempt.test_id,
        student_id=attempt.student_id,
        status=AttemptStatus(attempt.status.value),
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=attempt.time_taken_seconds,
        answer_file_url=attempt.answer_file_url,
        answer_file_name=attempt.answer_file_name,
        total_questions=attempt.total_questions,
        attempted_questions=attempt.attempted_questions,
        correct_answers=attempt.correct_answers,
        wrong_answers=attempt.wrong_answers,
        score=attempt.score,
        percentage=attempt.percentage,
        evaluated_by=attempt.evaluated_by,
        evaluated_at=attempt.evaluated_at,
        evaluation_remarks=attempt.evaluation_remarks,
        created_at=attempt.created_at,
    )


@router.get("/{test_id}/attempts", response_model=List[TestAttemptOut])
def get_test_attempts(test_id: int, db: Session = Depends(get_db)):
    """Get all attempts for a test (admin/faculty)"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    attempts = db.query(TestAttempt).filter(TestAttempt.test_id == test_id).all()

    return [
        TestAttemptOut(
            id=a.id,
            test_id=a.test_id,
            student_id=a.student_id,
            status=AttemptStatus(a.status.value),
            started_at=a.started_at,
            submitted_at=a.submitted_at,
            time_taken_seconds=a.time_taken_seconds,
            answer_file_url=a.answer_file_url,
            answer_file_name=a.answer_file_name,
            total_questions=a.total_questions,
            attempted_questions=a.attempted_questions,
            correct_answers=a.correct_answers,
            wrong_answers=a.wrong_answers,
            score=a.score,
            percentage=a.percentage,
            evaluated_by=a.evaluated_by,
            evaluated_at=a.evaluated_at,
            evaluation_remarks=a.evaluation_remarks,
            created_at=a.created_at,
        )
        for a in attempts
    ]


@router.get("/{test_id}/students-with-status", response_model=List[StudentWithAttemptStatus])
def get_students_with_attempt_status(test_id: int, db: Session = Depends(get_db)):
    """Get all eligible students for a test with their attempt status"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Get all eligible students (from batches + directly assigned)
    eligible_students = set()

    # Students from assigned batches
    for batch in test.batches:
        for student in batch.students:
            eligible_students.add(student.id)

    # Directly assigned students
    for student in test.students:
        eligible_students.add(student.id)

    # Get all attempts for this test
    attempts_map = {}
    attempts = db.query(TestAttempt).filter(TestAttempt.test_id == test_id).all()
    for attempt in attempts:
        attempts_map[attempt.student_id] = attempt

    # Build response
    from app.models.student import Student
    result = []
    for student_id in eligible_students:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            continue

        attempt = attempts_map.get(student_id)

        result.append(StudentWithAttemptStatus(
            student_id=student.id,
            student_name=student.name,
            student_email=student.email,
            student_roll_number=student.roll_number,
            attempt_status=AttemptStatus(attempt.status.value) if attempt else None,
            attempt_id=attempt.id if attempt else None,
            score=attempt.score if attempt else None,
            percentage=attempt.percentage if attempt else None,
            submitted_at=attempt.submitted_at if attempt else None,
            total_questions=attempt.total_questions if attempt else None,
            attempted_questions=attempt.attempted_questions if attempt else None,
            correct_answers=attempt.correct_answers if attempt else None,
            wrong_answers=attempt.wrong_answers if attempt else None,
        ))

    # Sort by student name
    result.sort(key=lambda x: x.student_name)

    return result


@router.get("/{test_id}/attempts/{attempt_id}/review", response_model=TestAttemptWithAnswers)
def get_attempt_review(test_id: int, attempt_id: int, db: Session = Depends(get_db)):
    """Get detailed attempt with all answers for review"""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.test_id == test_id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    return TestAttemptWithAnswers(
        id=attempt.id,
        test_id=attempt.test_id,
        student_id=attempt.student_id,
        status=AttemptStatus(attempt.status.value),
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=attempt.time_taken_seconds,
        answer_file_url=attempt.answer_file_url,
        answer_file_name=attempt.answer_file_name,
        total_questions=attempt.total_questions,
        attempted_questions=attempt.attempted_questions,
        correct_answers=attempt.correct_answers,
        wrong_answers=attempt.wrong_answers,
        score=attempt.score,
        percentage=attempt.percentage,
        evaluated_by=attempt.evaluated_by,
        evaluated_at=attempt.evaluated_at,
        evaluation_remarks=attempt.evaluation_remarks,
        created_at=attempt.created_at,
        test_name=attempt.test.test_name,
        answers=[
            {
                "id": ans.id,
                "question_id": ans.question_id,
                "selected_option": ans.selected_option,
                "is_correct": ans.is_correct,
                "marks_obtained": ans.marks_obtained,
                "answered_at": ans.answered_at,
            }
            for ans in attempt.answers
        ]
    )


# ============ Mains Evaluation Endpoint ============
@router.post("/{test_id}/attempts/{attempt_id}/evaluate", response_model=TestAttemptOut)
def evaluate_mains_attempt(
    test_id: int,
    attempt_id: int,
    data: MainsEvaluationCreate,
    evaluator_id: int,  # In real app, get from auth
    db: Session = Depends(get_db)
):
    """Evaluate a mains test attempt"""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.test_id == test_id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    test = attempt.test
    if test.category != TestCategoryEnum.MAINS:
        raise HTTPException(status_code=400, detail="Only mains tests need manual evaluation")

    if attempt.status != AttemptStatusEnum.SUBMITTED:
        raise HTTPException(status_code=400, detail="Attempt not submitted or already evaluated")

    attempt.score = data.score
    attempt.percentage = (data.score / test.total_marks * 100) if test.total_marks > 0 else 0
    attempt.evaluation_remarks = data.remarks
    attempt.evaluated_by = evaluator_id
    attempt.evaluated_at = datetime.utcnow()
    attempt.status = AttemptStatusEnum.EVALUATED

    db.commit()
    db.refresh(attempt)

    return TestAttemptOut(
        id=attempt.id,
        test_id=attempt.test_id,
        student_id=attempt.student_id,
        status=AttemptStatus(attempt.status.value),
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        time_taken_seconds=attempt.time_taken_seconds,
        answer_file_url=attempt.answer_file_url,
        answer_file_name=attempt.answer_file_name,
        total_questions=attempt.total_questions,
        attempted_questions=attempt.attempted_questions,
        correct_answers=attempt.correct_answers,
        wrong_answers=attempt.wrong_answers,
        score=attempt.score,
        percentage=attempt.percentage,
        evaluated_by=attempt.evaluated_by,
        evaluated_at=attempt.evaluated_at,
        evaluation_remarks=attempt.evaluation_remarks,
        created_at=attempt.created_at,
    )


# ============ Statistics Endpoint ============
@router.get("/{test_id}/statistics", response_model=TestStatistics)
def get_test_statistics(test_id: int, db: Session = Depends(get_db)):
    """Get statistics for a test"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    attempts = test.attempts

    # Calculate statistics
    total_students = len(test.students) + sum(len(b.students) for b in test.batches)
    attempted_count = len([a for a in attempts if a.status != AttemptStatusEnum.NOT_STARTED])
    submitted_count = len([a for a in attempts if a.status in [AttemptStatusEnum.SUBMITTED, AttemptStatusEnum.EVALUATED]])
    evaluated_count = len([a for a in attempts if a.status == AttemptStatusEnum.EVALUATED])

    scores = [a.score for a in attempts if a.score is not None]
    avg_score = sum(scores) / len(scores) if scores else None
    highest = max(scores) if scores else None
    lowest = min(scores) if scores else None

    pass_count = 0
    fail_count = 0
    if test.passing_marks:
        pass_count = len([s for s in scores if s >= test.passing_marks])
        fail_count = len([s for s in scores if s < test.passing_marks])

    return TestStatistics(
        test_id=test.id,
        test_name=test.test_name,
        total_students=total_students,
        attempted_count=attempted_count,
        submitted_count=submitted_count,
        evaluated_count=evaluated_count,
        average_score=avg_score,
        highest_score=highest,
        lowest_score=lowest,
        pass_count=pass_count,
        fail_count=fail_count,
    )


# ============ Student Results Endpoint ============
@router.get("/student/{student_id}/results", response_model=List[TestResultSummary])
def get_student_results(student_id: int, db: Session = Depends(get_db)):
    """Get all test results for a student"""
    attempts = db.query(TestAttempt).filter(
        TestAttempt.student_id == student_id,
        TestAttempt.status.in_([AttemptStatusEnum.SUBMITTED, AttemptStatusEnum.EVALUATED])
    ).all()

    return [
        TestResultSummary(
            test_id=a.test.id,
            test_name=a.test.test_name,
            exam_type=ExamType(a.test.exam_type.value),
            category=TestCategory(a.test.category.value),
            status=AttemptStatus(a.status.value),
            total_questions=a.total_questions,
            attempted_questions=a.attempted_questions,
            correct_answers=a.correct_answers,
            wrong_answers=a.wrong_answers,
            score=a.score,
            total_marks=a.test.total_marks,
            percentage=a.percentage,
            time_taken_seconds=a.time_taken_seconds,
            submitted_at=a.submitted_at,
        )
        for a in attempts
    ]
