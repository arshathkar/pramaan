"""Self-evaluation and metrics routes."""

from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import DbSession, CurrentUser
from app.models.operations import EvaluationRunRecord

router = APIRouter()


@router.get("")
async def list_evaluation_runs(db: DbSession, user: CurrentUser):
    """List all self-evaluation run records."""
    result = await db.execute(
        select(EvaluationRunRecord).order_by(EvaluationRunRecord.created_at.desc())
    )
    runs = result.scalars().all()
    return [_run_to_dict(r) for r in runs]


@router.get("/latest")
async def get_latest_evaluation(db: DbSession, user: CurrentUser):
    """Get the most recent evaluation run or return demo metrics."""
    result = await db.execute(
        select(EvaluationRunRecord).order_by(EvaluationRunRecord.created_at.desc()).limit(1)
    )
    run = result.scalar_one_or_none()

    if run:
        return _run_to_dict(run)

    # Return demo metrics if no runs exist
    return {
        "id": "demo",
        "run_label": "Demo Evaluation",
        "total_apps": 150,
        "precision": 0.94,
        "recall": 0.91,
        "f1": 0.925,
        "accuracy": 0.918,
        "false_positive_rate": 0.06,
        "false_negative_rate": 0.09,
        "mean_latency_ms": 2400,
        "p95_latency_ms": 4800,
        "anomaly_detector_auc": 0.89,
        "effort_saved_pct": 68.5,
        "metrics": {
            "ocr_accuracy": {"value": 0.96, "pass": True, "threshold": 0.90},
            "classification_accuracy": {"value": 0.94, "pass": True, "threshold": 0.90},
            "field_extraction_f1": {"value": 0.91, "pass": True, "threshold": 0.85},
            "cross_verify_accuracy": {"value": 0.88, "pass": True, "threshold": 0.85},
            "duplicate_precision": {"value": 0.95, "pass": True, "threshold": 0.90},
            "duplicate_recall": {"value": 0.82, "pass": False, "threshold": 0.85},
            "risk_calibration": {"value": 0.87, "pass": True, "threshold": 0.80},
            "overall_precision": {"value": 0.94, "pass": True, "threshold": 0.90},
            "overall_recall": {"value": 0.91, "pass": True, "threshold": 0.85},
            "false_positive_rate": {"value": 0.06, "pass": True, "threshold": 0.10},
            "mean_latency_ms": {"value": 2400, "pass": True, "threshold": 5000},
            "p95_latency_ms": {"value": 4800, "pass": True, "threshold": 10000},
        },
        "anomaly_chart": [
            {"threshold": 0.1, "fpr": 0.02, "tpr": 0.45},
            {"threshold": 0.2, "fpr": 0.05, "tpr": 0.65},
            {"threshold": 0.3, "fpr": 0.08, "tpr": 0.78},
            {"threshold": 0.4, "fpr": 0.12, "tpr": 0.85},
            {"threshold": 0.5, "fpr": 0.18, "tpr": 0.89},
            {"threshold": 0.6, "fpr": 0.25, "tpr": 0.92},
            {"threshold": 0.7, "fpr": 0.35, "tpr": 0.95},
            {"threshold": 0.8, "fpr": 0.50, "tpr": 0.97},
            {"threshold": 0.9, "fpr": 0.70, "tpr": 0.99},
            {"threshold": 1.0, "fpr": 1.00, "tpr": 1.00},
        ],
    }


@router.get("/{run_id}")
async def get_evaluation_run(run_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        return {"error": "Run not found"}
    return _run_to_dict(run)


def _run_to_dict(r: EvaluationRunRecord) -> dict:
    return {
        "id": r.id,
        "run_label": r.run_label,
        "total_apps": r.total_apps,
        "precision": r.precision,
        "recall": r.recall,
        "f1": r.f1,
        "accuracy": r.accuracy,
        "false_positive_rate": r.false_positive_rate,
        "false_negative_rate": r.false_negative_rate,
        "mean_latency_ms": r.mean_latency_ms,
        "p95_latency_ms": r.p95_latency_ms,
        "anomaly_detector_auc": r.anomaly_detector_auc,
        "effort_saved_pct": r.effort_saved_pct,
        "metrics_json": r.metrics_json,
        "notes": r.notes,
        "created_at": str(r.created_at),
    }
