import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileCheck, AlertTriangle, Shield,
  CheckCircle, Zap, BarChart3, Activity,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, Legend, Area, AreaChart,
} from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabPanel, useTabState } from '@/components/ui/Tabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { CATEGORY_LABELS } from '@/utils/constants'
import type { ApplicationStatus, RiskBand, ApplicationCategory } from '@/types'

// ── Mock Data ──
const kpis = {
  applications_in_queue: 18,
  validated_today: 7,
  high_risk: 4,
  critical_risk: 2,
  pending_verification: 9,
  open_deficiencies: 12,
  avg_validation_time_sec: 22.4,
  verification_success_rate: 0.87,
  unresolved_alerts: 6,
}

const statusFunnel = [
  { name: 'Submitted', value: 24, fill: '#3b82f6' },
  { name: 'Validated', value: 20, fill: '#6366f1' },
  { name: 'Under Review', value: 14, fill: '#0ea5e9' },
  { name: 'Deficiency', value: 6, fill: '#f97316' },
  { name: 'Cleared', value: 8, fill: '#22c55e' },
  { name: 'Closed', value: 4, fill: '#64748b' },
]

const riskDistribution = [
  { name: 'Low', value: 10, color: '#22c55e' },
  { name: 'Medium', value: 8, color: '#f59e0b' },
  { name: 'High', value: 4, color: '#f97316' },
  { name: 'Critical', value: 2, color: '#dc2626' },
]

const deficiencyTypes = [
  { name: 'Missing Document', count: 8 },
  { name: 'Expired', count: 6 },
  { name: 'Inconsistent Data', count: 5 },
  { name: 'Record Mismatch', count: 4 },
  { name: 'Anomaly', count: 3 },
  { name: 'Verification Issue', count: 2 },
]

const dailyApps = Array.from({ length: 14 }, (_, i) => ({
  date: `Oct ${i + 10}`,
  applications: Math.floor(Math.random() * 6) + 1,
  avgTime: Math.floor(Math.random() * 15) + 15,
}))

const verificationByIssuer = [
  { issuer: 'Fire Services', verified: 8, mismatch: 1, pending: 2, unavailable: 1 },
  { issuer: 'University', verified: 10, mismatch: 2, pending: 1, unavailable: 0 },
  { issuer: 'Accreditation', verified: 6, mismatch: 0, pending: 3, unavailable: 1 },
  { issuer: 'State Dept', verified: 7, mismatch: 1, pending: 1, unavailable: 0 },
  { issuer: 'Registrar', verified: 9, mismatch: 0, pending: 0, unavailable: 0 },
]

const queueData = [
  { id: 'APP-2026-0001', institution: 'Sample Institute of Technology, Delhi', category: 'EOA' as ApplicationCategory, status: 'VALIDATED' as ApplicationStatus, risk_score: 12, risk_band: 'LOW' as RiskBand, findings: { HIGH: 0, MEDIUM: 1, LOW: 2 }, pending_verifications: 0, sla_days: 3, officer: 'Anita Sharma' },
  { id: 'APP-2026-0002', institution: 'Sample Engineering College, Mumbai', category: 'EOA' as ApplicationCategory, status: 'UNDER_REVIEW' as ApplicationStatus, risk_score: 45, risk_band: 'MEDIUM' as RiskBand, findings: { HIGH: 2, MEDIUM: 3, LOW: 1 }, pending_verifications: 2, sla_days: 2, officer: 'Anita Sharma' },
  { id: 'APP-2026-0003', institution: 'Sample Polytechnic, Bangalore', category: 'ADD_COURSE' as ApplicationCategory, status: 'VALIDATED' as ApplicationStatus, risk_score: 78, risk_band: 'CRITICAL' as RiskBand, findings: { HIGH: 5, MEDIUM: 2, LOW: 0 }, pending_verifications: 1, sla_days: 4, officer: 'Unassigned' },
  { id: 'APP-2026-0004', institution: 'Sample Technical University, Chennai', category: 'INCREASE_INTAKE' as ApplicationCategory, status: 'UNDER_REVIEW' as ApplicationStatus, risk_score: 62, risk_band: 'HIGH' as RiskBand, findings: { HIGH: 3, MEDIUM: 4, LOW: 2 }, pending_verifications: 3, sla_days: 1, officer: 'Vikram Mehta' },
  { id: 'APP-2026-0005', institution: 'Sample College of Engineering, Pune', category: 'EOA' as ApplicationCategory, status: 'DEFICIENCY_NOTIFIED' as ApplicationStatus, risk_score: 88, risk_band: 'CRITICAL' as RiskBand, findings: { HIGH: 6, MEDIUM: 3, LOW: 1 }, pending_verifications: 0, sla_days: 0, officer: 'Anita Sharma' },
  { id: 'APP-2026-0006', institution: 'Sample Institute, Hyderabad', category: 'CHANGE_PARTICULARS' as ApplicationCategory, status: 'VALIDATED' as ApplicationStatus, risk_score: 8, risk_band: 'LOW' as RiskBand, findings: { HIGH: 0, MEDIUM: 0, LOW: 1 }, pending_verifications: 0, sla_days: 5, officer: 'Unassigned' },
  { id: 'APP-2026-0007', institution: 'Sample Technical Institute, Kolkata', category: 'EOA' as ApplicationCategory, status: 'UNDER_REVIEW' as ApplicationStatus, risk_score: 55, risk_band: 'HIGH' as RiskBand, findings: { HIGH: 4, MEDIUM: 2, LOW: 3 }, pending_verifications: 2, sla_days: 2, officer: 'Vikram Mehta' },
  { id: 'APP-2026-0008', institution: 'Sample Engineering Academy, Jaipur', category: 'EOA' as ApplicationCategory, status: 'VALIDATED' as ApplicationStatus, risk_score: 32, risk_band: 'MEDIUM' as RiskBand, findings: { HIGH: 1, MEDIUM: 3, LOW: 2 }, pending_verifications: 1, sla_days: 4, officer: 'Unassigned' },
]

