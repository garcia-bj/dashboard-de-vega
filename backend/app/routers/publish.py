from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import httpx
import base64
import uuid as uuid_lib

from app.utils.storage import get_storage, generate_image_path

from app.db.database import get_db
from app.models.user import User, Publication, SocialAccount, PublishLog, PublicationStatus, PublishTarget
from app.models.schemas import PublishRequest
from app.dependencies import get_current_user
from app.services.meta_service import MetaService
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/publish", tags=["publish"])

GEMINI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

ENHANCE_SYSTEM = (
    "Eres un experto en prompts para generación de imágenes con IA. "
    "Tu tarea es mejorar el prompt del usuario para obtener imágenes más detalladas y de mayor calidad. "
    "Mantené la idea original pero añadí detalles de: composición, iluminación, paleta de colores, "
    "estilo artístico, texturas y técnica fotográfica o pictórica. "
    "Respondé ÚNICAMENTE con el prompt mejorado en el mismo idioma que el original, sin explicaciones ni texto adicional."
)

CAPTION_SYSTEM = (
    "Eres un experto en marketing digital y redes sociales para restaurantes y negocios de comida. "
    "Tu tarea es mejorar o crear un caption atractivo para un post en redes sociales. "
    "Usa emojis relevantes (sin exagerar), genera emoción o urgencia, y termina con una llamada a la acción sutil. "
    "Mantén un tono cálido y apetitoso. "
    "Respondé ÚNICAMENTE con el caption mejorado, sin explicaciones, sin comillas."
)

HASHTAG_SYSTEM = (
    "Eres un experto en marketing digital para restaurantes. "
    "Genera hashtags relevantes para una publicación de restaurante en Bolivia. "
    "Mezcla hashtags populares globales con específicos del rubro y del país. "
    "Respondé ÚNICAMENTE con los hashtags separados por espacios, empezando cada uno con #. "
    "Sin explicaciones. Sin puntos. Solo hashtags en una sola línea."
)

meta_service = MetaService()


def _n8n_img_url() -> str:
    return settings.N8N_IMG_GENERATION_URL or f"{settings.N8N_WEBHOOK_URL}{settings.N8N_IMAGE_GEN_WEBHOOK}"


@router.post("/enhance-prompt")
async def enhance_prompt(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(400, "El prompt no puede estar vacío")

    meta = current_user.meta_data or {}
    api_key = meta.get("api_key_gemini") or settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(400, "Configurá tu Gemini API Key en Configuración para usar el mejorador de prompts")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                GEMINI_TEXT_URL,
                params={"key": api_key},
                json={
                    "system_instruction": {"parts": [{"text": ENHANCE_SYSTEM}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512},
                },
            )
            res.raise_for_status()
            data = res.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(429, "Límite de uso de Gemini alcanzado. Esperá unos segundos e intentá de nuevo.")
        raise HTTPException(502, "Error al conectar con Gemini")
    except httpx.HTTPError:
        raise HTTPException(502, "Error al conectar con Gemini")

    try:
        enhanced = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise HTTPException(502, "Respuesta inesperada de Gemini")

    return {"enhanced_prompt": enhanced}


async def _call_gemini(api_key: str, system: str, user_text: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            GEMINI_TEXT_URL,
            params={"key": api_key},
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"parts": [{"text": user_text}]}],
                "generationConfig": {"temperature": 0.75, "maxOutputTokens": 512},
            },
        )
        res.raise_for_status()
        data = res.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


