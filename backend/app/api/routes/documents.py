"""Document upload and management routes."""

import hashlib
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from sqlalchemy import select, func

from app.core.config import settings
from app.core.deps import DbSession, CurrentUser
from app.core.security import encrypt_file
from app.models.document import Document, DocumentPage, ExtractedField, DocumentFingerprint

router = APIRouter()


# ── Upload document ──

@router.post("/applications/{app_id}/documents")
async def upload_document(
    app_id: str,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
    declared_type: str = Form(...),
    tag: str = Form(None),
):
    """Upload a document to an application."""
    # Read file content
    content = await file.read()
    size = len(content)
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    sha256 = hashlib.sha256(content).hexdigest()
    mime = file.content_type or "application/octet-stream"

    # Encrypt and store
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    nonce, ciphertext = encrypt_file(content)
    stored_filename = f"{sha256}_{file.filename}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(stored_path, "wb") as f:
        f.write(ciphertext)

    # Check version
    existing = await db.execute(
        select(Document).where(Document.application_id == app_id, Document.declared_type == declared_type)
        .order_by(Document.version_no.desc())
    )
    prev = existing.scalar_one_or_none()
    version_no = (prev.version_no + 1) if prev else 1

    doc = Document(
        application_id=app_id,
        declared_type=declared_type,
        original_filename=file.filename,
        stored_path=stored_path,
        mime=mime,
        size_bytes=size,
        sha256=sha256,
        tag=tag,
        version_no=version_no,
        supersedes_id=prev.id if prev else None,
        uploaded_by=user["id"],
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        enc_nonce=nonce,
    )
    db.add(doc)
    await db.commit()

    return _doc_to_dict(doc)


# ── List documents for an application ──

@router.get("/applications/{app_id}/documents")
async def list_documents(app_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Document)
        .where(Document.application_id == app_id)
        .order_by(Document.declared_type, Document.version_no.desc())
    )
    docs = result.scalars().all()
    return [_doc_to_dict(d) for d in docs]


# ── Get single document metadata ──

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_dict(doc)


# ── Get extracted fields for a document ──

@router.get("/documents/{doc_id}/fields")
async def get_extracted_fields(doc_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(ExtractedField).where(ExtractedField.document_id == doc_id)
    )
    fields = result.scalars().all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "value_raw": f.value_raw,
            "value_norm": f.value_norm,
            "confidence": f.confidence,
            "page_no": f.page_no,
        }
        for f in fields
    ]


# ── Get document pages ──

@router.get("/documents/{doc_id}/pages")
async def get_document_pages(doc_id: str, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(DocumentPage)
        .where(DocumentPage.document_id == doc_id)
        .order_by(DocumentPage.page_no)
    )
    pages = result.scalars().all()
    return [
        {
            "id": p.id,
            "page_no": p.page_no,
            "source": p.source,
            "mean_conf": p.mean_conf,
            "text_length": len(p.text) if p.text else 0,
        }
        for p in pages
    ]


# ── Helpers ──

def _doc_to_dict(d: Document) -> dict:
    return {
        "id": d.id,
        "application_id": d.application_id,
        "declared_type": d.declared_type,
        "detected_type": d.detected_type,
        "detected_confidence": d.detected_confidence,
        "version_no": d.version_no,
        "original_filename": d.original_filename,
        "mime": d.mime,
        "size_bytes": d.size_bytes,
        "sha256": d.sha256,
        "tag": d.tag,
        "page_count": d.page_count,
        "ocr_mean_conf": d.ocr_mean_conf,
        "anomaly_score": d.anomaly_score,
        "uploaded_by": d.uploaded_by,
        "uploaded_at": d.uploaded_at,
        "created_at": str(d.created_at),
    }
