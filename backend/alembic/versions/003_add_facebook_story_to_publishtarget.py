"""Add FACEBOOK_STORY to publishtarget enum

Revision ID: 003
Revises: 002
Create Date: 2026-06-21
"""
from typing import Sequence, Union
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires the value to match the case used at enum creation.
    # SQLAlchemy's SAEnum(PublishTarget) uses member NAMES (uppercase) as the
    # PostgreSQL enum values, so we add 'FACEBOOK_STORY' in uppercase.
    op.execute("ALTER TYPE publishtarget ADD VALUE IF NOT EXISTS 'FACEBOOK_STORY'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op on downgrade.
    pass
