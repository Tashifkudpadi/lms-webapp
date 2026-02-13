"""add shuffle_questions column to tests table

Revision ID: 004_add_shuffle_questions
Revises: 003_add_activation_method
Create Date: 2026-02-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_shuffle_questions'
down_revision = '003_add_activation_method'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'tests',
        sa.Column('shuffle_questions', sa.Boolean(), server_default='false')
    )


def downgrade():
    op.drop_column('tests', 'shuffle_questions')
