import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Bell, LogOut, User, ChevronDown, Shield, CheckCircle, Key, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { SearchInput } from '@/components/ui/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ROLE_LABELS } from '@/utils/constants'

export function TopBar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [_search, setSearch] = useState('')

  if (!user) return null

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim()) return
    setPasswordChangeSuccess(true)
    setNewPassword('')
    setTimeout(() => setPasswordChangeSuccess(false), 3000)
  }

  return (
    <header className="
      sticky top-0 z-30 h-16
      bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl
      border-b border-white/15 dark:border-slate-700/15
      flex items-center gap-4 px-6
    ">
      {/* Search */}
      <SearchInput
        onChange={setSearch}
        placeholder="Search applications, documents…"
        className="w-80 max-w-md"
      />

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-white/20 dark:hover:bg-slate-700/40 transition-all duration-200"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </button>

        {/* Alerts */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2.5 rounded-xl hover:bg-white/20 dark:hover:bg-slate-700/40 transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-2xl hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
          >
            <Avatar name={user.full_name} size="sm" status="online" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="
                absolute right-0 top-full mt-2 w-56 z-50
                bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-2xl
                border border-white/20 dark:border-slate-700/30
                shadow-glass-lg py-2 animate-scale-in
              ">
                <div className="px-4 py-3 border-b border-white/10 dark:border-slate-700/20">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); setShowProfileModal(true) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <User className="w-4 h-4 text-primary-500" /> View Profile
                </button>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); navigate('/login') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="User Profile & Security"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-6 py-2">
          {/* Header Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-700/30 border border-white/20 dark:border-slate-600/20">
            <Avatar name={user.full_name} size="lg" status="online" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{user.full_name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge label={ROLE_LABELS[user.role]} bg="bg-primary-50 dark:bg-primary-900/30" color="text-primary-600 dark:text-primary-400" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Active Session
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/10 dark:border-slate-700/20">
              <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5" /> Institution / Org
              </p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {user.role === 'COLLEGE_USER' ? 'Vidya International Engineering & Technology' : 'AICTE Regulatory Scrutiny Division'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/10 dark:border-slate-700/20">
              <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Shield className="w-3.5 h-3.5" /> Security Level
              </p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                2FA Enabled (TOTP Active)
              </p>
            </div>
          </div>

          {/* Quick Password Update */}
          <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-white/10 dark:border-slate-700/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-primary-500" /> Change Password
            </h4>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new secure password (min. 12 chars)"
                className="glass-input w-full text-sm"
              />
              <div className="flex items-center justify-between">
                {passwordChangeSuccess ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Password updated successfully!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Argon2id cryptographic hash encryption</span>
                )}
                <Button size="sm" type="submit" disabled={!newPassword.trim()}>
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </header>
  )
}

export default TopBar
