// ============================================================
// Pramaan TypeScript Type Definitions
// Complete type system for the entire application
// ============================================================

// ---- Enumerations (exact strings from PRD section 10) ----

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'UNDER_REVIEW'
  | 'CLEARED_FOR_NEXT_STAGE'
  | 'DEFICIENCY_RECOMMENDED'
  | 'DEFICIENCY_NOTIFIED'
  | 'RECTIFICATION'
  | 'INSPECTION_RECOMMENDED'
  | 'INSPECTION_ADVISED'
  | 'CLOSED';

export type VerificationStatus =
  | 'VERIFIED'
  | 'MISMATCH_DETECTED'
  | 'EXPIRED'
  | 'VERIFICATION_PENDING'
  | 'SOURCE_UNAVAILABLE'
  | 'MANUAL_REVIEW_REQUIRED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus = 'OPEN' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';

export type UserRole =
  | 'COLLEGE_USER'
  | 'SCRUTINY_OFFICER'
  | 'SENIOR_OFFICER'
  | 'AUDITOR'
  | 'SYSTEM_ADMIN';

export type ApplicationCategory =
  | 'EOA'
  | 'ADD_COURSE'
  | 'INCREASE_INTAKE'
  | 'CHANGE_PARTICULARS';

export type DocumentType =
  | 'APPLICATION_FORM'
  | 'AFFIDAVIT_UNDERTAKING'
  | 'ACCREDITATION_CERTIFICATE'
  | 'UNIVERSITY_AFFILIATION_LETTER'
  | 'FIRE_SAFETY_NOC'
  | 'STATE_NOC'
  | 'TRUST_REGISTRATION_CERTIFICATE'
  | 'LAND_DOCUMENT'
  | 'FACULTY_LIST'
  | 'FEE_PAYMENT_PROOF'
  | 'FLOOR_PLAN'
  | 'INFRA_PHOTO'
  | 'UNCLASSIFIED';

export type FindingKind =
  | 'MISSING_DOCUMENT'
  | 'INCOMPLETE_FIELD'
  | 'EXPIRED'
  | 'EXPIRING_SOON'
  | 'INCONSISTENT'
  | 'RECORD_MISMATCH'
  | 'ANOMALY'
  | 'VERIFICATION'
  | 'COMPLIANCE_GAP'
  | 'INFRA_EVIDENCE'
  | 'DUPLICATE'
  | 'PATTERN'
  | 'PROCESSING_ERROR'
  | 'UNCLASSIFIED_DOCUMENT'
  | 'CATEGORY_MISMATCH'
  | 'LOW_OCR_QUALITY';

export type AlertCode =
  | 'MISSING_DOCUMENT'
  | 'EXPIRED_DOCUMENT'
  | 'EXPIRING_SOON'
  | 'INCONSISTENT_DATA'
  | 'PENDING_VERIFICATION_SLA'
  | 'SOURCE_UNAVAILABLE'
  | 'ANOMALY_DETECTED'
  | 'DUPLICATE_FOUND'
  | 'HIGH_RISK'
  | 'PATTERN_DETECTED'
  | 'RECTIFICATION_ENDING'
  | 'AUDIT_CHAIN_BROKEN';

export type InfraOutcome = 'SUFFICIENT' | 'INSUFFICIENT' | 'NEEDS_INSPECTION';

export type PatternCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8';

export type PatternStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED';

export type DuplicateDetector = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';

export type OcrSource = 'TEXT_LAYER' | 'OCR';

// ---- Core data models ----

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id?: string;
  totp_enabled: boolean;
  is_active: boolean;
  last_login_at?: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  trust_id: string;
  trust_name: string;
  address: string;
  state: string;
  district: string;
  lat?: number;
  lon?: number;
  founded_year: number;
}

export interface Application {
  id: string;
  app_no: string;
  institution_id: string;
  institution_name: string;
  category: ApplicationCategory;
  academic_year: string;
  status: ApplicationStatus;
  deadline?: string;
  submitted_at?: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  current_run_id?: string;
  current_run_no?: number;
  rectification_deadline?: string;
  created_by: string;
  created_at: string;
  risk_score?: number;
  risk_band?: RiskBand;
  findings_summary?: FindingsSummary;
}

export interface FindingsSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  pending: number;
  by_severity: Record<Severity, number>;
  by_status: Record<FindingStatus, number>;
}

