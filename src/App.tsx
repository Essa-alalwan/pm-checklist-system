import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/layout/RequireAuth'
import { SessionProvider } from './context/SessionContext'
import { TemplatesProvider } from './context/TemplatesContext'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NewChecklistTypePage from './pages/NewChecklistTypePage'
import NewChecklistWizardPage from './pages/NewChecklistWizardPage'
import NotFoundPage from './pages/NotFoundPage'
import RecordDetailPage from './pages/RecordDetailPage'
import RecordsPage from './pages/RecordsPage'
import SettingsPage from './pages/SettingsPage'
import UploadChecklistTypePage from './pages/UploadChecklistTypePage'

function App() {
  return (
    <SessionProvider>
      <TemplatesProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="checklists/new" element={<NewChecklistTypePage />} />
              <Route path="checklists/new/upload" element={<UploadChecklistTypePage />} />
              <Route path="checklists/new/:type" element={<NewChecklistWizardPage />} />
              <Route path="records" element={<RecordsPage />} />
              <Route path="records/:id" element={<RecordDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TemplatesProvider>
    </SessionProvider>
  )
}

export default App
