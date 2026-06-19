from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from pathlib import Path
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_path:path}")
async def serve_media(file_path: str):
    if settings.STORAGE_BACKEND == "s3":
        import aioboto3
        from botocore.config import Config as BotoConfig

        # Use public URL as endpoint so presigned URLs are browser-accessible
        endpoint = settings.STORAGE_S3_PUBLIC_URL or settings.STORAGE_S3_ENDPOINT
        session = aioboto3.Session()
        try:
            async with session.client(
                "s3",
                endpoint_url=endpoint or None,
                region_name=settings.STORAGE_S3_REGION,
                aws_access_key_id=settings.STORAGE_S3_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_S3_SECRET_KEY,
                config=BotoConfig(signature_version="s3v4"),
            ) as s3:
                presigned = await s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.STORAGE_S3_BUCKET, "Key": file_path},
                    ExpiresIn=3600,
                )
            return RedirectResponse(url=presigned, status_code=302)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {e}")

    full_path = Path(settings.STORAGE_LOCAL_PATH) / file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(full_path)
