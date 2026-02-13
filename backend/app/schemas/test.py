from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


# Enums for API
class ExamType(str, Enum):
    UPSC = "UPSC"
    TNPSC = "TNPSC"


class TestCategory(str, Enum):
    PRELIMS = "PRELIMS"
    MAINS = "MAINS"


class TestStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ActivationMethod(str, Enum):
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"


class AttemptStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"


# ============ Test Sub Category Schemas ============
class TestSubCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    exam_type: ExamType
    is_active: bool = True


class TestSubCategoryCreate(TestSubCategoryBase):
    pass


class TestSubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TestSubCategoryOut(TestSubCategoryBase):
    id: int
    created_at: datetime
    test_count: int = 0

    class Config:
        from_attributes = True


# ============ Test Question Option Schemas ============
class TestQuestionOptionBase(BaseModel):
    option_number: int = Field(..., ge=1, le=4)
    option_text: str
    option_image_url: Optional[str] = None


class TestQuestionOptionCreate(TestQuestionOptionBase):
    pass


class TestQuestionOptionOut(TestQuestionOptionBase):
    id: int

    class Config:
        from_attributes = True


# ============ Test Question Schemas ============
class TestQuestionBase(BaseModel):
    question_number: int
    question_text: str
    question_image_url: Optional[str] = None
    correct_option: int = Field(..., ge=1, le=4)
    marks: float = 1.0
    solution: Optional[str] = None
    solution_image_url: Optional[str] = None


class TestQuestionCreate(TestQuestionBase):
    options: List[TestQuestionOptionCreate]


class TestQuestionUpdate(BaseModel):
    question_number: Optional[int] = None
    question_text: Optional[str] = None
    question_image_url: Optional[str] = None
    correct_option: Optional[int] = Field(None, ge=1, le=4)
    marks: Optional[float] = None
    solution: Optional[str] = None
    solution_image_url: Optional[str] = None
    options: Optional[List[TestQuestionOptionCreate]] = None


