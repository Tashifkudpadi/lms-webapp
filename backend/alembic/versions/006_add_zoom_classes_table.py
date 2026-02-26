"""add zoom_classes table

Revision ID: 006_add_zoom_classes
Revises: 005_add_unique_constraints
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa

revision = '006_add_zoom_classes'
down_revision = '005_add_unique_constraints'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'zoom_classes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True),
        sa.Column('faculty_id', sa.Integer(), sa.ForeignKey('faculties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('class_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('zoom_url', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_zoom_classes_course_id', 'zoom_classes', ['course_id'])
    op.create_index('ix_zoom_classes_class_date', 'zoom_classes', ['class_date'])


def downgrade():
    op.drop_index('ix_zoom_classes_class_date')
    op.drop_index('ix_zoom_classes_course_id')
    op.drop_table('zoom_classes')
