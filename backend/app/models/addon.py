"""Risk scoring, patterns, and duplicate detection models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey
from app.models.base import Base, UUIDMixin


class RiskScore(Base, UUIDMixin):
    """Composite risk score for an application."""
    __tablename__ = "risk_scores"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, unique=True, index=True)
    overall_score = Column(Float, nullable=False, default=0.0)
    level = Column(String(10), nullable=False, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    doc_auth_score = Column(Float, default=0.0, nullable=False)
    compliance_score = Column(Float, default=0.0, nullable=False)
    cross_verify_score = Column(Float, default=0.0, nullable=False)
    history_score = Column(Float, default=0.0, nullable=False)
    anomaly_score = Column(Float, default=0.0, nullable=False)
    override_level = Column(String(10), nullable=True)
    override_reason = Column(Text, nullable=True)
    overridden_by = Column(String(36), ForeignKey("users.id"), nullable=True)


class RiskContribution(Base, UUIDMixin):
    """Individual factor contributing to a risk score (waterfall breakdown)."""
    __tablename__ = "risk_contributions"
    risk_score_id = Column(String(36), ForeignKey("risk_scores.id"), nullable=False, index=True)
    factor = Column(String(50), nullable=False)
    points = Column(Integer, nullable=False, default=0)
    weight = Column(Float, nullable=False, default=1.0)
    explanation = Column(Text, nullable=True)


class Pattern(Base, UUIDMixin):
    """Cross-institution anomaly pattern detected across submissions."""
    __tablename__ = "patterns"
    pattern_type = Column(String(30), nullable=False)  # TEMPLATE_REUSE, SIGNATURE_MATCH, OUTLIER, CLUSTER
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(10), nullable=False, default="MEDIUM")
    affected_count = Column(Integer, default=0, nullable=False)
    institutions_json = Column(Text, nullable=True)  # JSON array of institution IDs
    evidence_json = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    detected_at = Column(String(30), nullable=True)


class DuplicateCluster(Base, UUIDMixin):
    """Cluster of suspected duplicate documents."""
    __tablename__ = "duplicate_clusters"
    cluster_label = Column(String(50), nullable=True)
    detector_ids = Column(String(100), nullable=True)  # Comma-separated: D1,D4,D5
    status = Column(String(20), nullable=False, default="OPEN")  # OPEN, CONFIRMED, LEGITIMATE, ESCALATED
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(String(30), nullable=True)
    review_notes = Column(Text, nullable=True)


class DuplicateClusterMember(Base, UUIDMixin):
    """A member document within a duplicate cluster."""
    __tablename__ = "duplicate_cluster_members"
    cluster_id = Column(String(36), ForeignKey("duplicate_clusters.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    role = Column(String(20), nullable=True)  # ANCHOR, CANDIDATE
    similarity = Column(Float, default=0.0, nullable=False)


class DuplicateMatch(Base, UUIDMixin):
    """A pairwise match between two documents."""
    __tablename__ = "duplicate_matches"
    cluster_id = Column(String(36), ForeignKey("duplicate_clusters.id"), nullable=True, index=True)
    doc_a_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    doc_b_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    detector_id = Column(String(10), nullable=False)  # D1=SHA256, D4=pHash/dHash, D5=MinHash
    similarity = Column(Float, nullable=False, default=0.0)
    details_json = Column(Text, nullable=True)
