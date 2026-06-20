from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from pathlib import Path
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_path:path}")
async def serve_media(file_path: str):
    if settings.STORAGE_BACKEND == "s3":
        import aioboto3
        from botocore.config import Config as BotoConfig

        # Proxy the file through the backend so no presigned-URL validation issues arise.
        # Use the internal endpoint for backend→S3 traffic.
        endpoint = settings.STORAGE_S3_ENDPOINT or settings.STORAGE_S3_PUBLIC_URL
        session = aioboto3.Session()
        try:
            async with session.client(
                "s3",
                endpoint_url=endpoint or None,
                region_name=settings.STORAGE_S3_REGION,
                aws_access_key_id=settings.STORAGE_S3_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_S3_SECRET_KEY,
                config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
            ) as s3:
                obj = await s3.get_object(Bucket=settings.STORAGE_S3_BUCKET, Key=file_path)
                body = await obj["Body"].read()
                content_type = obj.get("ContentType", "image/jpeg")
            return Response(content=body, media_type=content_type)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {e}")

    full_path = Path(settings.STORAGE_LOCAL_PATH) / file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(full_path)
