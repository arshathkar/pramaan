import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, Eye, Files } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { CATEGORY_LABELS } from '@/utils/constants'
import { formatDateIST } from '@/utils/formatters'
import { getStoredApplications, type StoredApplication } from '@/utils/applicationStore'

export default function CollegeApplicationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [apps, setApps] = useState<StoredApplication[]>([])

  useEffect(() => {
    setApps(getStoredApplications())
  }, [])

  const filtered = apps.filter(app =>
    !search ||
    app.id.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[app.category]?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary-500" />
            My Applications
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your institution's applications and submitted documents</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/college/applications/new')}>
          New Application
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput onChange={setSearch} placeholder="Search applications or categories…" className="w-80" />
      </div>

      <div className="grid gap-4">
        {filtered.map(app => (
          <GlassCard key={app.id} hover onClick={() => navigate(`/college/applications/${app.id}`)}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-500/10">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white font-mono">{app.id}</h3>
                    <Badge variant="status" status={app.status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {CATEGORY_LABELS[app.category] || app.category} • {app.academic_year}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 mt-1 font-medium">
                    <Files className="w-3.5 h-3.5" />
                    {app.documents?.length || 0} document{app.documents?.length === 1 ? '' : 's'} attached
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Progress */}
                {app.findings?.total > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">{app.findings.passed}/{app.findings.total} passed</span>
                    </div>
                    {app.findings.failed > 0 && (
                      <div className="flex items-center gap-2 text-sm mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 font-medium">{app.findings.failed} items to fix</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Deadline */}
                <div className="text-right">
                  <p className="text-xs text-slate-400">Deadline</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateIST(app.deadline)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/college/applications/${app.id}`)
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
