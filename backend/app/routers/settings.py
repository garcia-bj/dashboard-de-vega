from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import base64

from app.db.database import get_db
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    logo_base64: str | None = None
    reference_image_base64: str | None = None
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    openrouter_api_key: str | None = None


class SettingsOut(BaseModel):
    has_logo: bool
    has_reference_image: bool
    gemini_configured: bool
    openai_configured: bool
    openrouter_configured: bool


@router.get("/", response_model=SettingsOut)
async def get_settings(current_user: User = Depends(get_current_user)):
    return SettingsOut(
        has_logo=current_user.meta_data and "logo" in (current_user.meta_data or {}),
        has_reference_image=current_user.meta_data and "reference_image" in (current_user.meta_data or {}),
        gemini_configured=False,
        openai_configured=False,
        openrouter_configured=False,
    )


@router.put("/", response_model=SettingsOut)
async def update_settings(
    payload: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meta = current_user.meta_data or {}

    if payload.logo_base64 is not None:
        meta["logo"] = payload.logo_base64
    if payload.reference_image_base64 is not None:
        meta["reference_image"] = payload.reference_image_base64

    current_user.meta_data = meta
    await db.flush()

    return SettingsOut(
        has_logo="logo" in meta,
        has_reference_image="reference_image" in meta,
        gemini_configured=False,
        openai_configured=False,
        openrouter_configured=False,
    )


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

    meta = current_user.meta_data or {}
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

    meta = current_user.meta_data or {}
    meta["reference_image"] = data_uri
    current_user.meta_data = meta
    await db.flush()

    return {"reference_image": data_uri}
