from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.schemas import SocialAccountCreate, SocialAccountOut
from app.models.user import User, SocialAccount

router = APIRouter(prefix="/api/social", tags=["social"])


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
    # Upsert: si ya existe una cuenta con ese provider, actualizarla
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == payload.provider,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.page_id = payload.page_id
        existing.page_name = payload.page_name
        existing.access_token = payload.access_token
        existing.instagram_business_id = payload.instagram_business_id
        existing.is_active = True
        await db.flush()
        await db.refresh(existing)
        return existing

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
