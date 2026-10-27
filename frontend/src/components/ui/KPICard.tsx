import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; label: string }
  color?: string
  className?: string
}

export function KPICard({ label, value, icon, trend, color = 'text-primary-500', className = '' }: KPICardProps) {
  return (
    <div className={`
      bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl
      border border-white/20 dark:border-slate-700/30
      shadow-glass p-6 flex flex-col gap-3 transition-all duration-300
      hover:shadow-glass-lg hover:bg-white/70 dark:hover:bg-slate-800/50
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl bg-white/30 dark:bg-slate-700/30 ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.value > 0 ? 'text-emerald-500' : trend.value < 0 ? 'text-red-500' : 'text-slate-400'
          }`}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> :
             trend.value < 0 ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trend.label}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default KPICard
