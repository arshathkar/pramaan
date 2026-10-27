import type {
  ApplicationCategory,
  ApplicationStatus,
  DocumentType,
  FindingKind,
  FindingStatus,
  RiskBand,
  Severity,
  UserRole,
  VerificationStatus,
  AlertCode,
  PatternCode,
  DuplicateDetector,
  InfraOutcome,
} from '@/types'

export const APP_NAME = 'Pramaan'
export const APP_TAGLINE = 'AI-Powered Document Validation & Authentication'

// ── Status Colors ──
export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; darkBg: string }> = {
  LOW: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/40' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/40' },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/40' },
}

export const RISK_BAND_CONFIG: Record<RiskBand, { label: string; color: string; bg: string; hex: string }> = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', hex: '#22c55e' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40', hex: '#f59e0b' },
  HIGH: { label: 'High Risk', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/40', hex: '#f97316' },
  CRITICAL: { label: 'Critical Risk', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40', hex: '#dc2626' },
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800/40' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  VALIDATING: { label: 'Validating', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
  VALIDATED: { label: 'Validated', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/40' },
  CLEARED_FOR_NEXT_STAGE: { label: 'Cleared', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  DEFICIENCY_RECOMMENDED: { label: 'Deficiency Recommended', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  DEFICIENCY_NOTIFIED: { label: 'Deficiency Notified', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' },
  RECTIFICATION: { label: 'Rectification', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  INSPECTION_RECOMMENDED: { label: 'Inspection Recommended', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  INSPECTION_ADVISED: { label: 'Inspection Advised', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' },
  CLOSED: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/40' },
}

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; bg: string; icon: string }> = {
  VERIFIED: { label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'CheckCircle' },
  MISMATCH_DETECTED: { label: 'Mismatch Detected', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40', icon: 'XCircle' },
  EXPIRED: { label: 'Expired', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40', icon: 'Clock' },
  VERIFICATION_PENDING: { label: 'Pending', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40', icon: 'Loader' },
  SOURCE_UNAVAILABLE: { label: 'Source Unavailable', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/40', icon: 'CloudOff' },
  MANUAL_REVIEW_REQUIRED: { label: 'Manual Review Required', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: 'UserCheck' },
}

export const FINDING_STATUS_CONFIG: Record<FindingStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  CONFIRMED: { label: 'Confirmed', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' },
  DISMISSED: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/40' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
}

export const CATEGORY_LABELS: Record<ApplicationCategory, string> = {
  EOA: 'Extension of Approval',
  ADD_COURSE: 'Addition of Course',
  INCREASE_INTAKE: 'Increase in Intake',
  CHANGE_PARTICULARS: 'Change in Particulars',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  APPLICATION_FORM: 'Application Form',
  AFFIDAVIT_UNDERTAKING: 'Affidavit / Undertaking',
  ACCREDITATION_CERTIFICATE: 'Accreditation Certificate',
  UNIVERSITY_AFFILIATION_LETTER: 'University Affiliation Letter',
  FIRE_SAFETY_NOC: 'Fire Safety NOC',
  STATE_NOC: 'State NOC',
  TRUST_REGISTRATION_CERTIFICATE: 'Trust Registration Certificate',
  LAND_DOCUMENT: 'Land Document',
  FACULTY_LIST: 'Faculty List',
  FEE_PAYMENT_PROOF: 'Fee Payment Proof',
  FLOOR_PLAN: 'Floor Plan',
  INFRA_PHOTO: 'Infrastructure Photo',
  UNCLASSIFIED: 'Unclassified',
}

export const FINDING_KIND_LABELS: Record<FindingKind, string> = {
  MISSING_DOCUMENT: 'Missing Document',
  INCOMPLETE_FIELD: 'Incomplete Field',
  EXPIRED: 'Expired',
  EXPIRING_SOON: 'Expiring Soon',
  INCONSISTENT: 'Inconsistent Data',
  RECORD_MISMATCH: 'Record Mismatch',
  ANOMALY: 'Anomaly Detected',
  VERIFICATION: 'Verification Issue',
  COMPLIANCE_GAP: 'Compliance Gap',
  INFRA_EVIDENCE: 'Infrastructure Evidence',
  DUPLICATE: 'Duplicate Detected',
  PATTERN: 'Historical Pattern',
  PROCESSING_ERROR: 'Processing Error',
  UNCLASSIFIED_DOCUMENT: 'Unclassified Document',
  CATEGORY_MISMATCH: 'Category Mismatch',
  LOW_OCR_QUALITY: 'Low OCR Quality',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  COLLEGE_USER: 'College User',
  SCRUTINY_OFFICER: 'Scrutiny Officer',
  SENIOR_OFFICER: 'Senior Officer',
  AUDITOR: 'Auditor',
  SYSTEM_ADMIN: 'System Admin',
}

export const ALERT_CODE_LABELS: Record<AlertCode, string> = {
  MISSING_DOCUMENT: 'Missing Document',
  EXPIRED_DOCUMENT: 'Expired Document',
  EXPIRING_SOON: 'Expiring Soon',
  INCONSISTENT_DATA: 'Inconsistent Data',
  PENDING_VERIFICATION_SLA: 'Verification SLA Breach',
  SOURCE_UNAVAILABLE: 'Source Unavailable',
  ANOMALY_DETECTED: 'Anomaly Detected',
  DUPLICATE_FOUND: 'Duplicate Found',
  HIGH_RISK: 'High Risk Application',
  PATTERN_DETECTED: 'Pattern Detected',
  RECTIFICATION_ENDING: 'Rectification Ending',
  AUDIT_CHAIN_BROKEN: 'Audit Chain Broken',
}

export const PATTERN_LABELS: Record<PatternCode, string> = {
  P1: 'Repeated Deficiency',
  P2: 'Last-Minute Filing',
  P3: 'Expiry Lapse Habit',
  P4: 'Resubmission Churn',
  P5: 'Sudden Jump',
  P6: 'Uniform Authorship',
  P7: 'Rising Flag Trend',
  P8: 'Verification Unreliability',
}

export const DUPLICATE_DETECTOR_LABELS: Record<DuplicateDetector, string> = {
  D1: 'Exact File Duplicate',
  D2: 'Exact Content Duplicate',
  D3: 'Near-Duplicate with Same Identifiers',
  D4: 'Identifier Collision',
  D5: 'Image Reuse',
  D6: 'Stamp/Signature Reuse',
}

export const INFRA_OUTCOME_LABELS: Record<InfraOutcome, string> = {
  SUFFICIENT: 'Sufficient',
  INSUFFICIENT: 'Insufficient',
  NEEDS_INSPECTION: 'Needs Inspection',
}

export const MAX_FILE_SIZE_MB = 15
export const MAX_VIDEO_SIZE_MB = 50
export const MAX_FILES_PER_APP = 25
export const ALLOWED_FILE_TYPES = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4']

export interface NavItem {
  label: string
  path: string
  icon: string
  roles: UserRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'My Applications', path: '/college/applications', icon: 'FileText', roles: ['COLLEGE_USER'] },
  { label: 'New Application', path: '/college/applications/new', icon: 'PlusCircle', roles: ['COLLEGE_USER'] },
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER', 'AUDITOR', 'SYSTEM_ADMIN'] },
  { label: 'Applications', path: '/applications', icon: 'FolderOpen', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER'] },
  { label: 'Verification Tasks', path: '/verification-tasks', icon: 'ClipboardCheck', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER'] },
  { label: 'Duplicates', path: '/duplicates', icon: 'Copy', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER'] },
  { label: 'Evaluation', path: '/evaluation', icon: 'BarChart3', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER', 'AUDITOR'] },
  { label: 'Alerts', path: '/alerts', icon: 'Bell', roles: ['COLLEGE_USER', 'SCRUTINY_OFFICER', 'SENIOR_OFFICER', 'AUDITOR'] },
  { label: 'Audit Log', path: '/audit', icon: 'Shield', roles: ['SCRUTINY_OFFICER', 'SENIOR_OFFICER', 'AUDITOR', 'SYSTEM_ADMIN'] },
  { label: 'User Management', path: '/admin/users', icon: 'Users', roles: ['SYSTEM_ADMIN'] },
  { label: 'Rules & Checklists', path: '/admin/rules', icon: 'Settings2', roles: ['SYSTEM_ADMIN'] },
  { label: 'Knowledge Base', path: '/admin/kb', icon: 'BookOpen', roles: ['SYSTEM_ADMIN'] },
  { label: 'Settings', path: '/admin/settings', icon: 'Cog', roles: ['SYSTEM_ADMIN'] },
]