class TestQuestionOut(TestQuestionBase):
    id: int
    test_id: int
    options: List[TestQuestionOptionOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TestQuestionPreview(TestQuestionOut):
    """Question with answer visible for preview"""
    pass


# ============ Test Schemas ============
class TestBase(BaseModel):
    test_name: str
    description: Optional[str] = None
    exam_type: ExamType
    category: TestCategory
    sub_category_id: Optional[int] = None
    activation_method: ActivationMethod = ActivationMethod.MANUAL
    shuffle_questions: bool = False
    duration_minutes: Optional[int] = None
    total_marks: float = 0
    passing_marks: Optional[float] = None
    negative_marking: float = 0
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    instructions: Optional[str] = None


class TestCreate(TestBase):
    student_ids: List[int] = []
    faculty_ids: List[int] = []
    batch_ids: List[int] = []
    course_ids: List[int] = []
    # For mains - question file
    question_file_url: Optional[str] = None
    question_file_name: Optional[str] = None


class TestUpdate(BaseModel):
    test_name: Optional[str] = None
    description: Optional[str] = None
    sub_category_id: Optional[int] = None
    activation_method: Optional[ActivationMethod] = None
    shuffle_questions: Optional[bool] = None
    status: Optional[TestStatus] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    negative_marking: Optional[float] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    instructions: Optional[str] = None
    student_ids: Optional[List[int]] = None
    faculty_ids: Optional[List[int]] = None
    batch_ids: Optional[List[int]] = None
    course_ids: Optional[List[int]] = None
    question_file_url: Optional[str] = None
    question_file_name: Optional[str] = None


class TestOut(TestBase):
    id: int
    status: TestStatus
    question_file_url: Optional[str] = None
    question_file_name: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    student_ids: List[int] = []
    faculty_ids: List[int] = []
    batch_ids: List[int] = []
    course_ids: List[int] = []
    question_count: int = 0
    sub_category_name: Optional[str] = None

    class Config:
        from_attributes = True


class TestListOut(BaseModel):
    """Simplified test output for list views"""
    id: int
    test_name: str
    exam_type: ExamType
    category: TestCategory
    sub_category_name: Optional[str] = None
    activation_method: ActivationMethod = ActivationMethod.MANUAL
    status: TestStatus
    duration_minutes: Optional[int] = None
    total_marks: float
    question_count: int = 0
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    created_at: datetime
    course_ids: List[int] = []
    batch_ids: List[int] = []

    class Config:
        from_attributes = True


class TestPreview(TestOut):
    """Test with all questions for preview"""
    questions: List[TestQuestionPreview] = []


# ============ Test Answer Schemas ============
class TestAnswerCreate(BaseModel):
    question_id: int
    selected_option: Optional[int] = Field(None, ge=1, le=4)


class TestAnswerOut(BaseModel):
    id: int
    question_id: int
    selected_option: Optional[int] = None
    is_correct: Optional[bool] = None
    marks_obtained: Optional[float] = None
    answered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Test Attempt Schemas ============
class TestAttemptCreate(BaseModel):
    test_id: int


class TestAttemptSubmit(BaseModel):
    answers: List[TestAnswerCreate] = []
    # For mains
    answer_file_url: Optional[str] = None
    answer_file_name: Optional[str] = None


class TestAttemptOut(BaseModel):
    id: int
    test_id: int
    student_id: int
    status: AttemptStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None
    answer_file_url: Optional[str] = None
    answer_file_name: Optional[str] = None
    total_questions: Optional[int] = None
    attempted_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    wrong_answers: Optional[int] = None
    score: Optional[float] = None
    percentage: Optional[float] = None
    evaluated_by: Optional[int] = None
    evaluated_at: Optional[datetime] = None
    evaluation_remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TestAttemptWithAnswers(TestAttemptOut):
    """Attempt with all answers for review"""
    answers: List[TestAnswerOut] = []
    test_name: str = ""


# ============ Test Result / Evaluation Schemas ============
class TestResultSummary(BaseModel):
    """Summary of test results for a student"""
    test_id: int
    test_name: str
    exam_type: ExamType
    category: TestCategory
    status: AttemptStatus
    total_questions: Optional[int] = None
    attempted_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    wrong_answers: Optional[int] = None
    score: Optional[float] = None
    total_marks: float
    percentage: Optional[float] = None
    time_taken_seconds: Optional[int] = None
    submitted_at: Optional[datetime] = None


class MainsEvaluationCreate(BaseModel):
    """Faculty evaluation for mains test"""
    score: float
    remarks: Optional[str] = None


# ============ Student Attempt Status Schemas ============
class StudentWithAttemptStatus(BaseModel):
    """Student info with their attempt status for a test"""
    student_id: int
    student_name: str
    student_email: str
    student_roll_number: str
    attempt_status: Optional[AttemptStatus] = None
    attempt_id: Optional[int] = None
    score: Optional[float] = None
    percentage: Optional[float] = None
    submitted_at: Optional[datetime] = None
    total_questions: Optional[int] = None
    attempted_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    wrong_answers: Optional[int] = None


# ============ Question Import Schemas ============
class QuestionImportItem(BaseModel):
    question_number: int
    question_text: str
    option_1: str
    option_2: str
    option_3: str
    option_4: str
    correct_option: int = Field(..., ge=1, le=4)
    marks: float = 1.0
    solution: Optional[str] = None


class QuestionImportResult(BaseModel):
    total_imported: int
    failed_count: int
    errors: List[str] = []


# ============ Test Statistics Schemas ============
class TestStatistics(BaseModel):
    test_id: int
    test_name: str
    total_students: int
    attempted_count: int
    submitted_count: int
    evaluated_count: int
    average_score: Optional[float] = None
    highest_score: Optional[float] = None
    lowest_score: Optional[float] = None
    pass_count: int = 0
    fail_count: int = 0
