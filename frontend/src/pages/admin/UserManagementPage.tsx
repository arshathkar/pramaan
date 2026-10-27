import { useState } from 'react'
import { Users, Plus, Shield, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  COLLEGE_USER: 'College User',
  SCRUTINY_OFFICER: 'Scrutiny Officer',
  SENIOR_OFFICER: 'Senior Officer',
  AUDITOR: 'Auditor',
  SYSTEM_ADMIN: 'System Admin',
}

const ROLE_COLORS: Record<UserRole, string> = {
  COLLEGE_USER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  SCRUTINY_OFFICER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  SENIOR_OFFICER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  AUDITOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SYSTEM_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

interface DemoUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  institution: string
  is_active: boolean
  totp_enabled: boolean
  last_login: string
}

const initialUsers: DemoUser[] = [
  { id: 'u-college', email: 'college@demo.pramaan.in', full_name: 'Ravi Patel', role: 'COLLEGE_USER', institution: 'Vidya International Engineering & Technology', is_active: true, totp_enabled: false, last_login: '2026-10-24 14:30 IST' },
  { id: 'u-scrutiny', email: 'scrutiny@demo.pramaan.in', full_name: 'Meera Joshi', role: 'SCRUTINY_OFFICER', institution: 'AICTE Scrutiny Cell', is_active: true, totp_enabled: true, last_login: '2026-10-25 09:15 IST' },
  { id: 'u-senior', email: 'senior@demo.pramaan.in', full_name: 'Anil Deshmukh', role: 'SENIOR_OFFICER', institution: 'AICTE Regional Directorate', is_active: true, totp_enabled: true, last_login: '2026-10-25 08:45 IST' },
  { id: 'u-auditor', email: 'auditor@demo.pramaan.in', full_name: 'Kavita Nair', role: 'AUDITOR', institution: 'Independent Regulatory Audit Board', is_active: true, totp_enabled: false, last_login: '2026-10-23 11:00 IST' },
  { id: 'u-admin', email: 'admin@demo.pramaan.in', full_name: 'System Administrator', role: 'SYSTEM_ADMIN', institution: 'AICTE IT Administration', is_active: true, totp_enabled: true, last_login: '2026-10-25 09:00 IST' },
]

export default function UserManagementPage() {
  const { success } = useToast()
  const [users, setUsers] = useState<DemoUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<DemoUser | null>(null)

  // Create form state
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('COLLEGE_USER')
  const [newInstitution, setNewInstitution] = useState('')

  // Edit form state
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('COLLEGE_USER')
  const [editInstitution, setEditInstitution] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editTotp, setEditTotp] = useState(false)

  const handleOpenEdit = (user: DemoUser) => {
    setEditingUser(user)
    setEditFullName(user.full_name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditInstitution(user.institution)
    setEditIsActive(user.is_active)
    setEditTotp(user.totp_enabled)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u,
      full_name: editFullName,
      email: editEmail,
      role: editRole,
      institution: editInstitution || '—',
      is_active: editIsActive,
      totp_enabled: editTotp,
    } : u))

    success('User Updated', `Changes to ${editFullName} have been saved successfully.`)
    setEditingUser(null)
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim() || !newEmail.trim()) return

    const created: DemoUser = {
      id: `u-${Date.now()}`,
      full_name: newFullName,
      email: newEmail,
      role: newRole,
      institution: newInstitution || '—',
      is_active: true,
      totp_enabled: false,
      last_login: 'Never'
    }

    setUsers(prev => [created, ...prev])
    setNewFullName('')
    setNewEmail('')
    setNewInstitution('')
    setShowCreateModal(false)
    success('User Created', `Account for ${created.full_name} created successfully.`)
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = selectedRole === 'all' || u.role === selectedRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage platform users, roles, 2FA credentials, and access permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users by name or email…" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(ROLE_LABELS)].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  selectedRole === role
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {role === 'all' ? 'All Roles' : ROLE_LABELS[role as UserRole]}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/20 dark:bg-slate-800/30">
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution / Cell</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2FA</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Login</th>
                <th className="text-right p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{user.institution}</td>
                  <td className="p-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      label={user.totp_enabled ? 'Enabled' : 'Off'}
                      color={user.totp_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}
                      bg={user.totp_enabled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800/40'}
                    />
                  </td>
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{user.last_login}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Role summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length
          return (
            <GlassCard key={role} className="p-4 text-center">
              <Shield className="w-5 h-5 mx-auto mb-2 text-primary-500" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </GlassCard>
          )
        })}
      </div>

      {/* Create User Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Platform User" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4 p-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
            <input
              required
              className="glass-input w-full text-sm"
              placeholder="e.g. Dr. Rajesh Kumar"
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
            <input
              required
              type="email"
              className="glass-input w-full text-sm"
              placeholder="user@institution.ac.in"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Role</label>
            <select
              className="glass-input w-full text-sm"
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
            >
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Institution / Department</label>
            <input
              className="glass-input w-full text-sm"
              placeholder="e.g. Sample Polytechnic, Bangalore"
              value={newInstitution}
              onChange={e => setNewInstitution(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit User: ${editingUser.full_name}`} size="md">
          <form onSubmit={handleSaveEdit} className="space-y-4 p-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
              <input
                required
                className="glass-input w-full text-sm"
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
              <input
                required
                type="email"
                className="glass-input w-full text-sm"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Role</label>
              <select
                className="glass-input w-full text-sm"
                value={editRole}
                onChange={e => setEditRole(e.target.value as UserRole)}
              >
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Institution</label>
              <input
                className="glass-input w-full text-sm"
                value={editInstitution}
                onChange={e => setEditInstitution(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 border border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Account Active</p>
                <p className="text-xs text-slate-400">Allow user to log in and access assigned features</p>
              </div>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={e => setEditIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 border border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">2-Factor Authentication (TOTP)</p>
                <p className="text-xs text-slate-400">Requires authenticator app code on login</p>
              </div>
              <input
                type="checkbox"
                checked={editTotp}
                onChange={e => setEditTotp(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" type="button" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      <p className="text-center text-xs text-slate-400 italic">AI-generated decision support — Prototype with simulated data</p>
    </div>
  )
}
