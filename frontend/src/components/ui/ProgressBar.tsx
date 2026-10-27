interface ProgressBarProps {
  value: number
  max?: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  label?: string
  showPercent?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function ProgressBar({ value, max = 100, color = 'primary', label, showPercent, className = '', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
          {showPercent && <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full ${size === 'sm' ? 'h-1.5' : 'h-2.5'} bg-white/20 dark:bg-slate-700/30 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  )
}

export default ProgressBar
