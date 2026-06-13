from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.schemas import UserOut, TokenOut
from app.dependencies import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    access_token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=access_token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
