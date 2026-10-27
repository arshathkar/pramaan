"""Institution and records routes."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser
from app.models.institution import (
    Institution, Trust, RecordApproval, RecordProgramme,
    RecordFaculty, RecordDeficiency, RecordFeePayment, RecordHistory,
)

router = APIRouter()


# ── List institutions ──

@router.get("")
async def list_institutions(
    db: DbSession,
    user: CurrentUser,
    state: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(Institution)
    if state:
        query = query.where(Institution.state == state)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Institution.name).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [_inst_to_dict(i) for i in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── Get single institution ──

@router.get("/{inst_id}")
async def get_institution(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Institution).where(Institution.id == inst_id))
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return _inst_to_dict(inst)


# ── Get institution records ──

@router.get("/{inst_id}/approvals")
async def get_approvals(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RecordApproval).where(RecordApproval.institution_id == inst_id)
        .order_by(RecordApproval.academic_year.desc())
    )
    return [
        {"id": r.id, "academic_year": r.academic_year, "status": r.status,
         "eoa_letter_no": r.eoa_letter_no, "valid_to": r.valid_to}
        for r in result.scalars().all()
    ]


@router.get("/{inst_id}/programmes")
async def get_programmes(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RecordProgramme).where(RecordProgramme.institution_id == inst_id)
    )
    return [
        {"id": r.id, "programme": r.programme, "level": r.level,
         "approved_intake": r.approved_intake, "from_year": r.from_year}
        for r in result.scalars().all()
    ]


@router.get("/{inst_id}/faculty")
async def get_faculty(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RecordFaculty).where(RecordFaculty.institution_id == inst_id)
    )
    return [
        {"id": r.id, "faculty_id": r.faculty_id, "name": r.name,
         "designation": r.designation, "qualification": r.qualification,
         "department": r.department, "employment_type": r.employment_type, "active": r.active}
        for r in result.scalars().all()
    ]


@router.get("/{inst_id}/deficiencies")
async def get_deficiencies(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RecordDeficiency).where(RecordDeficiency.institution_id == inst_id)
    )
    return [
        {"id": r.id, "cycle": r.cycle, "kind": r.kind,
         "document_type": r.document_type, "resolved": r.resolved}
        for r in result.scalars().all()
    ]


@router.get("/{inst_id}/history")
async def get_history(inst_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RecordHistory).where(RecordHistory.institution_id == inst_id)
        .order_by(RecordHistory.academic_year.desc())
    )
    return [
        {"id": r.id, "academic_year": r.academic_year, "category": r.category,
         "submitted_at": r.submitted_at, "deadline": r.deadline, "outcome": r.outcome}
        for r in result.scalars().all()
    ]


# ── Helpers ──

def _inst_to_dict(i: Institution) -> dict:
    return {
        "id": i.id,
        "code": i.code,
        "name": i.name,
        "trust_id": i.trust_id,
        "address": i.address,
        "state": i.state,
        "district": i.district,
        "lat": i.lat,
        "lon": i.lon,
        "founded_year": i.founded_year,
    }
