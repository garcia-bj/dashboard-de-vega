"""Add video_projects table

Revision ID: 004
Revises: 003
Create Date: 2026-06-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE videostatus AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED')")
    op.create_table(
        "video_projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("source_video_url", sa.Text(), nullable=False),
        sa.Column("edited_video_url", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "PROCESSING", "DONE", "FAILED", name="videostatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("meta_data", JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_video_projects_user", "video_projects", ["user_id"])
    op.create_index("idx_video_projects_status", "video_projects", ["status"])


def downgrade() -> None:
    op.drop_index("idx_video_projects_status", table_name="video_projects")
    op.drop_index("idx_video_projects_user", table_name="video_projects")
    op.drop_table("video_projects")
    op.execute("DROP TYPE IF EXISTS videostatus")
