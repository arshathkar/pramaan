# Pramaan — Security Documentation

## Authentication & Authorization

### Password Security
- **Hashing**: Argon2id (time_cost=3, memory_cost=64MB, parallelism=2)
- **Minimum length**: 12 characters
- **Blocklist**: Common passwords checked against a dictionary
- **Context check**: Password cannot contain the user's email prefix

### JWT Token Strategy
- **Access token**: 15-minute expiry, stored in HttpOnly cookie
- **Refresh token**: 7-day expiry, stored in HttpOnly cookie scoped to `/api/v1/auth/refresh`
- **Rotation**: Every refresh issues a new token pair; old refresh is revoked
- **Replay detection**: If a revoked token is reused, the entire token family is invalidated

### Two-Factor Authentication (TOTP)
- Compatible with Google Authenticator, Authy, etc.
- TOTP secrets encrypted with Fernet (derived from APP_SECRET_KEY)
- 30-second window with ±1 tolerance

### CSRF Protection
- Double-submit cookie pattern
- `csrf` cookie (non-HttpOnly, readable by JavaScript)
- `X-CSRF-Token` header must match cookie value
- HMAC constant-time comparison

### Account Lockout
- After 5 consecutive failed logins: 15-minute lockout
- Counter resets on successful login
- Dummy hash verification on unknown emails (prevents user enumeration via timing)

## Data Protection

### File Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: SHA-256 of FILE_ENC_KEY setting
- **Nonce**: 12-byte random per file (stored in database)
- Files are encrypted before writing to disk; decrypted on download

### Audit Log Integrity
- **Hash chain**: Each entry's hash = SHA-256(previous_hash + canonical_JSON(entry))
- **Genesis hash**: 64 zeros (initial chain value)
- **Verification**: Chain can be verified at any time; a broken link indicates tampering
- **CSV export**: Full audit log exportable for external review

## Security Headers

All API responses include:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store (API routes only)
```

## Role-Based Access Control

| Capability | COLLEGE_USER | SCRUTINY_OFFICER | SENIOR_OFFICER | AUDITOR | SYSTEM_ADMIN |
|------------|:---:|:---:|:---:|:---:|:---:|
| Create application | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own applications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review findings | ❌ | ✅ | ✅ | ❌ | ❌ |
| Override risk score | ❌ | ❌ | ✅ | ❌ | ❌ |
| View audit logs | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configure rules | ❌ | ❌ | ❌ | ❌ | ✅ |

## Prototype Limitations

> ⚠️ This is a demonstration prototype. For production deployment:
> 1. Generate proper secrets with `python gen_secrets.py`
> 2. Enable `COOKIE_SECURE=true` behind HTTPS
> 3. Switch from SQLite to PostgreSQL
> 4. Add Redis for rate limiting and session management
> 5. Enable real virus scanning for uploads
> 6. Implement proper key rotation
