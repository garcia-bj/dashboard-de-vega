from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from pathlib import Path
from app.config import get_settings
from app.utils.storage import get_storage

settings = get_settings()
router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_path:path}")
async def serve_media(file_path: str):
    if settings.STORAGE_BACKEND == "s3":
        storage = get_storage()
        url = storage.get_url(file_path)
        return RedirectResponse(url=url, status_code=302)

    full_path = Path(settings.STORAGE_LOCAL_PATH) / file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(full_path)
