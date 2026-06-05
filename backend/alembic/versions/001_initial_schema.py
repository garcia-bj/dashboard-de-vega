"""Initial schema: users, social_accounts, publications, generation_logs, publish_logs

Revision ID: 001
Revises:
Create Date: 2026-06-05
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("meta_data", JSONB),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_role", "users", ["role"])

    op.create_table(
        "social_accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("page_id", sa.String(100), nullable=False),
        sa.Column("page_name", sa.String(255), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("token_expires_at", sa.DateTime()),
        sa.Column("instagram_business_id", sa.String(100)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_social_accounts_user", "social_accounts", ["user_id"])
    op.create_index("idx_social_accounts_provider", "social_accounts", ["provider"])

    op.create_table(
        "publications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("caption", sa.Text()),
        sa.Column("ai_model", sa.String(30), nullable=False, server_default="gemini"),
        sa.Column("image_url", sa.Text()),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("targets", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("published_at", sa.DateTime()),
        sa.Column("meta_data", JSONB),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_publications_user", "publications", ["user_id"])
    op.create_index("idx_publications_status", "publications", ["status"])
    op.create_index("idx_publications_scheduled", "publications", ["scheduled_at"])
    op.create_index("idx_publications_ai_model", "publications", ["ai_model"])

    op.create_table(
        "generation_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("publication_id", UUID(as_uuid=True), sa.ForeignKey("publications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ai_model", sa.String(30), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text()),
        sa.Column("request_payload", JSONB),
        sa.Column("response_payload", JSONB),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("cost_usd", sa.Float()),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_gen_logs_publication", "generation_logs", ["publication_id"])
    op.create_index("idx_gen_logs_ai_model", "generation_logs", ["ai_model"])
    op.create_index("idx_gen_logs_created", "generation_logs", ["created_at"])

    op.create_table(
        "publish_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("publication_id", UUID(as_uuid=True), sa.ForeignKey("publications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("social_account_id", UUID(as_uuid=True), sa.ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target", sa.String(20), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("meta_post_id", sa.String(100)),
        sa.Column("meta_permalink", sa.Text()),
        sa.Column("error_message", sa.Text()),
        sa.Column("response_payload", JSONB),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_pub_logs_publication", "publish_logs", ["publication_id"])
    op.create_index("idx_pub_logs_social_account", "publish_logs", ["social_account_id"])
    op.create_index("idx_pub_logs_target", "publish_logs", ["target"])
    op.create_index("idx_pub_logs_success", "publish_logs", ["success"])


def downgrade() -> None:
    op.drop_table("publish_logs")
    op.drop_table("generation_logs")
    op.drop_table("publications")
    op.drop_table("social_accounts")
    op.drop_table("users")
