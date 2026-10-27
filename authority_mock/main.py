"""Authority Mock — Simulates external government verification APIs."""

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import random

app = FastAPI(title="Authority Mock Service", version="1.0.0")

# ── Simulated data stores ──

INSTITUTIONS = {
    "VIET-MH-001": {
        "name": "Vidya International Engineering & Technology",
        "trust": "Vidya Educational Trust",
        "eoa_letter": "EOA/2025-26/001",
        "status": "APPROVED",
    },
    "SKIT-KA-002": {
        "name": "Saraswati Knowledge Institute of Technology",
        "trust": "Saraswati Knowledge Foundation",
        "eoa_letter": "EOA/2025-26/002",
        "status": "APPROVED",
    },
    "NTES-DL-003": {
        "name": "National Technical Education School of Engineering",
        "trust": "National Technical Education Society",
        "eoa_letter": "EOA/2025-26/003",
        "status": "APPROVED",
    },
}

TRUSTS = {
    "TRN-MH-2008-4521": {"name": "Vidya Educational Trust", "status": "ACTIVE", "registered": "2008-03-15"},
    "TRN-KA-2012-8833": {"name": "Saraswati Knowledge Foundation", "status": "ACTIVE", "registered": "2012-07-22"},
    "TRN-DL-2005-1122": {"name": "National Technical Education Society", "status": "ACTIVE", "registered": "2005-11-08"},
}

FIRE_CERTS = {
    "FSC-MH-2025-4201": {"building": "Survey No. 42, Baramati", "valid_from": "2025-01-15", "valid_to": "2026-01-14", "status": "VALID"},
    "FSC-KA-2025-8801": {"building": "Hoskote Industrial Area", "valid_from": "2025-06-01", "valid_to": "2026-05-31", "status": "VALID"},
}


def _check_token(token: str):
    if token != "sim-token-change-me":
        raise HTTPException(status_code=401, detail="Invalid simulation token")


@app.get("/api/v1/institutions/{code}")
async def verify_institution(code: str, authorization: str = Header("")):
    _check_token(authorization.replace("Bearer ", ""))
    inst = INSTITUTIONS.get(code)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return {"code": code, **inst, "source": "AICTE_PORTAL (Simulated)"}


@app.get("/api/v1/trusts/{registration_no}")
async def verify_trust(registration_no: str, authorization: str = Header("")):
    _check_token(authorization.replace("Bearer ", ""))
    trust = TRUSTS.get(registration_no)
    if not trust:
        raise HTTPException(status_code=404, detail="Trust not found")
    return {"registration_no": registration_no, **trust, "source": "MCA_REGISTRY (Simulated)"}


@app.get("/api/v1/fire-safety/{cert_no}")
async def verify_fire_cert(cert_no: str, authorization: str = Header("")):
    _check_token(authorization.replace("Bearer ", ""))
    cert = FIRE_CERTS.get(cert_no)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"certificate_no": cert_no, **cert, "source": "FIRE_DEPARTMENT (Simulated)"}


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "authority-mock", "simulated": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
