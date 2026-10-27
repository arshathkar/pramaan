"""Application and WorkflowEvent models."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.models.base import Base, UUIDMixin


class Application(Base, UUIDMixin):
    __tablename__ = "applications"
    app_no = Column(String(20), unique=True, nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    category = Column(String(30), nullable=False)
    academic_year = Column(String(10), nullable=False)
    status = Column(String(40), nullable=False, default="DRAFT", index=True)
    deadline = Column(String(10), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    current_run_id = Column(String(36), nullable=True)
    rectification_deadline = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)


class WorkflowEvent(Base, UUIDMixin):
    __tablename__ = "workflow_events"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    from_state = Column(String(40), nullable=False)
    to_state = Column(String(40), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)
    at = Column(DateTime(timezone=True), nullable=False)
