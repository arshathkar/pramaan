import { useState } from 'react'
import { Settings, Save, RefreshCw, Shield, Clock, Upload, Database } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

interface SettingItem {
  key: string; value: string; label: string; description: string
  type: 'number' | 'text' | 'boolean' | 'select'
  options?: string[]; group: string; editable: boolean
}

const settings: SettingItem[] = [
  { key: 'sla_days', value: '5', label: 'SLA Processing Days', description: 'Maximum days for application processing before SLA breach alert', type: 'number', group: 'Processing', editable: true },
  { key: 'rectification_days', value: '15', label: 'Rectification Window', description: 'Days allowed for institution to respond to deficiency notices', type: 'number', group: 'Processing', editable: true },
  { key: 'max_upload_mb', value: '15', label: 'Max Upload Size (MB)', description: 'Maximum file size per document upload', type: 'number', group: 'Uploads', editable: true },
  { key: 'max_files_per_app', value: '25', label: 'Max Files Per Application', description: 'Maximum number of documents per application', type: 'number', group: 'Uploads', editable: true },
  { key: 'max_video_mb', value: '50', label: 'Max Video Size (MB)', description: 'Maximum video file size for infrastructure verification', type: 'number', group: 'Uploads', editable: true },
  { key: 'anomaly_threshold', value: '0.60', label: 'Anomaly Score Threshold', description: 'Documents with anomaly score above this are flagged for review', type: 'number', group: 'AI/ML', editable: true },
  { key: 'ocr_engine', value: 'tesseract', label: 'OCR Engine', description: 'Text extraction engine for scanned documents', type: 'select', options: ['tesseract', 'paddle'], group: 'AI/ML', editable: true },
  { key: 'assistant_mode', value: 'full', label: 'Assistant Mode', description: 'AI assistant response mode', type: 'select', options: ['full', 'predefined_only'], group: 'AI/ML', editable: true },
  { key: 'demo_mode', value: 'true', label: 'Demo Mode', description: 'Enable demo mode with synthetic data and relaxed security', type: 'boolean', group: 'System', editable: true },
  { key: 'retention_days', value: '365', label: 'Data Retention (Days)', description: 'Days to retain uploaded documents and processed data', type: 'number', group: 'System', editable: true },
  { key: 'app_env', value: 'demo', label: 'Environment', description: 'Current deployment environment', type: 'text', group: 'System', editable: false },
]

const GROUP_ICONS: Record<string, typeof Settings> = {
  Processing: Clock,
  Uploads: Upload,
  'AI/ML': Shield,
  System: Database,
}

export default function SettingsPage() {
  const { success, info } = useToast()
  const defaultValues = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const [values, setValues] = useState<Record<string, string>>(defaultValues)
  const [saved, setSaved] = useState(false)

  const groups = [...new Set(settings.map(s => s.group))]

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    success('Settings Saved', 'All regulatory parameters and system thresholds updated.')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setValues(defaultValues)
    setSaved(false)
    info('Defaults Restored', 'System settings reset to default values.')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary-500" />
            System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure platform behavior, limits, and AI parameters
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleReset} icon={<RefreshCw className="w-4 h-4" />}>
            Reset All
          </Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Grouped settings */}
      {groups.map(group => {
        const Icon = GROUP_ICONS[group] ?? Settings
        const groupSettings = settings.filter(s => s.group === group)
        return (
          <GlassCard key={group} className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <Icon className="w-5 h-5 text-primary-500" />
              {group}
            </h2>
            <div className="space-y-5">
              {groupSettings.map(setting => (
                <div key={setting.key} className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {setting.label}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{setting.description}</p>
                  </div>
                  <div className="w-48">
                    {setting.type === 'boolean' ? (
                      <button
                        onClick={() => setting.editable && handleChange(setting.key, values[setting.key] === 'true' ? 'false' : 'true')}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          values[setting.key] === 'true'
                            ? 'bg-primary-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        } ${!setting.editable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          values[setting.key] === 'true' ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : setting.type === 'select' ? (
                      <select
                        value={values[setting.key]}
                        onChange={e => handleChange(setting.key, e.target.value)}
                        disabled={!setting.editable}
                        className="glass-input w-full text-sm"
                      >
                        {setting.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={setting.type === 'number' ? 'number' : 'text'}
                        value={values[setting.key]}
                        onChange={e => handleChange(setting.key, e.target.value)}
                        disabled={!setting.editable}
                        className={`glass-input w-full text-sm ${!setting.editable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )
      })}

      <p className="text-center text-xs text-slate-400 italic">AI-generated decision support — Prototype with simulated data</p>
    </div>
  )
}
