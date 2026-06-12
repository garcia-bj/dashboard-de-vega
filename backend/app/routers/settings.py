from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import base64

from app.db.database import get_db
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    full_name: str | None = None
    logo_base64: str | None = None
    reference_image_base64: str | None = None
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    openrouter_api_key: str | None = None


class SettingsOut(BaseModel):
    full_name: str | None = None
    email: str
    logo: str | None = None
    has_logo: bool
    reference_image: str | None = None
    has_reference_image: bool
    gemini_configured: bool
    openai_configured: bool
    openrouter_configured: bool


def _build_out(user: User) -> SettingsOut:
    meta = user.meta_data or {}
    return SettingsOut(
        full_name=user.full_name,
        email=user.email,
        logo=meta.get("logo"),
        has_logo="logo" in meta,
        reference_image=meta.get("reference_image"),
        has_reference_image="reference_image" in meta,
        gemini_configured=bool(meta.get("api_key_gemini")),
        openai_configured=bool(meta.get("api_key_openai")),
        openrouter_configured=bool(meta.get("api_key_openrouter")),
    )


@router.get("/", response_model=SettingsOut)
async def get_settings(current_user: User = Depends(get_current_user)):
    return _build_out(current_user)


@router.put("/", response_model=SettingsOut)
async def update_settings(
    payload: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meta = dict(current_user.meta_data or {})

    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.logo_base64 is not None:
        meta["logo"] = payload.logo_base64
    if payload.reference_image_base64 is not None:
        meta["reference_image"] = payload.reference_image_base64
    if payload.gemini_api_key is not None:
        meta["api_key_gemini"] = payload.gemini_api_key
    if payload.openai_api_key is not None:
        meta["api_key_openai"] = payload.openai_api_key
    if payload.openrouter_api_key is not None:
        meta["api_key_openrouter"] = payload.openrouter_api_key

    current_user.meta_data = meta
    await db.flush()

    return _build_out(current_user)


@router.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten imágenes")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "Máximo 5MB")

    content = await file.read()
    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    meta = dict(current_user.meta_data or {})
    meta["logo"] = data_uri
    current_user.meta_data = meta
    await db.flush()

    return {"logo": data_uri}


@router.post("/upload-reference")
async def upload_reference(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten imágenes")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "Máximo 5MB")

    content = await file.read()
    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    meta = dict(current_user.meta_data or {})
    meta["reference_image"] = data_uri
    current_user.meta_data = meta
    await db.flush()

    return {"reference_image": data_uri}
