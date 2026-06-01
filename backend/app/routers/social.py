from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.database import get_db
from app.models.user import User, SocialAccount
from app.models.schemas import SocialAccountCreate, SocialAccountOut
from app.dependencies import get_current_user
from app.services.meta_service import MetaService

router = APIRouter(prefix="/api/social", tags=["social"])

meta_service = MetaService()


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


@router.get("/meta/callback")
async def meta_oauth_callback(code: str):
    token_data = await meta_service.exchange_token(code)

    pages = await meta_service.get_pages(token_data["access_token"])

    return {
        "access_token": token_data["access_token"],
        "expires_in": token_data.get("expires_in"),
        "pages": pages,
    }


@router.get("/meta/pages")
async def get_pages(
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
