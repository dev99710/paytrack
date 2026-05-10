import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Transactions from './pages/Transactions'
import Insights from './pages/Insights'
import Forecast from './pages/Forecast'
import Anomalies from './pages/Anomalies'
import HealthScore from './pages/HealthScore'
import RuleEngine from './pages/RuleEngine'
import AuditLog from './pages/AuditLog'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          marginLeft: '240px',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}

function PublicRoute() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/score" element={<HealthScore />} />
          <Route path="/rules" element={<RuleEngine />} />
          <Route path="/audit" element={<AuditLog />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
