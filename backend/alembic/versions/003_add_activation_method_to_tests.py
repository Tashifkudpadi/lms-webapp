"""add activation_method column to tests table

Revision ID: 003_add_activation_method
Revises: 002_add_test_system
Create Date: 2026-02-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '003_add_activation_method'
down_revision = '002_add_test_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create the enum type
    op.execute("CREATE TYPE activationmethodenum AS ENUM ('MANUAL', 'SCHEDULED')")

    activation_method_enum = postgresql.ENUM(
        'MANUAL', 'SCHEDULED',
        name='activationmethodenum',
        create_type=False
    )

    op.add_column(
        'tests',
        sa.Column('activation_method', activation_method_enum, server_default='MANUAL')
    )


def downgrade():
    op.drop_column('tests', 'activation_method')
    sa.Enum(name='activationmethodenum').drop(op.get_bind(), checkfirst=True)
