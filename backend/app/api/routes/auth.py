"""Authentication routes — login, logout, refresh, TOTP, CSRF."""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import DbSession, CurrentUser
from app.core.security import (
    verify_password, dummy_verify, hash_password, create_access_token,
    create_refresh_token, hash_token, decode_access_token,
    generate_csrf_token, verify_totp, generate_totp_secret,
    get_totp_uri, encrypt_secret, decrypt_secret, validate_password,
)
from app.models.user import User, RefreshToken

router = APIRouter()


# ── Schemas ──

class LoginRequest(BaseModel):
    email: str
    password: str

class TOTPVerifyRequest(BaseModel):
    email: str
    totp_code: str
    pending_token: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TOTPSetupResponse(BaseModel):
    secret: str
    uri: str


# ── Login ──

@router.post("/login")
async def login(body: LoginRequest, request: Request, response: Response, db: DbSession):
    """Authenticate with email + password. Returns access/refresh cookies."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        dummy_verify()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Check lockout
    if user.locked_until and datetime.now(timezone.utc) < user.locked_until:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account temporarily locked")

    if not verify_password(body.password, user.password_hash):
        user.failed_logins = (user.failed_logins or 0) + 1
        if user.failed_logins >= 5:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # If TOTP is enabled, return a pending token instead
    if user.totp_enabled:
        pending = secrets.token_urlsafe(32)
        # Store pending token temporarily (in production, use Redis/DB)
        response.set_cookie("totp_pending", pending, httponly=True, samesite="strict",
                            secure=settings.COOKIE_SECURE, max_age=300)
        return {"requires_totp": True, "pending_token": pending, "email": user.email}

    # Reset failed logins
    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    return await _issue_tokens(user, response)


@router.post("/totp-verify")
async def totp_verify(body: TOTPVerifyRequest, request: Request, response: Response, db: DbSession):
    """Verify TOTP code after initial login."""
    pending_cookie = request.cookies.get("totp_pending", "")
    if not pending_cookie or pending_cookie != body.pending_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pending token")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP not configured")

    secret = decrypt_secret(user.totp_secret_enc)
    if not verify_totp(secret, body.totp_code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TOTP code")

    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    response.delete_cookie("totp_pending")
    return await _issue_tokens(user, response)


# ── Logout ──

@router.post("/logout")
async def logout(request: Request, response: Response, db: DbSession):
    """Revoke refresh token and clear cookies."""
    refresh_raw = request.cookies.get("refresh")
    if refresh_raw:
        token_hash = hash_token(refresh_raw)
        result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        rt = result.scalar_one_or_none()
        if rt:
            rt.revoked_at = datetime.now(timezone.utc)
            await db.commit()

    response.delete_cookie("access")
    response.delete_cookie("refresh")
    response.delete_cookie("csrf")
    return {"message": "Logged out"}


# ── Token refresh ──

@router.post("/refresh")
async def refresh_tokens(request: Request, response: Response, db: DbSession):
    """Rotate the refresh token and issue new access + refresh cookies."""
    refresh_raw = request.cookies.get("refresh")
    if not refresh_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    token_hash = hash_token(refresh_raw)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    rt = result.scalar_one_or_none()

    if not rt or rt.revoked_at or rt.expires_at < datetime.now(timezone.utc):
        # If revoked, revoke entire family (rotation detection)
        if rt and rt.revoked_at:
            await db.execute(
                RefreshToken.__table__.update()
                .where(RefreshToken.family_id == rt.family_id)
                .values(revoked_at=datetime.now(timezone.utc))
            )
            await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Look up user
    user_result = await db.execute(select(User).where(User.id == rt.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    # Revoke current token
    rt.revoked_at = datetime.now(timezone.utc)

    # Issue new pair
    new_raw, new_hash, new_exp = create_refresh_token(user.id, rt.family_id)
    rt.replaced_by = new_hash
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        family_id=rt.family_id,
        expires_at=new_exp,
    )
    db.add(new_rt)
    await db.commit()

    jti = secrets.token_hex(16)
    access = create_access_token(user.id, user.role, jti)
    csrf = generate_csrf_token()

    _set_cookies(response, access, new_raw, csrf)
    return {"message": "Tokens refreshed", "role": user.role}


# ── CSRF token ──

@router.get("/csrf")
async def get_csrf(response: Response):
    csrf = generate_csrf_token()
    response.set_cookie("csrf", csrf, httponly=False, samesite="strict",
                        secure=settings.COOKIE_SECURE, max_age=86400)
    return {"csrf": csrf}


# ── Current user info ──

@router.get("/me")
async def get_me(user: CurrentUser, db: DbSession):
    result = await db.execute(select(User).where(User.id == user["id"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "institution_id": u.institution_id,
        "totp_enabled": u.totp_enabled,
        "last_login_at": str(u.last_login_at) if u.last_login_at else None,
    }


# ── Change password ──

@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: CurrentUser, db: DbSession):
    result = await db.execute(select(User).where(User.id == user["id"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, u.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    err = validate_password(body.new_password, u.email)
    if err:
        raise HTTPException(status_code=400, detail=err)

    u.password_hash = hash_password(body.new_password)
    u.password_changed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Password changed"}


# ── TOTP setup ──

@router.post("/totp/setup")
async def setup_totp(user: CurrentUser, db: DbSession):
    result = await db.execute(select(User).where(User.id == user["id"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404)

    secret = generate_totp_secret()
    u.totp_secret_enc = encrypt_secret(secret)
    u.totp_enabled = True
    await db.commit()

    uri = get_totp_uri(secret, u.email)
    return {"secret": secret, "uri": uri}


# ── Helpers ──

async def _issue_tokens(user: User, response: Response) -> dict:
    """Create access + refresh tokens and set cookies."""
    family_id = secrets.token_hex(16)
    jti = secrets.token_hex(16)
    access = create_access_token(user.id, user.role, jti)
    raw, token_hash, expires_at = create_refresh_token(user.id, family_id)
    csrf = generate_csrf_token()

    _set_cookies(response, access, raw, csrf)
    return {"message": "Login successful", "role": user.role, "csrf": csrf}


def _set_cookies(response: Response, access: str, refresh: str, csrf: str):
    response.set_cookie("access", access, httponly=True, samesite="strict",
                        secure=settings.COOKIE_SECURE, max_age=900)
    response.set_cookie("refresh", refresh, httponly=True, samesite="strict",
                        secure=settings.COOKIE_SECURE, max_age=604800, path="/api/v1/auth/refresh")
    response.set_cookie("csrf", csrf, httponly=False, samesite="strict",
                        secure=settings.COOKIE_SECURE, max_age=86400)
