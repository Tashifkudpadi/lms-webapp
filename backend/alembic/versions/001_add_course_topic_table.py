"""add course_topic association table

Revision ID: 001_add_course_topic
Revises:
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_course_topic'
down_revision = '0526b437890f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'course_topic',
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', sa.Integer(), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False),
        sa.PrimaryKeyConstraint('course_id', 'topic_id')
    )


def downgrade():
    op.drop_table('course_topic')