const glassTooltipProps = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 12,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
    padding: '8px 12px',
  },
  itemStyle: { color: '#ffffff', fontWeight: 600 },
  labelStyle: { color: '#93c5fd', fontWeight: 600, marginBottom: 4 },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useTabState('overview')
  const [search, setSearch] = useState('')
  const [selectedBand, setSelectedBand] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL')

  const filteredQueue = queueData
    .filter(app => {
      if (selectedBand !== 'ALL' && app.risk_band !== selectedBand) return false
      if (search && !app.institution.toLowerCase().includes(search.toLowerCase()) && !app.id.includes(search)) return false
      return true
    })
    .sort((a, b) => b.risk_score - a.risk_score)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-primary-500" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time overview of validation pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="In Queue" value={kpis.applications_in_queue} icon={<FileCheck className="w-5 h-5" />} trend={{ value: 3, label: '+3 today' }} />
        <KPICard label="Validated Today" value={kpis.validated_today} icon={<CheckCircle className="w-5 h-5" />} color="text-emerald-500" trend={{ value: 2, label: '+2 vs avg' }} />
        <KPICard label="High / Critical Risk" value={`${kpis.high_risk} / ${kpis.critical_risk}`} icon={<AlertTriangle className="w-5 h-5" />} color="text-orange-500" />
        <KPICard label="Pending Verification" value={kpis.pending_verification} icon={<Shield className="w-5 h-5" />} color="text-violet-500" />
        <KPICard label="Avg Validation Time" value={`${kpis.avg_validation_time_sec}s`} icon={<Zap className="w-5 h-5" />} color="text-sky-500" trend={{ value: -5, label: '-5s' }} />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'queue', label: 'Application Queue', icon: <Activity className="w-4 h-4" />, badge: filteredQueue.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TabPanel tabId="overview" activeTab={activeTab}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Funnel */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Application Status Funnel</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} width={90} />
                <Tooltip {...glassTooltipProps} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {statusFunnel.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Risk Distribution */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Risk Band Distribution</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...glassTooltipProps} />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-xs text-slate-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Deficiency Types */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Top Deficiency Types</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deficiencyTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} />
                <Tooltip {...glassTooltipProps} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Daily Applications */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Daily Applications & Avg. Validation Time</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyApps}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip {...glassTooltipProps} />
                <Legend formatter={(value) => <span className="text-xs text-slate-500">{value}</span>} />
                <Area yAxisId="left" type="monotone" dataKey="applications" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Verification by Issuer */}
          <GlassCard className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Verification Outcomes by Issuer</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={verificationByIssuer}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="issuer" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip {...glassTooltipProps} />
                <Legend formatter={(value) => <span className="text-xs text-slate-500">{value}</span>} />
                <Bar dataKey="verified" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="mismatch" stackId="a" fill="#ef4444" />
                <Bar dataKey="pending" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="unavailable" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </TabPanel>

      <TabPanel tabId="queue" activeTab={activeTab}>
        {/* Queue controls */}
        <div className="flex items-center gap-4 mb-4">
          <SearchInput onChange={setSearch} placeholder="Search applications…" className="w-80" />
          <div className="flex gap-2 ml-auto">
            {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(band => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${selectedBand === band
                    ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold'
                    : 'bg-white/20 dark:bg-slate-800/30 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {band === 'ALL' ? 'All' : band}
              </button>
            ))}
          </div>
        </div>

        {/* Queue table */}
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/30 dark:bg-slate-800/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Application</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Findings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Officer</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="border-t border-white/10 dark:border-slate-700/20 hover:bg-primary-500/10 dark:hover:bg-primary-500/10 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                      {app.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">{app.institution}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{CATEGORY_LABELS[app.category]}</td>
                    <td className="px-4 py-3"><Badge variant="status" status={app.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="risk" risk={app.risk_band} />
                        <span className="text-xs font-mono text-slate-500">{app.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {app.findings.HIGH > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 font-semibold">{app.findings.HIGH}H</span>}
                        {app.findings.MEDIUM > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 font-semibold">{app.findings.MEDIUM}M</span>}
                        {app.findings.LOW > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 font-semibold">{app.findings.LOW}L</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${app.sla_days <= 1 ? 'text-red-500' : app.sla_days <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {app.sla_days}d left
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{app.officer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </TabPanel>
    </div>
  )
}
