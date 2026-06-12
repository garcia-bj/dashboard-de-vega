from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.database import get_db
from app.models.user import User, Publication, GenerationLog
from app.models.schemas import (
    PublicationCreate,
    PublicationUpdate,
    PublicationOut,
    PublicationWithLogs,
    PublicationStatus,
    GenerateRequest,
    GenerateResponse,
    ImageCallbackPayload,
)
from app.dependencies import get_current_user
from app.services.n8n_service import trigger_image_generation_workflow

router = APIRouter(prefix="/api/publications", tags=["publications"])


@router.get("/", response_model=list[PublicationOut])
async def list_publications(
    status: PublicationStatus | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Publication).where(Publication.user_id == current_user.id)
    if status:
        query = query.where(Publication.status == status)
    query = query.order_by(Publication.scheduled_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PublicationOut, status_code=201)
async def create_publication(
    payload: PublicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    publication = Publication(
        user_id=current_user.id,
        title=payload.title,
        prompt=payload.prompt,
        caption=payload.caption,
        ai_model=payload.ai_model,
        targets=[t.value for t in payload.targets],
        status=PublicationStatus.DRAFT,
        scheduled_at=payload.scheduled_at,
    )
    db.add(publication)
    await db.flush()
    await db.refresh(publication)
    return publication


@router.get("/{publication_id}", response_model=PublicationWithLogs)
async def get_publication(
    publication_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Publication).where(
            Publication.id == publication_id,
            Publication.user_id == current_user.id,
        )
    )
    publication = result.scalar_one_or_none()
    if not publication:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    return publication


@router.patch("/{publication_id}", response_model=PublicationOut)
async def update_publication(
    publication_id: UUID,
    payload: PublicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Publication).where(
            Publication.id == publication_id,
            Publication.user_id == current_user.id,
        )
    )
    publication = result.scalar_one_or_none()
    if not publication:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    update_data = payload.model_dump(exclude_unset=True)
    if "targets" in update_data and update_data["targets"] is not None:
        update_data["targets"] = [t.value for t in update_data["targets"]]

    for key, value in update_data.items():
        setattr(publication, key, value)

    await db.flush()
    await db.refresh(publication)
    return publication


@router.delete("/{publication_id}", status_code=204)
async def delete_publication(
    publication_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Publication).where(
            Publication.id == publication_id,
            Publication.user_id == current_user.id,
        )
    )
    publication = result.scalar_one_or_none()
    if not publication:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    await db.delete(publication)


@router.post("/{publication_id}/image-ready")
async def image_ready_callback(
    publication_id: UUID,
    payload: ImageCallbackPayload,
    db: AsyncSession = Depends(get_db),
):
    """Llamado por n8n cuando termina la generación de imagen."""
    result = await db.execute(select(Publication).where(Publication.id == publication_id))
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    if payload.error_message:
        pub.status = PublicationStatus.FAILED
    else:
        pub.image_url = payload.image_url
        pub.status = PublicationStatus.GENERATED

    log = GenerationLog(
        publication_id=pub.id,
        ai_model=pub.ai_model,
        prompt=pub.prompt,
        image_url=payload.image_url,
        duration_ms=payload.duration_ms,
        cost_usd=payload.cost_usd,
        error_message=payload.error_message,
    )
    db.add(log)
    await db.flush()
    return {"ok": True}


@router.post("/generate", response_model=GenerateResponse)
async def generate_image(
    payload: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await trigger_image_generation_workflow(
        prompt=payload.prompt,
        ai_model=payload.ai_model.value,
        user_id=str(current_user.id),
    )
    raise HTTPException(
        status_code=202,
        detail="Generación de imagen disparada. Será procesada asíncronamente por n8n.",
    )
