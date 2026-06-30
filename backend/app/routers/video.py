import asyncio
import os
import tempfile
import uuid as uuid_lib
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.config import get_settings
from app.db.database import get_db, async_session
from app.dependencies import get_current_user
from app.models.schemas import VideoProjectOut
from app.models.user import User, VideoProject, VideoStatus
from app.services import kie_service
from app.utils.storage import get_storage

settings = get_settings()
router = APIRouter(prefix="/api/video", tags=["video"])

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska",
}
MAX_IMAGE_BYTES = 10 * 1024 * 1024    # 10 MB per image
MAX_VIDEO_BYTES = 100 * 1024 * 1024   # 100 MB
MAX_CLIP_SECONDS = 15                 # Seedance per-generation cap
MAX_TOTAL_SECONDS = 45                # we stitch clips with ffmpeg above the cap

# Keep refs so background tasks aren't garbage-collected mid-flight.
# ponytail: in-process orchestration — if the container restarts, an in-flight
# job is lost (stays PROCESSING). Add a queue/worker if that becomes a problem.
_bg_tasks: set = set()


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
    mode: str = Form("images"),               # "images" | "video"
    duration: int = Form(5),                  # total seconds, 4-45
    aspect_ratio: str = Form("9:16"),
    generate_audio: bool = Form(True),
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.KIE_API_KEY:
        raise HTTPException(503, "El servicio de video no está configurado (falta KIE_API_KEY).")
    if not settings.APP_PUBLIC_URL:
        raise HTTPException(503, "APP_PUBLIC_URL no está configurada; Kie no puede descargar los archivos.")
    if mode not in ("images", "video"):
        raise HTTPException(400, "Modo inválido.")
    if not (4 <= duration <= MAX_TOTAL_SECONDS):
        raise HTTPException(400, f"La duración debe estar entre 4 y {MAX_TOTAL_SECONDS} segundos.")
    if not files:
        raise HTTPException(400, "Subí al menos un archivo.")

    if mode == "images":
        if len(files) > 9:
            raise HTTPException(400, "Máximo 9 imágenes.")
        allowed, limit, kind = ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, "imagen"
    else:
        if len(files) != 1:
            raise HTTPException(400, "Para editar video, subí un solo archivo.")
        allowed, limit, kind = ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, "video"

    project_id = uuid_lib.uuid4()
    storage = get_storage()
    base = settings.APP_PUBLIC_URL.rstrip("/")
    source_urls: list[str] = []

    for i, f in enumerate(files):
        if f.content_type not in allowed:
            raise HTTPException(400, f"Formato de {kind} no soportado: {f.content_type}")
        data = await f.read()
        if len(data) > limit:
            raise HTTPException(400, f"Cada {kind} supera el tamaño máximo permitido.")
        ext = (f.filename or "file").rsplit(".", 1)[-1].lower()
        path = f"videos/{project_id}/src_{i}.{ext}"
        url = await storage.upload(data, path, content_type=f.content_type)
        source_urls.append(url if url.startswith("http") else f"{base}/{url.lstrip('/')}")

    project = VideoProject(
        id=project_id,
        user_id=current_user.id,
        title=title,
        prompt=prompt,
        source_video_url=source_urls[0],
        status=VideoStatus.PENDING,
        meta_data={
            "mode": mode,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "generate_audio": generate_audio,
            "source_urls": source_urls,
            "clips": -(-duration // MAX_CLIP_SECONDS),  # ceil
        },
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    task = asyncio.create_task(
        _run_job(project_id, mode, source_urls, prompt, duration, aspect_ratio, generate_audio)
    )
    _bg_tasks.add(task)
    task.add_done_callback(_bg_tasks.discard)

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


# ──────────────────────────── background orchestration ────────────────────────────

async def _set_status(project_id: UUID, *, meta_extra: dict | None = None, **fields) -> None:
    async with async_session() as db:
        proj = (
            await db.execute(select(VideoProject).where(VideoProject.id == project_id))
        ).scalar_one_or_none()
        if not proj:
            return
        for k, v in fields.items():
            setattr(proj, k, v)
        if meta_extra:
            proj.meta_data = {**(proj.meta_data or {}), **meta_extra}
        proj.updated_at = datetime.now(timezone.utc)
        await db.commit()


async def _download(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=180, follow_redirects=True) as c:
        r = await c.get(url)
        r.raise_for_status()
        return r.content


async def _stitch_clips(clip_bytes: list[bytes]) -> bytes:
    """Concatenate clips into one mp4 with ffmpeg (re-encode for safety)."""
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for i, b in enumerate(clip_bytes):
            p = os.path.join(d, f"clip{i}.mp4")
            with open(p, "wb") as f:
                f.write(b)
            paths.append(p)
        listfile = os.path.join(d, "list.txt")
        with open(listfile, "w") as f:
            for p in paths:
                f.write(f"file '{p}'\n")
        out = os.path.join(d, "out.mp4")
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
            "-movflags", "+faststart", out,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
        )
        _, err = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg falló: {err.decode(errors='ignore')[-400:]}")
        with open(out, "rb") as f:
            return f.read()


async def _run_job(
    project_id: UUID, mode: str, source_urls: list[str],
    prompt: str, duration: int, aspect_ratio: str, generate_audio: bool,
) -> None:
    await _set_status(project_id, status=VideoStatus.PROCESSING)
    try:
        # Split the requested duration into clips of <= MAX_CLIP_SECONDS.
        clips, remaining = [], duration
        while remaining > 0:
            d = min(MAX_CLIP_SECONDS, remaining)
            clips.append(d)
            remaining -= d

        clip_bytes: list[bytes] = []
        for d in clips:
            inp = {
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "resolution": "1080p",
                "duration": d,
                "generate_audio": generate_audio,
            }
            if mode == "video":
                inp["reference_video_urls"] = source_urls[:3]
            else:
                inp["reference_image_urls"] = source_urls[:9]
            task_id = await kie_service.create_task(inp)
            result_url = await kie_service.wait_for_result(task_id)
            clip_bytes.append(await _download(result_url))

        final = clip_bytes[0] if len(clip_bytes) == 1 else await _stitch_clips(clip_bytes)
        stored_url = await get_storage().upload(
            final, f"videos/{project_id}/result.mp4", content_type="video/mp4"
        )
        await _set_status(project_id, status=VideoStatus.DONE, edited_video_url=stored_url)
    except Exception as e:  # noqa: BLE001 — surface any failure to the user
        await _set_status(project_id, status=VideoStatus.FAILED, meta_extra={"error": str(e)[:500]})
