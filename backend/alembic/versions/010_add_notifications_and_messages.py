"""add notifications and messages tables

Revision ID: 010_notif_messages
Revises: 009_add_pass_mark_unit
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '010_notif_messages'
down_revision = '009_add_pass_mark_unit'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum type safely (may already exist from model loading)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE notificationtypeenum AS ENUM (
                'COURSE_ADDED', 'COURSE_REMOVED', 'TEST_ASSIGNED', 'TEST_EXPIRY',
                'TEST_SUBMITTED', 'TEST_EVALUATED', 'MESSAGE'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create tables using raw SQL to avoid SQLAlchemy trying to re-create the enum
    op.execute("""
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type notificationtypeenum NOT NULL,
            title VARCHAR NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
            test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        CREATE INDEX ix_notifications_user_id ON notifications(user_id);
        CREATE INDEX ix_notifications_is_read ON notifications(is_read);
    """)

    op.execute("""
        CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        CREATE INDEX ix_messages_course_id ON messages(course_id);
        CREATE INDEX ix_messages_recipient_id ON messages(recipient_id);
    """)


def downgrade():
    op.execute('DROP TABLE IF EXISTS messages')
    op.execute('DROP TABLE IF EXISTS notifications')
    op.execute('DROP TYPE IF EXISTS notificationtypeenum')
