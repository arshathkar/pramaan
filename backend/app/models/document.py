"""Document, DocumentPage, ExtractedField, DocumentFingerprint models."""

from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, LargeBinary
from app.models.base import Base, UUIDMixin


class Document(Base, UUIDMixin):
    __tablename__ = "documents"
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    declared_type = Column(String(50), nullable=False)
    detected_type = Column(String(50), nullable=True)
    detected_confidence = Column(Float, nullable=True)
    top3_json = Column(Text, nullable=True)
    version_no = Column(Integer, default=1, nullable=False)
    supersedes_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    mime = Column(String(50), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    tag = Column(String(50), nullable=True)
    page_count = Column(Integer, default=0, nullable=False)
    ocr_mean_conf = Column(Float, default=0.0, nullable=False)
    anomaly_score = Column(Float, default=0.0, nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(String(30), nullable=False)
    enc_nonce = Column(LargeBinary, nullable=True)
    enc_key_id = Column(String(36), nullable=True)


class DocumentPage(Base, UUIDMixin):
    __tablename__ = "document_pages"
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    page_no = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)
    source = Column(String(20), nullable=False)  # TEXT_LAYER or OCR
    mean_conf = Column(Float, default=0.0, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    words_path = Column(Text, nullable=True)  # JSON: [{word, confidence, box}]


class ExtractedField(Base, UUIDMixin):
    __tablename__ = "extracted_fields"
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    value_raw = Column(Text, nullable=True)
    value_norm = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0, nullable=False)
    page_no = Column(Integer, nullable=True)
    x0 = Column(Float, nullable=True)
    y0 = Column(Float, nullable=True)
    x1 = Column(Float, nullable=True)
    y1 = Column(Float, nullable=True)


class DocumentFingerprint(Base, UUIDMixin):
    __tablename__ = "document_fingerprints"
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    sha256 = Column(String(64), nullable=False, index=True)
    text_sha256 = Column(String(64), nullable=True, index=True)
    minhash = Column(LargeBinary, nullable=True)
    phash = Column(String(16), nullable=True)
    dhash = Column(String(16), nullable=True)
    identifiers_json = Column(Text, nullable=True)
