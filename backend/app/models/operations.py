"""Operational models — Alerts, Audit, KB, Chat, Admin config, Evaluation."""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from app.models.base import Base, UUIDMixin


class Alert(Base, UUIDMixin):
    """System alert/notification for officers and admins."""
    __tablename__ = "alerts"
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(10), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    category = Column(String(30), nullable=False)  # SLA_BREACH, RISK, DUPLICATE, SYSTEM, COMPLIANCE
    source = Column(String(50), nullable=True)
    target_role = Column(String(30), nullable=True)  # If set, only this role sees it
    target_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True)
    link = Column(String(500), nullable=True)
    acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    snoozed_until = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base, UUIDMixin):
    """Immutable audit log entry with hash chain."""
    __tablename__ = "audit_logs"
    seq = Column(Integer, autoincrement=True, nullable=False, unique=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    actor_role = Column(String(30), nullable=False)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(String(36), nullable=False)
    detail_json = Column(Text, nullable=True)
    ip = Column(String(45), nullable=True)
    user_agent_hash = Column(String(64), nullable=True)
    prev_hash = Column(String(64), nullable=False)
    row_hash = Column(String(64), nullable=False, index=True)


class KbEntry(Base, UUIDMixin):
    """Knowledge base entry for the AI assistant."""
    __tablename__ = "kb_entries"
    category = Column(String(50), nullable=False, index=True)  # AICTE_FAQ, PROCESS, REGULATION, TROUBLESHOOTING
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    keywords = Column(Text, nullable=True)  # Comma-separated
    role_scope = Column(String(100), nullable=True)  # Comma-separated roles, null = all
    active = Column(Boolean, default=True, nullable=False)


class ChatMessage(Base, UUIDMixin):
    """Chat message in an AI-assistant conversation."""
    __tablename__ = "chat_messages"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(36), nullable=False, index=True)
    direction = Column(String(10), nullable=False)  # USER, ASSISTANT
    text = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    source_ids = Column(Text, nullable=True)  # JSON array of KB entry IDs
    feedback = Column(String(10), nullable=True)  # THUMBS_UP, THUMBS_DOWN


class RuleSet(Base, UUIDMixin):
    """A versioned set of validation rules (YAML config snapshot)."""
    __tablename__ = "rulesets"
    version = Column(String(30), unique=True, nullable=False)
    category = Column(String(30), nullable=False)
    yaml_content = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)


class Checklist(Base, UUIDMixin):
    """A versioned document checklist for a category."""
    __tablename__ = "checklists"
    version = Column(String(30), unique=True, nullable=False)
    category = Column(String(30), nullable=False)
    yaml_content = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)


class RiskWeightSet(Base, UUIDMixin):
    """A versioned set of risk calculation weights."""
    __tablename__ = "risk_weight_sets"
    version = Column(String(30), unique=True, nullable=False)
    yaml_content = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)


class EvaluationRunRecord(Base, UUIDMixin):
    """Record of a self-evaluation run (accuracy, latency, etc.)."""
    __tablename__ = "evaluation_runs"
    run_label = Column(String(100), nullable=True)
    total_apps = Column(Integer, default=0, nullable=False)
    precision = Column(Float, default=0.0, nullable=False)
    recall = Column(Float, default=0.0, nullable=False)
    f1 = Column(Float, default=0.0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)
    false_positive_rate = Column(Float, default=0.0, nullable=False)
    false_negative_rate = Column(Float, default=0.0, nullable=False)
    mean_latency_ms = Column(Float, default=0.0, nullable=False)
    p95_latency_ms = Column(Float, default=0.0, nullable=False)
    anomaly_detector_auc = Column(Float, default=0.0, nullable=False)
    effort_saved_pct = Column(Float, default=0.0, nullable=False)
    metrics_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class Setting(Base, UUIDMixin):
    """Key-value system configuration setting."""
    __tablename__ = "settings"
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    editable = Column(Boolean, default=True, nullable=False)
