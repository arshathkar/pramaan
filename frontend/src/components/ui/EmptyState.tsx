import { type ReactNode } from 'react'
import { FileQuestion } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="p-4 rounded-3xl bg-white/20 dark:bg-slate-800/20 mb-4">
        {icon || <FileQuestion className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
