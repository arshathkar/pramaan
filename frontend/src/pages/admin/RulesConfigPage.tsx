import { useState } from 'react'
import { BookOpen, Scale, Sliders, ChevronRight, Save, RefreshCw, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Tabs, TabPanel, useTabState } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

const rulesets = [
  { id: 'rs-1', version: '1.0.0', category: 'ALL', rules: 12, active: true, updated: '2026-10-15' },
  { id: 'rs-2', version: '0.9.0', category: 'ALL', rules: 10, active: false, updated: '2026-09-01' },
]

const checklists = [
  {
    id: 'cl-1',
    version: '1.0.0',
    category: 'NEW_INSTITUTION',
    items: 9,
    active: true,
    documents: [
      'Trust/Society Registration Deed',
      'Land Document (Registered Sale / Lease Deed)',
      'Building Completion & Occupancy Certificate',
      'Fire Safety Certificate & NOC',
      'University Affiliation Approval Letter',
      'State Government NOC',
      'Faculty List with Qualifications & Experience',
      'Audited Financial Statements (2 years)',
      'AICTE Processing Fee Receipt',
    ]
  },
  {
    id: 'cl-2',
    version: '1.0.0',
    category: 'EXTENSION_OF_APPROVAL',
    items: 7,
    active: true,
    documents: [
      'EoA Application Form',
      'Previous Year EoA Approval Letter',
      'Current Academic Year University Affiliation Letter',
      'Updated Faculty List with biometric IDs',
      'Valid Fire Safety NOC',
      'AICTE Processing Fee Receipt',
      'Deficiency Compliance Report (if any)',
    ]
  },
  {
    id: 'cl-3',
    version: '1.0.0',
    category: 'NEW_PROGRAMME',
    items: 6,
    active: true,
    documents: [
      'New Programme Proposal Application',
      'Curriculum & Laboratory Floor Plan',
      'Faculty Allocation for Proposed Courses',
      'Affiliating University Consent Letter',
      'State Government Endorsement',
      'Processing Fee Proof',
    ]
  },
  {
    id: 'cl-4',
    version: '1.0.0',
    category: 'INCREASE_INTAKE',
    items: 5,
    active: true,
    documents: [
      'Intake Expansion Request Form',
      'Classroom & Infrastructure Verification Proof',
      'Faculty-to-Student Ratio Compliance Certificate',
      'NBA / NAAC Accreditation Letter',
      'Prescribed Inspection Fee Receipt',
    ]
  },
]

const defaultRiskWeights = [
  { factor: 'Document Authenticity', weight: 0.30, color: 'bg-red-500' },
  { factor: 'Compliance Gaps', weight: 0.25, color: 'bg-amber-500' },
  { factor: 'Cross-Verification', weight: 0.20, color: 'bg-blue-500' },
  { factor: 'Historical Track Record', weight: 0.15, color: 'bg-violet-500' },
  { factor: 'Anomaly Detection', weight: 0.10, color: 'bg-emerald-500' },
]

const tabs = [
  { id: 'rulesets', label: 'Validation Rules' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'risk', label: 'Risk Weights' },
]

export default function RulesConfigPage() {
  const { activeTab, setActiveTab } = useTabState('rulesets')
  const { success, info } = useToast()
  const [riskWeights, setRiskWeights] = useState(defaultRiskWeights)
  const [selectedChecklist, setSelectedChecklist] = useState<typeof checklists[0] | null>(null)
  const [selectedRuleset, setSelectedRuleset] = useState<typeof rulesets[0] | null>(null)

  const handleResetWeights = () => {
    setRiskWeights(defaultRiskWeights)
    info('Weights Reset', 'Risk weights restored to default values.')
  }

  const handleSaveWeights = () => {
    success('Weights Saved', 'Risk score weighting configuration updated for all future calculations.')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Scale className="w-7 h-7 text-primary-500" />
          Rules & Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage validation rules, document checklists, and risk scoring weights
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Rulesets Tab */}
      <TabPanel tabId="rulesets" activeTab={activeTab}>
        <div className="space-y-4">
          {rulesets.map(rs => (
            <GlassCard
              key={rs.id}
              className="p-5 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedRuleset(rs)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-100 dark:bg-primary-900/30">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Ruleset v{rs.version}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rs.rules} rules • Category: {rs.category} • Updated {rs.updated}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  label={rs.active ? 'Active' : 'Archived'}
                  color={rs.active ? 'text-emerald-600' : 'text-slate-500'}
                  bg={rs.active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800/40'}
                />
                <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </TabPanel>

      {/* Checklists Tab */}
      <TabPanel tabId="checklists" activeTab={activeTab}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklists.map(cl => (
            <GlassCard key={cl.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {cl.category.replace(/_/g, ' ')}
                </h3>
                <Badge label={`v${cl.version}`} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{cl.items} required documents</p>
              <button
                onClick={() => setSelectedChecklist(cl)}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
              >
                View Checklist <ChevronRight className="w-3 h-3" />
              </button>
            </GlassCard>
          ))}
        </div>
      </TabPanel>

      {/* Risk Weights Tab */}
      <TabPanel tabId="risk" activeTab={activeTab}>
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-500" /> Composite Risk Score Weights
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleResetWeights} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Reset
              </Button>
              <Button size="sm" onClick={handleSaveWeights} icon={<Save className="w-3.5 h-3.5" />}>
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            {riskWeights.map(w => (
              <div key={w.factor} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{w.factor}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{(w.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.color} transition-all duration-500`}
                    style={{ width: `${w.weight * 100 * 3.33}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-200/30 dark:border-primary-700/30">
            <p className="text-xs text-primary-700 dark:text-primary-300">
              <strong>Total:</strong> {(riskWeights.reduce((s, w) => s + w.weight, 0) * 100).toFixed(0)}% — Weights must sum to 100%.
              Changes will apply to all future risk calculations.
            </p>
          </div>
        </GlassCard>
      </TabPanel>

      {/* Checklist View Modal */}
      {selectedChecklist && (
        <Modal
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
          title={`Checklist: ${selectedChecklist.category.replace(/_/g, ' ')}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedChecklist(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">
              Prescribed mandatory documents under AICTE Approval Process Handbook (APH) v{selectedChecklist.version}:
            </p>
            <div className="space-y-2">
              {selectedChecklist.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/20 dark:bg-slate-800/30 border border-white/10 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Ruleset View Modal */}
      {selectedRuleset && (
        <Modal
          open={!!selectedRuleset}
          onClose={() => setSelectedRuleset(null)}
          title={`Validation Ruleset Details: v${selectedRuleset.version}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedRuleset(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-800/30 border border-white/10 space-y-1.5 font-mono text-slate-300">
              <p>• R-AUTH-001: Image layer anomaly check (Threshold: 0.60)</p>
              <p>• R-AUTH-002: Metadata date consistency check</p>
              <p>• R-AUTH-003: Critical anomaly detector threshold (0.80)</p>
              <p>• R-COMP-001: Category checklist completeness verification</p>
              <p>• R-COMP-002: Faculty-to-student ratio norms (1:20 UG, 1:15 PG)</p>
              <p>• R-COMP-003: Ph.D. faculty ratio compliance (min 10% UG)</p>
              <p>• R-COMP-004: Processing fee transaction verification</p>
              <p>• R-XVER-001: Cross-document institution name consistency</p>
              <p>• R-XVER-002: Authority approval letter reference cross-check</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