export interface Document {
  id: string;
  application_id: string;
  declared_type: DocumentType;
  detected_type: DocumentType;
  detected_confidence: number;
  top3: Array<{ type: DocumentType; confidence: number }>;
  version_no: number;
  supersedes_id?: string;
  original_filename: string;
  mime: string;
  size_bytes: number;
  sha256: string;
  tag?: string;
  page_count: number;
  ocr_mean_conf: number;
  anomaly_score: number;
  uploaded_by: string;
  uploaded_at: string;
  extracted_fields: ExtractedField[];
}

export interface ExtractedField {
  id: string;
  document_id: string;
  name: string;
  value_raw: string;
  value_norm: string;
  confidence: number;
  page_no: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ValidationRun {
  id: string;
  application_id: string;
  run_no: number;
  mode: 'self_check' | 'full';
  ruleset_version: string;
  checklist_version: string;
  records_snapshot_ref: string;
  started_at: string;
  finished_at?: string;
  status: 'RUNNING' | 'COMPLETED' | 'ERROR';
  stage_results: StageResult[];
  triggered_by: string;
}

export interface StageResult {
  stage: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  started_at?: string;
  finished_at?: string;
  error?: string;
}

export interface Finding {
  id: string;
  run_id: string;
  application_id: string;
  document_id?: string;
  kind: FindingKind;
  severity: Severity;
  detector_id?: string;
  rule_id?: string;
  title: string;
  message: string;
  suggested_action: string;
  confidence: number;
  status: FindingStatus;
  rectifiable: boolean;
  risk_points: number;
  explanation: FindingExplanation;
  evidence: FindingEvidence[];
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
}

export interface FindingExplanation {
  summary: string;
  saw: string;
  expected: string;
  why: string;
  method: string;
  parameters: Record<string, unknown>;
  measured: Record<string, unknown>;
  alternatives: string[];
  rule?: { id: string; text: string; reference: string; version: string };
  points: number;
  confidence: number;
  evidence: FindingEvidence[];
}

export interface FindingEvidence {
  id: string;
  finding_id: string;
  document_id: string;
  page_no: number;
  bbox: BoundingBox;
  value_found?: string;
  value_expected?: string;
  source: OcrSource | 'METADATA' | 'IMAGE_ANALYSIS' | 'AUTHORITY' | 'RECORD';
  heatmap_path?: string;
}

export interface Verification {
  id: string;
  application_id: string;
  document_id: string;
  document_type: DocumentType;
  issuer_code: string;
  issuer_name: string;
  method: 'SIGNED_QR' | 'REFERENCE_LOOKUP' | 'MANUAL';
  status: VerificationStatus;
  compared_fields: ComparedField[];
  signature_valid?: boolean;
  latency_ms?: number;
  attempts: number;
  requested_at: string;
  responded_at?: string;
  overridden_by?: string;
  override_reason?: string;
}

export interface ComparedField {
  field: string;
  submitted_value: string;
  authority_value: string;
  match: boolean;
}

export interface RiskScore {
  run_id: string;
  score: number;
  band: RiskBand;
  reliability: 'normal' | 'reduced';
  contributions: RiskContribution[];
}

export interface RiskContribution {
  component: string;
  finding_id?: string;
  pattern_id?: string;
  points: number;
  multiplier: number;
  label: string;
}

export interface InfraResult {
  id: string;
  application_id: string;
  requirement_key: string;
  outcome: InfraOutcome;
  details: {
    room_table?: RoomEntry[];
    photo_checks?: PhotoCheck[];
    area_analysis?: AreaAnalysis;
  };
}

export interface RoomEntry {
  label: string;
  type: string;
  dimensions: string;
  area_sqm: number;
  meets_minimum: boolean;
}

export interface PhotoCheck {
  document_id: string;
  tag: string;
  quality: 'GOOD' | 'BLURRED' | 'DARK' | 'OVEREXPOSED' | 'LOW_RES';
  metadata_ok: boolean;
  reuse_detected: boolean;
  issues: string[];
}

export interface AreaAnalysis {
  claimed_sqm: number;
  computed_sqm: number;
  min_required_sqm: number;
  difference_pct: number;
  status: InfraOutcome;
}

export interface Pattern {
  id: string;
  institution_id: string;
  pattern_code: PatternCode;
  cycles: string[];
  statistic: Record<string, unknown>;
  narrative: string;
  severity: Severity;
  status: PatternStatus;
  status_reason?: string;
  first_seen_at: string;
  evidence_refs: string[];
}

export interface DuplicateCluster {
  id: string;
  status: 'OPEN' | 'CONFIRMED' | 'LEGITIMATE' | 'ESCALATED';
  members: DuplicateClusterMember[];
  matches: DuplicateMatch[];
}

export interface DuplicateClusterMember {
  document_id: string;
  institution_id: string;
  institution_name: string;
  document_type: DocumentType;
  application_id: string;
}

export interface DuplicateMatch {
  id: string;
  document_a: string;
  document_b: string;
  detector: DuplicateDetector;
  similarity: number;
  severity: Severity;
  verdict?: 'CONFIRMED' | 'LEGITIMATE' | 'ESCALATED';
  verdict_reason?: string;
  details: Record<string, unknown>;
}

export interface Alert {
  id: string;
  code: AlertCode;
  severity: Severity | 'CRITICAL';
  application_id?: string;
  institution_id?: string;
  message: string;
  count: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'SNOOZED' | 'RESOLVED';
  created_at: string;
  acknowledged_by?: string;
  snoozed_until?: string;
  resolved_at?: string;
}

export interface AuditEntry {
  id: number;
  ts: string;
  actor_id: string;
  actor_role: UserRole;
  ip_trunc: string;
  action: string;
  entity_type: string;
  entity_id: string;
  application_id?: string;
  details: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
  score?: number;
  kb_id?: string;
  related_questions?: string[];
  confidence_label?: 'Low' | 'Medium' | 'High';
  source?: string;
  timestamp: string;
}

export interface KbEntry {
  id: string;
  topic: string;
  audience: UserRole[] | ['ALL'];
  questions: string[];
  answer: string;
  source: string;
  keywords: string[];
  kind: 'curated' | 'passage';
  active: boolean;
}

export interface ChecklistItem {
  document_type: DocumentType;
  mandatory: boolean;
  fields_required: string[];
  validity?: { must_be_valid_on: string; warn_if_expires_within_days: number };
  status: 'NOT_UPLOADED' | 'UPLOADED' | 'PROCESSING' | 'PASSED' | 'FAILED' | 'WARNING';
  document_id?: string;
  issues: string[];
}

export interface DashboardKPIs {
  applications_in_queue: number;
  validated_today: number;
  high_risk: number;
  critical_risk: number;
  pending_verification: number;
  open_deficiencies: number;
  avg_validation_time_sec: number;
  verification_success_rate: number;
  unresolved_alerts: number;
}

export interface EvaluationMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  passed: boolean;
}

