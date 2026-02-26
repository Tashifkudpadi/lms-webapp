"""add subject_id to tests table

Revision ID: 007_add_subject_id_to_tests
Revises: 006_add_zoom_classes
Create Date: 2026-02-25

"""
from alembic import op
import sqlalchemy as sa

revision = '007_add_subject_id_to_tests'
down_revision = '006_add_zoom_classes'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tests', sa.Column('subject_id', sa.Integer(), sa.ForeignKey('subjects.id'), nullable=True))


def downgrade():
    op.drop_column('tests', 'subject_id')
