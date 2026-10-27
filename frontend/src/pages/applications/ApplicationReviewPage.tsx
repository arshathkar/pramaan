import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck,
  Building2, BarChart3, History, Eye,
  RefreshCw, MoreHorizontal, Play, Plus, Upload, Check, AlertCircle
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabPanel, useTabState } from '@/components/ui/Tabs'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { DOCUMENT_TYPE_LABELS, FINDING_KIND_LABELS, CATEGORY_LABELS } from '@/utils/constants'
import { formatDateTimeIST } from '@/utils/formatters'
import { getStoredApplications, addDocumentToStoredApp, type StoredDocument } from '@/utils/applicationStore'
import type { DocumentType, FindingKind, Severity, ApplicationStatus, VerificationStatus } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface FindingItem {
  id: string
  kind: FindingKind
  severity: Severity
  title: string
  message: string
  status: 'OPEN' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED'
  document_type: DocumentType
  confidence: number
  risk_points: number
  evidenceDetails?: {
    claimed: string
    detectedOrExpected: string
    page: number
    field: string
  }
}

const initialFindings: FindingItem[] = [
  {
    id: 'f-001',
    kind: 'ANOMALY',
    severity: 'HIGH',
    title: 'Overlay text detected on certificate date',
    message: 'The visible date on page 1 differs from the underlying text layer value.',
    status: 'OPEN',
    document_type: 'FIRE_SAFETY_NOC',
    confidence: 0.92,
    risk_points: 10,
    evidenceDetails: {
      claimed: 'Valid up to: 30-Jun-2027',
      detectedOrExpected: 'Underlying OCR Layer: 30-Jun-2024',
      page: 1,
      field: 'expiry_date'
    }
  },
  {
    id: 'f-002',
    kind: 'RECORD_MISMATCH',
    severity: 'HIGH',
    title: 'Intake mismatch: claimed 180, record shows 120',
    message: 'The intake claimed in the application form exceeds the approved intake on record.',
    status: 'CONFIRMED',
    document_type: 'APPLICATION_FORM',
    confidence: 1.0,
    risk_points: 5,
    evidenceDetails: {
      claimed: 'UG Computer Science Intake: 180',
      detectedOrExpected: 'AICTE EoA Approval 2025-26: 120 Intake',
      page: 2,
      field: 'approved_intake'
    }
  },
  {
    id: 'f-003',
    kind: 'EXPIRED',
    severity: 'HIGH',
    title: 'Fire Safety NOC expired on 30 Jun 2026',
    message: 'The NOC is no longer valid as of the submission date.',
    status: 'OPEN',
    document_type: 'FIRE_SAFETY_NOC',
    confidence: 1.0,
    risk_points: 6,
    evidenceDetails: {
      claimed: 'Issued: 01-Jul-2023',
      detectedOrExpected: 'Expiry Date: 30-Jun-2026 (Expired before academic term)',
      page: 1,
      field: 'validity_period'
    }
  },
  {
    id: 'f-004',
    kind: 'INCONSISTENT',
    severity: 'MEDIUM',
    title: 'Institution name varies across documents',
    message: '"Sample Inst. of Tech" vs "Sample Institute of Technology, Delhi"',
    status: 'OPEN',
    document_type: 'AFFIDAVIT_UNDERTAKING',
    confidence: 0.88,
    risk_points: 5,
    evidenceDetails: {
      claimed: 'Affidavit: Sample Inst. of Tech',
      detectedOrExpected: 'Trust Deed: Sample Institute of Technology, Delhi',
      page: 1,
      field: 'institution_name'
    }
  },
  {
    id: 'f-005',
    kind: 'VERIFICATION',
    severity: 'MEDIUM',
    title: 'Verification mismatch: issue date differs',
    message: 'Authority records show issue date as 15 Jan 2025, document shows 15 Mar 2025.',
    status: 'OPEN',
    document_type: 'ACCREDITATION_CERTIFICATE',
    confidence: 0.95,
    risk_points: 12,
    evidenceDetails: {
      claimed: 'Certificate Date: 15-Mar-2025',
      detectedOrExpected: 'NBA Council Registry: 15-Jan-2025',
      page: 1,
      field: 'date_of_issue'
    }
  },
  {
    id: 'f-006',
    kind: 'INCOMPLETE_FIELD',
    severity: 'LOW',
    title: 'Signatory designation not extracted',
    message: 'The designation field was not found with sufficient confidence.',
    status: 'RESOLVED',
    document_type: 'AFFIDAVIT_UNDERTAKING',
    confidence: 0.45,
    risk_points: 2,
    evidenceDetails: {
      claimed: 'Signature detected on page 3',
      detectedOrExpected: 'Missing official seal / designation stamp',
      page: 3,
      field: 'signatory_designation'
    }
  },
]

const riskWaterfall = [
  { component: 'Missing Documents', points: 8, color: '#f97316' },
  { component: 'Expired', points: 6, color: '#f43f5e' },
  { component: 'Inconsistencies', points: 5, color: '#f59e0b' },
  { component: 'Verification Mismatch', points: 12, color: '#ef4444' },
  { component: 'Anomalies', points: 10, color: '#8b5cf6' },
  { component: 'Compliance Gaps', points: 6, color: '#3b82f6' },
  { component: 'Infrastructure', points: 4, color: '#06b6d4' },
  { component: 'Confirmed ×1.25', points: 6, color: '#dc2626' },
]

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>()
  const appId = id || 'APP-2026-0003'
  const { activeTab, setActiveTab } = useTabState('findings')
  const { success, info } = useToast()

  // Dynamic Case Management State
  const [appStatus, setAppStatus] = useState<ApplicationStatus>('UNDER_REVIEW')
  const [isAssignedToMe, setIsAssignedToMe] = useState(false)
  const [isReRunning, setIsReRunning] = useState(false)
  const [runNumber, setRunNumber] = useState(2)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Findings State & Filter
  const [findings, setFindings] = useState<FindingItem[]>(initialFindings)
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null)
  const [evidenceModalFinding, setEvidenceModalFinding] = useState<FindingItem | null>(null)

  // Documents State
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocType, setNewDocType] = useState<DocumentType>('FIRE_SAFETY_NOC')
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null)

  // Verification Tasks State
  const [verifications, setVerifications] = useState<Array<{
    doc: string
    issuer: string
    method: string
    status: VerificationStatus
    fields: Array<{ f: string; sub: string; auth: string; match: boolean }>
  }>>([
    { doc: 'Fire Safety NOC', issuer: 'Demo Fire Services Directorate (Simulated)', method: 'SIGNED_QR', status: 'MISMATCH_DETECTED', fields: [{ f: 'certificate_no', sub: 'FSN-2025-4421', auth: 'FSN-2025-4421', match: true }, { f: 'valid_to', sub: '2026-06-30', auth: '2025-06-30', match: false }] },
    { doc: 'Accreditation Certificate', issuer: 'Demo Accreditation Council (Simulated)', method: 'REFERENCE_LOOKUP', status: 'VERIFIED', fields: [{ f: 'certificate_no', sub: 'ACC-2024-0891', auth: 'ACC-2024-0891', match: true }, { f: 'valid_to', sub: '2027-12-31', auth: '2027-12-31', match: true }] },
    { doc: 'University Affiliation Letter', issuer: 'Demo State Technical University (Simulated)', method: 'REFERENCE_LOOKUP', status: 'SOURCE_UNAVAILABLE', fields: [] },
  ])

  // Profile Modal
  const [showInstitutionProfile, setShowInstitutionProfile] = useState(false)

  // Load documents from persistent storage
  useEffect(() => {
    const apps = getStoredApplications()
    const current = apps.find(a => a.id === appId)
    if (current && current.documents && current.documents.length > 0) {
      setDocuments(current.documents)
    } else {
      setDocuments([
        { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.98, fields: 8, pages: 3, uploaded_at: '2026-10-16T10:00:00Z' },
        { name: 'Fire_NOC_2025.pdf', type: 'FIRE_SAFETY_NOC', confidence: 0.95, fields: 6, pages: 1, uploaded_at: '2026-10-16T10:05:00Z' },
        { name: 'Affidavit.pdf', type: 'AFFIDAVIT_UNDERTAKING', confidence: 0.91, fields: 5, pages: 2, uploaded_at: '2026-10-16T10:10:00Z' },
        { name: 'Accreditation.pdf', type: 'ACCREDITATION_CERTIFICATE', confidence: 0.97, fields: 6, pages: 1, uploaded_at: '2026-10-16T10:15:00Z' },
        { name: 'Affiliation_Letter.pdf', type: 'UNIVERSITY_AFFILIATION_LETTER', confidence: 0.93, fields: 7, pages: 2, uploaded_at: '2026-10-16T10:20:00Z' },
        { name: 'Faculty_List.pdf', type: 'FACULTY_LIST', confidence: 0.88, fields: 25, pages: 4, uploaded_at: '2026-10-16T10:25:00Z' },
        { name: 'Fee_Receipt.pdf', type: 'FEE_PAYMENT_PROOF', confidence: 0.99, fields: 4, pages: 1, uploaded_at: '2026-10-16T10:30:00Z' },
        { name: 'Floor_Plan.pdf', type: 'FLOOR_PLAN', confidence: 0.85, fields: 12, pages: 2, uploaded_at: '2026-10-16T10:35:00Z' },
      ])
    }
  }, [appId])

  // Handle Take Case / Release Case
  const handleTakeCase = () => {
    if (!isAssignedToMe) {
      setIsAssignedToMe(true)
      setAppStatus('UNDER_REVIEW')
      success('Case Assigned', `You have taken case ${appId} for scrutiny review.`)
    } else {
      setIsAssignedToMe(false)
      info('Case Released', `Case ${appId} has been returned to the review queue.`)
    }
  }

  // Handle Re-run
  const handleReRun = () => {
    setIsReRunning(true)
    setTimeout(() => {
      setIsReRunning(false)
      setRunNumber(prev => prev + 1)
      success('Validation Re-run Completed', `Full automated pipeline Run #${runNumber + 1} finished with latest checks.`)
    }, 1000)
  }

  // Handle Confirm Finding
  const handleConfirmFinding = (findingId: string) => {
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, status: 'CONFIRMED' } : f))
    const finding = findings.find(f => f.id === findingId)
    success('Finding Confirmed', `"${finding?.title}" marked as confirmed deficiency.`)
    if (evidenceModalFinding?.id === findingId) {
      setEvidenceModalFinding(prev => prev ? { ...prev, status: 'CONFIRMED' } : null)
    }
  }

  // Handle Dismiss Finding
  const handleDismissFinding = (findingId: string) => {
    setFindings(prev => prev.map(f => f.id === findingId ? { ...f, status: 'DISMISSED' } : f))
    const finding = findings.find(f => f.id === findingId)
    info('Finding Dismissed', `"${finding?.title}" has been dismissed.`)
    if (evidenceModalFinding?.id === findingId) {
      setEvidenceModalFinding(prev => prev ? { ...prev, status: 'DISMISSED' } : null)
    }
  }

  // Handle Manual Document Upload
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocName.trim()) return

    const newDoc: StoredDocument = {
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      confidence: 0.96,
      fields: 6,
      pages: 2,
      uploaded_at: new Date().toISOString()
    }

    // Persist to storage
    addDocumentToStoredApp(appId, newDoc)
    setDocuments(prev => [newDoc, ...prev])
    setNewDocName('')
    setShowUploadModal(false)
    success('Document Added', `${newDoc.name} has been successfully added to ${appId}.`)
  }

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    if (severityFilter === 'ALL') return true
    return f.severity === severityFilter
  })

  const openFindingsCount = findings.filter(f => f.status === 'OPEN').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary-500/10">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">{appId}</h1>
                <Badge variant="status" status={appStatus} />
                {isAssignedToMe && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    Assigned to You
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">Sample Polytechnic, Bangalore • {CATEGORY_LABELS.EOA} • 2026-27</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <RiskGauge score={78} band="CRITICAL" size={100} showLabel={false} />
            <div className="text-right">
              <Badge variant="risk" risk="CRITICAL" />
              <p className="text-xs text-slate-400 mt-1">Run #{runNumber} • {formatDateTimeIST(new Date().toISOString())}</p>
            </div>
            <div className="relative flex items-center gap-2 ml-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReRun}
                disabled={isReRunning}
                icon={<RefreshCw className={`w-4 h-4 ${isReRunning ? 'animate-spin text-primary-500' : ''}`} />}
              >
                {isReRunning ? 'Running…' : 'Re-run'}
              </Button>
              <Button
                variant={isAssignedToMe ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleTakeCase}
                icon={isAssignedToMe ? <Check className="w-4 h-4 text-emerald-500" /> : <Play className="w-4 h-4" />}
              >
                {isAssignedToMe ? 'Release Case' : 'Take Case'}
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  icon={<MoreHorizontal className="w-4 h-4" />}
                />
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 z-40 bg-white/90 dark:bg-slate-800/95 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-glass-lg py-2">
                      <button
                        onClick={() => { setShowMoreMenu(false); success('Export Generated', 'Application audit dossier exported as PDF.') }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                      >
                        📄 Export Audit Dossier
                      </button>
                      <button
                        onClick={() => { setShowMoreMenu(false); info('Deficiency Notice', 'Drafted deficiency notice for 3 items.') }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                      >
                        ⚠️ Issue Deficiency Notice
                      </button>
                      <button
                        onClick={() => { setShowMoreMenu(false); info('Escalated', 'Application escalated to Senior Scrutiny Committee.') }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                      >
                        🚩 Escalate to Senior Officer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'findings', label: 'Findings', icon: <AlertTriangle className="w-4 h-4" />, badge: openFindingsCount },
          { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" />, badge: documents.length },
          { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'risk', label: 'Risk Score', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
          { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Findings Tab */}
      <TabPanel tabId="findings" activeTab={activeTab}>
        {/* Severity filter buttons */}
        <div className="flex gap-2 mb-4">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white/20 dark:bg-slate-800/30 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : `${sev} Severity`}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredFindings.map(f => (
            <GlassCard key={f.id} hover onClick={() => setSelectedFinding(f.id)} className={selectedFinding === f.id ? 'ring-2 ring-primary-500/50' : ''}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl shrink-0 ${
                  f.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  f.severity === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    f.severity === 'HIGH' ? 'text-orange-500' :
                    f.severity === 'MEDIUM' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                    <Badge variant="severity" severity={f.severity} />
                    <Badge variant="finding" finding={f.status} />
                    <Badge label={FINDING_KIND_LABELS[f.kind]} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{f.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>{DOCUMENT_TYPE_LABELS[f.document_type]}</span>
                    <span>Confidence: {Math.round(f.confidence * 100)}%</span>
                    <span>+{f.risk_points} risk points</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {f.status === 'OPEN' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleConfirmFinding(f.id) }}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDismissFinding(f.id) }}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={(e) => { e.stopPropagation(); setEvidenceModalFinding(f) }}
                  >
                    Evidence
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6 italic">
          AI-generated decision support. Final decisions rest with the competent authority.
        </p>
      </TabPanel>

      {/* Documents Tab */}
      <TabPanel tabId="documents" activeTab={activeTab}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Uploaded Documents ({documents.length})</h3>
              <p className="text-xs text-slate-400">Manage and preview documents associated with this application</p>
            </div>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowUploadModal(true)}
            >
              Upload Document
            </Button>
          </div>

          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/20 dark:bg-slate-800/20 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400">Classified: {DOCUMENT_TYPE_LABELS[doc.type] || doc.type} ({Math.round(doc.confidence * 100)}%)</p>
                </div>
                <span className="text-xs text-slate-400">{doc.fields} fields • {doc.pages} pages</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc) }}
                >
                  Preview
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </TabPanel>

      {/* Verification Tab */}
      <TabPanel tabId="verification" activeTab={activeTab}>
        <div className="grid gap-4">
          {verifications.map((v, i) => (
            <GlassCard key={i}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{v.doc}</h3>
                  <p className="text-xs text-slate-500">{v.issuer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="verification" verification={v.status} />
                  <span className="text-xs text-slate-400">via {v.method.replace('_', ' ')}</span>
                </div>
              </div>
              {v.fields.length > 0 && (
                <table className="w-full text-sm mt-2">
                  <thead><tr className="text-xs text-slate-500"><th className="text-left py-1">Field</th><th className="text-left py-1">Submitted</th><th className="text-left py-1">Authority Record</th><th className="text-left py-1">Match</th></tr></thead>
                  <tbody>
                    {v.fields.map((field, fi) => (
                      <tr key={fi} className="border-t border-white/10 dark:border-slate-700/20">
                        <td className="py-2 text-slate-600 dark:text-slate-400">{field.f}</td>
                        <td className="py-2 font-mono text-xs">{field.sub}</td>
                        <td className="py-2 font-mono text-xs">{field.auth}</td>
                        <td className="py-2">{field.match ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {v.status === 'SOURCE_UNAVAILABLE' && (
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setVerifications(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'VERIFIED' } : item))
                      success('Authority Re-connected', 'Received confirmation from State Technical University Registry.')
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setVerifications(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'VERIFIED' } : item))
                      success('Manually Confirmed', 'University affiliation confirmed manually by scrutiny officer.')
                    }}
                  >
                    Confirm Manually
                  </Button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </TabPanel>

      {/* Risk Tab */}
      <TabPanel tabId="risk" activeTab={activeTab}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center">
            <RiskGauge score={78} band="CRITICAL" size={180} reliability="normal" />
            <p className="text-sm text-slate-500 mt-4 text-center max-w-xs">
              A higher score means more items need a human look. It is not a judgement about the institution.
            </p>
          </GlassCard>

          <GlassCard className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Risk Score Breakdown (Waterfall)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskWaterfall} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="component" tick={{ fontSize: 11, fill: '#94a3b8' }} width={130} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 16,
                    color: '#ffffff',
                    fontSize: 12,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  labelStyle={{ color: '#93c5fd', fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="points" radius={[0, 8, 8, 0]}>
                  {riskWaterfall.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </TabPanel>

      {/* History Tab */}
      <TabPanel tabId="history" activeTab={activeTab}>
        <GlassCard>
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Institution History</h3>
            <p className="text-sm text-slate-400 mt-1">View historical patterns and past cycles for this institution</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => setShowInstitutionProfile(true)}
            >
              View Institution Profile
            </Button>
          </div>
        </GlassCard>
      </TabPanel>

      {/* Timeline Tab */}
      <TabPanel tabId="timeline" activeTab={activeTab}>
        <GlassCard>
          <div className="space-y-0">
            {[
              { state: 'SUBMITTED', actor: 'Dr. Rajesh Kumar', time: '2026-10-18T10:00:00Z', reason: 'Application submitted' },
              { state: 'VALIDATING', actor: 'System', time: '2026-10-18T10:00:05Z', reason: 'Validation pipeline started' },
              { state: 'VALIDATED', actor: 'System', time: '2026-10-18T10:00:28Z', reason: 'Validation completed — Run #1' },
              { state: 'UNDER_REVIEW', actor: 'Anita Sharma', time: '2026-10-19T09:15:00Z', reason: 'Case taken for review' },
              { state: 'VALIDATED', actor: 'Anita Sharma', time: '2026-10-20T11:30:00Z', reason: `Re-run requested — Run #${runNumber}` },
            ].map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-500/20" />
                  {i < 4 && <div className="w-0.5 flex-1 bg-white/20 dark:bg-slate-700/30" />}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="status" status={event.state as any} />
                    <span className="text-xs text-slate-400">{formatDateTimeIST(event.time)}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.reason}</p>
                  <p className="text-xs text-slate-400 mt-0.5">by {event.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </TabPanel>

      {/* Evidence Viewer Modal */}
      {evidenceModalFinding && (
        <Modal
          open={!!evidenceModalFinding}
          onClose={() => setEvidenceModalFinding(null)}
          title={`Evidence Inspection: ${evidenceModalFinding.title}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">
                Finding ID: {evidenceModalFinding.id} • Status: {evidenceModalFinding.status}
              </span>
              <div className="flex gap-2">
                {evidenceModalFinding.status === 'OPEN' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirmFinding(evidenceModalFinding.id)}
                    >
                      Confirm Deficiency
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDismissFinding(evidenceModalFinding.id)}
                    >
                      Dismiss Finding
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEvidenceModalFinding(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  AI Advisory Finding Details
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {evidenceModalFinding.message}
                </p>
              </div>
            </div>

            {/* Document Visual Crop Simulation */}
            <div className="border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 bg-slate-900/40 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-white/10 pb-2">
                <span>Document: {DOCUMENT_TYPE_LABELS[evidenceModalFinding.document_type]}</span>
                <span>Page: {evidenceModalFinding.evidenceDetails?.page || 1} • OCR Confidence: {Math.round(evidenceModalFinding.confidence * 100)}%</span>
              </div>
              <div className="p-6 bg-slate-950/80 rounded-xl border border-dashed border-red-500/60 font-mono text-xs text-slate-300 relative">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">
                  FLAGGED REGION (Bounding Box #2)
                </div>
                <div className="space-y-1.5 opacity-60">
                  <p>CERTIFICATE OF COMPLIANCE & SAFETY STANDARDS</p>
                  <p>ISSUED UNDER REGULATORY FRAMEWORK SECTION 12(A)</p>
                </div>
                <div className="my-3 p-2.5 rounded bg-red-950/40 border border-red-500/80 text-red-200 font-bold">
                  {evidenceModalFinding.evidenceDetails?.claimed}
                </div>
                <div className="space-y-1.5 opacity-60">
                  <p>INSPECTED BY AUTHORIZED DEPUTY CHIEF INSPECTOR</p>
                  <p>REGISTRATION ID: FSN-2025-4421</p>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-800/20 border border-white/10">
                <span className="text-slate-400 block mb-1">Declared / Document Value</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {evidenceModalFinding.evidenceDetails?.claimed}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-800/20 border border-white/10">
                <span className="text-slate-400 block mb-1">Verified Authority / Expected Value</span>
                <span className="font-semibold text-amber-500 font-mono">
                  {evidenceModalFinding.evidenceDetails?.detectedOrExpected}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Document Upload Modal */}
      {showUploadModal && (
        <Modal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Additional Document"
          size="md"
        >
          <form onSubmit={handleUploadDocument} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document File Name
              </label>
              <input
                type="text"
                required
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                placeholder="e.g. Fire_Safety_NOC_Renewed.pdf"
                className="glass-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Classification Category
              </label>
              <select
                value={newDocType}
                onChange={e => setNewDocType(e.target.value as DocumentType)}
                className="glass-input w-full text-sm"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="p-6 border-2 border-dashed border-white/20 dark:border-slate-700/30 rounded-2xl text-center bg-white/10 dark:bg-slate-800/10">
              <Upload className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Click to select PDF or drag and drop</p>
              <p className="text-[11px] text-slate-400 mt-1">Simulated encryption and automated OCR field extraction on upload</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newDocName.trim()}>
                Upload Document
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.name}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setPreviewDoc(null)}>
              Close Preview
            </Button>
          }
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Classified Document Type</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {DOCUMENT_TYPE_LABELS[previewDoc.type] || previewDoc.type}
                </p>
              </div>
              <Badge label={`${Math.round(previewDoc.confidence * 100)}% Confidence`} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/40" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/20">
                <span className="text-slate-400 block mb-0.5">Pages Extracted</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDoc.pages} pages</span>
              </div>
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/20">
                <span className="text-slate-400 block mb-0.5">Structured Fields</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDoc.fields} fields</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/10 text-xs font-mono space-y-1.5 text-slate-300">
              <p className="text-slate-400 pb-1 border-b border-white/10">Extracted Key-Value Summary:</p>
              <p>• institution_name: "Sample Institute of Technology"</p>
              <p>• registration_no: "REG-2024-9921"</p>
              <p>• valid_from: "2024-06-01"</p>
              <p>• valid_until: "2027-05-31"</p>
              <p>• authority_issuer: "Competent Statutory Board"</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Institution Profile Modal */}
      {showInstitutionProfile && (
        <Modal
          open={showInstitutionProfile}
          onClose={() => setShowInstitutionProfile(false)}
          title="Institution Regulatory Profile: Sample Polytechnic"
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setShowInstitutionProfile(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 py-2 text-sm">
            <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/10">
              <h4 className="font-bold text-slate-900 dark:text-white">Sample Polytechnic Institute, Bangalore</h4>
              <p className="text-xs text-slate-400">AICTE Permanent ID: 1-9482103 • Trust: Vidya Educational Foundation</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 font-medium">
                  Approval Status: ACTIVE
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-medium">
                  Cycle 2026-27
                </span>
              </div>
            </div>

            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mt-2">Past Approval Cycles:</h5>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/20 flex items-center justify-between text-xs">
                <span>Academic Year 2025-26</span>
                <span className="text-emerald-500 font-medium">Extension of Approval Granted</span>
              </div>
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/20 flex items-center justify-between text-xs">
                <span>Academic Year 2024-25</span>
                <span className="text-amber-500 font-medium">Deficiency Resolved (Fire NOC re-submitted)</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
