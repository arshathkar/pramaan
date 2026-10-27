"""Alert management routes."""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser
from app.models.operations import Alert

router = APIRouter()


# ── Schemas ──

class AlertAcknowledge(BaseModel):
    pass

class AlertSnooze(BaseModel):
    until: str  # ISO datetime


# ── List alerts ──

@router.get("")
async def list_alerts(
    db: DbSession,
    user: CurrentUser,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(Alert)

    # Role-based filtering
    if user["role"] != "SYSTEM_ADMIN":
        query = query.where(
            (Alert.target_role == None) | (Alert.target_role == user["role"])
        )

    if severity:
        query = query.where(Alert.severity == severity)
    if category:
        query = query.where(Alert.category == category)
    if acknowledged is not None:
        query = query.where(Alert.acknowledged == acknowledged)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Alert.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "items": [_alert_to_dict(a) for a in alerts],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── Get single alert ──

@router.get("/{alert_id}")
async def get_alert(alert_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


# ── Acknowledge ──

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    alert.acknowledged_by = user["id"]
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Alert acknowledged"}


# ── Snooze ──

@router.post("/{alert_id}/snooze")
async def snooze_alert(alert_id: str, body: AlertSnooze, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.snoozed_until = datetime.fromisoformat(body.until)
    await db.commit()

    return {"message": f"Alert snoozed until {body.until}"}


# ── Unread count ──

@router.get("/count/unread")
async def unread_count(db: DbSession, user: CurrentUser):
    query = select(func.count()).select_from(Alert).where(Alert.acknowledged == False)
    if user["role"] != "SYSTEM_ADMIN":
        query = query.where(
            (Alert.target_role == None) | (Alert.target_role == user["role"])
        )
    count = (await db.execute(query)).scalar() or 0
    return {"unread": count}


# ── Helpers ──

def _alert_to_dict(a: Alert) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "message": a.message,
        "severity": a.severity,
        "category": a.category,
        "source": a.source,
        "target_role": a.target_role,
        "application_id": a.application_id,
        "link": a.link,
        "acknowledged": a.acknowledged,
        "acknowledged_at": str(a.acknowledged_at) if a.acknowledged_at else None,
        "snoozed_until": str(a.snoozed_until) if a.snoozed_until else None,
        "created_at": str(a.created_at),
    }
