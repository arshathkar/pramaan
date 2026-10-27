# Pramaan — AI-Powered Application Validation and Document Authentication

Pramaan (प्रमाण) means “proof” in Hindi. The project is built around a simple idea: important claims and documents should be checked carefully, consistently, and transparently.

**Smart India Hackathon 2026**  
**Problem statement:** AICTE Application Processing

## Overview

Pramaan is a web platform prototype designed to support the All India Council for Technical Education (AICTE) in reviewing college applications for new approvals, renewals, and programme additions.

Application reviews can involve many documents and require officers to compare names, dates, registration numbers, and other details across multiple records. Checking these details manually takes time, and altered or reused documents can be difficult to identify.

Pramaan brings document checks, compliance rules, cross-verification, risk indicators, and audit information into one platform. It helps officers identify applications that may need closer review.

The system is intended to assist human reviewers, not replace them. Its findings are advisory, and a human officer remains responsible for the final decision.

## Key Features

### Document processing

- Classifies uploaded documents, such as Fire Safety Certificates and Affiliation Letters.
- Extracts text from scanned PDFs using OCR-related processing.
- Identifies important fields, including names, dates, and registration numbers.

### Document authenticity checks

- Looks for indicators that a document may have been altered, such as unusual pixel patterns, font changes, or metadata inconsistencies.
- Provides findings with confidence scores and explanations.
- Flags documents for further verification rather than declaring them fake or forged.

### Compliance checks

- Checks whether required documents have been submitted.
- Supports checks for faculty-to-student ratios and PhD faculty percentages.
- Validates fee-payment status and compares declared intake with approved intake.

### Cross-verification

- Compares information across documents submitted with the same application.
- Checks institution names across records such as Trust Deeds, Affiliation Letters, and AICTE records.
- Supports simulated external-authority checks for registration numbers, EOA letters, and related information.
- Presents differences between document details and authority responses for review.

### Duplicate document detection

Pramaan combines multiple approaches to identify documents that may have been reused:

- **SHA-256 hashing:** detects identical files.
- **Image fingerprinting:** helps identify visually similar documents.
- **Perceptual hashing:** can identify documents that have been slightly cropped or compressed.
- **MinHash text similarity:** finds documents with similar text.
- **Identifier overlap:** flags registration numbers or other identifiers appearing across different applications.

This can help reviewers investigate cases where, for example, the same Fire Safety Certificate appears in applications from different colleges.

### Application risk scoring

Each application receives a composite risk score from 0 to 100. The prototype uses the following factor weights:

| Factor | Weight |
|---|---:|
| Document authenticity | 30% |
| Compliance gaps | 25% |
| Cross-verification results | 20% |
| Historical track record | 15% |
| Anomaly detection | 10% |

A waterfall-style breakdown explains how the factors contribute to the score. Officers can override a risk level when necessary, with a documented reason.

### AI assistant

- Answers questions using a built-in knowledge base of AICTE rules and processes.
- Provides role-aware responses and confidence information.
- Suggests related questions and supports user feedback on answers.

### Alerts and reminders

- Warns when an application is approaching or exceeding its service-level deadline.
- Highlights applications that may need urgent attention.
- Notifies reviewers about possible duplicate documents.
- Allows alerts to be acknowledged or snoozed.

### Audit log

The prototype records actions such as logins, document uploads, review decisions, and approvals. Its blockchain-inspired hash chain links each log entry to the previous one, helping detect changes to recorded history. Audit information can be exported as CSV.

### Evaluation dashboard

The dashboard is designed to show measures such as precision, recall, F1 score, false-positive and false-negative rates, OCR and classification accuracy, processing latency, and an ROC curve for anomaly detection. It can also show estimated reductions in officer effort.

### Role-based access

Pramaan defines five user roles with different responsibilities:

| Role | Main responsibilities |
|---|---|
| College User | Submit applications, upload documents, and respond to deficiencies |
| Scrutiny Officer | Review findings, verify documents, and process applications |
| Senior Officer | Handle escalations, override risk scores, and view analytics |
| Auditor | Review audit logs and check hash-chain integrity |
| System Admin | Manage users, rules, and system settings |

### User interface

The interface is designed with a modern glassmorphic style, dark and light themes, responsive layouts for desktop and tablet, and subtle transitions.

## Technical Architecture

The application is organized into a frontend, backend, database, local AI/ML components, and a simulated authority API.

```text
Browser
  |
React single-page application (Vite)
  |
FastAPI backend
  |-- SQLite database
  |-- Local AI/ML components
  `-- Mock authority API
```

### Technology stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** FastAPI, SQLAlchemy, Pydantic, Python AI/ML libraries
- **Database:** SQLite for the demo; PostgreSQL is identified as a production option
- **Authentication:** JWT cookies, TOTP two-factor authentication support, and Argon2id password hashing

## Project Structure

```text
pramaan/
├── authority_mock/       # Mock authority services
├── backend/              # Backend application
├── dataset/              # Supporting demo or development data
├── docs/                 # Additional documentation
├── frontend/             # Frontend application
├── proxy/                # Proxy configuration
├── scripts/              # Utility scripts
├── .env.example          # Example environment configuration
├── .gitignore            # Git ignore rules
├── ARCHITECTURE.md       # Architecture notes
├── DECISIONS.md          # Technical decisions
├── DEMO.md               # Demo instructions
├── SECURITY.md           # Security notes
├── docker-compose.yml    # Docker Compose configuration
└── Makefile              # Project commands
```

## Getting Started

### Prerequisites

- Git
- Node.js 18 or later and npm
- Python 3.11 or later

Docker is also useful if you plan to run the services through the provided Docker Compose configuration.

### 1. Clone the repository

```bash
git clone https://github.com/arshathkar/pramaan.git
cd pramaan
```

### 2. Configure environment variables

Use `.env.example` as a reference for your local configuration. If the application expects a root-level `.env` file, you can create one in PowerShell with:

```powershell
Copy-Item .env.example .env
```

Update the values for your local setup. Do not commit real credentials, tokens, passwords, or other secrets.

### 3. Set up the backend

From the project root, run:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS or Linux:**

```bash
source venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

### 4. Seed the demo database

From the `backend` directory, run:

```bash
python seed_db.py
```

The seed script is described as creating demo records for three institutions, five user accounts, six sample applications, and related findings, risk scores, and alerts.

### 5. Run the application

The repository includes a `docker-compose.yml` file. If its services and environment variables are configured for your setup, you can try:

```bash
docker compose up --build
```

Check `DEMO.md`, the Compose configuration, and the frontend/backend instructions for the exact startup commands and local URLs. The required commands and ports may depend on the current configuration.

## What Makes Pramaan Different?

Pramaan is designed to bring several checks together instead of relying on a single signal:

- **Multiple duplicate-detection methods:** Combines file hashes, image similarity, text similarity, and identifier overlap.
- **Explainable risk scores:** Shows the factors that contribute to an application's score.
- **A cautious approach to findings:** Uses indicators and requests for verification rather than automatically accusing an institution of submitting a forged document.
- **Human oversight:** AI-generated findings support officers; they do not make the final approval or rejection decision.
- **Auditability:** A hash-chain log helps identify changes to recorded actions.
- **Configurable rules:** The project describes YAML-based rules and weights that can be updated without changing application code.
- **Source-aware assistance:** The built-in assistant is designed to refer to a structured knowledge base so users can check the basis for its answers.

## Security

The project documentation describes the following security measures:

- Argon2id password hashing.
- JWTs stored in HttpOnly cookies.
- CSRF double-submit protection.
- TOTP two-factor authentication support.
- AES-256-GCM encryption for files at rest.
- Security headers, including CSP and HSTS.
- Account lockout after repeated failed login attempts.
- Rate limiting and request-size limits.
- Hash-chain audit logging.
- Server-side role-based access control.

Review `SECURITY.md` and the implementation before using the application outside a controlled demo environment.

## Important Notes

- **This is a prototype.** The README supplied with the project describes AI detections as simulated and based on synthetic data.
- **No real AICTE data is used.** Institutions, documents, and findings are fictional demo data.
- **AI findings are advisory.** The system is not intended to automatically reject applications.
- **Simulated components are labelled.** AI-generated or simulated outputs should be treated as demonstrations rather than verified real-world assessments.
- **Demo credentials are for testing only.** Configure secure, unique secrets before any deployment.

## Roadmap

Planned areas for further development include:

- Integrating a real OCR engine, such as Tesseract or PaddleOCR.
- Training machine-learning models for document classification.
- Supporting PostgreSQL for production use.
- Adding Redis for session caching and rate limiting.
- Adding email and SMS notifications.
- Generating PDF reports.
- Supporting Hindi and regional languages.
- Improving mobile responsiveness.
- Integrating with real authority APIs where access is available.

## Documentation

See the following files for more project details:

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system architecture
- [`DECISIONS.md`](DECISIONS.md) — technical decisions
- [`DEMO.md`](DEMO.md) — demo instructions
- [`SECURITY.md`](SECURITY.md) — security information

## License

This project was built for Smart India Hackathon 2026 for educational and demonstration purposes. No formal open-source license is specified in the current project documentation.

---

**Pramaan — Because every claim deserves proof.**
