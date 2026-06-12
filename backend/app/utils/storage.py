from abc import ABC, abstractmethod
from pathlib import Path
from uuid import uuid4
import aiofiles
from app.config import get_settings

settings = get_settings()


class StorageBackend(ABC):
    @abstractmethod
    async def upload(self, data: bytes, path: str, content_type: str = "image/png") -> str:
        ...

    @abstractmethod
    async def delete(self, path: str) -> None:
        ...

    @abstractmethod
    def get_url(self, path: str) -> str:
        ...

    @abstractmethod
    async def exists(self, path: str) -> bool:
        ...


class LocalStorage(StorageBackend):
    def __init__(self, base_path: str = "./uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def upload(self, data: bytes, path: str, content_type: str = "image/png") -> str:
        full_path = self.base_path / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(data)
        return str(full_path)

    async def delete(self, path: str) -> None:
        full_path = self.base_path / path
        if full_path.exists():
            full_path.unlink()

    def get_url(self, path: str) -> str:
        return f"/media/{path}"

    async def exists(self, path: str) -> bool:
        return (self.base_path / path).exists()


class S3Storage(StorageBackend):
    def __init__(
        self,
        bucket: str,
        endpoint: str = "",
        public_url: str = "",
        region: str = "us-east-1",
        access_key: str = "",
        secret_key: str = "",
    ):
        self.bucket = bucket
        self.endpoint = endpoint
        # public_url is what browsers use to fetch the file directly.
        # Falls back to endpoint if not set (works when RustFS is on localhost).
        self.public_url = public_url or endpoint
        self.region = region
        self.access_key = access_key
        self.secret_key = secret_key
        self._client = None

    async def _get_client(self):
        if self._client is None:
            import aioboto3
            from botocore.config import Config as BotoConfig

            session = aioboto3.Session()
            self._client = await session.client(
                "s3",
                endpoint_url=self.endpoint or None,
                region_name=self.region,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=BotoConfig(signature_version="s3v4"),
            ).__aenter__()
        return self._client

    async def upload(self, data: bytes, path: str, content_type: str = "image/png") -> str:
        client = await self._get_client()
        await client.put_object(
            Bucket=self.bucket,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
        return self.get_url(path)

    async def delete(self, path: str) -> None:
        client = await self._get_client()
        await client.delete_object(Bucket=self.bucket, Key=path)

    def get_url(self, path: str) -> str:
        if self.public_url:
            return f"{self.public_url}/{self.bucket}/{path}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{path}"

    async def exists(self, path: str) -> bool:
        client = await self._get_client()
        try:
            await client.head_object(Bucket=self.bucket, Key=path)
            return True
        except Exception:
            return False


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage(
            bucket=settings.STORAGE_S3_BUCKET,
            endpoint=settings.STORAGE_S3_ENDPOINT,
            public_url=settings.STORAGE_S3_PUBLIC_URL,
            region=settings.STORAGE_S3_REGION,
            access_key=settings.STORAGE_S3_ACCESS_KEY,
            secret_key=settings.STORAGE_S3_SECRET_KEY,
        )
    return LocalStorage(base_path=settings.STORAGE_LOCAL_PATH)


def generate_image_path(publication_id: str, extension: str = "png") -> str:
    return f"publications/{publication_id}/{uuid4().hex}.{extension}"
