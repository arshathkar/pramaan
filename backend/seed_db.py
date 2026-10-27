"""Seed the database with demo data for the Pramaan prototype."""

import asyncio
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.deps import engine, async_session_factory
from app.core.security import hash_password, generate_totp_secret, encrypt_secret, GENESIS_HASH, compute_audit_hash
from app.models.base import Base
from app.models.user import User
from app.models.institution import Trust, Institution, RecordApproval, RecordProgramme, RecordFaculty, RecordDeficiency
from app.models.application import Application, WorkflowEvent
from app.models.document import Document, DocumentFingerprint
from app.models.finding import ValidationRun, Finding
from app.models.verification import Verification
from app.models.addon import RiskScore, RiskContribution, DuplicateCluster, DuplicateClusterMember
from app.models.operations import Alert, AuditLog, KbEntry, RuleSet, Checklist, Setting
from datetime import datetime, timezone, timedelta

DEMO_PASSWORD = hash_password("demo12345678")


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # ── Trusts & Institutions ──
        trust1 = Trust(id="t-001", name="Vidya Educational Trust", registration_no="TRN-MH-2008-4521")
        trust2 = Trust(id="t-002", name="Saraswati Knowledge Foundation", registration_no="TRN-KA-2012-8833")
        trust3 = Trust(id="t-003", name="National Technical Education Society", registration_no="TRN-DL-2005-1122")
        db.add_all([trust1, trust2, trust3])

        inst1 = Institution(id="inst-001", code="VIET-MH-001", name="Vidya International Engineering & Technology",
                            trust_id="t-001", address="Survey No. 42, Baramati, Pune", state="Maharashtra",
                            district="Pune", lat=18.1547, lon=74.5771, founded_year=2009)
        inst2 = Institution(id="inst-002", code="SKIT-KA-002", name="Saraswati Knowledge Institute of Technology",
                            trust_id="t-002", address="Hoskote Industrial Area, Bengaluru", state="Karnataka",
                            district="Bengaluru Rural", lat=13.0707, lon=77.7983, founded_year=2013)
        inst3 = Institution(id="inst-003", code="NTES-DL-003", name="National Technical Education School of Engineering",
                            trust_id="t-003", address="Sector 62, Noida", state="Delhi NCR",
                            district="Gautam Buddh Nagar", lat=28.6273, lon=77.3714, founded_year=2006)
        db.add_all([inst1, inst2, inst3])

        # ── Approval records ──
        for inst_id in ["inst-001", "inst-002", "inst-003"]:
            for yr in ["2024-25", "2025-26"]:
                db.add(RecordApproval(institution_id=inst_id, academic_year=yr,
                                      status="APPROVED", eoa_letter_no=f"EOA/{yr}/{inst_id[-3:]}"))

        # ── Programmes ──
        programmes = [
            ("inst-001", "B.Tech Computer Science", "UG", 120), ("inst-001", "B.Tech Electronics", "UG", 60),
            ("inst-001", "M.Tech AI & ML", "PG", 30), ("inst-002", "B.Tech Mechanical", "UG", 90),
            ("inst-002", "B.Tech Civil", "UG", 60), ("inst-003", "B.Tech IT", "UG", 180),
            ("inst-003", "MBA", "PG", 120), ("inst-003", "B.Tech ECE", "UG", 60),
        ]
        for inst_id, prog, level, intake in programmes:
            db.add(RecordProgramme(institution_id=inst_id, programme=prog, level=level, approved_intake=intake))

        # ── Faculty (sample) ──
        faculty_data = [
            ("inst-001", "FAC-001", "Dr. Rajesh Kumar", "Professor", "Ph.D. Computer Science", "CSE"),
            ("inst-001", "FAC-002", "Prof. Anita Sharma", "Associate Professor", "M.Tech", "ECE"),
            ("inst-002", "FAC-003", "Dr. Suresh Patil", "Professor", "Ph.D. Mechanical", "MECH"),
            ("inst-003", "FAC-004", "Dr. Priya Singh", "Professor", "Ph.D. Information Technology", "IT"),
        ]
        for inst_id, fid, name, desig, qual, dept in faculty_data:
            db.add(RecordFaculty(institution_id=inst_id, faculty_id=fid, name=name,
                                  designation=desig, qualification=qual, department=dept))

        # ── Deficiency records ──
        db.add(RecordDeficiency(institution_id="inst-001", cycle="2024-25", kind="DOCUMENT_GAP",
                                 document_type="Fire Safety Certificate", resolved=True))
        db.add(RecordDeficiency(institution_id="inst-002", cycle="2025-26", kind="FACULTY_SHORTAGE",
                                 document_type=None, resolved=False))

        # ── Users ──
        users = [
            User(id="u-college", email="college@demo.pramaan.in", full_name="Ravi Patel",
                 role="COLLEGE_USER", institution_id="inst-001", password_hash=DEMO_PASSWORD),
            User(id="u-scrutiny", email="scrutiny@demo.pramaan.in", full_name="Meera Joshi",
                 role="SCRUTINY_OFFICER", password_hash=DEMO_PASSWORD),
            User(id="u-senior", email="senior@demo.pramaan.in", full_name="Anil Deshmukh",
                 role="SENIOR_OFFICER", password_hash=DEMO_PASSWORD),
            User(id="u-auditor", email="auditor@demo.pramaan.in", full_name="Kavita Nair",
                 role="AUDITOR", password_hash=DEMO_PASSWORD),
            User(id="u-admin", email="admin@demo.pramaan.in", full_name="System Administrator",
                 role="SYSTEM_ADMIN", password_hash=DEMO_PASSWORD),
        ]
        db.add_all(users)

        # ── Applications ──
        now = datetime.now(timezone.utc)
        apps = [
            Application(id="app-001", app_no="APP-000001", institution_id="inst-001",
                        category="NEW_INSTITUTION", academic_year="2026-27", status="OFFICER_REVIEW",
                        submitted_at=now - timedelta(days=3), created_by="u-college",
                        assigned_officer_id="u-scrutiny", deadline="2026-10-28"),
            Application(id="app-002", app_no="APP-000002", institution_id="inst-002",
                        category="EXTENSION_OF_APPROVAL", academic_year="2026-27", status="AI_REVIEW",
                        submitted_at=now - timedelta(days=1), created_by="u-college", deadline="2026-10-30"),
            Application(id="app-003", app_no="APP-000003", institution_id="inst-001",
                        category="NEW_PROGRAMME", academic_year="2026-27", status="SUBMITTED",
                        submitted_at=now - timedelta(hours=6), created_by="u-college", deadline="2026-11-01"),
            Application(id="app-004", app_no="APP-000004", institution_id="inst-003",
                        category="INCREASE_INTAKE", academic_year="2026-27", status="APPROVED",
                        submitted_at=now - timedelta(days=10), created_by="u-college", deadline="2026-10-20"),
            Application(id="app-005", app_no="APP-000005", institution_id="inst-002",
                        category="EXTENSION_OF_APPROVAL", academic_year="2026-27", status="DEFICIENCY_NOTICE_SENT",
                        submitted_at=now - timedelta(days=7), created_by="u-college",
                        rectification_deadline=now + timedelta(days=8), deadline="2026-10-25"),
            Application(id="app-006", app_no="APP-000006", institution_id="inst-003",
                        category="NEW_INSTITUTION", academic_year="2026-27", status="DRAFT",
                        created_by="u-college"),
        ]
        db.add_all(apps)

        # ── Workflow Events ──
        for app in apps:
            db.add(WorkflowEvent(application_id=app.id, from_state="NONE", to_state="DRAFT",
                                  actor_id="u-college", at=now - timedelta(days=15)))
            if app.status != "DRAFT":
                db.add(WorkflowEvent(application_id=app.id, from_state="DRAFT", to_state="SUBMITTED",
                                      actor_id="u-college", at=app.submitted_at or now - timedelta(days=3)))

        # ── Validation Runs ──
        run1 = ValidationRun(id="run-001", application_id="app-001", run_no=1, mode="full",
                              started_at=now - timedelta(days=2, hours=23), finished_at=now - timedelta(days=2, hours=22),
                              status="COMPLETED", triggered_by="u-scrutiny")
        run2 = ValidationRun(id="run-002", application_id="app-002", run_no=1, mode="full",
                              started_at=now - timedelta(hours=20), finished_at=now - timedelta(hours=19),
                              status="COMPLETED", triggered_by="u-scrutiny")
        db.add_all([run1, run2])

        # ── Findings ──
        findings_data = [
            ("f-001", "run-001", "app-001", "DOC_AUTHENTICITY", "HIGH", "D2", "R-AUTH-001",
             "Possible alteration indicator in Fire Safety Certificate",
             "Image layer analysis detected potential modification in signature region. OCR confidence drop from 0.95 to 0.62 on page 2.",
             "Request original document or re-verification from issuing authority", 0.78, True, 15),
            ("f-002", "run-001", "app-001", "COMPLIANCE_GAP", "MEDIUM", "D3", "R-COMP-002",
             "Faculty-to-student ratio below AICTE norm",
             "Declared ratio is 1:22 but AICTE mandates 1:20 for UG programmes. Current faculty count: 32 for 700 students.",
             "Verify updated faculty list or submit justification", 0.92, True, 10),
            ("f-003", "run-001", "app-001", "CROSS_VERIFY_MISMATCH", "HIGH", "D6", "R-XVER-001",
             "Institution name mismatch across documents",
             "Trust deed shows 'Vidya International Engineering College' but Affiliation Letter shows 'Vidya International Engineering & Technology'. Authority record shows the latter.",
             "Confirm correct legal name and ensure consistency", 0.95, True, 12),
            ("f-004", "run-002", "app-002", "COMPLIANCE_GAP", "LOW", "D3", "R-COMP-005",
             "Minor inconsistency in intake numbers",
             "Application form states 90 for B.Tech Mechanical, but AICTE record for 2025-26 shows approved intake of 90. Consistent.",
             None, 0.45, False, 2),
            ("f-005", "run-002", "app-002", "DOC_AUTHENTICITY", "CRITICAL", "D2", "R-AUTH-003",
             "Needs verification — NOC document anomaly score elevated",
             "Document anomaly score is 0.82 (threshold: 0.60). Multiple indicators: metadata date mismatch, unusual font rendering on page 1.",
             "Escalate to senior officer for manual verification", 0.88, False, 25),
            ("f-006", "run-001", "app-001", "MISSING_DOCUMENT", "MEDIUM", "D3", "R-DOC-001",
             "Building completion certificate not uploaded",
             "Category NEW_INSTITUTION requires a Building Completion Certificate from the local municipal authority. Not found in uploaded documents.",
             "Upload the required document", 1.0, True, 8),
        ]
        for fid, rid, aid, kind, sev, det, rule, title, msg, action, conf, rect, pts in findings_data:
            db.add(Finding(id=fid, run_id=rid, application_id=aid, kind=kind, severity=sev,
                           detector_id=det, rule_id=rule, title=title, message=msg,
                           suggested_action=action, confidence=conf, rectifiable=rect, risk_points=pts))

        # ── Risk Scores ──
        risk1 = RiskScore(id="rs-001", application_id="app-001", overall_score=62.0, level="HIGH",
                           doc_auth_score=22.0, compliance_score=15.0, cross_verify_score=12.0,
                           history_score=5.0, anomaly_score=8.0)
        risk2 = RiskScore(id="rs-002", application_id="app-002", overall_score=78.0, level="CRITICAL",
                           doc_auth_score=30.0, compliance_score=8.0, cross_verify_score=15.0,
                           history_score=10.0, anomaly_score=15.0)
        risk3 = RiskScore(id="rs-004", application_id="app-004", overall_score=12.0, level="LOW",
                           doc_auth_score=2.0, compliance_score=5.0, cross_verify_score=0.0,
                           history_score=3.0, anomaly_score=2.0)
        db.add_all([risk1, risk2, risk3])

        # Risk contributions for app-001
        contributions = [
            ("Doc Authenticity — Fire Safety Cert", 15, 1.5, "Elevated anomaly score on signature region"),
            ("Compliance — Faculty Ratio", 10, 1.0, "1:22 vs required 1:20"),
            ("Cross-Verify — Name Mismatch", 12, 1.2, "Inconsistent institution name across 2 documents"),
            ("Missing Document", 8, 1.0, "Building Completion Certificate not uploaded"),
            ("History — Prior Deficiency", 5, 0.8, "1 resolved deficiency in 2024-25"),
            ("Anomaly Baseline", 8, 0.5, "Overall document anomaly above norm"),
        ]
        for factor, pts, wt, expl in contributions:
            db.add(RiskContribution(risk_score_id="rs-001", factor=factor, points=pts, weight=wt, explanation=expl))

        # ── Verifications ──
        verifications = [
            ("v-001", "app-001", "institution_name", "Vidya International Engineering & Technology",
             "Vidya International Engineering & Technology", "AICTE Portal", "MATCH", 0.95, "API", "PENDING"),
            ("v-002", "app-001", "eoa_letter_no", "EOA/2025-26/001", "EOA/2025-26/001",
             "AICTE Records", "MATCH", 0.99, "API", "PENDING"),
            ("v-003", "app-002", "trust_registration_no", "TRN-KA-2012-8833", "TRN-KA-2012-8833",
             "MCA Registry (Simulated)", "MATCH", 0.90, "API", "PENDING"),
        ]
        for vid, aid, field, claimed, authority, source, match, conf, method, st in verifications:
            db.add(Verification(id=vid, application_id=aid, field_name=field, claimed_value=claimed,
                                 authority_value=authority, authority_source=source, match_result=match,
                                 confidence=conf, method=method, status=st, assigned_to="u-scrutiny"))

        # ── Duplicate Clusters ──
        cluster1 = DuplicateCluster(id="dc-001", cluster_label="Fire Safety Certificate reuse across institutions",
                                     detector_ids="D1,D5", status="OPEN")
        db.add(cluster1)
        db.add(DuplicateClusterMember(cluster_id="dc-001", document_id="doc-placeholder-1",
                                       institution_id="inst-001", role="ANCHOR", similarity=1.0))
        db.add(DuplicateClusterMember(cluster_id="dc-001", document_id="doc-placeholder-2",
                                       institution_id="inst-002", role="CANDIDATE", similarity=0.94))

        # ── Alerts ──
        alerts_data = [
            ("SLA Breach Warning — APP-000001", "Application APP-000001 has been in OFFICER_REVIEW for 3 days. SLA target is 5 days.",
             "HIGH", "SLA_BREACH", "app-001"),
            ("Critical Risk — APP-000002", "Application APP-000002 has a CRITICAL risk score of 78. Immediate review recommended.",
             "CRITICAL", "RISK", "app-002"),
            ("Duplicate Document Detected", "A Fire Safety Certificate submitted by INST-001 shows 94% similarity with a document from INST-002.",
             "HIGH", "DUPLICATE", None),
            ("New Application Submitted", "Application APP-000003 submitted by Vidya International Engineering & Technology.",
             "LOW", "SYSTEM", "app-003"),
            ("Rectification Deadline Approaching", "APP-000005 rectification deadline is in 8 days.",
             "MEDIUM", "COMPLIANCE", "app-005"),
        ]
        for title, msg, sev, cat, aid in alerts_data:
            db.add(Alert(title=title, message=msg, severity=sev, category=cat, application_id=aid))

        # ── Knowledge Base ──
        kb_entries = [
            ("AICTE_FAQ", "What is the Extension of Approval (EoA) process?",
             "The Extension of Approval is an annual process where existing AICTE-approved institutions apply for continuation of their approval. The institution must submit required documents including faculty details, infrastructure proof, fee receipts, and affiliation letters before the deadline set by AICTE.",
             "eoa,extension,approval,annual,renewal"),
            ("PROCESS", "Application status workflow",
             "Applications follow this workflow: DRAFT → SUBMITTED → AI_REVIEW → OFFICER_REVIEW → APPROVED/REJECTED. At any stage, a DEFICIENCY_NOTICE can be sent, after which the institution gets a RECTIFICATION window. Applications can also be ESCALATED to senior officers.",
             "status,workflow,process,stages,draft,submitted"),
            ("REGULATION", "AICTE faculty-to-student ratio norms",
             "AICTE mandates a faculty-to-student ratio of 1:20 for UG programmes and 1:15 for PG programmes. At least 10% of faculty must hold a Ph.D. for UG programmes, and 50% for PG programmes.",
             "faculty,ratio,student,norm,aicte,requirement"),
            ("TROUBLESHOOTING", "Document upload issues",
             "Documents must be in PDF format, maximum 15MB per file and 25 files per application. Ensure the PDF is not password-protected. If OCR quality is low, consider scanning at 300 DPI minimum with good lighting.",
             "upload,document,pdf,size,limit,error,ocr"),
            ("AICTE_FAQ", "What documents are required for a New Institution application?",
             "A New Institution application requires: Trust/Society Registration Deed, Land Documents, Building Completion Certificate, Fire Safety Certificate, Affiliation Letter from the university, Faculty list with qualifications, Financial statements, and NOC from the State Government.",
             "new,institution,documents,required,checklist"),
            ("REGULATION", "Risk score calculation methodology",
             "The risk score is a weighted composite of 5 factors: Document Authenticity (30%), Compliance Gap Analysis (25%), Cross-Verification Results (20%), Historical Track Record (15%), and Anomaly Detection (10%). Scores range from 0 (lowest risk) to 100 (highest risk).",
             "risk,score,calculation,weight,methodology"),
        ]
        for cat, title, content, keywords in kb_entries:
            db.add(KbEntry(category=cat, title=title, content=content, keywords=keywords))

        # ── Audit Log (with hash chain) ──
        prev_hash = GENESIS_HASH
        audit_entries = [
            ("u-admin", "SYSTEM_ADMIN", "SYSTEM_STARTUP", "system", "pramaan", "System initialized"),
            ("u-college", "COLLEGE_USER", "APP_CREATED", "application", "app-001", "Application APP-000001 created"),
            ("u-college", "COLLEGE_USER", "DOC_UPLOADED", "document", "doc-001", "Fire Safety Certificate uploaded"),
            ("u-college", "COLLEGE_USER", "APP_SUBMITTED", "application", "app-001", "Application submitted for review"),
            ("u-scrutiny", "SCRUTINY_OFFICER", "RUN_TRIGGERED", "validation_run", "run-001", "Full validation run initiated"),
            ("u-scrutiny", "SCRUTINY_OFFICER", "FINDING_REVIEWED", "finding", "f-001", "Finding reviewed and accepted"),
        ]
        for seq_no, (actor, role, action, etype, eid, detail) in enumerate(audit_entries, 1):
            row_data = {"seq": seq_no, "actor_id": actor, "actor_role": role, "action": action,
                        "entity_type": etype, "entity_id": eid, "detail_json": f'{{"note":"{detail}"}}',
                        "created_at": str(now - timedelta(days=15 - seq_no))}
            row_hash = compute_audit_hash(prev_hash, row_data)
            db.add(AuditLog(seq=seq_no, actor_id=actor, actor_role=role, action=action,
                             entity_type=etype, entity_id=eid, detail_json=f'{{"note":"{detail}"}}',
                             prev_hash=prev_hash, row_hash=row_hash))
            prev_hash = row_hash

        # ── Settings ──
        settings_data = [
            ("sla_days", "5", "SLA processing time in days"),
            ("rectification_days", "15", "Days allowed for rectification"),
            ("max_upload_mb", "15", "Maximum upload file size in MB"),
            ("max_files_per_app", "25", "Maximum files per application"),
            ("anomaly_threshold", "0.60", "Document anomaly score threshold"),
            ("demo_mode", "true", "Enable demo mode with synthetic data"),
        ]
        for key, val, desc in settings_data:
            db.add(Setting(key=key, value=val, description=desc))

        await db.commit()
        print("[OK] Database seeded successfully with demo data!")
        print(f"   - 3 trusts, 3 institutions")
        print(f"   - 5 demo users (password: demo12345678)")
        print(f"   - 6 applications across various statuses")
        print(f"   - 6 AI findings with evidence")
        print(f"   - Risk scores with waterfall breakdown")
        print(f"   - Verification tasks, alerts, KB entries")
        print(f"   - Audit log with hash chain")


if __name__ == "__main__":
    asyncio.run(seed())
