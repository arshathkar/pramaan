# Pramaan — Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   React 18 SPA (TypeScript + Vite + Tailwind CSS)          │  │
│  │   ├── Glassmorphic UI Components                           │  │
│  │   ├── Role-based Routing & Navigation                      │  │
│  │   ├── Recharts Data Visualizations                         │  │
│  │   ├── TanStack Query (Data Fetching)                       │  │
│  │   └── Context-based Auth + Theme State                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │ HTTPS / API Proxy                     │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    FastAPI Backend                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   API Layer (15 Route Modules)                              │  │
│  │   ├── /auth     — JWT cookies, TOTP, CSRF                  │  │
│  │   ├── /applications — CRUD, workflow transitions            │  │
│  │   ├── /documents    — Upload, encrypt, metadata             │  │
│  │   ├── /findings     — AI validation results + actions       │  │
│  │   ├── /verification — Cross-verification tasks              │  │
│  │   ├── /risk         — Composite scoring + override          │  │
│  │   ├── /duplicates   — Cluster detection + review            │  │
│  │   ├── /dashboard    — KPIs + chart aggregations             │  │
│  │   ├── /alerts       — Smart notifications                   │  │
│  │   ├── /audit        — Hash-chain log + CSV export           │  │
│  │   ├── /chat         — AI assistant + KB search              │  │
│  │   ├── /admin        — Users, rules, settings                │  │
│  │   └── /evaluation   — Self-assessment metrics               │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │   Security Middleware                                        │  │
│  │   CSP, HSTS, CORS, CSRF, Rate Limiting                     │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │   Service Layer (AI/ML Pipeline)                            │  │
│  │   ├── OCR          — Tesseract/PaddleOCR text extraction    │  │
│  │   ├── Classify     — Document type classification           │  │
│  │   ├── Extract      — Field extraction (NER/regex)           │  │
│  │   ├── Rules        — YAML-driven compliance checks          │  │
│  │   ├── Verify       — Cross-verification with authorities    │  │
│  │   ├── Risk         — Weighted composite scoring             │  │
│  │   ├── Duplicates   — 5-detector duplicate detection         │  │
│  │   ├── Anomaly      — Document authenticity analysis         │  │
│  │   ├── Patterns     — Cross-institution analysis             │  │
│  │   └── Chatbot      — KB-powered AI assistant                │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │   Data Layer (SQLAlchemy + Alembic)                         │  │
│  │   30+ Models across 8 modules                               │  │
│  │   SQLite (demo) / PostgreSQL (production)                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│              Authority Mock Service (Port 8100)                  │
│  Simulates AICTE Portal, MCA Registry, Fire Dept APIs           │
└──────────────────────────────────────────────────────────────────┘
```

## AI/ML Validation Pipeline

```
Document Upload
      │
      ▼
┌─── Stage 1: Ingest ───┐
│  Virus scan (simulated)│
│  SHA-256 hash          │
│  AES-256-GCM encrypt   │
│  Store to disk         │
└────────┬───────────────┘
         ▼
┌─── Stage 2: OCR ──────┐
│  Text layer extraction │
│  Tesseract fallback    │
│  Per-page confidence   │
│  Word bounding boxes   │
└────────┬───────────────┘
         ▼
┌─── Stage 3: Classify ─┐
│  Document type detect  │
│  Top-3 predictions     │
│  Mismatch flagging     │
└────────┬───────────────┘
         ▼
┌─── Stage 4: Extract ──┐
│  Field extraction      │
│  Normalization         │
│  Entity recognition    │
└────────┬───────────────┘
         ▼
┌─── Stage 5: Verify ───┐
│  Cross-doc comparison  │
│  Authority API checks  │
│  Field-level matching  │
└────────┬───────────────┘
         ▼
┌─── Stage 6: Analyze ──┐
│  Anomaly detection     │
│  Duplicate detection   │
│  Pattern matching      │
│  Rule engine           │
└────────┬───────────────┘
         ▼
┌─── Stage 7: Score ────┐
│  Risk calculation      │
│  Weighted composite    │
│  Level assignment      │
└────────┬───────────────┘
         ▼
    Findings + Risk Score
    → Officer Review Queue
```

## Data Model Overview

| Module | Models | Purpose |
|--------|--------|---------|
| `user.py` | User, RefreshToken | Authentication & sessions |
| `institution.py` | Trust, Institution, 6 Record* models | Institutional data |
| `application.py` | Application, WorkflowEvent | Application lifecycle |
| `document.py` | Document, Page, ExtractedField, Fingerprint | Document processing |
| `finding.py` | ValidationRun, Finding, Evidence | AI validation results |
| `verification.py` | Verification, InfraResult, Notice | Cross-verification |
| `addon.py` | RiskScore, Contribution, Pattern, Duplicate* | Analytics & detection |
| `operations.py` | Alert, AuditLog, KB, Chat, RuleSet, Setting | Operations |

## Security Architecture

- **Authentication**: JWT in HttpOnly cookies (15 min access / 7 day refresh)
- **Password**: Argon2id with memory-hard parameters
- **2FA**: TOTP (Google Authenticator compatible)
- **CSRF**: Double-submit cookie pattern
- **File encryption**: AES-256-GCM at rest
- **Audit**: SHA-256 hash chain (blockchain-inspired)
- **Headers**: Full CSP, HSTS, X-Frame-Options, Referrer-Policy
