import type { ApplicationCategory, ApplicationStatus, DocumentType } from '@/types'

export interface StoredDocument {
  name: string
  type: DocumentType
  confidence: number
  fields: number
  pages: number
  uploaded_at: string
}

export interface StoredApplication {
  id: string
  category: ApplicationCategory
  academic_year: string
  status: ApplicationStatus
  created_at: string
  deadline: string
  findings: { total: number; passed: number; failed: number }
  documents: StoredDocument[]
}

const STORAGE_KEY = 'pramaan_stored_applications'

const initialApps: StoredApplication[] = [
  {
    id: 'APP-2026-0001',
    category: 'EOA',
    academic_year: '2026-27',
    status: 'DRAFT',
    created_at: '2026-10-20T10:00:00Z',
    deadline: '2026-11-15',
    findings: { total: 0, passed: 0, failed: 0 },
    documents: [
      { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.98, fields: 8, pages: 3, uploaded_at: '2026-10-20T10:00:00Z' },
      { name: 'Affidavit.pdf', type: 'AFFIDAVIT_UNDERTAKING', confidence: 0.91, fields: 5, pages: 2, uploaded_at: '2026-10-20T10:05:00Z' },
    ],
  },
  {
    id: 'APP-2026-0002',
    category: 'EOA',
    academic_year: '2026-27',
    status: 'SUBMITTED',
    created_at: '2026-10-18T10:00:00Z',
    deadline: '2026-11-15',
    findings: { total: 12, passed: 8, failed: 3 },
    documents: [
      { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.98, fields: 8, pages: 3, uploaded_at: '2026-10-18T10:00:00Z' },
      { name: 'Fire_NOC_2025.pdf', type: 'FIRE_SAFETY_NOC', confidence: 0.95, fields: 6, pages: 1, uploaded_at: '2026-10-18T10:15:00Z' },
      { name: 'Faculty_List.pdf', type: 'FACULTY_LIST', confidence: 0.88, fields: 25, pages: 4, uploaded_at: '2026-10-18T10:20:00Z' },
    ],
  },
  {
    id: 'APP-2026-0003',
    category: 'EOA',
    academic_year: '2026-27',
    status: 'UNDER_REVIEW',
    created_at: '2026-10-16T10:00:00Z',
    deadline: '2026-11-15',
    findings: { total: 6, passed: 2, failed: 4 },
    documents: [
      { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.98, fields: 8, pages: 3, uploaded_at: '2026-10-16T10:00:00Z' },
      { name: 'Fire_NOC_2025.pdf', type: 'FIRE_SAFETY_NOC', confidence: 0.95, fields: 6, pages: 1, uploaded_at: '2026-10-16T10:05:00Z' },
      { name: 'Affidavit.pdf', type: 'AFFIDAVIT_UNDERTAKING', confidence: 0.91, fields: 5, pages: 2, uploaded_at: '2026-10-16T10:10:00Z' },
      { name: 'Accreditation.pdf', type: 'ACCREDITATION_CERTIFICATE', confidence: 0.97, fields: 6, pages: 1, uploaded_at: '2026-10-16T10:15:00Z' },
      { name: 'Affiliation_Letter.pdf', type: 'UNIVERSITY_AFFILIATION_LETTER', confidence: 0.93, fields: 7, pages: 2, uploaded_at: '2026-10-16T10:20:00Z' },
      { name: 'Faculty_List.pdf', type: 'FACULTY_LIST', confidence: 0.88, fields: 25, pages: 4, uploaded_at: '2026-10-16T10:25:00Z' },
      { name: 'Fee_Receipt.pdf', type: 'FEE_PAYMENT_PROOF', confidence: 0.99, fields: 4, pages: 1, uploaded_at: '2026-10-16T10:30:00Z' },
      { name: 'Floor_Plan.pdf', type: 'FLOOR_PLAN', confidence: 0.85, fields: 12, pages: 2, uploaded_at: '2026-10-16T10:35:00Z' },
    ],
  },
  {
    id: 'APP-2026-0010',
    category: 'ADD_COURSE',
    academic_year: '2026-27',
    status: 'DEFICIENCY_NOTIFIED',
    created_at: '2026-10-15T10:00:00Z',
    deadline: '2026-11-01',
    findings: { total: 10, passed: 6, failed: 4 },
    documents: [
      { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.97, fields: 8, pages: 3, uploaded_at: '2026-10-15T10:00:00Z' },
    ],
  },
  {
    id: 'APP-2026-0015',
    category: 'INCREASE_INTAKE',
    academic_year: '2026-27',
    status: 'CLEARED_FOR_NEXT_STAGE',
    created_at: '2026-10-10T10:00:00Z',
    deadline: '2026-11-15',
    findings: { total: 8, passed: 8, failed: 0 },
    documents: [
      { name: 'Application_Form.pdf', type: 'APPLICATION_FORM', confidence: 0.99, fields: 8, pages: 3, uploaded_at: '2026-10-10T10:00:00Z' },
    ],
  },
]

export function getStoredApplications(): StoredApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialApps))
      return initialApps
    }
    return JSON.parse(raw) as StoredApplication[]
  } catch {
    return initialApps
  }
}

export function saveStoredApplication(app: StoredApplication): void {
  const current = getStoredApplications()
  const index = current.findIndex(a => a.id === app.id)
  if (index >= 0) {
    current[index] = app
  } else {
    current.unshift(app)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function addDocumentToStoredApp(appId: string, doc: StoredDocument): StoredApplication | null {
  const current = getStoredApplications()
  let app = current.find(a => a.id === appId)
  if (!app) {
    // If not found, use APP-2026-0003 as fallback default
    app = current.find(a => a.id === 'APP-2026-0003') || current[0]
  }
  if (!app) return null

  app.documents = [doc, ...app.documents]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  return app
}
