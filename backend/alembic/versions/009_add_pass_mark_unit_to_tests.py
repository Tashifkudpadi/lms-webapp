"""add pass_mark_unit to tests table

Revision ID: 009_add_pass_mark_unit
Revises: 008_add_subj_topic_to_ques
Create Date: 2026-03-02

"""
from alembic import op
import sqlalchemy as sa

revision = '009_add_pass_mark_unit'
down_revision = '008_add_subj_topic_to_ques'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tests', sa.Column('pass_mark_unit', sa.String(), server_default='percentage', nullable=True))


def downgrade():
    op.drop_column('tests', 'pass_mark_unit')
