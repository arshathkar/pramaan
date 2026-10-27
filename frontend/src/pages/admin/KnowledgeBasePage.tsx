import { useState } from 'react'
import { BookOpen, Plus, Edit2, Tag } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

interface KBItem {
  id: string
  category: string
  title: string
  keywords: string
  content: string
  active: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  AICTE_FAQ: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PROCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REGULATION: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  TROUBLESHOOTING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const initialEntries: KBItem[] = [
  { id: 'kb-1', category: 'AICTE_FAQ', title: 'What is the Extension of Approval (EoA) process?', keywords: 'eoa,extension,approval', content: 'Annual approval cycle where existing approved institutions submit verification proofs and faculty lists for continuation of courses.', active: true },
  { id: 'kb-2', category: 'PROCESS', title: 'Application status workflow', keywords: 'status,workflow,process,stages', content: 'Applications move from Draft -> Submitted -> AI Review -> Officer Review -> Approved / Rejected. Deficiencies grant a 15-day rectification window.', active: true },
  { id: 'kb-3', category: 'REGULATION', title: 'AICTE faculty-to-student ratio norms', keywords: 'faculty,ratio,student,norm', content: 'Prescribed ratio is 1:20 for undergraduate technical degree programmes and 1:15 for postgraduate degree programmes.', active: true },
  { id: 'kb-4', category: 'TROUBLESHOOTING', title: 'Document upload issues', keywords: 'upload,document,pdf,error', content: 'Files must be PDF format and under 15MB. Ensure scanned documents are at least 300 DPI for reliable OCR text extraction.', active: true },
  { id: 'kb-5', category: 'AICTE_FAQ', title: 'Documents required for a New Institution application', keywords: 'new,institution,documents,checklist', content: 'Includes Trust Registration Deed, Land Document, Building Completion Certificate, Fire Safety NOC, and State NOC.', active: true },
  { id: 'kb-6', category: 'REGULATION', title: 'Risk score calculation methodology', keywords: 'risk,score,calculation,weight', content: 'Calculated using a 5-pillar weighted model: Authenticity (30%), Compliance (25%), Cross-Verification (20%), History (15%), and Anomaly Detection (10%).', active: true },
]

export default function KnowledgeBasePage() {
  const { success } = useToast()
  const [entries, setEntries] = useState<KBItem[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<KBItem | null>(null)

  // Add form state
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('AICTE_FAQ')
  const [newKeywords, setNewKeywords] = useState('')
  const [newContent, setNewContent] = useState('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('AICTE_FAQ')
  const [editKeywords, setEditKeywords] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editActive, setEditActive] = useState(true)

  const handleOpenEdit = (item: KBItem) => {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditCategory(item.category)
    setEditKeywords(item.keywords)
    setEditContent(item.content)
    setEditActive(item.active)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setEntries(prev => prev.map(entry => entry.id === editingItem.id ? {
      ...entry,
      title: editTitle,
      category: editCategory,
      keywords: editKeywords,
      content: editContent,
      active: editActive,
    } : entry))

    success('KB Entry Updated', `"${editTitle}" has been saved.`)
    setEditingItem(null)
  }

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newItem: KBItem = {
      id: `kb-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      keywords: newKeywords,
      content: newContent,
      active: true,
    }

    setEntries(prev => [newItem, ...prev])
    setNewTitle('')
    setNewKeywords('')
    setNewContent('')
    setShowAddModal(false)
    success('KB Entry Created', `"${newItem.title}" added to knowledge base.`)
  }

  const filtered = entries.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.keywords.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory
    return matchesSearch && matchesCat
  })

  const categories = ['all', ...Object.keys(CATEGORY_COLORS)]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary-500" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage AI assistant knowledge entries and regulatory FAQ guidelines
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          Add Entry
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_COLORS).map(([cat, colorClass]) => {
          const count = entries.filter(e => e.category === cat).length
          return (
            <GlassCard
              key={cat}
              className={`p-4 cursor-pointer hover:shadow-lg transition-all ${selectedCategory === cat ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
            >
              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${colorClass}`}>
                {cat.replace(/_/g, ' ')}
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">entries</p>
            </GlassCard>
          )
        })}
      </div>

      {/* Search & Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search knowledge base entries…" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Entries List */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <GlassCard key={entry.id} className="p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2.5 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mt-0.5">
                <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{entry.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{entry.content}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${CATEGORY_COLORS[entry.category] ?? 'bg-slate-100 text-slate-600'}`}>
                    {entry.category.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Tag className="w-3 h-3" /> {entry.keywords}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <Badge
                label={entry.active ? 'Active' : 'Inactive'}
                color={entry.active ? 'text-emerald-600' : 'text-slate-500'}
                bg={entry.active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800/40'}
              />
              <button
                onClick={() => handleOpenEdit(entry)}
                className="p-2 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                title="Edit Entry"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Knowledge Base Entry" size="md">
        <form onSubmit={handleCreateEntry} className="space-y-4 p-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Title</label>
            <input
              required
              className="glass-input w-full text-sm"
              placeholder="e.g. What is the deadline for EoA?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <select
              className="glass-input w-full text-sm"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            >
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Search Keywords (comma separated)</label>
            <input
              className="glass-input w-full text-sm"
              placeholder="e.g. deadline, eoa, extension, dates"
              value={newKeywords}
              onChange={e => setNewKeywords(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Explanation Content</label>
            <textarea
              required
              rows={3}
              className="glass-input w-full text-sm resize-none"
              placeholder="Detailed answer or regulatory clause summary..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Create Entry</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingItem && (
        <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title={`Edit KB Entry: ${editingItem.title}`} size="md">
          <form onSubmit={handleSaveEdit} className="space-y-4 p-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Title</label>
              <input
                required
                className="glass-input w-full text-sm"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select
                className="glass-input w-full text-sm"
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
              >
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Keywords</label>
              <input
                className="glass-input w-full text-sm"
                value={editKeywords}
                onChange={e => setEditKeywords(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Explanation Content</label>
              <textarea
                required
                rows={3}
                className="glass-input w-full text-sm resize-none"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 border border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Active in AI Assistant</p>
                <p className="text-xs text-slate-400">Include this answer when answering officer or college queries</p>
              </div>
              <input
                type="checkbox"
                checked={editActive}
                onChange={e => setEditActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="ghost" type="button" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      <p className="text-center text-xs text-slate-400 italic">AI-generated decision support — Prototype with simulated data</p>
    </div>
  )
}
