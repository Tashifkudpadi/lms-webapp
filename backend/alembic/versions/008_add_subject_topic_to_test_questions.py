"""add subject_id and topic_id to test_questions table

Revision ID: 008_add_subj_topic_to_ques
Revises: 007_add_subject_id_to_tests
Create Date: 2026-02-25

"""
from alembic import op
import sqlalchemy as sa

revision = '008_add_subj_topic_to_ques'
down_revision = '007_add_subject_id_to_tests'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('test_questions', sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id'), nullable=True))
    op.add_column('test_questions', sa.Column('topic_id', sa.Integer(), sa.ForeignKey('topics.id'), nullable=True))


def downgrade():
    op.drop_column('test_questions', 'topic_id')
    op.drop_column('test_questions', 'subject_id')
