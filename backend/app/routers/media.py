from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import FileResponse, Response, StreamingResponse
from pathlib import Path
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_path:path}")
async def serve_media(file_path: str, range: str | None = Header(default=None)):
    if settings.STORAGE_BACKEND == "s3":
        import aioboto3
        from botocore.config import Config as BotoConfig

        # Use the internal endpoint for backend→S3 traffic.
        endpoint = settings.STORAGE_S3_ENDPOINT or settings.STORAGE_S3_PUBLIC_URL
        kwargs = {"Bucket": settings.STORAGE_S3_BUCKET, "Key": file_path}
        if range:
            kwargs["Range"] = range  # forward the browser's Range to S3 (video seeking)

        # ponytail: manage the client context by hand so it stays open while the
        # body streams, then closes when the generator finishes. Streaming (vs
        # .read()) means bytes flow S3→browser as they arrive — fast time-to-first-byte.
        session = aioboto3.Session()
        cm = session.client(
            "s3",
            endpoint_url=endpoint or None,
            region_name=settings.STORAGE_S3_REGION,
            aws_access_key_id=settings.STORAGE_S3_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_S3_SECRET_KEY,
            config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
        )
        s3 = await cm.__aenter__()
        try:
            obj = await s3.get_object(**kwargs)
        except Exception as e:
            await cm.__aexit__(None, None, None)
            raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {e}")

        content_type = obj.get("ContentType", "image/jpeg")
        content_range = obj.get("ContentRange")
        content_length = obj.get("ContentLength")
        body = obj["Body"]

        async def _stream():
            try:
                async for chunk in body.iter_chunks(chunk_size=256 * 1024):
                    yield chunk
            finally:
                await cm.__aexit__(None, None, None)

        headers = {"Accept-Ranges": "bytes"}
        if content_length is not None:
            headers["Content-Length"] = str(content_length)
        status = 200
        if range and content_range:
            headers["Content-Range"] = content_range
            status = 206
        return StreamingResponse(_stream(), status_code=status, media_type=content_type, headers=headers)

    # FileResponse ya soporta Range (206) de forma nativa para storage local.
    full_path = Path(settings.STORAGE_LOCAL_PATH) / file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(full_path)
