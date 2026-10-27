"""Audit log routes with hash-chain verification."""

import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser
from app.core.security import compute_audit_hash, GENESIS_HASH
from app.models.operations import AuditLog

router = APIRouter()


# ── List audit logs ──

@router.get("")
async def list_audit_logs(
    db: DbSession,
    user: CurrentUser,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if search:
        query = query.where(AuditLog.action.contains(search))

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(AuditLog.seq.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    logs = result.scalars().all()

    return {
        "items": [_log_to_dict(l) for l in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── Verify hash chain ──

@router.post("/verify-chain")
async def verify_chain(db: DbSession, user: CurrentUser):
    """Verify the integrity of the audit log hash chain."""
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.seq.asc())
    )
    logs = result.scalars().all()

    if not logs:
        return {"valid": True, "checked": 0, "message": "No audit logs to verify"}

    prev_hash = GENESIS_HASH
    broken_at = None

    for log_entry in logs:
        row_data = {
            "seq": log_entry.seq,
            "actor_id": log_entry.actor_id,
            "actor_role": log_entry.actor_role,
            "action": log_entry.action,
            "entity_type": log_entry.entity_type,
            "entity_id": log_entry.entity_id,
            "detail_json": log_entry.detail_json,
            "created_at": str(log_entry.created_at),
        }
        expected_hash = compute_audit_hash(prev_hash, row_data)

        if log_entry.row_hash != expected_hash:
            broken_at = log_entry.seq
            break

        if log_entry.prev_hash != prev_hash:
            broken_at = log_entry.seq
            break

        prev_hash = log_entry.row_hash

    if broken_at:
        return {
            "valid": False,
            "checked": len(logs),
            "broken_at_seq": broken_at,
            "message": f"Hash chain broken at sequence {broken_at}",
        }

    return {"valid": True, "checked": len(logs), "message": "Hash chain verified successfully"}


# ── Export as CSV ──

@router.get("/export")
async def export_csv(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.seq.asc())
    )
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["seq", "actor_id", "actor_role", "action", "entity_type",
                      "entity_id", "ip", "row_hash", "created_at"])
    for l in logs:
        writer.writerow([
            l.seq, l.actor_id, l.actor_role, l.action, l.entity_type,
            l.entity_id, l.ip, l.row_hash, str(l.created_at),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"},
    )


# ── Helpers ──

def _log_to_dict(l: AuditLog) -> dict:
    return {
        "id": l.id,
        "seq": l.seq,
        "actor_id": l.actor_id,
        "actor_role": l.actor_role,
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "detail_json": l.detail_json,
        "ip": l.ip,
        "row_hash": l.row_hash,
        "created_at": str(l.created_at),
    }
