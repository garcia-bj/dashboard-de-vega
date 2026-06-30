"""Add timezone support to all timestamp columns

Revision ID: 005
Revises: 004
Create Date: 2026-06-29
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Columns that need to change from TIMESTAMP → TIMESTAMPTZ
_TIMESTAMP_COLUMNS = {
    "users": ["created_at", "updated_at"],
    "social_accounts": ["created_at"],
    "publications": ["scheduled_at", "published_at", "created_at", "updated_at"],
    "generation_logs": ["created_at"],
    "publish_logs": ["created_at"],
    "video_projects": ["created_at", "updated_at"],
}


def upgrade() -> None:
    """Convert TIMESTAMP columns to TIMESTAMPTZ. Existing values were written in UTC
    by datetime.utcnow(), so we interpret them as UTC to preserve correctness."""
    for table, columns in _TIMESTAMP_COLUMNS.items():
        for col in columns:
            op.alter_column(
                table,
                col,
                type_=sa.DateTime(timezone=True),
                existing_type=sa.DateTime(),
                postgresql_using=f"{col} AT TIME ZONE 'UTC'",
            )


def downgrade() -> None:
    """Convert TIMESTAMPTZ back to TIMESTAMP, extracting the UTC time."""
    for table, columns in _TIMESTAMP_COLUMNS.items():
        for col in columns:
            op.alter_column(
                table,
                col,
                type_=sa.DateTime(),
                existing_type=sa.DateTime(timezone=True),
                postgresql_using=f"{col} AT TIME ZONE 'UTC'",
            )
