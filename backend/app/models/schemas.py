from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.models.user import PublicationStatus, AImodel, PublishTarget, SocialProvider, UserRole


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SocialAccountCreate(BaseModel):
    provider: SocialProvider
    page_id: str
    page_name: str
    access_token: str
    instagram_business_id: str | None = None


class SocialAccountOut(BaseModel):
    id: UUID
    provider: SocialProvider
    page_id: str
    page_name: str
    instagram_business_id: str | None
    is_active: bool
    token_expires_at: datetime | None

    model_config = {"from_attributes": True}


class PublicationCreate(BaseModel):
    title: str
    prompt: str
    caption: str | None = None
    ai_model: AImodel = AImodel.GEMINI
    targets: list[PublishTarget]
    scheduled_at: datetime


class PublicationUpdate(BaseModel):
    title: str | None = None
    prompt: str | None = None
    caption: str | None = None
    ai_model: AImodel | None = None
    targets: list[PublishTarget] | None = None
    scheduled_at: datetime | None = None
    status: PublicationStatus | None = None


class PublicationOut(BaseModel):
    id: UUID
    title: str
    prompt: str
    caption: str | None
    ai_model: AImodel
    image_url: str | None
    status: PublicationStatus
    targets: list[PublishTarget]
    scheduled_at: datetime
    published_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerationLogOut(BaseModel):
    id: UUID
    ai_model: AImodel
    image_url: str | None
    duration_ms: int | None
    cost_usd: float | None
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PublishLogOut(BaseModel):
    id: UUID
    target: PublishTarget
    success: bool
    meta_post_id: str | None
    meta_permalink: str | None
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicationWithLogs(PublicationOut):
    generation_logs: list[GenerationLogOut] = []
    publish_logs: list[PublishLogOut] = []


class GenerateRequest(BaseModel):
    prompt: str
    ai_model: AImodel = AImodel.GEMINI
    negative_prompt: str | None = None
    width: int = Field(default=1024, ge=256, le=2048)
    height: int = Field(default=1024, ge=256, le=2048)


class GenerateResponse(BaseModel):
    image_url: str
    ai_model: AImodel
    prompt: str
    duration_ms: int
    cost_usd: float | None = None
