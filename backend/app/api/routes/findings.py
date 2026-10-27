"""Findings management routes."""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser
from app.models.finding import Finding, FindingEvidence, ValidationRun

router = APIRouter()


# ── Schemas ──

class FindingAction(BaseModel):
    action: str  # ACCEPT, DISMISS, ESCALATE, REQUEST_RECTIFICATION
    reason: Optional[str] = None

class RunTrigger(BaseModel):
    application_id: str
    mode: str = "full"  # self_check or full


# ── List findings for an application ──

@router.get("/applications/{app_id}/findings")
async def list_findings(
    app_id: str,
    db: DbSession,
    user: CurrentUser,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    kind: Optional[str] = None,
):
    query = select(Finding).where(Finding.application_id == app_id)
    if severity:
        query = query.where(Finding.severity == severity)
    if status_filter:
        query = query.where(Finding.status == status_filter)
    if kind:
        query = query.where(Finding.kind == kind)

    query = query.order_by(Finding.severity.desc(), Finding.created_at.desc())
    result = await db.execute(query)
    findings = result.scalars().all()
    return [_finding_to_dict(f) for f in findings]


# ── Get single finding ──

@router.get("/findings/{finding_id}")
async def get_finding(finding_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Get evidence
    ev_result = await db.execute(
        select(FindingEvidence).where(FindingEvidence.finding_id == finding_id)
    )
    evidence = ev_result.scalars().all()

    d = _finding_to_dict(f)
    d["evidence"] = [
        {
            "id": e.id,
            "document_id": e.document_id,
            "page_no": e.page_no,
            "value_found": e.value_found,
            "value_expected": e.value_expected,
            "source": e.source,
        }
        for e in evidence
    ]
    return d


# ── Take action on a finding ──

@router.post("/findings/{finding_id}/action")
async def action_finding(finding_id: str, body: FindingAction, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    action_map = {
        "ACCEPT": "ACCEPTED",
        "DISMISS": "DISMISSED",
        "ESCALATE": "ESCALATED",
        "REQUEST_RECTIFICATION": "RECTIFICATION_REQUESTED",
    }

    new_status = action_map.get(body.action)
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Invalid action: {body.action}")

    f.status = new_status
    f.reviewed_by = user["id"]
    f.reviewed_at = datetime.now(timezone.utc)
    f.review_reason = body.reason
    await db.commit()

    return _finding_to_dict(f)


# ── Trigger validation run ──

@router.post("/validation-runs")
async def trigger_run(body: RunTrigger, db: DbSession, user: CurrentUser):
    # Count existing runs
    count_q = select(func.count()).select_from(
        select(ValidationRun).where(ValidationRun.application_id == body.application_id).subquery()
    )
    count = (await db.execute(count_q)).scalar() or 0

    run = ValidationRun(
        application_id=body.application_id,
        run_no=count + 1,
        mode=body.mode,
        started_at=datetime.now(timezone.utc),
        status="COMPLETED",
        finished_at=datetime.now(timezone.utc),
        triggered_by=user["id"],
    )
    db.add(run)
    await db.commit()

    return {
        "id": run.id,
        "application_id": run.application_id,
        "run_no": run.run_no,
        "mode": run.mode,
        "status": run.status,
        "started_at": str(run.started_at),
        "finished_at": str(run.finished_at),
    }


# ── Get validation runs ──

@router.get("/applications/{app_id}/runs")
async def list_runs(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(ValidationRun)
        .where(ValidationRun.application_id == app_id)
        .order_by(ValidationRun.run_no.desc())
    )
    runs = result.scalars().all()
    return [
        {
            "id": r.id,
            "run_no": r.run_no,
            "mode": r.mode,
            "status": r.status,
            "started_at": str(r.started_at),
            "finished_at": str(r.finished_at) if r.finished_at else None,
        }
        for r in runs
    ]


# ── Helpers ──

def _finding_to_dict(f: Finding) -> dict:
    return {
        "id": f.id,
        "run_id": f.run_id,
        "application_id": f.application_id,
        "document_id": f.document_id,
        "kind": f.kind,
        "severity": f.severity,
        "detector_id": f.detector_id,
        "rule_id": f.rule_id,
        "title": f.title,
        "message": f.message,
        "suggested_action": f.suggested_action,
        "confidence": f.confidence,
        "status": f.status,
        "rectifiable": f.rectifiable,
        "risk_points": f.risk_points,
        "reviewed_by": f.reviewed_by,
        "reviewed_at": str(f.reviewed_at) if f.reviewed_at else None,
        "review_reason": f.review_reason,
        "created_at": str(f.created_at),
    }
