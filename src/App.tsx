import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Portfolios from './pages/Portfolios'
import Settings from './pages/Settings'
import AiAssistants from './pages/AiAssistants'
import Agents from './pages/Agents'
import Clients from './pages/Clients'
import Constructor from './pages/Constructor'
import BrainContexts from './pages/Constructor/BrainContexts'
import CJMTemplates from './pages/Constructor/CJMTemplates'
import BotSessions from './pages/Constructor/BotSessions'
import HomeOwners from './pages/Insurance/HomeOwners'
import Layout from './components/Layout'
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'
import AdminUsers from './pages/Admin/Users'

function ProtectedRoute({ children, allowNoProject = false }: { children: React.ReactNode, allowNoProject?: boolean }) {
  const { isAuthenticated, user, activeProject } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If super_admin and no project selected, redirect to project selector (unless already there)
  if (user?.role === 'super_admin' && !activeProject && !allowNoProject && location.pathname !== '/super-admin') {
    return <Navigate to="/super-admin" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="portfolios" element={<Portfolios />} />
        <Route path="insurance/home-owners" element={<HomeOwners />} />
        <Route path="ai-assistants" element={<AiAssistants />} />
        <Route path="agents" element={<Agents />} />
        <Route path="clients" element={<Clients />} />
        <Route path="constructor" element={<Constructor />}>
          <Route path="brain" element={<BrainContexts />} />
          <Route path="cjm" element={<CJMTemplates />} />
          <Route path="sessions" element={<BotSessions />} />
        </Route>
        <Route path="settings" element={<Settings />} />

        {/* Super Admin Routes */}
        <Route path="super-admin" element={<ProtectedRoute allowNoProject><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App











