"""Risk scoring routes."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import DbSession, CurrentUser
from app.models.addon import RiskScore, RiskContribution

router = APIRouter()


# ── Schemas ──

class RiskOverride(BaseModel):
    level: str  # LOW, MEDIUM, HIGH, CRITICAL
    reason: str


# ── Get risk score for an application ──

@router.get("/applications/{app_id}/risk")
async def get_risk_score(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RiskScore).where(RiskScore.application_id == app_id)
    )
    risk = result.scalar_one_or_none()
    if not risk:
        # Return default
        return {
            "application_id": app_id,
            "overall_score": 0.0,
            "level": "LOW",
            "doc_auth_score": 0.0,
            "compliance_score": 0.0,
            "cross_verify_score": 0.0,
            "history_score": 0.0,
            "anomaly_score": 0.0,
            "contributions": [],
        }

    # Get contributions (waterfall)
    contrib_result = await db.execute(
        select(RiskContribution)
        .where(RiskContribution.risk_score_id == risk.id)
        .order_by(RiskContribution.points.desc())
    )
    contributions = contrib_result.scalars().all()

    return {
        "application_id": app_id,
        "overall_score": risk.overall_score,
        "level": risk.override_level or risk.level,
        "doc_auth_score": risk.doc_auth_score,
        "compliance_score": risk.compliance_score,
        "cross_verify_score": risk.cross_verify_score,
        "history_score": risk.history_score,
        "anomaly_score": risk.anomaly_score,
        "override_level": risk.override_level,
        "override_reason": risk.override_reason,
        "contributions": [
            {
                "factor": c.factor,
                "points": c.points,
                "weight": c.weight,
                "explanation": c.explanation,
            }
            for c in contributions
        ],
    }


# ── Override risk level ──

@router.post("/applications/{app_id}/risk/override")
async def override_risk(app_id: str, body: RiskOverride, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(RiskScore).where(RiskScore.application_id == app_id)
    )
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk score not found")

    risk.override_level = body.level
    risk.override_reason = body.reason
    risk.overridden_by = user["id"]
    await db.commit()

    return {"message": "Risk level overridden", "level": body.level}
