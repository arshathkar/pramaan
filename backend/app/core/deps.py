"""FastAPI dependencies — DB sessions, auth, RBAC, CSRF."""

from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.security import decode_access_token, verify_csrf

# ── Database ──


database_url = settings.DATABASE_URL

# Convert PostgreSQL URLs to the asyncpg driver format
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )

# asyncpg uses "ssl", not "sslmode"
if "sslmode=" in database_url:
    database_url = database_url.replace("sslmode=require", "")
    database_url = database_url.replace("sslmode=verify-full", "")

engine = create_async_engine(
    database_url,
    echo=(settings.APP_ENV == "dev"),
    connect_args=(
        {"check_same_thread": False}
        if "sqlite" in database_url
        else {"ssl": "require"}
    ),
)


async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session_factory() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


# ── Current user ──

async def get_current_user(request: Request) -> dict:
    """Extract and validate the user from the access cookie.

    In a full implementation this re-reads the user's role and active flag
    from the database on every request. For the prototype, we decode the JWT.
    """
    token = request.cookies.get("access")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return {
        "id": payload["sub"],
        "role": payload.get("role", ""),
        "jti": payload.get("jti", ""),
    }


CurrentUser = Annotated[dict, Depends(get_current_user)]


# ── Role checking ──

def require_role(*allowed_roles: str) -> Callable:
    """Return a dependency that 403s if the user's role is not in the list."""

    async def _check(user: CurrentUser) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return Depends(_check)


# ── CSRF check ──

async def csrf_check(request: Request) -> None:
    """Validate double-submit CSRF token on state-changing requests."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    cookie_val = request.cookies.get("csrf", "")
    header_val = request.headers.get("X-CSRF-Token", "")
    if not cookie_val or not verify_csrf(cookie_val, header_val):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")
