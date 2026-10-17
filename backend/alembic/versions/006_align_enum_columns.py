"""Alinear las columnas enum con los modelos ORM

La migración 001 creó users.role, social_accounts.provider,
publications.status y publish_logs.target como VARCHAR, mientras que los
modelos las declaran con SAEnum. En bases creadas con create_all() el tipo
nativo existía y todo funcionaba; en una base creada solo por Alembic el
INSERT falla con 'type userrole does not exist'.

Esta migración crea los tipos que falten y convierte las columnas que aún
sean VARCHAR. Es idempotente: si la columna ya es un enum, no la toca.

Revision ID: 006
Revises: 005
Create Date: 2026-10-17
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Nombre del tipo en PostgreSQL -> valores (SQLAlchemy SAEnum usa los NOMBRES)
_ENUMS = {
    "userrole": ("ADMIN", "USER"),
    "socialprovider": ("FACEBOOK", "INSTAGRAM"),
    "publicationstatus": (
        "DRAFT",
        "PENDING",
        "GENERATING",
        "GENERATED",
        "SCHEDULED",
        "PUBLISHING",
        "PUBLISHED",
        "FAILED",
    ),
    "publishtarget": (
        "FACEBOOK_FEED",
        "FACEBOOK_STORY",
        "INSTAGRAM_FEED",
        "INSTAGRAM_STORY",
    ),
    "videostatus": ("PENDING", "PROCESSING", "DONE", "FAILED"),
}

# tabla, columna, tipo enum, default del servidor (None = sin default)
_COLUMNS = (
    ("users", "role", "userrole", "USER"),
    ("social_accounts", "provider", "socialprovider", None),
    ("publications", "status", "publicationstatus", "DRAFT"),
    ("publish_logs", "target", "publishtarget", None),
    ("video_projects", "status", "videostatus", "PENDING"),
)


def _create_types(bind) -> None:
    for name, values in _ENUMS.items():
        vals = ", ".join(f"'{v}'" for v in values)
        bind.execute(
            sa.text(
                f"DO $$ BEGIN CREATE TYPE {name} AS ENUM ({vals}); "
                "EXCEPTION WHEN duplicate_object THEN null; END $$;"
            )
        )


def upgrade() -> None:
    bind = op.get_bind()
    _create_types(bind)

    for table, column, enum, default in _COLUMNS:
        row = bind.execute(
            sa.text(
                "SELECT data_type FROM information_schema.columns "
                "WHERE table_schema = current_schema() "
                "AND table_name = :t AND column_name = :c"
            ),
            {"t": table, "c": column},
        ).first()

        # La tabla no existe o la columna ya es un enum nativo: nada que hacer.
        if row is None or row[0] == "USER-DEFINED":
            continue

        bind.execute(sa.text(f"ALTER TABLE {table} ALTER COLUMN {column} DROP DEFAULT"))
        bind.execute(
            sa.text(
                f"ALTER TABLE {table} ALTER COLUMN {column} "
                f"TYPE {enum} USING upper({column}::text)::{enum}"
            )
        )
        if default is not None:
            bind.execute(
                sa.text(
                    f"ALTER TABLE {table} ALTER COLUMN {column} SET DEFAULT '{default}'"
                )
            )


def downgrade() -> None:
    # No se revierte: volver a VARCHAR perdería la validación del enum y no
    # hay forma segura de adivinar el estado previo (create_all vs Alembic).
    pass
