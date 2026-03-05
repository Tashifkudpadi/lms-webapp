from sqlalchemy import Column, Integer, String, Text, Boolean, Table, ForeignKey, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql.expression import text
from app.database import Base
import enum


# Enums
class ExamTypeEnum(str, enum.Enum):
    UPSC = "UPSC"
    TNPSC = "TNPSC"


class TestCategoryEnum(str, enum.Enum):
    PRELIMS = "PRELIMS"
    MAINS = "MAINS"


class TestStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ActivationMethodEnum(str, enum.Enum):
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"


class AttemptStatusEnum(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"


# Association tables
test_student = Table(
    "test_student",
    Base.metadata,
    Column("test_id", Integer, ForeignKey("tests.id", ondelete="CASCADE")),
    Column("student_id", Integer, ForeignKey("students.id", ondelete="CASCADE")),
)

test_faculty = Table(
    "test_faculty",
    Base.metadata,
    Column("test_id", Integer, ForeignKey("tests.id", ondelete="CASCADE")),
    Column("faculty_id", Integer, ForeignKey("faculties.id", ondelete="CASCADE")),
)

test_batch = Table(
    "test_batch",
    Base.metadata,
    Column("test_id", Integer, ForeignKey("tests.id", ondelete="CASCADE")),
    Column("batch_id", Integer, ForeignKey("batches.id", ondelete="CASCADE")),
)

test_course = Table(
    "test_course",
    Base.metadata,
    Column("test_id", Integer, ForeignKey("tests.id", ondelete="CASCADE")),
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
)


class TestSubCategory(Base):
    """Sub-categories under Prelims (e.g., 'General Studies', 'CSAT', etc.)"""
    __tablename__ = "test_sub_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    exam_type = Column(SQLEnum(ExamTypeEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    # Relationships
    tests = relationship("Test", back_populates="sub_category")


class Test(Base):
    """Main test model with all configurations"""
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Test classification
    exam_type = Column(SQLEnum(ExamTypeEnum), nullable=False)
    category = Column(SQLEnum(TestCategoryEnum), nullable=False)
    sub_category_id = Column(Integer, ForeignKey("test_sub_categories.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)

    # Test settings
    status = Column(SQLEnum(TestStatusEnum), default=TestStatusEnum.DRAFT)
    duration_minutes = Column(Integer, nullable=True)  # Test duration in minutes
    total_marks = Column(Float, default=0)
    passing_marks = Column(Float, nullable=True)
    pass_mark_unit = Column(String, default="percentage")  # "percentage", "point"
    negative_marking = Column(Float, default=0)  # Negative marks per wrong answer

    # Activation
    activation_method = Column(SQLEnum(ActivationMethodEnum), default=ActivationMethodEnum.MANUAL)
    shuffle_questions = Column(Boolean, default=False)

    # Schedule
    start_datetime = Column(DateTime(timezone=True), nullable=True)
    end_datetime = Column(DateTime(timezone=True), nullable=True)

    # Instructions
    instructions = Column(Text, nullable=True)

    # For Mains - Question paper PDF
    question_file_url = Column(String, nullable=True)
    question_file_name = Column(String, nullable=True)

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True, onupdate=text('now()'))

    # Relationships
    sub_category = relationship("TestSubCategory", back_populates="tests")
    students = relationship("Student", secondary=test_student, back_populates="tests")
    faculties = relationship("Faculty", secondary=test_faculty, back_populates="tests")
    batches = relationship("Batch", secondary=test_batch, backref="tests")
    courses = relationship("Course", secondary=test_course, backref="tests")
    questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")


class TestQuestion(Base):
    """Questions for Prelims (MCQ) tests"""
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)

    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_image_url = Column(String, nullable=True)  # Optional image for question

    # Subject/Topic classification
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)

    # Correct answer index (1, 2, 3, or 4)
    correct_option = Column(Integer, nullable=False)
    marks = Column(Float, default=1)

    # Solution/Explanation
    solution = Column(Text, nullable=True)
    solution_image_url = Column(String, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    # Relationships
    test = relationship("Test", back_populates="questions")
    options = relationship("TestQuestionOption", back_populates="question", cascade="all, delete-orphan")
    subject = relationship("Subject", foreign_keys=[subject_id])
    topic = relationship("Topic", foreign_keys=[topic_id])


class TestQuestionOption(Base):
    """Options for MCQ questions"""
    __tablename__ = "test_question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("test_questions.id", ondelete="CASCADE"), nullable=False)

    option_number = Column(Integer, nullable=False)  # 1, 2, 3, or 4
    option_text = Column(Text, nullable=False)
    option_image_url = Column(String, nullable=True)

    # Relationships
    question = relationship("TestQuestion", back_populates="options")


class TestAttempt(Base):
    """Student's test attempt"""
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    status = Column(SQLEnum(AttemptStatusEnum), default=AttemptStatusEnum.NOT_STARTED)

    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)

    # For Mains - Answer file upload
    answer_file_url = Column(String, nullable=True)
    answer_file_name = Column(String, nullable=True)

    # Results
    total_questions = Column(Integer, nullable=True)
    attempted_questions = Column(Integer, nullable=True)
    correct_answers = Column(Integer, nullable=True)
    wrong_answers = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)

    # For Mains - Faculty evaluation
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=True)
    evaluation_remarks = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    # Relationships
    test = relationship("Test", back_populates="attempts")
    student = relationship("Student", backref="test_attempts")
    answers = relationship("TestAnswer", back_populates="attempt", cascade="all, delete-orphan")


class TestAnswer(Base):
    """Individual answer for each question in an attempt"""
    __tablename__ = "test_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("test_questions.id", ondelete="CASCADE"), nullable=False)

    selected_option = Column(Integer, nullable=True)  # 1, 2, 3, 4, or null if skipped
    is_correct = Column(Boolean, nullable=True)
    marks_obtained = Column(Float, nullable=True)

    answered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    attempt = relationship("TestAttempt", back_populates="answers")
    question = relationship("TestQuestion")
