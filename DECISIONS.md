# Pramaan — Key Design Decisions

This document records the key architectural and design decisions made during development.

## 1. "Never Accuse" Language Policy

**Decision**: The system never uses words like "fake", "forged", or "fraudulent" in any UI text, API response, or database field.

**Rationale**: Institutions are innocent until proven otherwise. AI findings are probabilistic — a high anomaly score doesn't mean a document is forged. Using accusatory language could lead to legal issues and erode trust.

**Implementation**: All findings use neutral language: "possible alteration indicator", "needs verification", "elevated anomaly score". The PRD's exact terminology is enforced.

## 2. Advisory-Only AI

**Decision**: All AI outputs are labeled "AI-generated decision support" and the system architecture prevents automatic rejections.

**Rationale**: AI models have false positives. A critical finding might be a scanning artifact. Human officers must always confirm before any action affects an institution.

**Implementation**: The workflow state machine requires an explicit officer action (ACCEPT/DISMISS/ESCALATE) for every finding. No status transition happens without a human actor_id.

## 3. JWT in Cookies (Not localStorage)

**Decision**: Access and refresh tokens are stored in HttpOnly cookies, not localStorage or sessionStorage.

**Rationale**: HttpOnly cookies are immune to XSS attacks. An attacker who injects JavaScript cannot read the token. Combined with SameSite=Strict and CSRF double-submit, this provides defense-in-depth.

## 4. SQLite for Demo, PostgreSQL for Production

**Decision**: Use SQLite with aiosqlite for the prototype; design for easy PostgreSQL migration.

**Rationale**: SQLite requires zero setup — evaluators can run the demo immediately. All SQLAlchemy models use standard types that work with both databases.

## 5. Five-Layer Duplicate Detection

**Decision**: Implement 5 complementary detection methods rather than relying on a single approach.

**Rationale**: Each method catches different types of reuse:
- **D1 (SHA-256)**: Exact byte-identical copies
- **D2 (Image fingerprint)**: Visual similarity after re-scanning
- **D4 (pHash/dHash)**: Perceptual similarity (crop/compress resilient)
- **D5 (MinHash)**: Text content similarity (reformatted documents)
- **D6 (Identifiers)**: Same registration numbers across applications

## 6. Hash-Chain Audit Log

**Decision**: Use a blockchain-inspired hash chain for the audit log instead of a simple database table.

**Rationale**: A traditional audit log can be tampered with by a database admin. The hash chain ensures that any deletion or modification of a past entry is immediately detectable — the chain breaks from that point forward.

## 7. YAML-Based Rule Configuration

**Decision**: Store all validation rules, checklists, and risk weights in YAML files rather than hard-coding them.

**Rationale**: AICTE regulations change. Non-developers (policy officers) should be able to update compliance rules without deploying new code. YAML is human-readable and version-controllable.

## 8. Glassmorphic UI Design

**Decision**: Use a frosted-glass (glassmorphism) design language with backdrop-blur, semi-transparency, and large border-radius throughout.

**Rationale**: Modern, clean aesthetic that differentiates Pramaan from typical government software. The visual hierarchy created by glass layers naturally guides officer attention to important elements.

## 9. Role-Based UI (Not Just RBAC)

**Decision**: Each role gets a different navigation sidebar, different dashboard, and different suggested assistant questions — not just different API permissions.

**Rationale**: A college user uploading documents has completely different needs than an auditor verifying hash chains. Role-tailored UIs reduce cognitive load and training time.

## 10. Synthetic Data Only

**Decision**: All demo data is entirely fictional. No real AICTE data, institution names, or document contents.

**Rationale**: Avoids privacy concerns, data protection issues, and any implication that the system's findings are real. The "(Simulated)" label appears on all AI-generated components.
