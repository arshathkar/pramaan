"""Cross-verification routes."""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import DbSession, CurrentUser
from app.models.verification import Verification, InfraResult

router = APIRouter()


# ── Schemas ──

class VerificationOutcome(BaseModel):
    outcome: str  # CONFIRMED, REJECTED, ESCALATED
    officer_notes: Optional[str] = None


# ── List verification tasks ──

@router.get("/verification-tasks")
async def list_verification_tasks(
    db: DbSession,
    user: CurrentUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_to: Optional[str] = None,
):
    query = select(Verification)
    if status_filter:
        query = query.where(Verification.status == status_filter)
    if assigned_to:
        query = query.where(Verification.assigned_to == assigned_to)
    elif user["role"] == "SCRUTINY_OFFICER":
        query = query.where(Verification.assigned_to == user["id"])

    query = query.order_by(Verification.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [_verif_to_dict(v) for v in tasks]


# ── Get single verification task ──

@router.get("/verification-tasks/{task_id}")
async def get_verification_task(task_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Verification).where(Verification.id == task_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Verification task not found")
    return _verif_to_dict(v)


# ── Submit outcome ──

@router.post("/verification-tasks/{task_id}/outcome")
async def submit_outcome(task_id: str, body: VerificationOutcome, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Verification).where(Verification.id == task_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Verification task not found")

    v.outcome = body.outcome
    v.status = body.outcome  # CONFIRMED, REJECTED, ESCALATED
    v.officer_notes = body.officer_notes
    v.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return _verif_to_dict(v)


# ── Application-level verifications ──

@router.get("/applications/{app_id}/verifications")
async def list_app_verifications(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Verification)
        .where(Verification.application_id == app_id)
        .order_by(Verification.created_at.desc())
    )
    verifs = result.scalars().all()
    return [_verif_to_dict(v) for v in verifs]


# ── Infrastructure verification results ──

@router.get("/applications/{app_id}/infra-results")
async def list_infra_results(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(InfraResult)
        .where(InfraResult.application_id == app_id)
        .order_by(InfraResult.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": r.id,
            "check_type": r.check_type,
            "submitted_lat": r.submitted_lat,
            "submitted_lon": r.submitted_lon,
            "reference_lat": r.reference_lat,
            "reference_lon": r.reference_lon,
            "distance_km": r.distance_km,
            "result": r.result,
            "simulated": r.simulated,
            "created_at": str(r.created_at),
        }
        for r in items
    ]


# ── Helpers ──

def _verif_to_dict(v: Verification) -> dict:
    return {
        "id": v.id,
        "application_id": v.application_id,
        "document_id": v.document_id,
        "finding_id": v.finding_id,
        "field_name": v.field_name,
        "claimed_value": v.claimed_value,
        "authority_value": v.authority_value,
        "authority_source": v.authority_source,
        "match_result": v.match_result,
        "confidence": v.confidence,
        "method": v.method,
        "assigned_to": v.assigned_to,
        "status": v.status,
        "outcome": v.outcome,
        "officer_notes": v.officer_notes,
        "completed_at": str(v.completed_at) if v.completed_at else None,
        "created_at": str(v.created_at),
    }
