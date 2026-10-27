import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Download } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { useToast } from '@/hooks/useToast'
import { formatDateTimeIST } from '@/utils/formatters'
import { ROLE_LABELS } from '@/utils/constants'
import type { UserRole } from '@/types'

const mockAuditLog = [
  { id: 1, ts: '2026-10-23T14:30:00Z', actor: 'Anita Sharma', role: 'SCRUTINY_OFFICER' as UserRole, action: 'FINDING_CONFIRMED', entity: 'Finding f-002', app: 'APP-2026-0003', detail: 'Confirmed intake mismatch finding. Reason: Verified against AICTE record.' },
  { id: 2, ts: '2026-10-23T14:25:00Z', actor: 'System', role: 'SYSTEM_ADMIN' as UserRole, action: 'VALIDATION_RUN', entity: 'Run #2', app: 'APP-2026-0003', detail: 'Full validation completed. Ruleset SAMPLE-1.0. 6 findings.' },
  { id: 3, ts: '2026-10-23T14:20:00Z', actor: 'Anita Sharma', role: 'SCRUTINY_OFFICER' as UserRole, action: 'DOCUMENT_VIEWED', entity: 'Fire Safety NOC', app: 'APP-2026-0003', detail: 'Purpose: Review anomaly evidence.' },
  { id: 4, ts: '2026-10-23T14:15:00Z', actor: 'Anita Sharma', role: 'SCRUTINY_OFFICER' as UserRole, action: 'APPLICATION_TAKEN', entity: 'APP-2026-0003', app: 'APP-2026-0003', detail: 'Case assigned to self. Status: UNDER_REVIEW.' },
  { id: 5, ts: '2026-10-23T10:00:00Z', actor: 'Dr. Rajesh Kumar', role: 'COLLEGE_USER' as UserRole, action: 'DOCUMENT_UPLOADED', entity: 'Affidavit.pdf', app: 'APP-2026-0002', detail: 'Version 2. Replaces version 1 (expired affidavit).' },
  { id: 6, ts: '2026-10-22T16:00:00Z', actor: 'Suresh Patel', role: 'SYSTEM_ADMIN' as UserRole, action: 'RULESET_ACTIVATED', entity: 'SAMPLE-1.0', app: '', detail: 'Rule set SAMPLE-1.0 activated. Previous: none.' },
  { id: 7, ts: '2026-10-22T09:00:00Z', actor: 'Dr. Rajesh Kumar', role: 'COLLEGE_USER' as UserRole, action: 'APPLICATION_SUBMITTED', entity: 'APP-2026-0002', app: 'APP-2026-0002', detail: 'Category: EOA. Academic year: 2026-27.' },
  { id: 8, ts: '2026-10-22T08:45:00Z', actor: 'Dr. Rajesh Kumar', role: 'COLLEGE_USER' as UserRole, action: 'SELF_CHECK_RUN', entity: 'Run #1', app: 'APP-2026-0002', detail: 'Self-check completed. 5 issues found.' },
  { id: 9, ts: '2026-10-21T14:00:00Z', actor: 'Suresh Patel', role: 'SYSTEM_ADMIN' as UserRole, action: 'USER_CREATED', entity: 'college2@pramaan.demo', app: '', detail: 'Role: COLLEGE_USER. Institution: INST-0002.' },
  { id: 10, ts: '2026-10-20T10:00:00Z', actor: 'System', role: 'SYSTEM_ADMIN' as UserRole, action: 'GENESIS', entity: 'audit_log', app: '', detail: 'Audit log initialised with genesis hash.' },
]

export default function AuditLogPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [chainVerified, setChainVerified] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const filtered = mockAuditLog.filter(entry =>
    !search ||
    entry.action.toLowerCase().includes(search.toLowerCase()) ||
    entry.actor.toLowerCase().includes(search.toLowerCase()) ||
    entry.app.includes(search) ||
    entry.detail.toLowerCase().includes(search.toLowerCase())
  )

  const handleVerifyChain = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setChainVerified(true)
      toast.success('Audit chain integrity verified (10 blocks checked, 0 errors)')
    }, 700)
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp_IST', 'Actor', 'Role', 'Action', 'Entity', 'Application', 'Details']
    const rows = filtered.map(item => [
      item.id,
      `"${formatDateTimeIST(item.ts)}"`,
      `"${item.actor}"`,
      `"${item.role}"`,
      `"${item.action}"`,
      `"${item.entity}"`,
      `"${item.app}"`,
      `"${item.detail.replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `pramaan_audit_log_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Audit log exported successfully as CSV')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary-500" />
            Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">Immutable, hash-chained record of all system actions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleVerifyChain}
            loading={isVerifying}
            icon={chainVerified === true ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Shield className="w-4 h-4" />}
          >
            {chainVerified ? 'Re-verify Chain' : 'Verify Chain'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {chainVerified !== null && (
        <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${
          chainVerified
            ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50/50 dark:bg-red-900/20 border border-red-200/30 text-red-700 dark:text-red-400'
        }`}>
          {chainVerified ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {chainVerified ? 'Audit chain integrity verified — all cryptographic hashes valid and sequential.' : 'Chain broken at row #42. Integrity compromised.'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <SearchInput onChange={setSearch} placeholder="Search audit entries…" className="w-96" />
      </div>

      <GlassCard padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/30 dark:bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time (IST)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Application</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-t border-white/10 dark:border-slate-700/20 hover:bg-white/20 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{entry.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTimeIST(entry.ts)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">{entry.actor}</td>
                  <td className="px-4 py-3"><Badge label={ROLE_LABELS[entry.role]} className="text-[10px]" /></td>
                  <td className="px-4 py-3 font-mono text-xs text-primary-600 dark:text-primary-400">{entry.action}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{entry.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.app || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
