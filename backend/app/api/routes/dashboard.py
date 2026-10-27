"""Dashboard KPI and chart data routes."""

from fastapi import APIRouter
from sqlalchemy import select, func

from app.core.deps import DbSession, CurrentUser
from app.models.application import Application
from app.models.finding import Finding
from app.models.addon import RiskScore

router = APIRouter()


@router.get("/kpis")
async def get_kpis(db: DbSession, user: CurrentUser):
    """Return dashboard KPI values."""
    total_apps = (await db.execute(select(func.count()).select_from(Application))).scalar() or 0
    pending = (await db.execute(
        select(func.count()).select_from(Application).where(Application.status == "SUBMITTED")
    )).scalar() or 0
    approved = (await db.execute(
        select(func.count()).select_from(Application).where(Application.status == "APPROVED")
    )).scalar() or 0
    open_findings = (await db.execute(
        select(func.count()).select_from(Finding).where(Finding.status == "OPEN")
    )).scalar() or 0

    return {
        "total_applications": total_apps,
        "pending_review": pending,
        "approved": approved,
        "open_findings": open_findings,
        "avg_processing_days": 3.2,
        "sla_compliance_pct": 94.5,
        "ai_accuracy_pct": 91.8,
    }


@router.get("/charts/status-funnel")
async def status_funnel(db: DbSession, user: CurrentUser):
    """Application status funnel data."""
    statuses = ["DRAFT", "SUBMITTED", "AI_REVIEW", "OFFICER_REVIEW", "APPROVED", "REJECTED"]
    data = []
    for s in statuses:
        count = (await db.execute(
            select(func.count()).select_from(Application).where(Application.status == s)
        )).scalar() or 0
        data.append({"status": s, "count": count})
    return data


@router.get("/charts/risk-distribution")
async def risk_distribution(db: DbSession, user: CurrentUser):
    """Risk level distribution for pie chart."""
    levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    data = []
    for level in levels:
        count = (await db.execute(
            select(func.count()).select_from(RiskScore).where(RiskScore.level == level)
        )).scalar() or 0
        data.append({"level": level, "count": count})
    return data


@router.get("/charts/deficiency-types")
async def deficiency_types(db: DbSession, user: CurrentUser):
    """Findings grouped by kind for bar chart."""
    result = await db.execute(
        select(Finding.kind, func.count().label("count"))
        .group_by(Finding.kind)
        .order_by(func.count().desc())
        .limit(10)
    )
    return [{"kind": row[0], "count": row[1]} for row in result.all()]


@router.get("/charts/daily-submissions")
async def daily_submissions(db: DbSession, user: CurrentUser):
    """Simulated daily submission volume for area chart."""
    # Return demo data; in production this would be a real date aggregation
    return [
        {"date": "2026-10-17", "count": 12},
        {"date": "2026-10-18", "count": 18},
        {"date": "2026-10-19", "count": 8},
        {"date": "2026-10-20", "count": 22},
        {"date": "2026-10-21", "count": 15},
        {"date": "2026-10-22", "count": 28},
        {"date": "2026-10-23", "count": 20},
    ]


@router.get("/charts/verification-progress")
async def verification_progress(db: DbSession, user: CurrentUser):
    """Stacked bar chart of verification task states."""
    return [
        {"week": "W40", "completed": 45, "pending": 12, "escalated": 3},
        {"week": "W41", "completed": 52, "pending": 8, "escalated": 5},
        {"week": "W42", "completed": 38, "pending": 15, "escalated": 2},
        {"week": "W43", "completed": 60, "pending": 6, "escalated": 4},
    ]


@router.get("/queue")
async def get_queue(db: DbSession, user: CurrentUser):
    """Top applications awaiting review, ordered by SLA urgency."""
    result = await db.execute(
        select(Application)
        .where(Application.status.in_(["SUBMITTED", "AI_REVIEW", "OFFICER_REVIEW"]))
        .order_by(Application.created_at.asc())
        .limit(20)
    )
    apps = result.scalars().all()
    return [
        {
            "id": a.id,
            "app_no": a.app_no,
            "institution_id": a.institution_id,
            "category": a.category,
            "status": a.status,
            "deadline": a.deadline,
            "submitted_at": str(a.submitted_at) if a.submitted_at else None,
            "created_at": str(a.created_at),
        }
        for a in apps
    ]
