import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, XCircle, Clock,
  Eye, Check, AlarmClock, CheckCheck,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { useToast } from '@/hooks/useToast'
import { ALERT_CODE_LABELS } from '@/utils/constants'
import { formatTimeAgo } from '@/utils/formatters'
import type { AlertCode, Severity } from '@/types'

const initialAlerts: Array<{ id: string; code: AlertCode; severity: Severity | 'CRITICAL'; message: string; application_id: string; count: number; status: 'NEW' | 'ACKNOWLEDGED' | 'SNOOZED' | 'RESOLVED'; created_at: string }> = [
  { id: 'a1', code: 'DUPLICATE_FOUND', severity: 'HIGH', message: 'Same Fire Safety NOC (SHA match) detected under INST-0005 and INST-0006.', application_id: 'APP-2026-0005', count: 1, status: 'NEW', created_at: '2026-10-23T14:10:00Z' },
  { id: 'a2', code: 'ANOMALY_DETECTED', severity: 'HIGH', message: 'Overlay text detected: visible date differs from text layer on Fire Safety NOC.', application_id: 'APP-2026-0003', count: 1, status: 'NEW', created_at: '2026-10-23T14:05:00Z' },
  { id: 'a3', code: 'HIGH_RISK', severity: 'HIGH', message: 'APP-2026-0003 risk score 78 (CRITICAL band).', application_id: 'APP-2026-0003', count: 1, status: 'ACKNOWLEDGED', created_at: '2026-10-23T14:02:00Z' },
  { id: 'a4', code: 'EXPIRED_DOCUMENT', severity: 'HIGH', message: 'Fire Safety NOC expired on 30 Jun 2026.', application_id: 'APP-2026-0002', count: 1, status: 'NEW', created_at: '2026-10-22T11:00:00Z' },
  { id: 'a5', code: 'MISSING_DOCUMENT', severity: 'MEDIUM', message: 'Accreditation Certificate not uploaded.', application_id: 'APP-2026-0002', count: 1, status: 'NEW', created_at: '2026-10-22T10:55:00Z' },
  { id: 'a6', code: 'INCONSISTENT_DATA', severity: 'MEDIUM', message: 'Institution name mismatch between Affidavit and Application Form.', application_id: 'APP-2026-0004', count: 2, status: 'NEW', created_at: '2026-10-21T16:30:00Z' },
  { id: 'a7', code: 'SOURCE_UNAVAILABLE', severity: 'MEDIUM', message: 'Demo State Technical University Registry is unreachable after 2 retries.', application_id: 'APP-2026-0008', count: 3, status: 'ACKNOWLEDGED', created_at: '2026-10-21T09:00:00Z' },
  { id: 'a8', code: 'PATTERN_DETECTED', severity: 'MEDIUM', message: 'INST-0003: Fire Safety NOC found expired in 3 of the last 4 cycles.', application_id: 'APP-2026-0007', count: 1, status: 'NEW', created_at: '2026-10-20T14:00:00Z' },
  { id: 'a9', code: 'EXPIRING_SOON', severity: 'LOW', message: 'Accreditation Certificate expires in 45 days.', application_id: 'APP-2026-0001', count: 1, status: 'SNOOZED', created_at: '2026-10-19T08:00:00Z' },
  { id: 'a10', code: 'RECTIFICATION_ENDING', severity: 'MEDIUM', message: 'Rectification window for APP-2026-0010 ends in 3 days.', application_id: 'APP-2026-0010', count: 1, status: 'NEW', created_at: '2026-10-23T06:00:00Z' },
]

const severityIcon: Record<string, typeof AlertTriangle> = {
  HIGH: XCircle, CRITICAL: XCircle, MEDIUM: AlertTriangle, LOW: Clock,
}
const severityColor: Record<string, string> = {
  HIGH: 'text-orange-500', CRITICAL: 'text-red-500', MEDIUM: 'text-amber-500', LOW: 'text-emerald-500',
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [alerts, setAlerts] = useState(initialAlerts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'ACKNOWLEDGED' | 'SNOOZED'>('ALL')

  const filtered = alerts.filter(a => {
    if (filter !== 'ALL' && a.status !== filter) return false
    if (search && !a.message.toLowerCase().includes(search.toLowerCase()) && !a.application_id.includes(search)) return false
    return true
  })

  const newCount = alerts.filter(a => a.status === 'NEW').length

  const handleAck = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
    toast.success('Alert marked as acknowledged')
  }

  const handleSnooze = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'SNOOZED' } : a))
    toast.info('Alert snoozed for 24 hours')
  }

  const handleView = (applicationId: string) => {
    navigate(`/applications/${applicationId}`)
  }

  const handleAckAll = () => {
    setAlerts(prev => prev.map(a => a.status === 'NEW' ? { ...a, status: 'ACKNOWLEDGED' } : a))
    toast.success('All new alerts acknowledged')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary-500" />
            Alert Center
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">{newCount}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time alerts from the validation pipeline</p>
        </div>
        {newCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="w-4 h-4" />}
            onClick={handleAckAll}
          >
            Acknowledge All ({newCount})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput onChange={setSearch} placeholder="Search alerts…" className="w-80" />
        <div className="flex gap-2 ml-auto">
          {(['ALL', 'NEW', 'ACKNOWLEDGED', 'SNOOZED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary-500/15 text-primary-600' : 'bg-white/20 dark:bg-slate-800/30 text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(alert => {
          const Icon = severityIcon[alert.severity] || AlertTriangle
          const color = severityColor[alert.severity] || 'text-slate-500'
          return (
            <GlassCard key={alert.id} className={alert.status === 'NEW' ? 'ring-1 ring-primary-500/20' : 'opacity-80'}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl shrink-0 bg-white/20 dark:bg-slate-800/20 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={ALERT_CODE_LABELS[alert.code]} />
                    <Badge variant="severity" severity={alert.severity === 'CRITICAL' ? 'HIGH' : alert.severity} />
                    {alert.count > 1 && (
                      <span className="text-xs text-slate-400">×{alert.count}</span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{formatTimeAgo(alert.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{alert.message}</p>
                  <p className="text-xs text-primary-500 mt-1 font-mono">{alert.application_id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {alert.status === 'NEW' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Check className="w-4 h-4" />}
                      onClick={() => handleAck(alert.id)}
                    >
                      Ack
                    </Button>
                  )}
                  {alert.status !== 'SNOOZED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<AlarmClock className="w-4 h-4" />}
                      onClick={() => handleSnooze(alert.id)}
                    >
                      Snooze
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => handleView(alert.application_id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
