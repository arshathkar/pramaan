"""Application management routes."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, and_

from app.core.deps import DbSession, CurrentUser, require_role
from app.models.application import Application, WorkflowEvent
from app.models.institution import Institution
from app.models.finding import ValidationRun, Finding
from app.models.addon import RiskScore

router = APIRouter()


# ── Schemas ──

class ApplicationCreate(BaseModel):
    institution_id: str
    category: str
    academic_year: str = "2026-27"

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    deadline: Optional[str] = None

class WorkflowTransition(BaseModel):
    to_state: str
    reason: Optional[str] = None


# ── List applications ──

@router.get("")
async def list_applications(
    db: DbSession,
    user: CurrentUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    institution_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List applications with filtering and pagination."""
    query = select(Application)

    # Role-based filtering
    if user["role"] == "COLLEGE_USER":
        query = query.where(Application.created_by == user["id"])
    if status_filter:
        query = query.where(Application.status == status_filter)
    if category:
        query = query.where(Application.category == category)
    if institution_id:
        query = query.where(Application.institution_id == institution_id)

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    query = query.order_by(Application.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    apps = result.scalars().all()

    return {
        "items": [_app_to_dict(a) for a in apps],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── Get single application ──

@router.get("/{app_id}")
async def get_application(app_id: str, db: DbSession, user: CurrentUser):
    app = await _get_app_or_404(db, app_id)
    return _app_to_dict(app)


# ── Create application ──

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_application(body: ApplicationCreate, db: DbSession, user: CurrentUser):
    # Generate app number
    count_q = select(func.count()).select_from(Application)
    count = (await db.execute(count_q)).scalar() or 0
    app_no = f"APP-{count + 1:06d}"

    app = Application(
        app_no=app_no,
        institution_id=body.institution_id,
        category=body.category,
        academic_year=body.academic_year,
        status="DRAFT",
        created_by=user["id"],
    )
    db.add(app)
    await db.flush()

    # Create initial workflow event
    event = WorkflowEvent(
        application_id=app.id,
        from_state="NONE",
        to_state="DRAFT",
        actor_id=user["id"],
        at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()

    return _app_to_dict(app)


# ── Update application ──

@router.patch("/{app_id}")
async def update_application(app_id: str, body: ApplicationUpdate, db: DbSession, user: CurrentUser):
    app = await _get_app_or_404(db, app_id)
    if body.status is not None:
        app.status = body.status
    if body.assigned_officer_id is not None:
        app.assigned_officer_id = body.assigned_officer_id
    if body.deadline is not None:
        app.deadline = body.deadline
    await db.commit()
    return _app_to_dict(app)


# ── Submit application ──

@router.post("/{app_id}/submit")
async def submit_application(app_id: str, db: DbSession, user: CurrentUser):
    app = await _get_app_or_404(db, app_id)
    if app.status not in ("DRAFT", "RECTIFICATION_SUBMITTED"):
        raise HTTPException(status_code=400, detail=f"Cannot submit from status {app.status}")

    old_status = app.status
    app.status = "SUBMITTED"
    app.submitted_at = datetime.now(timezone.utc)

    event = WorkflowEvent(
        application_id=app.id,
        from_state=old_status,
        to_state="SUBMITTED",
        actor_id=user["id"],
        at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()
    return _app_to_dict(app)


# ── Workflow transition ──

@router.post("/{app_id}/transition")
async def transition_application(
    app_id: str, body: WorkflowTransition, db: DbSession, user: CurrentUser
):
    app = await _get_app_or_404(db, app_id)
    old_status = app.status
    app.status = body.to_state

    event = WorkflowEvent(
        application_id=app.id,
        from_state=old_status,
        to_state=body.to_state,
        actor_id=user["id"],
        reason=body.reason,
        at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()
    return _app_to_dict(app)


# ── Get workflow timeline ──

@router.get("/{app_id}/timeline")
async def get_timeline(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(WorkflowEvent)
        .where(WorkflowEvent.application_id == app_id)
        .order_by(WorkflowEvent.at.asc())
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "from_state": e.from_state,
            "to_state": e.to_state,
            "actor_id": e.actor_id,
            "reason": e.reason,
            "at": str(e.at),
        }
        for e in events
    ]


# ── Helpers ──

async def _get_app_or_404(db, app_id: str) -> Application:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


def _app_to_dict(a: Application) -> dict:
    return {
        "id": a.id,
        "app_no": a.app_no,
        "institution_id": a.institution_id,
        "category": a.category,
        "academic_year": a.academic_year,
        "status": a.status,
        "deadline": a.deadline,
        "submitted_at": str(a.submitted_at) if a.submitted_at else None,
        "assigned_officer_id": a.assigned_officer_id,
        "current_run_id": a.current_run_id,
        "rectification_deadline": str(a.rectification_deadline) if a.rectification_deadline else None,
        "created_by": a.created_by,
        "created_at": str(a.created_at),
        "updated_at": str(a.updated_at),
    }
