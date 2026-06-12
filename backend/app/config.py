from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "De_Vega"
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

    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_REDIRECT_URI: str = ""

    REDIS_URL: str = "redis://redis:6379/0"

    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
