"""User and RefreshToken models."""

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from app.models.base import Base, UUIDMixin


class User(Base, UUIDMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # COLLEGE_USER, SCRUTINY_OFFICER, SENIOR_OFFICER, AUDITOR, SYSTEM_ADMIN
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    password_hash = Column(String(512), nullable=False)
    totp_secret_enc = Column(String(512), nullable=True)
    totp_enabled = Column(Boolean, default=False, nullable=False)
    failed_logins = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class RefreshToken(Base, UUIDMixin):
    __tablename__ = "refresh_tokens"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    family_id = Column(String(36), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by = Column(String(36), nullable=True)
    user_agent_hash = Column(String(64), nullable=True)
