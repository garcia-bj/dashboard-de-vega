"""Add video_projects table

Revision ID: 004
Revises: 003
Create Date: 2026-06-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type (safe if already exists)
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE videostatus AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    # Create table only if it doesn't exist
    op.execute("""
    CREATE TABLE IF NOT EXISTS video_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        source_video_url TEXT NOT NULL,
        edited_video_url TEXT,
        status videostatus NOT NULL DEFAULT 'PENDING',
        meta_data JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
    );
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_video_projects_user ON video_projects (user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects (status);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS video_projects;")
    op.execute("DROP TYPE IF EXISTS videostatus;")
