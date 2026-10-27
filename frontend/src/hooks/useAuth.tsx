import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'

// Demo users for the prototype
const DEMO_USERS: Record<string, { user: User; password: string }> = {
  'college@pramaan.demo': {
    password: 'demo12345678',
    user: {
      id: 'u-college-001',
      email: 'college@pramaan.demo',
      full_name: 'Dr. Rajesh Kumar',
      role: 'COLLEGE_USER',
      institution_id: 'inst-0001',
      totp_enabled: false,
      is_active: true,
      last_login_at: new Date().toISOString(),
    },
  },
  'scrutiny@pramaan.demo': {
    password: 'demo12345678',
    user: {
      id: 'u-scrutiny-001',
      email: 'scrutiny@pramaan.demo',
      full_name: 'Anita Sharma',
      role: 'SCRUTINY_OFFICER',
      totp_enabled: true,
      is_active: true,
      last_login_at: new Date().toISOString(),
    },
  },
  'senior@pramaan.demo': {
    password: 'demo12345678',
    user: {
      id: 'u-senior-001',
      email: 'senior@pramaan.demo',
      full_name: 'Vikram Mehta',
      role: 'SENIOR_OFFICER',
      totp_enabled: true,
      is_active: true,
      last_login_at: new Date().toISOString(),
    },
  },
  'auditor@pramaan.demo': {
    password: 'demo12345678',
    user: {
      id: 'u-auditor-001',
      email: 'auditor@pramaan.demo',
      full_name: 'Priya Nair',
      role: 'AUDITOR',
      totp_enabled: true,
      is_active: true,
      last_login_at: new Date().toISOString(),
    },
  },
  'admin@pramaan.demo': {
    password: 'demo12345678',
    user: {
      id: 'u-admin-001',
      email: 'admin@pramaan.demo',
      full_name: 'Suresh Patel',
      role: 'SYSTEM_ADMIN',
      totp_enabled: true,
      is_active: true,
      last_login_at: new Date().toISOString(),
    },
  },
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, totp?: string) => Promise<{ needsTotp: boolean }>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  isOfficer: boolean
  isCollege: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pramaan-user')
    if (saved) {
      try { return JSON.parse(saved) as User } catch { return null }
    }
    return null
  })
  const [isLoading] = useState(false)

  const login = useCallback(async (email: string, _password: string, _totp?: string): Promise<{ needsTotp: boolean }> => {
    // Demo: accept any of the demo users
    const demoUser = DEMO_USERS[email]
    if (demoUser) {
      const needsTotp = demoUser.user.totp_enabled && !_totp
      if (needsTotp) return { needsTotp: true }
      setUser(demoUser.user)
      localStorage.setItem('pramaan-user', JSON.stringify(demoUser.user))
      return { needsTotp: false }
    }
    throw new Error('Invalid email or password')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('pramaan-user')
  }, [])

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  const isOfficer = user?.role === 'SCRUTINY_OFFICER' || user?.role === 'SENIOR_OFFICER'
  const isCollege = user?.role === 'COLLEGE_USER'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole, isOfficer, isCollege }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
