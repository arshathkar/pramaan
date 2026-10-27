import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssistantPanel } from '@/components/AssistantPanel'
import { MessageCircle } from 'lucide-react'

// Pages
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CollegeApplicationsPage from '@/pages/college/ApplicationsPage'
import NewApplicationPage from '@/pages/college/NewApplicationPage'
import ApplicationReviewPage from '@/pages/applications/ApplicationReviewPage'
import AlertsPage from '@/pages/alerts/AlertsPage'
import EvaluationPage from '@/pages/evaluation/EvaluationPage'
import AuditLogPage from '@/pages/audit/AuditLogPage'
import DuplicatesPage from '@/pages/duplicates/DuplicatesPage'
import VerificationTasksPage from '@/pages/verification/VerificationTasksPage'
import UserManagementPage from '@/pages/admin/UserManagementPage'
import RulesConfigPage from '@/pages/admin/RulesConfigPage'
import KnowledgeBasePage from '@/pages/admin/KnowledgeBasePage'
import SettingsPage from '@/pages/admin/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const { isAuthenticated, user } = useAuth()
  const [assistantOpen, setAssistantOpen] = useState(false)

  // Determine home route based on role
  const homeRoute = user?.role === 'COLLEGE_USER' ? '/college/applications' : '/dashboard'

  return (
    <>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={homeRoute} replace /> : <LoginPage />
        } />

        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* College routes */}
          <Route path="/college/applications" element={<CollegeApplicationsPage />} />
          <Route path="/college/applications/new" element={<NewApplicationPage />} />
          <Route path="/college/applications/:id" element={<ApplicationReviewPage />} />

          {/* Officer routes */}
          <Route path="/applications" element={<DashboardPage />} />
          <Route path="/applications/:id" element={<ApplicationReviewPage />} />

          {/* Verification */}
          <Route path="/verification-tasks" element={<VerificationTasksPage />} />

          {/* Duplicates */}
          <Route path="/duplicates" element={<DuplicatesPage />} />

          {/* Alerts */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Evaluation */}
          <Route path="/evaluation" element={<EvaluationPage />} />

          {/* Audit */}
          <Route path="/audit" element={<AuditLogPage />} />

          {/* Admin routes */}
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/rules" element={<RulesConfigPage />} />
          <Route path="/admin/kb" element={<KnowledgeBasePage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />

          {/* Catch-all */}
          <Route path="/" element={<Navigate to={homeRoute} replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Floating Assistant Button */}
      {isAuthenticated && !assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40
            p-4 rounded-2xl
            bg-gradient-to-br from-primary-500 to-violet-500
            text-white shadow-glow hover:shadow-glow-lg
            transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Ask Pramaan"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Assistant Panel */}
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}

export default App
