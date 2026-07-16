from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Cookio"
    DEBUG: bool = False
    SECRET_KEY: str
    DATABASE_URL: str

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    STORAGE_BACKEND: str = "local"  # "local" | "s3"
    STORAGE_LOCAL_PATH: str = "./uploads"
    STORAGE_S3_BUCKET: str = ""
    STORAGE_S3_ENDPOINT: str = ""       # Internal URL (backend → RustFS), e.g. http://rustfs:9000
    STORAGE_S3_PUBLIC_URL: str = ""     # Browser-accessible URL, e.g. http://localhost:9000
    STORAGE_S3_REGION: str = "us-east-1"
    STORAGE_S3_ACCESS_KEY: str = ""
    STORAGE_S3_SECRET_KEY: str = ""

    N8N_WEBHOOK_URL: str = "http://n8n:5678"
    N8N_IMAGE_GEN_WEBHOOK: str = "/webhook/image-generation"
    N8N_PUBLISH_WEBHOOK: str = "/webhook/auto-publish"
    N8N_IMG_GENERATION_URL: str = ""  # Full URL override (e.g. production n8n endpoint)
    N8N_VIDEO_EDIT_WEBHOOK: str = ""  # legacy, unused (video now goes direct to Kie.ai)

    # Kie.ai — unified video generation API (Seedance, Veo, Kling…)
    KIE_API_KEY: str = ""
    KIE_BASE_URL: str = "https://api.kie.ai"
    KIE_VIDEO_MODEL: str = "bytedance/seedance-2"

    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_TEXT_MODEL: str = "gemini-2.5-pro"  # used for prompt/caption enhancement

    # Public URL of the backend as seen from the internet.
    # Meta's API downloads images from this URL — it must be reachable externally.
    # Example: https://api.tudominio.com
    APP_PUBLIC_URL: str = ""

    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_REDIRECT_URI: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    REDIS_URL: str = "redis://redis:6379/0"

    CORS_ORIGINS: str = "http://localhost:3000"

    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        origins = {o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()}
        if self.FRONTEND_URL:
            origins.add(self.FRONTEND_URL.rstrip("/"))
        origins.add("http://localhost:3000")
        return list(origins)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
