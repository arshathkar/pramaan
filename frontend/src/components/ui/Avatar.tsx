interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  status?: 'online' | 'offline' | 'busy'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function getColor(name: string): string {
  const colors = [
    'bg-primary-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]!
}

export function Avatar({ name, size = 'md', className = '', status }: AvatarProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <div className={`
        ${sizeClasses[size]} ${getColor(name)}
        rounded-2xl flex items-center justify-center font-semibold text-white
        ring-2 ring-white/20 dark:ring-slate-700/30
      `}>
        {getInitials(name)}
      </div>
      {status && (
        <span className={`
          absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
          ${statusColors[status]} ring-2 ring-white dark:ring-slate-800
        `} />
      )}
    </div>
  )
}

export default Avatar
