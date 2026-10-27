import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { formatFileSize } from '@/utils/formatters'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxSizeMB?: number
  maxFiles?: number
  multiple?: boolean
  className?: string
}

interface UploadedFile {
  file: File
  id: string
  error?: string
}

export function FileUploadZone({
  onFilesSelected,
  accept = '.pdf,.png,.jpg,.jpeg,.mp4',
  maxSizeMB = 15,
  maxFiles = 25,
  multiple = true,
  className = '',
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const validateFile = (file: File): string | undefined => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExts = accept.split(',').map(s => s.trim())
    if (!allowedExts.includes(ext)) return `File type ${ext} is not allowed`
    const limitMB = ext === '.mp4' ? 50 : maxSizeMB
    if (file.size > limitMB * 1024 * 1024) return `File exceeds ${limitMB} MB limit`
    return undefined
  }

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    const uploadedFiles: UploadedFile[] = arr.map((file, i) => ({
      file,
      id: `file-${Date.now()}-${i}`,
      error: validateFile(file),
    }))
    setFiles(prev => {
      const combined = [...prev, ...uploadedFiles].slice(0, maxFiles)
      const valid = combined.filter(f => !f.error).map(f => f.file)
      onFilesSelected(valid)
      return combined
    })
  }, [maxFiles, onFilesSelected])

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id)
      onFilesSelected(updated.filter(f => !f.error).map(f => f.file))
      return updated
    })
  }

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-3xl border-2 border-dashed p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
            : 'border-white/30 dark:border-slate-600/30 bg-white/20 dark:bg-slate-800/20 hover:bg-white/30 dark:hover:bg-slate-800/30'
          }
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload files"
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-slate-400 mt-2">
          PDF, PNG, JPG (max {maxSizeMB} MB) • MP4 (max 50 MB) • Up to {maxFiles} files
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map(f => (
            <div
              key={f.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl
                ${f.error
                  ? 'bg-red-50/50 dark:bg-red-900/20 border border-red-200/30 dark:border-red-800/30'
                  : 'bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/20'
                }
              `}
            >
              {f.error ? (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{f.file.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(f.file.size)}</p>
                {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="p-1.5 rounded-xl hover:bg-white/20 dark:hover:bg-slate-700/30 transition-colors"
                aria-label={`Remove ${f.file.name}`}
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUploadZone
