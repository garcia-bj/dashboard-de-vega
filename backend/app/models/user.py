import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    meta_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    social_accounts = relationship("SocialAccount", back_populates="user")
    publications = relationship("Publication", back_populates="user")


class SocialProvider(str, enum.Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    provider: Mapped[SocialProvider] = mapped_column(SAEnum(SocialProvider), nullable=False)
    page_id: Mapped[str] = mapped_column(String(100), nullable=False)
    page_name: Mapped[str] = mapped_column(String(255), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    instagram_business_id: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="social_accounts")
    publish_logs = relationship("PublishLog", back_populates="social_account")


class AImodel(str, enum.Enum):
    GEMINI = "gemini"
    OPENAI_DALLE = "openai_dalle"
    OPENROUTER_FLUX = "openrouter_flux"
    OPENROUTER_SD = "openrouter_stable_diffusion"


class PublicationStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    GENERATING = "generating"
    GENERATED = "generated"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class PublishTarget(str, enum.Enum):
    FACEBOOK_FEED = "facebook_feed"
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORY = "instagram_story"


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    ai_model: Mapped[AImodel] = mapped_column(SAEnum(AImodel), nullable=False, default=AImodel.GEMINI)
    image_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[PublicationStatus] = mapped_column(
        SAEnum(PublicationStatus), default=PublicationStatus.DRAFT, index=True
    )
    targets: Mapped[list] = mapped_column(JSONB, default=list)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    meta_data: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="publications")
    generation_logs = relationship("GenerationLog", back_populates="publication")
    publish_logs = relationship("PublishLog", back_populates="publication")


class GenerationLog(Base):
    __tablename__ = "generation_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False, index=True)
    ai_model: Mapped[AImodel] = mapped_column(SAEnum(AImodel), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text)
    request_payload: Mapped[dict | None] = mapped_column(JSONB)
    response_payload: Mapped[dict | None] = mapped_column(JSONB)
    duration_ms: Mapped[int | None] = mapped_column()
    cost_usd: Mapped[float | None] = mapped_column()
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    publication = relationship("Publication", back_populates="generation_logs")


class PublishLog(Base):
    __tablename__ = "publish_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False, index=True)
    social_account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("social_accounts.id"), nullable=False)
    target: Mapped[PublishTarget] = mapped_column(SAEnum(PublishTarget), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    meta_post_id: Mapped[str | None] = mapped_column(String(100))
    meta_permalink: Mapped[str | None] = mapped_column(Text)
    error_message: Mapped[str | None] = mapped_column(Text)
    response_payload: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    publication = relationship("Publication", back_populates="publish_logs")
    social_account = relationship("SocialAccount", back_populates="publish_logs")
