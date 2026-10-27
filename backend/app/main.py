"""Pramaan FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.deps import engine
from app.models.base import Base
from app.api.routes import (
    health, auth, applications, documents, findings,
    verification, risk, institutions, duplicates,
    dashboard, alerts, audit, chat, admin, evaluation,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (dev/demo); dispose engine on shutdown."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "dev" else None,
    openapi_url="/openapi.json" if settings.APP_ENV == "dev" else None,
    lifespan=lifespan,
)


# ── Security Headers Middleware ──

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
        "worker-src 'self' blob:; object-src 'none'; base-uri 'none'; "
        "form-action 'self'; frame-ancestors 'none'"
    )
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


# ── CORS (dev only — prod uses same-origin via proxy) ──

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pramaan-liart.vercel.app",
        "http://localhost:5173",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ──

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import uuid
    request_id = str(uuid.uuid4())[:8]
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred.", "request_id": request_id}},
    )


# ── Register route modules ──

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(findings.router, prefix="/api/v1", tags=["Findings"])
app.include_router(verification.router, prefix="/api/v1", tags=["Verification"])
app.include_router(risk.router, prefix="/api/v1", tags=["Risk"])
app.include_router(institutions.router, prefix="/api/v1/institutions", tags=["Institutions"])
app.include_router(duplicates.router, prefix="/api/v1/duplicates", tags=["Duplicates"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
