"""Verification, InfraResult, and Notice models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from app.models.base import Base, UUIDMixin


class Verification(Base, UUIDMixin):
    """A cross-verification task assigned to an officer."""
    __tablename__ = "verifications"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    finding_id = Column(String(36), ForeignKey("findings.id"), nullable=True)
    field_name = Column(String(100), nullable=False)
    claimed_value = Column(Text, nullable=True)
    authority_value = Column(Text, nullable=True)
    authority_source = Column(String(100), nullable=True)
    match_result = Column(String(20), nullable=True)  # MATCH, MISMATCH, NOT_FOUND, PENDING
    confidence = Column(Float, default=0.0, nullable=False)
    method = Column(String(30), nullable=True)  # API, MANUAL, OCR_COMPARE
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, CONFIRMED, REJECTED, ESCALATED
    outcome = Column(String(20), nullable=True)
    officer_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class InfraResult(Base, UUIDMixin):
    """Result from simulated infrastructure verification (video/photo/geo)."""
    __tablename__ = "infra_results"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    check_type = Column(String(30), nullable=False)  # GEO_CHECK, PHOTO_CHECK, VIDEO_CHECK
    submitted_lat = Column(Float, nullable=True)
    submitted_lon = Column(Float, nullable=True)
    reference_lat = Column(Float, nullable=True)
    reference_lon = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    result = Column(String(20), nullable=False, default="PENDING")  # PASS, FAIL, INCONCLUSIVE, PENDING
    details_json = Column(Text, nullable=True)
    simulated = Column(Boolean, default=True, nullable=False)


class Notice(Base, UUIDMixin):
    """Deficiency notice / show-cause notice sent to an institution."""
    __tablename__ = "notices"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    notice_type = Column(String(30), nullable=False)  # DEFICIENCY, SHOW_CAUSE, RECTIFICATION
    content = Column(Text, nullable=False)
    generated_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="DRAFT")  # DRAFT, SENT, RESPONDED, EXPIRED
    response_text = Column(Text, nullable=True)
    issued_by = Column(String(36), ForeignKey("users.id"), nullable=False)
