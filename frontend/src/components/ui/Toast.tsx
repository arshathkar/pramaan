import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useToast, type Toast as ToastType } from '@/hooks/useToast'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-emerald-400/30 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
  error: 'border-red-400/30 bg-red-50/80 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  warning: 'border-amber-400/30 bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  info: 'border-blue-400/30 bg-blue-50/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast()
  const Icon = icons[toast.type]

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-2xl border
        backdrop-blur-xl shadow-glass-sm animate-slide-in-right
        ${colors[toast.type]}
      `}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastContainer
