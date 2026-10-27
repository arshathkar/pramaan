import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, CheckCircle, Upload,
  ClipboardList, Search, Send, AlertTriangle, Check, Plus, Trash2, FileText, CheckCheck
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/hooks/useToast'
import { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from '@/utils/constants'
import { saveStoredApplication, type StoredDocument, type StoredApplication } from '@/utils/applicationStore'
import type { ApplicationCategory, DocumentType } from '@/types'

const steps = [
  { id: 1, label: 'Category & Year', icon: ClipboardList },
  { id: 2, label: 'Checklist', icon: Search },
  { id: 3, label: 'Upload Documents', icon: Upload },
  { id: 4, label: 'Self-Check', icon: CheckCircle },
  { id: 5, label: 'Review & Submit', icon: Send },
]

const categories: ApplicationCategory[] = ['EOA', 'ADD_COURSE', 'INCREASE_INTAKE', 'CHANGE_PARTICULARS']

const checklistItems: Array<{ type: DocumentType; mandatory: boolean; status: 'NOT_UPLOADED' | 'UPLOADED' | 'PASSED' | 'FAILED' }> = [
  { type: 'APPLICATION_FORM', mandatory: true, status: 'UPLOADED' },
  { type: 'AFFIDAVIT_UNDERTAKING', mandatory: true, status: 'UPLOADED' },
  { type: 'ACCREDITATION_CERTIFICATE', mandatory: true, status: 'NOT_UPLOADED' },
  { type: 'UNIVERSITY_AFFILIATION_LETTER', mandatory: true, status: 'UPLOADED' },
  { type: 'FIRE_SAFETY_NOC', mandatory: true, status: 'NOT_UPLOADED' },
  { type: 'STATE_NOC', mandatory: false, status: 'NOT_UPLOADED' },
  { type: 'TRUST_REGISTRATION_CERTIFICATE', mandatory: true, status: 'UPLOADED' },
  { type: 'LAND_DOCUMENT', mandatory: true, status: 'NOT_UPLOADED' },
  { type: 'FACULTY_LIST', mandatory: true, status: 'UPLOADED' },
  { type: 'FEE_PAYMENT_PROOF', mandatory: true, status: 'UPLOADED' },
  { type: 'FLOOR_PLAN', mandatory: false, status: 'NOT_UPLOADED' },
  { type: 'INFRA_PHOTO', mandatory: false, status: 'NOT_UPLOADED' },
]

export default function NewApplicationPage() {
  const navigate = useNavigate()
  const { success } = useToast()
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<ApplicationCategory | null>('EOA')
  const [year] = useState('2026-27')
  const [selfCheckDone, setSelfCheckDone] = useState(false)

  // Document collection state
  const [uploadedDocs, setUploadedDocs] = useState<StoredDocument[]>([
    { name: 'Application_Form_Filled.pdf', type: 'APPLICATION_FORM', confidence: 0.98, fields: 8, pages: 3, uploaded_at: new Date().toISOString() },
    { name: 'Affidavit_Undertaking_Signed.pdf', type: 'AFFIDAVIT_UNDERTAKING', confidence: 0.92, fields: 5, pages: 2, uploaded_at: new Date().toISOString() },
    { name: 'University_Affiliation_2026.pdf', type: 'UNIVERSITY_AFFILIATION_LETTER', confidence: 0.94, fields: 7, pages: 2, uploaded_at: new Date().toISOString() },
    { name: 'Trust_Deed_Registration.pdf', type: 'TRUST_REGISTRATION_CERTIFICATE', confidence: 0.96, fields: 6, pages: 4, uploaded_at: new Date().toISOString() },
    { name: 'Faculty_Details_2026.xlsx', type: 'FACULTY_LIST', confidence: 0.89, fields: 25, pages: 3, uploaded_at: new Date().toISOString() },
    { name: 'Challan_Fee_Payment.pdf', type: 'FEE_PAYMENT_PROOF', confidence: 0.99, fields: 4, pages: 1, uploaded_at: new Date().toISOString() },
  ])

  // Manual document addition in Step 3
  const [manualDocName, setManualDocName] = useState('')
  const [manualDocType, setManualDocType] = useState<DocumentType>('FIRE_SAFETY_NOC')

  // Self-check results state
  const [selfCheckItems, setSelfCheckItems] = useState([
    { kind: 'MISSING_DOCUMENT', severity: 'HIGH' as const, title: 'Missing: Fire Safety NOC', message: 'A valid Fire Safety NOC is required for Extension of Approval.', action: 'Upload a Fire Safety NOC issued by a competent authority.', rectifiable: true, fixed: false },
    { kind: 'MISSING_DOCUMENT', severity: 'HIGH' as const, title: 'Missing: Accreditation Certificate', message: 'An accreditation certificate is required.', action: 'Upload your accreditation certificate.', rectifiable: true, fixed: false },
    { kind: 'EXPIRED', severity: 'HIGH' as const, title: 'University Affiliation Letter expired', message: 'The affiliation letter expired on 30 Jun 2026.', action: 'Upload a renewed affiliation letter valid for the current academic year.', rectifiable: true, fixed: false },
    { kind: 'INCONSISTENT', severity: 'MEDIUM' as const, title: 'Institution name mismatch', message: 'The institution name on the Affidavit differs from the Application Form.', action: 'Ensure the institution name is consistent across all documents.', rectifiable: true, fixed: false },
    { kind: 'INCOMPLETE_FIELD', severity: 'LOW' as const, title: 'Signatory designation missing', message: 'The signatory designation field was not found in the Affidavit.', action: 'Ensure the signatory designation is clearly printed.', rectifiable: true, fixed: false },
  ])

  const handleAddManualDoc = () => {
    if (!manualDocName.trim()) return
    const doc: StoredDocument = {
      name: manualDocName.endsWith('.pdf') ? manualDocName : `${manualDocName}.pdf`,
      type: manualDocType,
      confidence: 0.95,
      fields: 6,
      pages: 2,
      uploaded_at: new Date().toISOString()
    }
    setUploadedDocs(prev => [doc, ...prev])
    setManualDocName('')
    success('Document Added', `${doc.name} attached to this application.`)
  }

  const handleFilesDropped = (files: File[]) => {
    const newItems: StoredDocument[] = files.map(f => ({
      name: f.name,
      type: 'FIRE_SAFETY_NOC',
      confidence: 0.94,
      fields: 6,
      pages: 2,
      uploaded_at: new Date().toISOString()
    }))
    setUploadedDocs(prev => [...newItems, ...prev])
    success('Files Attached', `${files.length} document(s) uploaded successfully.`)
  }

  const handleRemoveDoc = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index))
  }

  const handleFixIssue = (index: number) => {
    setSelfCheckItems(prev => prev.map((item, i) => i === index ? { ...item, fixed: true } : item))
    success('Item Addressed', 'The selected validation advisory has been resolved.')
  }

  const handleSubmitApplication = () => {
    const generatedId = `APP-2026-00${Math.floor(Math.random() * 80) + 20}`
    const newApp: StoredApplication = {
      id: generatedId,
      category: category || 'EOA',
      academic_year: year,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      deadline: '2026-11-20',
      findings: {
        total: selfCheckItems.length,
        passed: selfCheckItems.filter(i => i.fixed).length + 3,
        failed: selfCheckItems.filter(i => !i.fixed).length
      },
      documents: uploadedDocs
    }

    saveStoredApplication(newApp)
    success('Application Submitted!', `Application ${generatedId} submitted with ${uploadedDocs.length} attached documents.`)
    navigate('/college/applications')
  }

  const mandatoryCount = checklistItems.filter(i => i.mandatory).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Application Wizard</h1>
        <p className="text-sm text-slate-500 mt-1">Submit an institutional regulatory filing with automated validation pre-screening</p>
      </div>

      {/* Step indicator */}
      <GlassCard>
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = s.id === step
            const isCompleted = s.id < step
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${isActive ? '' : 'opacity-60'}`}>
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center transition-all
                    ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary-500 text-white shadow-glow' : 'bg-white/20 dark:bg-slate-800/30 text-slate-400'}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm font-medium hidden lg:block ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 lg:w-16 h-0.5 mx-2 rounded-full ${s.id < step ? 'bg-emerald-400' : 'bg-white/20 dark:bg-slate-700/30'}`} />
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Step 1: Category */}
      {step === 1 && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Application Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  p-5 rounded-2xl border-2 text-left transition-all duration-200
                  ${category === cat
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm'
                    : 'border-white/20 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 hover:border-primary-300'
                  }
                `}
              >
                <p className="font-semibold text-slate-900 dark:text-white">{CATEGORY_LABELS[cat]}</p>
                <p className="text-xs text-slate-500 mt-1">Regulatory Cycle: {year}</p>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Step 2: Checklist */}
      {step === 2 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prescribed Document Checklist</h2>
            <span className="text-sm text-slate-500">{uploadedDocs.length} documents staged</span>
          </div>
          <ProgressBar value={uploadedDocs.length} max={mandatoryCount} color="primary" showPercent className="mb-6" />
          <div className="space-y-2">
            {checklistItems.map(item => {
              const isAttached = uploadedDocs.some(d => d.type === item.type)
              return (
                <div key={item.type} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/20 dark:bg-slate-800/20">
                  {isAttached ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{DOCUMENT_TYPE_LABELS[item.type]}</p>
                  </div>
                  {item.mandatory && <Badge label="Required" bg="bg-red-100 dark:bg-red-900/30" color="text-red-600 dark:text-red-400" />}
                  {!item.mandatory && <Badge label="Optional" bg="bg-slate-100 dark:bg-slate-800/40" color="text-slate-500" />}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Step 3: Upload */}
      {step === 3 && (
        <div className="space-y-4">
          <GlassCard>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Upload Files</h2>
            <p className="text-xs text-slate-400 mb-4">Upload PDFs or scanned documents. Automated encryption and OCR will run upon submission.</p>
            <FileUploadZone onFilesSelected={handleFilesDropped} />

            {/* Quick manual document addition */}
            <div className="mt-6 pt-5 border-t border-white/10 dark:border-slate-700/20">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Or Add / Specify Document Manually:</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={manualDocName}
                  onChange={e => setManualDocName(e.target.value)}
                  placeholder="e.g. Fire_Safety_NOC_2026.pdf"
                  className="glass-input flex-1 text-sm"
                />
                <select
                  value={manualDocType}
                  onChange={e => setManualDocType(e.target.value as DocumentType)}
                  className="glass-input sm:w-64 text-sm"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
                <Button onClick={handleAddManualDoc} disabled={!manualDocName.trim()} icon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Staged documents list */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Staged Application Documents ({uploadedDocs.length})
              </h3>
              <span className="text-xs text-emerald-500 font-medium">Ready for Self-Check</span>
            </div>
            <div className="space-y-2">
              {uploadedDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/20 dark:bg-slate-800/30 border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                      <p className="text-xs text-slate-400">{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDoc(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Step 4: Self-Check */}
      {step === 4 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Self-Check Diagnostics</h2>
              <p className="text-xs text-slate-400">Pre-screen your application against AICTE rules and regulations before submitting</p>
            </div>
            {!selfCheckDone && (
              <Button size="sm" onClick={() => { setSelfCheckDone(true); success('Self-Check Completed', 'AI pre-screening analyzed all staged documents.') }} icon={<Search className="w-4 h-4" />}>
                Run Self-Check
              </Button>
            )}
          </div>
          {selfCheckDone ? (
            <div className="space-y-3">
              {selfCheckItems.map((r, i) => (
                <div key={i} className={`px-4 py-3 rounded-2xl border ${
                  r.fixed ? 'border-emerald-200/30 bg-emerald-50/20 dark:bg-emerald-950/10 opacity-70' :
                  r.severity === 'HIGH' ? 'border-orange-200/30 bg-orange-50/30 dark:bg-orange-900/10' :
                  r.severity === 'MEDIUM' ? 'border-amber-200/30 bg-amber-50/30 dark:bg-amber-900/10' :
                  'border-emerald-200/30 bg-emerald-50/30 dark:bg-emerald-900/10'
                }`}>
                  <div className="flex items-start gap-3">
                    {r.fixed ? (
                      <CheckCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                        r.severity === 'HIGH' ? 'text-orange-500' : r.severity === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
                      }`} />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${r.fixed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{r.title}</p>
                        <Badge variant="severity" severity={r.severity} />
                        {r.fixed && <span className="text-xs text-emerald-500 font-semibold">Resolved</span>}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{r.message}</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1.5">💡 {r.action}</p>
                    </div>
                    {r.rectifiable && !r.fixed && (
                      <Button variant="secondary" size="sm" onClick={() => handleFixIssue(i)}>Fix</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary-500" />
              <p>Run the self-check to identify and rectify issues before formal submission</p>
              <Button className="mt-4" size="sm" onClick={() => { setSelfCheckDone(true); success('Self-Check Completed', 'Pre-screening completed.') }}>
                Run Full Pre-screening
              </Button>
            </div>
          )}
        </GlassCard>
      )}

      {/* Step 5: Review & Submit */}
      {step === 5 && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Review & Submit Application</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20">
                <p className="text-xs text-slate-400">Category</p>
                <p className="font-medium text-slate-900 dark:text-white">{category ? CATEGORY_LABELS[category] : '—'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20">
                <p className="text-xs text-slate-400">Academic Year</p>
                <p className="font-medium text-slate-900 dark:text-white">{year}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20">
                <p className="text-xs text-slate-400">Attached Documents</p>
                <p className="font-medium text-slate-900 dark:text-white">{uploadedDocs.length} files attached</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20">
                <p className="text-xs text-slate-400">Self-Check Status</p>
                <p className={`font-medium ${selfCheckDone ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selfCheckDone ? 'Passed Pre-screening' : 'Skipped'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Documents to be Submitted:</p>
              <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                {uploadedDocs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{d.name} ({DOCUMENT_TYPE_LABELS[d.type] || d.type})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/20 text-sm text-blue-700 dark:text-blue-300">
              By submitting, you confirm that all uploaded documents are genuine and belong to your institution. A full automated validation pipeline will run upon submission.
            </div>
          </div>
        </GlassCard>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => step === 1 ? navigate('/college/applications') : setStep(s => s - 1)}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={() => {
            if (step === 5) handleSubmitApplication()
            else setStep(s => s + 1)
          }}
          disabled={step === 1 && !category}
          icon={step === 5 ? <Send className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        >
          {step === 5 ? 'Submit Application' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
