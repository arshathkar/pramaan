interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'card' | 'row'
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const base = 'bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 dark:from-slate-700/40 dark:via-slate-600/40 dark:to-slate-700/40 animate-shimmer bg-[length:200%_100%]'

  switch (variant) {
    case 'circle':
      return <div className={`${base} rounded-full w-10 h-10 ${className}`} />
    case 'card':
      return <div className={`${base} rounded-3xl h-48 ${className}`} />
    case 'row':
      return (
        <div className="flex items-center gap-4 py-3">
          <div className={`${base} rounded-full w-8 h-8`} />
          <div className="flex-1 space-y-2">
            <div className={`${base} rounded-xl h-4 w-3/4`} />
            <div className={`${base} rounded-xl h-3 w-1/2`} />
          </div>
        </div>
      )
    default:
      return <div className={`${base} rounded-xl h-4 ${className}`} />
  }
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  )
}

export default Skeleton
