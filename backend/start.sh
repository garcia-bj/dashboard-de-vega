#!/bin/sh
set -e

cd /app

# If the app tables exist but alembic_version doesn't, the DB was created by
# SQLAlchemy create_all() instead of Alembic. Stamp revision 001 so Alembic
# knows migration 001 is already applied and only runs 002+.
python3 - <<'PYEOF'
import asyncio, sys
sys.path.insert(0, '/app')

async def ensure_alembic_state():
    from app.config import get_settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    engine = create_async_engine(get_settings().DATABASE_URL)
    try:
        async with engine.connect() as conn:
            r = await conn.execute(text(
                "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='alembic_version')"
            ))
            if not r.scalar():
                r2 = await conn.execute(text(
                    "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='users')"
                ))
                if r2.scalar():
                    print("Tables exist without Alembic history — stamping revision 001")
                    await conn.execute(text(
                        "CREATE TABLE alembic_version "
                        "(version_num VARCHAR(32) NOT NULL, PRIMARY KEY (version_num))"
                    ))
                    await conn.execute(text("INSERT INTO alembic_version VALUES ('001')"))
                    await conn.commit()
    finally:
        await engine.dispose()

asyncio.run(ensure_alembic_state())
PYEOF

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
