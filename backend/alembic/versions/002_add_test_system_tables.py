"""add comprehensive test system tables

Revision ID: 002_add_test_system
Revises: 001_add_course_topic
Create Date: 2026-01-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '002_add_test_system'
down_revision = '001_add_course_topic'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types using raw SQL (most reliable approach)
    op.execute("CREATE TYPE examtypeenum AS ENUM ('UPSC', 'TNPSC')")
    op.execute("CREATE TYPE testcategoryenum AS ENUM ('PRELIMS', 'MAINS')")
    op.execute("CREATE TYPE teststatusenum AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED')")
    op.execute("CREATE TYPE attemptstatusenum AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED')")

    # Use postgresql.ENUM with create_type=False since we already created them
    exam_type_enum = postgresql.ENUM('UPSC', 'TNPSC', name='examtypeenum', create_type=False)
    test_category_enum = postgresql.ENUM('PRELIMS', 'MAINS', name='testcategoryenum', create_type=False)
    test_status_enum = postgresql.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', name='teststatusenum', create_type=False)
    attempt_status_enum = postgresql.ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED', name='attemptstatusenum', create_type=False)

    # Create test_sub_categories table
    op.create_table(
        'test_sub_categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('exam_type', exam_type_enum, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # Alter existing tests table to add new columns
    op.add_column('tests', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('tests', sa.Column('exam_type', exam_type_enum, nullable=True))
    op.add_column('tests', sa.Column('category', test_category_enum, nullable=True))
    op.add_column('tests', sa.Column('sub_category_id', sa.Integer(), sa.ForeignKey('test_sub_categories.id'), nullable=True))
    op.add_column('tests', sa.Column('status', test_status_enum, server_default='DRAFT'))
    op.add_column('tests', sa.Column('duration_minutes', sa.Integer(), nullable=True))
    op.add_column('tests', sa.Column('total_marks', sa.Float(), default=0))
    op.add_column('tests', sa.Column('passing_marks', sa.Float(), nullable=True))
    op.add_column('tests', sa.Column('negative_marking', sa.Float(), default=0))
    op.add_column('tests', sa.Column('start_datetime', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tests', sa.Column('end_datetime', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tests', sa.Column('instructions', sa.Text(), nullable=True))
    op.add_column('tests', sa.Column('question_file_url', sa.String(), nullable=True))
    op.add_column('tests', sa.Column('question_file_name', sa.String(), nullable=True))
    op.add_column('tests', sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('tests', sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=True, server_default=sa.text('now()')))
    op.add_column('tests', sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=True))

    # Create test_batch association table
    op.create_table(
        'test_batch',
        sa.Column('test_id', sa.Integer(), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False),
        sa.PrimaryKeyConstraint('test_id', 'batch_id')
    )

    # Create test_course association table
    op.create_table(
        'test_course',
        sa.Column('test_id', sa.Integer(), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.PrimaryKeyConstraint('test_id', 'course_id')
    )

    # Create test_questions table
    op.create_table(
        'test_questions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('test_id', sa.Integer(), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_number', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_image_url', sa.String(), nullable=True),
        sa.Column('correct_option', sa.Integer(), nullable=False),
        sa.Column('marks', sa.Float(), default=1),
        sa.Column('solution', sa.Text(), nullable=True),
        sa.Column('solution_image_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # Create test_question_options table
    op.create_table(
        'test_question_options',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('question_id', sa.Integer(), sa.ForeignKey('test_questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('option_number', sa.Integer(), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('option_image_url', sa.String(), nullable=True),
    )

    # Re-define attempt_status_enum for the table creation
    attempt_status_enum_col = postgresql.ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED', name='attemptstatusenum', create_type=False)

    # Create test_attempts table
    op.create_table(
        'test_attempts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('test_id', sa.Integer(), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', attempt_status_enum_col, server_default='NOT_STARTED'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
        sa.Column('answer_file_url', sa.String(), nullable=True),
        sa.Column('answer_file_name', sa.String(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=True),
        sa.Column('attempted_questions', sa.Integer(), nullable=True),
        sa.Column('correct_answers', sa.Integer(), nullable=True),
        sa.Column('wrong_answers', sa.Integer(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('percentage', sa.Float(), nullable=True),
        sa.Column('evaluated_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('evaluation_remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # Create test_answers table
    op.create_table(
        'test_answers',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('attempt_id', sa.Integer(), sa.ForeignKey('test_attempts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_id', sa.Integer(), sa.ForeignKey('test_questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('selected_option', sa.Integer(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('marks_obtained', sa.Float(), nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    # Drop tables in reverse order
    op.drop_table('test_answers')
    op.drop_table('test_attempts')
    op.drop_table('test_question_options')
    op.drop_table('test_questions')
    op.drop_table('test_course')
    op.drop_table('test_batch')

    # Remove columns from tests table
    op.drop_column('tests', 'updated_at')
    op.drop_column('tests', 'created_at')
    op.drop_column('tests', 'created_by')
    op.drop_column('tests', 'question_file_name')
    op.drop_column('tests', 'question_file_url')
    op.drop_column('tests', 'instructions')
    op.drop_column('tests', 'end_datetime')
    op.drop_column('tests', 'start_datetime')
    op.drop_column('tests', 'negative_marking')
    op.drop_column('tests', 'passing_marks')
    op.drop_column('tests', 'total_marks')
    op.drop_column('tests', 'duration_minutes')
    op.drop_column('tests', 'status')
    op.drop_column('tests', 'sub_category_id')
    op.drop_column('tests', 'category')
    op.drop_column('tests', 'exam_type')
    op.drop_column('tests', 'description')

    op.drop_table('test_sub_categories')

    # Drop enum types
    sa.Enum(name='attemptstatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='teststatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='testcategoryenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='examtypeenum').drop(op.get_bind(), checkfirst=True)
