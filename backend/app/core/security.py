"""Security utilities — passwords, JWT, CSRF, TOTP, file encryption."""

import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import argon2
import jwt
import pyotp
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

# ── Password hashing (argon2id) ──

_ph = argon2.PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2, type=argon2.Type.ID)
_DUMMY_HASH = _ph.hash("dummy-timing-equaliser")

COMMON_PASSWORDS: set[str] = set()
_pw_file = os.path.join(os.path.dirname(__file__), "common_passwords.txt")
if os.path.exists(_pw_file):
    with open(_pw_file) as f:
        COMMON_PASSWORDS = {line.strip().lower() for line in f if line.strip()}


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (argon2.exceptions.VerifyMismatchError, argon2.exceptions.InvalidHashError):
        return False


def dummy_verify() -> None:
    """Run a dummy hash so unknown-user logins take the same time."""
    try:
        _ph.verify(_DUMMY_HASH, "wrong")
    except argon2.exceptions.VerifyMismatchError:
        pass


def validate_password(password: str, email: str) -> str | None:
    """Return an error message if the password is weak, else None."""
    if len(password) < 12:
        return "Password must be at least 12 characters."
    email_name = email.split("@")[0].lower()
    if email_name and email_name in password.lower():
        return "Password must not contain your email name."
    if password.lower() in COMMON_PASSWORDS:
        return "This password is too common."
    return None


# ── JWT tokens ──

_JWT_ALGORITHM = "HS256"
_ACCESS_EXPIRE_MINUTES = 15
_REFRESH_EXPIRE_DAYS = 7


def create_access_token(user_id: str, role: str, jti: str | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=_ACCESS_EXPIRE_MINUTES),
        "jti": jti or secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_JWT_ALGORITHM)


def create_refresh_token(user_id: str, family_id: str) -> tuple[str, str, datetime]:
    """Return (raw_token, token_hash, expires_at)."""
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=_REFRESH_EXPIRE_DAYS)
    return raw, token_hash, expires_at


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[_JWT_ALGORITHM])


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── CSRF ──

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def verify_csrf(cookie_value: str, header_value: str) -> bool:
    return hmac.compare_digest(cookie_value, header_value)


# ── TOTP 2FA ──

def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=settings.APP_NAME)


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


# ── Fernet encryption (for TOTP secrets) ──

def _fernet() -> Fernet:
    # Derive a Fernet key from APP_SECRET_KEY
    key_bytes = hashlib.sha256(settings.APP_SECRET_KEY.encode()).digest()
    import base64
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()


# ── AES-256-GCM file encryption ──

def _aesgcm() -> AESGCM:
    key_bytes = hashlib.sha256(settings.FILE_ENC_KEY.encode()).digest()
    return AESGCM(key_bytes)


def encrypt_file(plaintext: bytes) -> tuple[bytes, bytes]:
    """Return (nonce, ciphertext)."""
    nonce = os.urandom(12)
    ct = _aesgcm().encrypt(nonce, plaintext, None)
    return nonce, ct


def decrypt_file(nonce: bytes, ciphertext: bytes) -> bytes:
    return _aesgcm().decrypt(nonce, ciphertext, None)


# ── Audit hash chain ──

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def compute_audit_hash(prev_hash: str, row_data: dict[str, Any]) -> str:
    """SHA-256(prev_hash + canonical_json(row))."""
    canonical = json.dumps(row_data, sort_keys=True, default=str, separators=(",", ":"))
    combined = f"{prev_hash}{canonical}"
    return hashlib.sha256(combined.encode()).hexdigest()
