from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_path:path}")
async def serve_media(file_path: str):
    if settings.STORAGE_BACKEND == "s3":
        raise HTTPException(status_code=307, detail="Redirigir a S3")

    full_path = Path(settings.STORAGE_LOCAL_PATH) / file_path
    if not full_path.exists():
        return {"detail": "Archivo no encontrado"}
    return FileResponse(full_path)
