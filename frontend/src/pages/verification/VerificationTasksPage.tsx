import { useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, HelpCircle, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import type { VerificationStatus } from '@/types'

interface TaskItem {
  id: string
  document: string
  issuer: string
  app: string
  institution: string
  status: VerificationStatus
  reason: string
  fields: Array<{ f: string; value: string }>
  contact: string
}

const initialTasks: TaskItem[] = [
  {
    id: 'vt-001', document: 'University Affiliation Letter', issuer: 'Demo State Technical University Registry (Simulated)',
    app: 'APP-2026-0008', institution: 'Sample Engineering Academy, Jaipur',
    status: 'SOURCE_UNAVAILABLE', reason: 'Authority unreachable after 2 retries (timeout).',
    fields: [{ f: 'letter_no', value: 'AFF-2025-0934' }, { f: 'valid_to', value: '2027-06-30' }, { f: 'programmes', value: 'CSE, ECE, ME' }],
    contact: 'registrar@demo-university.sim • +91-11-2345-6789 (Simulated)',
  },
  {
    id: 'vt-002', document: 'Fire Safety NOC', issuer: 'Demo Fire Services Directorate (Simulated)',
    app: 'APP-2026-0004', institution: 'Sample Technical University, Chennai',
    status: 'MANUAL_REVIEW_REQUIRED', reason: 'QR signature verification failed. Possible key rotation.',
    fields: [{ f: 'certificate_no', value: 'FSN-2025-7712' }, { f: 'valid_to', value: '2027-03-31' }],
    contact: 'verification@demo-fire.sim • +91-44-9876-5432 (Simulated)',
  },
  {
    id: 'vt-003', document: 'Trust Registration Certificate', issuer: 'Demo Societies and Trusts Registrar (Simulated)',
    app: 'APP-2026-0007', institution: 'Sample Technical Institute, Kolkata',
    status: 'VERIFICATION_PENDING', reason: 'Authority returned 202 PENDING. Awaiting processing (24h SLA).',
    fields: [{ f: 'registration_no', value: 'TR-KOL-2018-0445' }, { f: 'trust_name', value: 'Sample Educational Trust' }],
    contact: 'trusts@demo-registrar.sim • +91-33-2222-3333 (Simulated)',
  },
]

export default function VerificationTasksPage() {
  const { success, warning, info } = useToast()
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)

  const handleUpdateStatus = (taskId: string, newStatus: VerificationStatus, toastMsg: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    if (newStatus === 'VERIFIED') success('Verification Confirmed', toastMsg)
    else if (newStatus === 'MISMATCH_DETECTED') warning('Verification Mismatch Flagged', toastMsg)
    else info('Status Updated', toastMsg)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-primary-500" />
          Cross-Authority Verification Tasks
        </h1>
        <p className="text-sm text-slate-500 mt-1">Direct officer verification workflows for external statutory authorities</p>
      </div>

      <div className="space-y-4">
        {tasks.map(task => (
          <GlassCard key={task.id}>
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{task.document}</h3>
                  <Badge variant="verification" verification={task.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{task.issuer}</p>
                <p className="text-xs text-slate-400">{task.institution} • <span className="font-mono text-primary-500 font-semibold">{task.app}</span></p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/40 dark:bg-amber-900/10 border border-amber-200/20 text-sm text-amber-700 dark:text-amber-400 mb-3">
              {task.reason}
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Authority Fields to Confirm:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {task.fields.map(field => (
                  <div key={field.f} className="px-3 py-2 rounded-xl bg-white/20 dark:bg-slate-800/20">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{field.f}</p>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300 font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <ExternalLink className="w-3.5 h-3.5 text-primary-500" />
              Contact: {task.contact}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleUpdateStatus(task.id, 'VERIFIED', `Confirmed ${task.document} as genuine with authority.`)}
              >
                Confirmed Genuine
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleUpdateStatus(task.id, 'MISMATCH_DETECTED', `Flagged mismatch for ${task.document}.`)}
              >
                Not Confirmed
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<HelpCircle className="w-4 h-4" />}
                onClick={() => handleUpdateStatus(task.id, 'SOURCE_UNAVAILABLE', `Marked ${task.issuer} as unreachable.`)}
              >
                Unable to Reach
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
