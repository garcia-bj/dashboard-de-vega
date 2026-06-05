from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import httpx

from app.db.database import get_db
from app.models.user import User, Publication, SocialAccount, PublishLog, PublicationStatus, PublishTarget
from app.models.schemas import PublishRequest
from app.dependencies import get_current_user
from app.services.meta_service import MetaService
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/publish", tags=["publish"])

meta_service = MetaService()
N8N_WEBHOOK = "https://asc-n8n.autosalescloser.com/webhook/img_asd"


@router.post("/generate")
async def generate_via_n8n(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Proxy: envía prompt + assets al webhook n8n para generar imagen"""
    body: dict = {
        "prompt": payload.get("prompt", ""),
        "model": payload.get("model", "gemini"),
    }
    if payload.get("style"):
        body["style"] = payload["style"]
    if payload.get("size"):
        body["size"] = payload["size"]
    if payload.get("negative_prompt"):
        body["negative_prompt"] = payload["negative_prompt"]

    meta = current_user.meta_data or {}
    if meta.get("logo"):
        body["logo"] = meta["logo"]
    if meta.get("reference_image"):
        body["reference_image"] = meta["reference_image"]

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            res = await client.post(N8N_WEBHOOK, json=body)
            res.raise_for_status()
            data = res.json()
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Error del webhook n8n: {str(e)}")

    image_url = (
        data.get("image_url") or data.get("url") or data.get("output") or
        (data.get("result") or {}).get("image") or data.get("data", {}).get("url")
    )

    if not image_url:
        image_url = None

    if payload.get("publication_id"):
        result = await db.execute(
            select(Publication).where(Publication.id == UUID(payload["publication_id"]))
        )
        pub = result.scalar_one_or_none()
        if pub:
            pub.image_url = image_url
            pub.status = PublicationStatus.GENERATED
            await db.flush()

    return {
        "image_url": image_url,
        "model": payload.get("model"),
        "raw_response": data if not image_url else None,
    }


@router.post("/publication/{publication_id}")
async def publish_publication(
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
    pub = result.scalar_one_or_none()
    if not pub:
        raise HTTPException(404, "Publicación no encontrada")
    if not pub.image_url:
        raise HTTPException(400, "La publicación no tiene imagen generada")

    accounts_result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_active == True,
        )
    )
    accounts = accounts_result.scalars().all()

    results = []
    pub.status = PublicationStatus.PUBLISHING

    for target_str in (pub.targets or []):
        target = PublishTarget(target_str)
        account = None
        for acc in accounts:
            if target in (PublishTarget.INSTAGRAM_FEED, PublishTarget.INSTAGRAM_STORY):
                if acc.provider.value == "instagram":
                    account = acc
                    break
            elif target == PublishTarget.FACEBOOK_FEED:
                if acc.provider.value == "facebook":
                    account = acc
                    break

        if not account:
            results.append({"target": target_str, "success": False, "error": "Cuenta no vinculada"})
            continue

        try:
            if target == PublishTarget.FACEBOOK_FEED:
                meta_result = await meta_service.publish_to_feed(
                    account.page_id, account.access_token, pub.image_url, pub.caption or ""
                )
            elif target == PublishTarget.INSTAGRAM_FEED:
                meta_result = await meta_service.publish_to_instagram(
                    account.instagram_business_id or account.page_id,
                    account.access_token, pub.image_url, pub.caption or ""
                )
            elif target == PublishTarget.INSTAGRAM_STORY:
                meta_result = await meta_service.publish_to_story(
                    account.instagram_business_id or account.page_id,
                    account.access_token, pub.image_url
                )
            else:
                continue

            log = PublishLog(
                publication_id=pub.id,
                social_account_id=account.id,
                target=target,
                success=True,
                meta_post_id=meta_result.get("post_id"),
                meta_permalink=meta_result.get("permalink"),
            )
            db.add(log)
            results.append({"target": target_str, "success": True, "post_id": meta_result.get("post_id"), "permalink": meta_result.get("permalink")})

        except Exception as e:
            log = PublishLog(
                publication_id=pub.id,
                social_account_id=account.id,
                target=target,
                success=False,
                error_message=str(e),
            )
            db.add(log)
            results.append({"target": target_str, "success": False, "error": str(e)})

    pub.status = PublicationStatus.PUBLISHED if any(r["success"] for r in results) else PublicationStatus.FAILED
    pub.published_at = __import__("datetime").datetime.utcnow()
    await db.flush()

    return {"publication_id": str(pub.id), "results": results}
