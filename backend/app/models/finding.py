"""Finding, FindingEvidence, ValidationRun models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from app.models.base import Base, UUIDMixin


class ValidationRun(Base, UUIDMixin):
    __tablename__ = "validation_runs"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    run_no = Column(Integer, nullable=False)
    mode = Column(String(20), nullable=False)  # self_check or full
    ruleset_version = Column(String(30), nullable=True)
    checklist_version = Column(String(30), nullable=True)
    records_snapshot_ref = Column(String(64), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="RUNNING")
    stage_results_json = Column(Text, nullable=True)
    triggered_by = Column(String(36), ForeignKey("users.id"), nullable=False)


class Finding(Base, UUIDMixin):
    __tablename__ = "findings"
    run_id = Column(String(36), ForeignKey("validation_runs.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    kind = Column(String(40), nullable=False)
    severity = Column(String(10), nullable=False)
    detector_id = Column(String(10), nullable=True)
    rule_id = Column(String(30), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), nullable=False, default="OPEN")
    rectifiable = Column(Boolean, default=False, nullable=False)
    risk_points = Column(Integer, default=0, nullable=False)
    explanation_json = Column(Text, nullable=True)
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_reason = Column(Text, nullable=True)


class FindingEvidence(Base, UUIDMixin):
    __tablename__ = "finding_evidence"
    finding_id = Column(String(36), ForeignKey("findings.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    page_no = Column(Integer, nullable=True)
    x0 = Column(Float, nullable=True)
    y0 = Column(Float, nullable=True)
    x1 = Column(Float, nullable=True)
    y1 = Column(Float, nullable=True)
    value_found = Column(Text, nullable=True)
    value_expected = Column(Text, nullable=True)
    source = Column(String(30), nullable=True)
    heatmap_path = Column(String(500), nullable=True)
