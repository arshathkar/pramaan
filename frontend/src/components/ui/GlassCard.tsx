import { type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function GlassCard({ children, className = '', hover, onClick, padding = 'md' }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl
        border border-white/20 dark:border-slate-700/30
        shadow-glass transition-all duration-300
        ${hover ? 'hover:bg-white/70 dark:hover:bg-slate-800/50 hover:shadow-glass-lg hover:scale-[1.01] cursor-pointer' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export default GlassCard
