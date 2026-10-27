# Pramaan — Demo Guide

## Quick Demo Walkthrough

This guide walks you through the key features of Pramaan in a 10-minute demo.

---

### Step 1: Login as College User

1. Open **http://localhost:5173**
2. Click "College User" in the quick-select panel
3. Click **Login** (password auto-fills as `demo12345678`)

**What to show:**
- Glassmorphic login page with animated gradient background
- Quick-select demo accounts
- TOTP step (available if enabled for the user)

---

### Step 2: College Dashboard — Applications

You'll see the **Applications** page with existing applications at various stages.

**What to show:**
- Application cards with status badges (Draft, Submitted, AI Review, etc.)
- Progress indicators and deadline countdown
- Click **"New Application"** to show the 5-step wizard

---

### Step 3: New Application Wizard

Walk through the wizard steps:
1. **Category Selection** — Choose "New Institution"
2. **Document Checklist** — Shows all 9 required documents
3. **Upload Documents** — Drag-and-drop zone
4. **Self-Check** — AI pre-screening before submission
5. **Review & Submit** — Final confirmation

---

### Step 4: Switch to Scrutiny Officer

1. Logout (user menu → Logout)
2. Login as **Scrutiny Officer** (`scrutiny@demo.pramaan.in`)

**What to show:**
- The **Dashboard** with KPI cards (total apps, pending review, open findings, etc.)
- Five interactive charts (status funnel, risk distribution, deficiency types, daily volume, verification progress)
- Application queue with SLA urgency indicators

---

### Step 5: Application Review

Click on **APP-000001** to open the detailed review page.

**What to show:**
- **Risk Gauge** — Half-circle SVG showing 62/100 (HIGH)
- **Findings Tab** — 3 AI-generated findings with:
  - Severity badges (HIGH, MEDIUM)
  - Confidence percentages
  - "Accept / Dismiss / Escalate / Request Rectification" action buttons
  - Detailed evidence with source documents
- **Documents Tab** — List of uploaded documents with classification results
- **Verification Tab** — Side-by-side comparison table (Claimed vs Authority values)
- **Risk Tab** — Waterfall chart breakdown of risk factors
- **Timeline Tab** — Workflow state transitions

---

### Step 6: Key Feature Demos

#### Duplicate Detection (`/duplicates`)
- Show duplicate clusters with detection methods (D1, D4, D5)
- Similarity scores between documents from different institutions
- "Confirm Duplicate / Mark Legitimate / Escalate" actions

#### Verification Tasks (`/verification-tasks`)
- Pending cross-verification assignments
- Field-level comparisons
- "Confirm / Reject / Escalate" outcomes

#### Smart Alerts (`/alerts`)
- SLA breach warnings, risk alerts, duplicate notifications
- Acknowledge / Snooze functionality
- Severity-based filtering

#### Audit Log (`/audit`)
- Searchable event log with hash chain
- "Verify Chain" button — checks cryptographic integrity
- CSV export for external auditing

#### AI Assistant (floating button, bottom-right)
- Role-aware suggested questions
- Knowledge base powered responses
- Confidence indicators and source citations
- Thumbs up/down feedback

---

### Step 7: Admin Features

Login as **System Admin** (`admin@demo.pramaan.in`)

**What to show:**
- **User Management** (`/admin/users`) — User table with roles, 2FA status
- **Rules Configuration** (`/admin/rules`) — Rulesets, checklists, risk weights
- **Knowledge Base** (`/admin/kb`) — KB entries with categories and keywords
- **Settings** (`/admin/settings`) — System configuration with toggle switches

---

### Step 8: Self-Evaluation (`/evaluation`)

Login as **Auditor** (`auditor@demo.pramaan.in`)

**What to show:**
- 12 accuracy metrics with pass/fail indicators
- Anomaly detector precision/recall chart
- Effort saved percentage
- This demonstrates the system's self-awareness

---

## Key Talking Points

1. **"AI assists, human decides"** — Every finding is advisory; no automatic rejections
2. **Five-layer duplicate detection** — From exact hash to perceptual similarity
3. **Explainable risk scores** — Waterfall chart shows exactly why
4. **Tamper-proof audit** — Blockchain-inspired hash chain
5. **Self-evaluating AI** — Measures its own accuracy continuously
6. **Zero accusations** — "Needs verification", never "fake" or "forged"
7. **Configurable rules** — YAML-based, no code changes needed
8. **Built-in security** — Argon2id, JWT cookies, AES-256, CSRF, TOTP
