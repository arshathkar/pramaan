"""Admin configuration routes — users, rulesets, checklists, settings."""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser, require_role
from app.core.security import hash_password, validate_password
from app.models.user import User
from app.models.operations import RuleSet, Checklist, RiskWeightSet, Setting
from app.models.addon import Pattern

router = APIRouter()


# ── Schemas ──

class UserCreate(BaseModel):
    email: str
    full_name: str
    role: str
    password: str
    institution_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class SettingUpdate(BaseModel):
    value: str


# ── User management ──

@router.get("/users")
async def list_users(
    db: DbSession,
    user: CurrentUser,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "items": [_user_to_dict(u) for u in users],
        "total": total,
    }


@router.post("/users")
async def create_user(body: UserCreate, db: DbSession, user: CurrentUser):
    # Check existing
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    err = validate_password(body.password, body.email)
    if err:
        raise HTTPException(status_code=400, detail=err)

    new_user = User(
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        password_hash=hash_password(body.password),
        institution_id=body.institution_id,
    )
    db.add(new_user)
    await db.commit()
    return _user_to_dict(new_user)


@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, db: DbSession, user: CurrentUser):
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        u.full_name = body.full_name
    if body.role is not None:
        u.role = body.role
    if body.is_active is not None:
        u.is_active = body.is_active
    await db.commit()
    return _user_to_dict(u)


# ── Rulesets ──

@router.get("/rulesets")
async def list_rulesets(db: DbSession, user: CurrentUser):
    result = await db.execute(select(RuleSet).order_by(RuleSet.created_at.desc()))
    return [
        {"id": r.id, "version": r.version, "category": r.category,
         "active": r.active, "created_at": str(r.created_at)}
        for r in result.scalars().all()
    ]


@router.get("/rulesets/{ruleset_id}")
async def get_ruleset(ruleset_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(RuleSet).where(RuleSet.id == ruleset_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404)
    return {"id": r.id, "version": r.version, "category": r.category,
            "yaml_content": r.yaml_content, "active": r.active, "notes": r.notes}


# ── Checklists ──

@router.get("/checklists")
async def list_checklists(db: DbSession, user: CurrentUser):
    result = await db.execute(select(Checklist).order_by(Checklist.created_at.desc()))
    return [
        {"id": c.id, "version": c.version, "category": c.category,
         "active": c.active, "created_at": str(c.created_at)}
        for c in result.scalars().all()
    ]


# ── Risk weights ──

@router.get("/risk-weights")
async def list_risk_weights(db: DbSession, user: CurrentUser):
    result = await db.execute(select(RiskWeightSet).order_by(RiskWeightSet.created_at.desc()))
    return [
        {"id": r.id, "version": r.version, "active": r.active, "created_at": str(r.created_at)}
        for r in result.scalars().all()
    ]


# ── Patterns ──

@router.get("/patterns")
async def list_patterns(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Pattern).where(Pattern.active == True).order_by(Pattern.created_at.desc())
    )
    return [
        {"id": p.id, "pattern_type": p.pattern_type, "title": p.title,
         "severity": p.severity, "affected_count": p.affected_count,
         "detected_at": p.detected_at}
        for p in result.scalars().all()
    ]


# ── Settings ──

@router.get("/settings")
async def list_settings(db: DbSession, user: CurrentUser):
    result = await db.execute(select(Setting).order_by(Setting.key))
    return [
        {"id": s.id, "key": s.key, "value": s.value,
         "description": s.description, "editable": s.editable}
        for s in result.scalars().all()
    ]


@router.patch("/settings/{setting_id}")
async def update_setting(setting_id: str, body: SettingUpdate, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Setting).where(Setting.id == setting_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404)
    if not s.editable:
        raise HTTPException(status_code=403, detail="This setting is not editable")
    s.value = body.value
    await db.commit()
    return {"message": "Setting updated"}


# ── Helpers ──

def _user_to_dict(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "institution_id": u.institution_id,
        "is_active": u.is_active,
        "totp_enabled": u.totp_enabled,
        "last_login_at": str(u.last_login_at) if u.last_login_at else None,
        "created_at": str(u.created_at),
    }
