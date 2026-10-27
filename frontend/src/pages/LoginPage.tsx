import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [needsTotp, setNeedsTotp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password, needsTotp ? totp : undefined)
      if (result.needsTotp) {
        setNeedsTotp(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { email: 'college@pramaan.demo', label: 'College User', icon: '🎓' },
    { email: 'scrutiny@pramaan.demo', label: 'Scrutiny Officer', icon: '🔍' },
    { email: 'senior@pramaan.demo', label: 'Senior Officer', icon: '⭐' },
    { email: 'auditor@pramaan.demo', label: 'Auditor', icon: '📋' },
    { email: 'admin@pramaan.demo', label: 'System Admin', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4
      bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950
      relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />


      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-glow mb-4">
            <Fingerprint className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Pramaan</h1>
          <p className="text-sm text-slate-400">AI-Powered Document Validation & Authentication</p>
        </div>

        {/* Login card */}
        <div className="
          bg-white/10 backdrop-blur-2xl rounded-3xl
          border border-white/15 shadow-glass-lg
          p-8
        ">
          <h2 className="text-xl font-semibold text-white mb-6">
            {needsTotp ? 'Two-Factor Authentication' : 'Sign in to your account'}
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!needsTotp ? (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  className="!bg-white/10 !border-white/15 !text-white !placeholder:text-slate-500"
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  icon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                  className="!bg-white/10 !border-white/15 !text-white !placeholder:text-slate-500"
                />
              </>
            ) : (
              <Input
                label="TOTP Code"
                type="text"
                value={totp}
                onChange={e => setTotp(e.target.value)}
                placeholder="Enter 6-digit code"
                icon={<ShieldCheck className="w-4 h-4" />}
                maxLength={6}
                required
                autoFocus
                className="!bg-white/10 !border-white/15 !text-white !placeholder:text-slate-500 tracking-widest text-center text-lg"
              />
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full !rounded-2xl !py-3.5 mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {needsTotp ? 'Verify' : 'Sign In'}
            </Button>

            {needsTotp && (
              <button
                type="button"
                onClick={() => { setNeedsTotp(false); setTotp('') }}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back to login
              </button>
            )}
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6">
          <p className="text-xs text-slate-500 text-center mb-3">Quick access — Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => {
                  setEmail(acc.email)
                  setPassword('demo12345678')
                  setNeedsTotp(false)
                  setError('')
                }}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-2xl
                  bg-white/5 hover:bg-white/10 backdrop-blur-sm
                  border border-white/10 hover:border-white/20
                  transition-all duration-200 text-left
                "
              >
                <span className="text-lg">{acc.icon}</span>
                <span className="text-xs text-slate-300">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-8">
          AI-generated decision support. Final decisions rest with the competent authority.
        </p>
      </div>
    </div>
  )
}
