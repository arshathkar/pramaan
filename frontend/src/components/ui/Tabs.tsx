import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            transition-all duration-200
            ${tab.id === activeTab
              ? 'bg-white/60 dark:bg-slate-700/60 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }
          `}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface TabPanelProps {
  children: ReactNode
  tabId: string
  activeTab: string
  className?: string
}

export function TabPanel({ children, tabId, activeTab, className = '' }: TabPanelProps) {
  if (tabId !== activeTab) return null
  return (
    <div role="tabpanel" aria-label={tabId} className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}

export function useTabState(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return { activeTab, setActiveTab }
}

export default Tabs
