"""Update AImodel enum: remove openrouter variants, rename openai_dalle to openai

Revision ID: 002
Revises: 001
Create Date: 2026-06-18
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename openai_dalle → openai in existing rows
    op.execute("UPDATE publications SET ai_model = 'openai' WHERE ai_model IN ('openai_dalle')")
    op.execute("UPDATE generation_logs SET ai_model = 'openai' WHERE ai_model IN ('openai_dalle')")

    # Replace openrouter rows with gemini (fallback) so the enum change doesn't break constraints
    op.execute("UPDATE publications SET ai_model = 'gemini' WHERE ai_model IN ('openrouter_flux', 'openrouter_stable_diffusion')")
    op.execute("UPDATE generation_logs SET ai_model = 'gemini' WHERE ai_model IN ('openrouter_flux', 'openrouter_stable_diffusion')")

    # Alter the PostgreSQL ENUM type by creating a new one and swapping
    op.execute("ALTER TYPE aimodel RENAME TO aimodel_old")
    op.execute("CREATE TYPE aimodel AS ENUM ('gemini', 'openai')")
    op.execute("ALTER TABLE publications ALTER COLUMN ai_model TYPE aimodel USING ai_model::text::aimodel")
    op.execute("ALTER TABLE generation_logs ALTER COLUMN ai_model TYPE aimodel USING ai_model::text::aimodel")
    op.execute("DROP TYPE aimodel_old")


def downgrade() -> None:
    op.execute("ALTER TYPE aimodel RENAME TO aimodel_old")
    op.execute("CREATE TYPE aimodel AS ENUM ('gemini', 'openai_dalle', 'openrouter_flux', 'openrouter_stable_diffusion')")
    op.execute("ALTER TABLE publications ALTER COLUMN ai_model TYPE aimodel USING ai_model::text::aimodel")
    op.execute("ALTER TABLE generation_logs ALTER COLUMN ai_model TYPE aimodel USING ai_model::text::aimodel")
    op.execute("DROP TYPE aimodel_old")
