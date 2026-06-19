"""Fix ai_model column: drop native enum type, normalize values to lowercase

Revision ID: 002
Revises: 001
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert columns to plain VARCHAR(30), handling both cases:
    # - If the column is a native PostgreSQL ENUM type (created by SQLAlchemy create_all)
    # - If the column is already VARCHAR (created by Alembic migration 001)
    op.execute(
        "ALTER TABLE publications "
        "ALTER COLUMN ai_model TYPE VARCHAR(30) USING ai_model::text"
    )
    op.execute(
        "ALTER TABLE generation_logs "
        "ALTER COLUMN ai_model TYPE VARCHAR(30) USING ai_model::text"
    )

    # Drop the old native enum type if it exists
    op.execute("DROP TYPE IF EXISTS aimodel")

    # Normalize to lowercase (handles uppercase names from create_all, e.g. 'GEMINI' -> 'gemini')
    op.execute("UPDATE publications SET ai_model = lower(ai_model)")
    op.execute("UPDATE generation_logs SET ai_model = lower(ai_model)")

    # Rename openai_dalle -> openai (also handles 'openai_dalle' from value-based enum)
    op.execute("UPDATE publications SET ai_model = 'openai' WHERE ai_model = 'openai_dalle'")
    op.execute("UPDATE generation_logs SET ai_model = 'openai' WHERE ai_model = 'openai_dalle'")

    # Replace any openrouter variants with gemini
    op.execute("UPDATE publications SET ai_model = 'gemini' WHERE ai_model LIKE 'openrouter%'")
    op.execute("UPDATE generation_logs SET ai_model = 'gemini' WHERE ai_model LIKE 'openrouter%'")


def downgrade() -> None:
    # No-op: we can't safely restore the original native enum without knowing the original state
    pass
