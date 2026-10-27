import { Fingerprint, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="text-center">
        <div className="inline-flex p-4 rounded-3xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl border border-white/10 mb-6">
          <Fingerprint className="w-12 h-12 text-primary-400 opacity-50" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 dark:text-slate-700 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>Go Back</Button>
      </div>
    </div>
  )
}
