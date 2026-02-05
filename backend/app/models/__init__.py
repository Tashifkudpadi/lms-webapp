from app.database import Base
from .user import User, Role  # type: ignore
from .student import Student  # type: ignore
from .faculty import Faculty  # type: ignore
from .subject import Subject  # type: ignore
from .faculty_subject import FacultySubject  # type: ignore
from .batch import Batch  # type: ignore
from .topic import Topic  # type: ignore
from .course import Course  # type: ignore
from .course_content import CourseContent  # type: ignore
from .test import (  # type: ignore
    Test,
    TestSubCategory,
    TestQuestion,
    TestQuestionOption,
    TestAttempt,
    TestAnswer,
    ExamTypeEnum,
    TestCategoryEnum,
    TestStatusEnum,
    AttemptStatusEnum,
)
