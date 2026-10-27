import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  confidence?: 'Low' | 'Medium' | 'High'
  source?: string
  related?: string[]
  timestamp: string
}

const starterChips: Record<string, string[]> = {
  COLLEGE_USER: [
    'What documents are required for Extension of Approval?',
    'Why was my document flagged?',
    'When is a document treated as expired?',
    'How do I fix a deficiency?',
    'What file formats are accepted?',
    'How long is the rectification window?',
  ],
  SCRUTINY_OFFICER: [
    'Which applications are high risk today?',
    'What does Mismatch Detected mean?',
    'How is the risk score calculated?',
    'What are the six verification statuses?',
    'How do I confirm a finding?',
    'What does the anomaly panel show?',
  ],
  SENIOR_OFFICER: [
    'Which applications are high risk today?',
    'How does the two-person rule work?',
    'When can I issue a deficiency notice?',
    'How is the risk score calculated?',
    'What does Needs Inspection mean?',
    'How do I read the explainable panel?',
  ],
  AUDITOR: [
    'How do I verify the audit chain?',
    'What events are logged?',
    'How is the risk score calculated?',
    'What does the evaluation page show?',
    'How are duplicates detected?',
    'What are the accuracy targets?',
  ],
  SYSTEM_ADMIN: [
    'How do I update a rule set?',
    'How do I add a knowledge base entry?',
    'What settings can I change?',
    'How do I manage users?',
    'How do I import a handbook PDF?',
    'What happens when I activate a new rule set?',
  ],
}

const knowledgeBase: Record<string, { answer: string; source: string; confidence: 'High' | 'Medium'; related: string[] }> = {
  'what documents are required for extension of approval?': {
    answer: 'For an Extension of Approval (EoA), the following documents are required:\n\n• Application Form\n• Affidavit / Undertaking (notarised)\n• Accreditation Certificate\n• University Affiliation Letter\n• Fire Safety NOC\n• Trust Registration Certificate\n• Land Document\n• Faculty List\n• Fee Payment Proof\n\nOptional but recommended: Floor Plan, Infrastructure Photos, State NOC.',
    source: 'Pramaan Guide — Section 7.1, Checklist EOA',
    confidence: 'High',
    related: ['What file formats are accepted?', 'When is a document treated as expired?', 'How do I fix a deficiency?'],
  },
  'how is the risk score calculated?': {
    answer: 'The risk score is a number from 0 to 100 calculated by summing documented points from findings:\n\n• Missing document: 8 pts (cap 24)\n• Expired document: 6 pts (cap 18)\n• Incomplete field: 2 pts (cap 8)\n• Inconsistency/mismatch: 5 pts (cap 15)\n• Verification mismatch: 12 pts (cap 24)\n• Anomaly: High=10, Medium=5, Low=2 (cap 30)\n• Compliance gap: High=6, Medium=3 (cap 24)\n• Duplicate: Exact=15, Near=8 (cap 25)\n\nConfirmed findings count ×1.25. Dismissed/Resolved count 0.\n\nBands: 0–24 LOW, 25–49 MEDIUM, 50–74 HIGH, 75–100 CRITICAL.\n\nA higher score means more items need a human look. It is not a judgement about the institution.',
    source: 'Pramaan Guide — Section 8.1, Risk Score',
    confidence: 'High',
    related: ['What does the anomaly panel show?', 'Which applications are high risk today?'],
  },
  'what does mismatch detected mean?': {
    answer: 'Mismatch Detected means the issuing authority\'s record differs from what was submitted. The compared field values (certificate number, dates, institution name, intake, etc.) are shown side by side in the verification table.\n\nThis could indicate an error in the submitted document, an outdated version, or a possible alteration that needs human verification.\n\nAn officer should review the compared fields, examine the evidence, and either confirm the concern or dismiss it with a reason.',
    source: 'Pramaan Guide — Section 7.5, Verification Statuses',
    confidence: 'High',
    related: ['What are the six verification statuses?', 'How do I confirm a finding?'],
  },
  'when is a document treated as expired?': {
    answer: 'A document is treated as expired when its valid_to date is before the submission date (or the DEMO_TODAY date in demo mode). A warning is also raised if the document expires within 60 days of the submission date.\n\nExpired documents receive a HIGH severity finding and contribute 6 risk points to the risk score.',
    source: 'Pramaan Guide — Section 7.3, Rule EOA-VAL-010',
    confidence: 'High',
    related: ['How is the risk score calculated?', 'How do I fix a deficiency?'],
  },
}

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chips = starterChips[user?.role || 'COLLEGE_USER'] ?? starterChips.COLLEGE_USER ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (text?: string) => {
    const query = text || input.trim()
    if (!query) return
    setInput('')

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Simulate retrieval
    setTimeout(() => {
      const key = query.toLowerCase().replace(/[?!.,]/g, '').trim()
      const match = Object.entries(knowledgeBase).find(([k]) => {
        const words = key.split(' ')
        const kWords = k.split(' ')
        const overlap = words.filter(w => kWords.includes(w)).length
        return overlap >= Math.min(3, kWords.length * 0.5)
      })

      const response: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: match
          ? match[1].answer
          : "I couldn't find a specific answer to that in my knowledge base. Here are some topics I can help with — try clicking one of the suggestions below, or rephrase your question.",
        confidence: match ? match[1].confidence : 'Low',
        source: match ? match[1].source : undefined,
        related: match ? match[1].related : chips.slice(0, 3),
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, response])
      setIsTyping(false)
    }, 600)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl
        border-l border-white/15 dark:border-slate-700/20
        shadow-glass-lg flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-slate-700/15">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Ask Pramaan</h2>
              <p className="text-[10px] text-slate-400">Knowledge assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 dark:hover:bg-slate-700/40 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Limits note */}
        <div className="px-5 py-2">
          <p className="text-[10px] text-slate-400 bg-white/20 dark:bg-slate-800/20 rounded-xl px-3 py-1.5">
            Answers from the Pramaan knowledge base. Cannot discuss topics outside rules, documents, statuses and platform usage.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">Suggestions for you:</p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    className="text-xs px-3 py-2 rounded-2xl bg-primary-50/50 dark:bg-primary-900/20
                      text-primary-600 dark:text-primary-400 hover:bg-primary-100/50 dark:hover:bg-primary-900/30
                      border border-primary-200/30 dark:border-primary-700/30 transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-lg'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 rounded-bl-lg border border-white/20 dark:border-slate-700/20'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.role === 'assistant' && msg.confidence && (
                  <div className="mt-3 space-y-2">
                    {msg.source && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {msg.source}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        msg.confidence === 'High' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        msg.confidence === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                        'bg-slate-100 dark:bg-slate-700/30 text-slate-500'
                      }`}>
                        {msg.confidence} confidence
                      </span>
                    </div>

                    {msg.related && msg.related.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.related.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(q)}
                            className="text-[10px] px-2 py-1 rounded-xl bg-white/20 dark:bg-slate-700/20 text-primary-500 hover:bg-white/30 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-3xl rounded-bl-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/20">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/10 dark:border-slate-700/15">
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about Pramaan…"
              className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl
                border border-white/20 dark:border-slate-600/20
                px-4 py-3 text-sm outline-none
                focus:ring-2 focus:ring-primary-400/50
                placeholder:text-slate-400 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600
                disabled:opacity-40 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default AssistantPanel
