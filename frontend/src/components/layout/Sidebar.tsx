import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  FileText, PlusCircle, LayoutDashboard, FolderOpen, ClipboardCheck,
  Copy, BarChart3, Bell, Shield, Users, Settings2, BookOpen, Cog,
  ChevronLeft, ChevronRight, Fingerprint,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NAV_ITEMS } from '@/utils/constants'

const iconMap: Record<string, typeof FileText> = {
  FileText, PlusCircle, LayoutDashboard, FolderOpen, ClipboardCheck,
  Copy, BarChart3, Bell, Shield, Users, Settings2, BookOpen, Cog,
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-40
        bg-white/30 dark:bg-slate-900/60 backdrop-blur-2xl
        border-r border-white/15 dark:border-slate-700/20
        flex flex-col transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 dark:border-slate-700/15">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-glow">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold gradient-text">Pramaan</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 truncate">Document Validation</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map(item => {
          const Icon = iconMap[item.icon] || FileText
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? 'bg-primary-500/15 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700/30 hover:text-slate-900 dark:hover:text-white'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-500" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-500' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-white/10 dark:border-slate-700/15">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl
            text-sm text-slate-500 hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
