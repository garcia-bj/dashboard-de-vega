import base64
import hashlib
import hmac
import time
from urllib.parse import urlencode
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.schemas import SocialAccountCreate, SocialAccountOut
from app.models.user import User, SocialAccount, SocialProvider
from app.services.meta_service import MetaService

router = APIRouter(prefix="/api/social", tags=["social"])
settings = get_settings()
meta_service = MetaService()

META_SCOPES = (
    "pages_show_list,pages_read_engagement,"
    "pages_manage_posts,instagram_basic,"
    "instagram_content_publishing"
)


def _create_state(user_id: str) -> str:
    ts = str(int(time.time()))
    msg = f"{user_id}:{ts}"
    sig = hmac.new(settings.SECRET_KEY.encode(), msg.encode(), hashlib.sha256).hexdigest()[:20]
    raw = f"{user_id}:{ts}:{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def _verify_state(state: str) -> str | None:
    try:
        padded = state + "=" * (-len(state) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode()).decode()
        # UUID has hyphens only, no colons — split by : gives [user_id, ts, sig]
        parts = decoded.split(":")
        if len(parts) != 3:
            return None
        user_id, ts, sig = parts
        msg = f"{user_id}:{ts}"
        expected = hmac.new(settings.SECRET_KEY.encode(), msg.encode(), hashlib.sha256).hexdigest()[:20]
        if hmac.compare_digest(sig, expected) and time.time() - int(ts) < 600:
            return user_id
    except Exception:
        pass
    return None


@router.get("/accounts", response_model=list[SocialAccountOut])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_active == True,
        )
    )
    return result.scalars().all()


@router.post("/accounts", response_model=SocialAccountOut, status_code=201)
async def connect_account(
    payload: SocialAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = SocialAccount(
        user_id=current_user.id,
        provider=payload.provider,
        page_id=payload.page_id,
        page_name=payload.page_name,
        access_token=payload.access_token,
        instagram_business_id=payload.instagram_business_id,
    )
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


@router.delete("/accounts/{account_id}", status_code=204)
async def disconnect_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    account.is_active = False
    await db.flush()


@router.get("/meta/authorize")
async def meta_authorize(current_user: User = Depends(get_current_user)):
    state = _create_state(str(current_user.id))
    params = {
        "client_id": settings.META_APP_ID,
        "redirect_uri": settings.META_REDIRECT_URI,
        "scope": META_SCOPES,
        "response_type": "code",
        "state": state,
    }
    url = f"https://www.facebook.com/v19.0/dialog/oauth?{urlencode(params)}"
    return {"url": url}


@router.get("/meta/callback")
async def meta_oauth_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    frontend_url = settings.FRONTEND_URL

    user_id = _verify_state(state)
    if not user_id:
        return RedirectResponse(f"{frontend_url}/settings?connected=error&msg=state_invalido")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        return RedirectResponse(f"{frontend_url}/settings?connected=error&msg=usuario_no_encontrado")

    try:
        short_lived = await meta_service.exchange_code_for_token(code)
        long_lived = await meta_service.exchange_token(short_lived["access_token"])
        pages = await meta_service.get_pages(long_lived["access_token"])
    except Exception:
        return RedirectResponse(f"{frontend_url}/settings?connected=error&msg=error_token")

    if not pages:
        return RedirectResponse(f"{frontend_url}/settings?connected=error&msg=sin_paginas")

    for page in pages:
        page_id: str = page["id"]
        page_name: str = page["name"]
        page_token: str = page["access_token"]

        # Upsert Facebook account
        fb_res = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == UUID(user_id),
                SocialAccount.provider == SocialProvider.FACEBOOK,
                SocialAccount.page_id == page_id,
            )
        )
        fb = fb_res.scalar_one_or_none()
        if fb:
            fb.access_token = page_token
            fb.page_name = page_name
            fb.is_active = True
        else:
            db.add(SocialAccount(
                user_id=UUID(user_id),
                provider=SocialProvider.FACEBOOK,
                page_id=page_id,
                page_name=page_name,
                access_token=page_token,
            ))

        # Upsert Instagram account (if linked)
        try:
            ig_data = await meta_service.get_instagram_accounts(page_id, page_token)
            ig = ig_data.get("instagram_business_account")
            if ig:
                ig_id: str = ig["id"]
                ig_name: str = ig.get("username", page_name)

                ig_res = await db.execute(
                    select(SocialAccount).where(
                        SocialAccount.user_id == UUID(user_id),
                        SocialAccount.provider == SocialProvider.INSTAGRAM,
                        SocialAccount.page_id == ig_id,
                    )
                )
                ig_acc = ig_res.scalar_one_or_none()
                if ig_acc:
                    ig_acc.access_token = page_token
                    ig_acc.page_name = ig_name
                    ig_acc.instagram_business_id = ig_id
                    ig_acc.is_active = True
                else:
                    db.add(SocialAccount(
                        user_id=UUID(user_id),
                        provider=SocialProvider.INSTAGRAM,
                        page_id=ig_id,
                        page_name=ig_name,
                        access_token=page_token,
                        instagram_business_id=ig_id,
                    ))
        except Exception:
            pass  # Instagram is optional

    await db.flush()
    return RedirectResponse(f"{frontend_url}/settings?connected=success")


@router.get("/meta/pages")
async def get_meta_pages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_active == True,
        )
    )
    accounts = result.scalars().all()

    pages_data = []
    for acc in accounts:
        ig_data = await meta_service.get_instagram_accounts(acc.page_id, acc.access_token)
        pages_data.append({
            "page_id": acc.page_id,
            "page_name": acc.page_name,
            "instagram": ig_data.get("instagram_business_account"),
        })
    return pages_data
