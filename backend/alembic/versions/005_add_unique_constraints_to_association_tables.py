"""add unique constraints to course association tables

Revision ID: 005_add_unique_constraints
Revises: 004_add_shuffle_questions
Create Date: 2026-02-12

"""
from alembic import op

# revision identifiers
revision = '005_add_unique_constraints'
down_revision = '004_add_shuffle_questions'
branch_labels = None
depends_on = None


def upgrade():
    # Remove duplicates before adding constraints
    for table, col1, col2 in [
        ("course_subject", "course_id", "subject_id"),
        ("course_topic", "course_id", "topic_id"),
        ("course_batch", "course_id", "batch_id"),
        ("course_student", "course_id", "student_id"),
        ("course_faculty", "course_id", "faculty_id"),
    ]:
        op.execute(f"""
            DELETE FROM {table} a USING {table} b
            WHERE a.ctid < b.ctid
            AND a.{col1} = b.{col1} AND a.{col2} = b.{col2}
        """)

    op.create_unique_constraint("uq_course_subject", "course_subject", ["course_id", "subject_id"])
    op.create_unique_constraint("uq_course_topic", "course_topic", ["course_id", "topic_id"])
    op.create_unique_constraint("uq_course_batch", "course_batch", ["course_id", "batch_id"])
    op.create_unique_constraint("uq_course_student", "course_student", ["course_id", "student_id"])
    op.create_unique_constraint("uq_course_faculty", "course_faculty", ["course_id", "faculty_id"])


def downgrade():
    op.drop_constraint("uq_course_subject", "course_subject", type_="unique")
    op.drop_constraint("uq_course_topic", "course_topic", type_="unique")
    op.drop_constraint("uq_course_batch", "course_batch", type_="unique")
    op.drop_constraint("uq_course_student", "course_student", type_="unique")
    op.drop_constraint("uq_course_faculty", "course_faculty", type_="unique")
