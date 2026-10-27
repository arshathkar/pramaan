import type { Severity, RiskBand, ApplicationStatus, FindingStatus, VerificationStatus } from '@/types'
import {
  SEVERITY_CONFIG,
  RISK_BAND_CONFIG,
  APPLICATION_STATUS_CONFIG,
  FINDING_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
} from '@/utils/constants'
import { CheckCircle, XCircle, Clock, Loader2, CloudOff, UserCheck } from 'lucide-react'

type BadgeVariant = 'severity' | 'risk' | 'status' | 'finding' | 'verification' | 'custom'

interface BadgeProps {
  variant?: BadgeVariant
  severity?: Severity
  risk?: RiskBand
  status?: ApplicationStatus
  finding?: FindingStatus
  verification?: VerificationStatus
  label?: string
  color?: string
  bg?: string
  className?: string
  dot?: boolean
}

const verificationIcons: Record<VerificationStatus, typeof CheckCircle> = {
  VERIFIED: CheckCircle,
  MISMATCH_DETECTED: XCircle,
  EXPIRED: Clock,
  VERIFICATION_PENDING: Loader2,
  SOURCE_UNAVAILABLE: CloudOff,
  MANUAL_REVIEW_REQUIRED: UserCheck,
}

export function Badge({ variant = 'custom', severity, risk, status, finding, verification, label, color, bg, className = '', dot }: BadgeProps) {
  let displayLabel = label || ''
  let colorClass = color || 'text-slate-600 dark:text-slate-400'
  let bgClass = bg || 'bg-slate-100 dark:bg-slate-800/40'
  let IconComponent: typeof CheckCircle | null = null

  if (variant === 'severity' && severity) {
    const cfg = SEVERITY_CONFIG[severity]
    displayLabel = label || cfg.label
    colorClass = cfg.color
    bgClass = `${cfg.bg} ${cfg.darkBg}`
  } else if (variant === 'risk' && risk) {
    const cfg = RISK_BAND_CONFIG[risk]
    displayLabel = label || cfg.label
    colorClass = cfg.color
    bgClass = cfg.bg
  } else if (variant === 'status' && status) {
    const cfg = APPLICATION_STATUS_CONFIG[status]
    displayLabel = label || cfg.label
    colorClass = cfg.color
    bgClass = cfg.bg
  } else if (variant === 'finding' && finding) {
    const cfg = FINDING_STATUS_CONFIG[finding]
    displayLabel = label || cfg.label
    colorClass = cfg.color
    bgClass = cfg.bg
  } else if (variant === 'verification' && verification) {
    const cfg = VERIFICATION_STATUS_CONFIG[verification]
    displayLabel = label || cfg.label
    colorClass = cfg.color
    bgClass = cfg.bg
    IconComponent = verificationIcons[verification] ?? null
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        ${colorClass} ${bgClass} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      )}
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {displayLabel}
    </span>
  )
}

export default Badge
