"""Institution, Trust, and simulated AICTE record models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from app.models.base import Base, UUIDMixin


class Trust(Base, UUIDMixin):
    __tablename__ = "trusts"
    name = Column(String(255), nullable=False)
    registration_no = Column(String(100), nullable=True)


class Institution(Base, UUIDMixin):
    __tablename__ = "institutions"
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    trust_id = Column(String(36), ForeignKey("trusts.id"), nullable=True)
    address = Column(String(500), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    founded_year = Column(Integer, nullable=True)


class RecordApproval(Base, UUIDMixin):
    __tablename__ = "record_approvals"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    academic_year = Column(String(10), nullable=False)
    status = Column(String(30), nullable=False)
    eoa_letter_no = Column(String(50), nullable=True)
    valid_to = Column(String(10), nullable=True)


class RecordProgramme(Base, UUIDMixin):
    __tablename__ = "record_programmes"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    programme = Column(String(50), nullable=False)
    level = Column(String(20), nullable=True)
    approved_intake = Column(Integer, nullable=False)
    from_year = Column(String(10), nullable=True)


class RecordFaculty(Base, UUIDMixin):
    __tablename__ = "record_faculty"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    faculty_id = Column(String(30), nullable=False)
    name = Column(String(255), nullable=False)
    designation = Column(String(50), nullable=True)
    qualification = Column(String(100), nullable=True)
    department = Column(String(50), nullable=True)
    employment_type = Column(String(20), nullable=True)
    active = Column(Boolean, default=True, nullable=False)


class RecordDeficiency(Base, UUIDMixin):
    __tablename__ = "record_deficiencies"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    cycle = Column(String(10), nullable=False)
    kind = Column(String(30), nullable=False)
    document_type = Column(String(50), nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)


class RecordFeePayment(Base, UUIDMixin):
    __tablename__ = "record_fee_payments"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    academic_year = Column(String(10), nullable=False)
    amount_inr = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    paid_on = Column(String(10), nullable=True)
    txn_ref = Column(String(50), nullable=True)


class RecordHistory(Base, UUIDMixin):
    __tablename__ = "record_history"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    academic_year = Column(String(10), nullable=False)
    category = Column(String(30), nullable=False)
    submitted_at = Column(String(30), nullable=True)
    deadline = Column(String(10), nullable=True)
    outcome = Column(String(30), nullable=True)
