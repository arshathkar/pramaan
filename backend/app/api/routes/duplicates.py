"""Duplicate detection routes."""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import DbSession, CurrentUser
from app.models.addon import DuplicateCluster, DuplicateClusterMember, DuplicateMatch

router = APIRouter()


# ── Schemas ──

class ClusterAction(BaseModel):
    action: str  # CONFIRMED, LEGITIMATE, ESCALATED
    notes: Optional[str] = None


# ── List duplicate clusters ──

@router.get("")
async def list_clusters(
    db: DbSession,
    user: CurrentUser,
    status_filter: Optional[str] = Query(None, alias="status"),
):
    query = select(DuplicateCluster)
    if status_filter:
        query = query.where(DuplicateCluster.status == status_filter)
    query = query.order_by(DuplicateCluster.created_at.desc())

    result = await db.execute(query)
    clusters = result.scalars().all()

    items = []
    for c in clusters:
        members_result = await db.execute(
            select(DuplicateClusterMember).where(DuplicateClusterMember.cluster_id == c.id)
        )
        members = members_result.scalars().all()
        items.append({
            "id": c.id,
            "cluster_label": c.cluster_label,
            "detector_ids": c.detector_ids,
            "status": c.status,
            "member_count": len(members),
            "reviewed_by": c.reviewed_by,
            "reviewed_at": c.reviewed_at,
            "created_at": str(c.created_at),
        })
    return items


# ── Get cluster detail ──

@router.get("/{cluster_id}")
async def get_cluster(cluster_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(DuplicateCluster).where(DuplicateCluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    members_result = await db.execute(
        select(DuplicateClusterMember).where(DuplicateClusterMember.cluster_id == cluster_id)
    )
    members = members_result.scalars().all()

    matches_result = await db.execute(
        select(DuplicateMatch).where(DuplicateMatch.cluster_id == cluster_id)
    )
    matches = matches_result.scalars().all()

    return {
        "id": cluster.id,
        "cluster_label": cluster.cluster_label,
        "detector_ids": cluster.detector_ids,
        "status": cluster.status,
        "review_notes": cluster.review_notes,
        "members": [
            {
                "id": m.id,
                "document_id": m.document_id,
                "institution_id": m.institution_id,
                "role": m.role,
                "similarity": m.similarity,
            }
            for m in members
        ],
        "matches": [
            {
                "id": mt.id,
                "doc_a_id": mt.doc_a_id,
                "doc_b_id": mt.doc_b_id,
                "detector_id": mt.detector_id,
                "similarity": mt.similarity,
            }
            for mt in matches
        ],
    }


# ── Take action on cluster ──

@router.post("/{cluster_id}/action")
async def action_cluster(cluster_id: str, body: ClusterAction, db: DbSession, user: CurrentUser):
    result = await db.execute(select(DuplicateCluster).where(DuplicateCluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = body.action
    cluster.reviewed_by = user["id"]
    cluster.reviewed_at = datetime.now(timezone.utc).isoformat()
    cluster.review_notes = body.notes
    await db.commit()

    return {"message": f"Cluster marked as {body.action}", "id": cluster.id}