export interface WorkflowEvent {
  id: string;
  application_id: string;
  from_state: ApplicationStatus;
  to_state: ApplicationStatus;
  actor_id: string;
  actor_name: string;
  reason?: string;
  at: string;
}

// ---- API response wrappers ----

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

// ---- SSE Events ----

export interface SSEEvent {
  type: string;
  data: Record<string, unknown> | Alert;
}

export interface ValidationProgressEvent extends SSEEvent {
  type: 'validation_progress';
  data: {
    run_id: string;
    stage: string;
    status: 'RUNNING' | 'COMPLETED' | 'ERROR';
    progress_pct: number;
  };
}

export interface AlertEvent extends SSEEvent {
  type: 'alert';
  data: Alert;
}

// ---- Form types ----

export interface LoginForm {
  email: string;
  password: string;
  totp?: string;
}

export interface CreateApplicationForm {
  category: ApplicationCategory;
  academic_year: string;
}

export interface ReviewFindingForm {
  action: 'CONFIRM' | 'DISMISS' | 'REQUEST_RESUBMISSION' | 'SEND_TO_VERIFICATION';
  reason: string;
}

export interface ManualVerificationForm {
  outcome: 'CONFIRMED_GENUINE' | 'NOT_CONFIRMED' | 'UNABLE_TO_REACH';
  notes: string;
}

export interface WorkflowTransitionForm {
  to_state: ApplicationStatus;
  reason: string;
}

export interface RiskSimulationForm {
  application_id: string;
  assume_resolved: string[];
}

export interface RiskSimulationResult {
  original_score: number;
  simulated_score: number;
  original_band: RiskBand;
  simulated_band: RiskBand;
  contributions: RiskContribution[];
}

// ---- UI State types ----

export interface ThemeMode {
  mode: 'light' | 'dark';
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sort: { field: string; direction: 'asc' | 'desc' };
}
