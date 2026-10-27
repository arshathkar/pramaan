"""Health check routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "pramaan", "version": "1.0.0"}


@router.get("/health/ready")
async def readiness_check():
    return {"ready": True}
