import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({ value: controlledValue, onChange, placeholder = 'Search…', debounceMs = 300, className = '' }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (controlledValue !== undefined) setLocalValue(controlledValue)
  }, [controlledValue])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocalValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounceMs)
  }, [onChange, debounceMs])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl
          border border-white/30 dark:border-slate-600/30
          pl-10 pr-9 py-2.5 text-sm outline-none transition-all duration-200
          focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/50
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          text-slate-900 dark:text-slate-100
        "
        aria-label="Search"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
