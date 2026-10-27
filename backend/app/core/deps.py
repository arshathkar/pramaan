from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

from app.core.config import settings
from app.core.security import decode_access_token, verify_csrf


# ----------------------------------------
# Database configuration
# ----------------------------------------

database_url = settings.DATABASE_URL

# Convert standard PostgreSQL URLs to the asyncpg driver.
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    )

# Parse the URL once. Use URL properties for all subsequent checks.
parsed_url = make_url(database_url)

is_sqlite = parsed_url.get_backend_name() == "sqlite"
is_async_postgres = parsed_url.drivername == "postgresql+asyncpg"

# asyncpg does not accept Neon's sslmode and channel_binding
# parameters as connection keyword arguments.
if is_async_postgres:
    query_params = dict(parsed_url.query)
    query_params.pop("sslmode", None)
    query_params.pop("channel_binding", None)

    parsed_url = parsed_url.set(query=query_params)

# Configure the appropriate connection arguments.
if is_sqlite:
    connect_args = {"check_same_thread": False}
elif is_async_postgres:
    connect_args = {"ssl": "require"}
else:
    connect_args = {}

engine = create_async_engine(
    parsed_url,
    echo=(settings.APP_ENV == "dev"),
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


# ----------------------------------------
# Database dependency
# ----------------------------------------

async def get_db():
    async with async_session_factory() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


# ----------------------------------------
# Authentication dependency
# ----------------------------------------

async def get_current_user(request: Request):
    token = request.cookies.get("access")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return {
        "id": payload["sub"],
        "role": payload.get("role", ""),
        "jti": payload.get("jti", ""),
    }


CurrentUser = Annotated[dict, Depends(get_current_user)]


# ----------------------------------------
# Role authorization
# ----------------------------------------

def require_role(*allowed_roles: str):
    async def _check(user: CurrentUser):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return Depends(_check)


# ----------------------------------------
# CSRF protection
# ----------------------------------------

async def csrf_check(request: Request):
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return

    csrf_cookie = request.cookies.get("csrf")
    csrf_header = request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )

    if not verify_csrf(csrf_cookie, csrf_header):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )