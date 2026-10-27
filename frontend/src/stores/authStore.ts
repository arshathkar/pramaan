// ============================================================
// Auth Store - React Context based auth state management
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, UserRole } from '@/types';

// ---- Types ----

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

type AuthContextValue = AuthState & AuthActions;

// ---- Permission Map ----

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  COLLEGE_USER: [
    'application:create',
    'application:view_own',
    'document:upload',
    'document:view_own',
    'alert:view_own',
    'assistant:use',
  ],
  SCRUTINY_OFFICER: [
    'dashboard:view',
    'application:view_all',
    'application:review',
    'finding:review',
    'verification:view',
    'verification:manual',
    'duplicate:view',
    'alert:view_all',
    'audit:view',
    'assistant:use',
  ],
  SENIOR_OFFICER: [
    'dashboard:view',
    'application:view_all',
    'application:review',
    'application:transition',
    'finding:review',
    'verification:view',
    'verification:manual',
    'duplicate:view',
    'duplicate:resolve',
    'alert:view_all',
    'audit:view',
    'assistant:use',
  ],
  AUDITOR: [
    'dashboard:view',
    'application:view_all',
    'evaluation:view',
    'audit:view',
    'alert:view_all',
    'assistant:use',
  ],
  SYSTEM_ADMIN: [
    'dashboard:view',
    'application:view_all',
    'user:manage',
    'rules:manage',
    'kb:manage',
    'settings:manage',
    'audit:view',
    'alert:view_all',
    'assistant:use',
  ],
};

// ---- Storage ----

const STORAGE_KEY = 'pramaan-auth-user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ---- Context ----

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Provider Props ----

interface AuthProviderProps {
  children: React.ReactNode;
}

// ---- Provider Component ----

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadUser();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    saveUser(u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveUser(updated);
      return updated;
    });
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role] ?? [];
      return perms.includes(permission);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
      hasRole,
      hasPermission,
    }),
    [user, isLoading, login, logout, updateUser, hasRole, hasPermission],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

// ---- Hook ----

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export { AuthContext, ROLE_PERMISSIONS };
export type { AuthContextValue };
