"""add ON DELETE CASCADE to publish_logs and generation_logs

Revision ID: 004
Revises: 003
Create Date: 2026-06-22
"""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Clean up orphaned rows (logs whose parent publication was deleted without CASCADE)
    op.execute("""
        DELETE FROM publish_logs
        WHERE publication_id NOT IN (SELECT id FROM publications)
    """)
    op.execute("""
        DELETE FROM generation_logs
        WHERE publication_id NOT IN (SELECT id FROM publications)
    """)

    # 2. Re-create publish_logs FK with ON DELETE CASCADE
    op.execute("""
        ALTER TABLE publish_logs
        DROP CONSTRAINT IF EXISTS publish_logs_publication_id_fkey
    """)
    op.execute("""
        ALTER TABLE publish_logs
        ADD CONSTRAINT publish_logs_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
    """)

    # 3. Re-create generation_logs FK with ON DELETE CASCADE
    op.execute("""
        ALTER TABLE generation_logs
        DROP CONSTRAINT IF EXISTS generation_logs_publication_id_fkey
    """)
    op.execute("""
        ALTER TABLE generation_logs
        ADD CONSTRAINT generation_logs_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE publish_logs
        DROP CONSTRAINT IF EXISTS publish_logs_publication_id_fkey
    """)
    op.execute("""
        ALTER TABLE publish_logs
        ADD CONSTRAINT publish_logs_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id)
    """)

    op.execute("""
        ALTER TABLE generation_logs
        DROP CONSTRAINT IF EXISTS generation_logs_publication_id_fkey
    """)
    op.execute("""
        ALTER TABLE generation_logs
        ADD CONSTRAINT generation_logs_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id)
    """)
