from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import get_settings
from app.db.database import init_db, async_session
from app.routers import auth, publications, social, media, settings as settings_router, publish

settings = get_settings()


async def _seed_admin() -> None:
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return
    from app.models.user import User
    from app.dependencies import hash_password
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        if result.scalar_one_or_none():
            return
        db.add(User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name="Admin",
            is_active=True,
        ))
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_admin()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(publications.router)
app.include_router(social.router)
app.include_router(media.router)
app.include_router(settings_router.router)
app.include_router(publish.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
