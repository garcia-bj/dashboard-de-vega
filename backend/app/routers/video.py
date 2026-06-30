from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import uuid as uuid_lib
import httpx
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.user import User, VideoProject, VideoStatus
from app.models.schemas import VideoProjectOut, VideoWebhookCallback
from app.dependencies import get_current_user
from app.utils.storage import get_storage
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/video", tags=["video"])

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
}
MAX_VIDEO_BYTES = 100 * 1024 * 1024  # 100 MB


@router.get("/", response_model=list[VideoProjectOut])
async def list_video_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoProject)
        .where(VideoProject.user_id == current_user.id)
        .order_by(VideoProject.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=VideoProjectOut, status_code=201)
async def create_video_project(
    title: str = Form(...),
    prompt: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, "Formato no soportado. Usá MP4, MOV, AVI o WebM.")

    if not settings.N8N_VIDEO_EDIT_WEBHOOK:
        raise HTTPException(503, "El servicio de edición de video no está configurado aún.")

    video_bytes = await file.read()
    if len(video_bytes) > MAX_VIDEO_BYTES:
        raise HTTPException(400, "El video no puede superar 100MB.")

    storage = get_storage()
    ext = (file.filename or "video.mp4").rsplit(".", 1)[-1].lower()
    project_id = str(uuid_lib.uuid4())
    path = f"videos/{project_id}/source.{ext}"
    await storage.upload(video_bytes, path, content_type=file.content_type or "video/mp4")
    source_url = storage.get_url(path)

    abs_source_url = (
        source_url
        if source_url.startswith("http")
        else f"{settings.APP_PUBLIC_URL.rstrip('/')}/{source_url.lstrip('/')}"
    )

    project = VideoProject(
        id=uuid_lib.UUID(project_id),
        user_id=current_user.id,
        title=title,
        prompt=prompt,
        source_video_url=abs_source_url,
        status=VideoStatus.PENDING,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    callback_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/api/video/{project_id}/callback"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                settings.N8N_VIDEO_EDIT_WEBHOOK,
                json={
                    "video_project_id": project_id,
                    "video_url": abs_source_url,
                    "prompt": prompt,
                    "callback_url": callback_url,
                },
            )
        project.status = VideoStatus.PROCESSING
        await db.flush()
    except httpx.HTTPError:
        pass

    return project


@router.get("/{project_id}", response_model=VideoProjectOut)
async def get_video_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoProject).where(
            VideoProject.id == project_id,
            VideoProject.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Proyecto de video no encontrado.")
    return project


@router.post("/{project_id}/callback", include_in_schema=False)
async def video_callback(
    project_id: UUID,
    payload: VideoWebhookCallback,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(VideoProject).where(VideoProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Proyecto no encontrado.")

    if payload.error_message:
        project.status = VideoStatus.FAILED
        project.meta_data = {**(project.meta_data or {}), "error": payload.error_message}
    else:
        project.edited_video_url = payload.edited_video_url
        project.status = VideoStatus.DONE

    project.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return {"ok": True}


@router.delete("/{project_id}", status_code=204)
async def delete_video_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoProject).where(
            VideoProject.id == project_id,
            VideoProject.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Proyecto no encontrado.")
    await db.delete(project)
    await db.flush()