@router.post("/enhance-caption")
async def enhance_caption(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    meta = current_user.meta_data or {}
    api_key = meta.get("api_key_gemini") or settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(400, "Configurá tu Gemini API Key en Configuración")

    caption = payload.get("caption", "").strip()
    context = payload.get("context", "").strip()  # platos, precios, etc.
    mode = payload.get("mode", "caption")  # "caption" | "hashtags" | "both"
    hashtag_count = int(payload.get("hashtag_count", 12))

    user_text_caption = f"{context}\n\nCaption actual: {caption}" if caption else context or "Publicación de restaurante"
    user_text_hashtags = f"Genera {hashtag_count} hashtags para: {context or caption or 'publicación de restaurante'}"

    result: dict = {}
    try:
        if mode in ("caption", "both"):
            result["enhanced_caption"] = await _call_gemini(api_key, CAPTION_SYSTEM, user_text_caption)
        if mode in ("hashtags", "both"):
            result["hashtags"] = await _call_gemini(api_key, HASHTAG_SYSTEM, user_text_hashtags)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(429, "Límite de uso de Gemini alcanzado. Esperá unos segundos.")
        raise HTTPException(502, "Error al conectar con Gemini")
    except (httpx.HTTPError, KeyError, IndexError):
        raise HTTPException(502, "Error al conectar con Gemini")

    return result


@router.post("/generate")
async def generate_via_n8n(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
            res = await client.post(_n8n_img_url(), json=body)
            res.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Error del webhook n8n: {str(e)}")

    image_url = None
    data_uri = None
    image_bytes: bytes | None = None
    mime = "image/jpeg"

    content_type = res.headers.get("content-type", "")

    if content_type.startswith("image/"):
        # n8n devuelve binario directamente
        image_bytes = res.content
        mime = content_type.split(";")[0].strip()
    else:
        # n8n devuelve JSON con base64
        try:
            data = res.json()
        except Exception:
            raise HTTPException(502, "Respuesta inesperada del webhook n8n")

        raw_b64 = data.get("imagen_base64")
        formato = data.get("formato")  # "data:image/jpeg;base64,..."
        mime = data.get("mime_type", "image/jpeg")

        if raw_b64 or formato:
            try:
                b64_str = raw_b64 or formato.split(",", 1)[1]
                # n8n puede devolver el objeto binario completo en vez del string;
                # { data: "base64...", mimeType: "image/png", ... }
                if isinstance(b64_str, dict):
                    mime = b64_str.get("mimeType", mime)
                    b64_str = b64_str.get("data", "")
                if isinstance(b64_str, str) and b64_str.startswith("data:"):
                    b64_str = b64_str.split(",", 1)[1]
                image_bytes = base64.b64decode(b64_str)
            except Exception:
                pass
        else:
            # Fallback para respuestas con URL directa
            image_url = (
                data.get("image_url") or data.get("url") or data.get("output") or
                (data.get("result") or {}).get("image") or data.get("data", {}).get("url")
            )

    if image_bytes:
        # Detectar formato real desde los magic bytes
        if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            mime, ext = "image/png", "png"
        elif image_bytes[:3] == b'\xff\xd8\xff':
            mime, ext = "image/jpeg", "jpg"
        else:
            ext = "png" if "png" in mime else "jpg"

        b64_clean = base64.b64encode(image_bytes).decode()
        data_uri = f"data:{mime};base64,{b64_clean}"

        try:
            storage = get_storage()
            pub_id = payload.get("publication_id", str(uuid_lib.uuid4()))
            path = generate_image_path(pub_id, extension=ext)
            await storage.upload(image_bytes, path, content_type=mime)
            image_url = storage.get_url(path)
        except Exception:
            image_url = data_uri

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
        "data_uri": data_uri,
        "model": payload.get("model"),
        "raw_response": None,
    }


@router.post("/save-to-gallery")
async def save_to_gallery(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime
    from app.models.user import AImodel

    image_url = payload.get("image_url")
    data_uri = payload.get("data_uri")
    prompt = payload.get("prompt", "")
    model_id = payload.get("model", "gemini")

    if not image_url and not data_uri:
        raise HTTPException(400, "Se requiere image_url o data_uri")

    # Si solo tenemos data_uri, guardarlo en storage ahora
    if not image_url and data_uri and data_uri.startswith("data:"):
        try:
            header, b64_str = data_uri.split(",", 1)
            mime = header.split(":")[1].split(";")[0]
            image_bytes = base64.b64decode(b64_str)
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                mime, ext = "image/png", "png"
            elif image_bytes[:3] == b'\xff\xd8\xff':
                mime, ext = "image/jpeg", "jpg"
            else:
                ext = mime.split("/")[-1]
            storage = get_storage()
            path = generate_image_path(str(uuid_lib.uuid4()), extension=ext)
            await storage.upload(image_bytes, path, content_type=mime)
            image_url = storage.get_url(path)
        except Exception as e:
            raise HTTPException(502, f"Error al guardar imagen: {str(e)}")

    ai_model = AImodel.OPENAI if model_id == "openai" else AImodel.GEMINI
    title = datetime.utcnow().strftime("%d/%m/%Y %H:%M")

    pub = Publication(
        user_id=current_user.id,
        title=title,
        prompt=prompt,
        ai_model=ai_model,
        image_url=image_url,
        status=PublicationStatus.GENERATED,
        targets=[],
        scheduled_at=datetime.utcnow(),
    )
    db.add(pub)
    await db.flush()
    return {"id": str(pub.id), "image_url": image_url}


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

        # Detect carousel
        pub_meta = pub.meta_data or {}
        is_carousel = pub_meta.get("carousel") and pub_meta.get("carousel_images")
        carousel_images: list[str] = pub_meta.get("carousel_images", [])

        try:
            if target == PublishTarget.FACEBOOK_FEED:
                if is_carousel and len(carousel_images) >= 2:
                    meta_result = await meta_service.publish_carousel_to_feed(
                        account.page_id, account.access_token, carousel_images, pub.caption or ""
                    )
                else:
                    meta_result = await meta_service.publish_to_feed(
                        account.page_id, account.access_token, pub.image_url, pub.caption or ""
                    )
            elif target == PublishTarget.INSTAGRAM_FEED:
                ig_id = account.instagram_business_id or account.page_id
                if is_carousel and len(carousel_images) >= 2:
                    meta_result = await meta_service.publish_carousel_to_instagram(
                        ig_id, account.access_token, carousel_images, pub.caption or ""
                    )
                else:
                    meta_result = await meta_service.publish_to_instagram(
                        ig_id, account.access_token, pub.image_url, pub.caption or ""
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
