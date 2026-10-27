import type { RiskBand } from '@/types'
import { RISK_BAND_CONFIG } from '@/utils/constants'

interface RiskGaugeProps {
  score: number
  band: RiskBand
  size?: number
  showLabel?: boolean
  reliability?: 'normal' | 'reduced'
  className?: string
}

export function RiskGauge({ score, band, size = 140, showLabel = true, reliability, className = '' }: RiskGaugeProps) {
  const cfg = RISK_BAND_CONFIG[band]
  const radius = (size - 20) / 2
  const circumference = Math.PI * radius // half circle
  const progress = (score / 100) * circumference
  const center = size / 2
  const strokeWidth = 10

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke={cfg.hex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text
          x={center}
          y={size / 2 - 8}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-white font-bold"
          fontSize={size / 4.5}
        >
          {score}
        </text>
        <text
          x={center}
          y={size / 2 + 8}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400"
          fontSize={size / 12}
        >
          / 100
        </text>
      </svg>
      {showLabel && (
        <div className="text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {cfg.label}
          </span>
          {reliability === 'reduced' && (
            <p className="text-xs text-amber-500 mt-1">Score reliability: reduced</p>
          )}
        </div>
      )}
    </div>
  )
}

export default RiskGauge
