import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthenticationStatus } from '@nhost/react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()

  if (isLoading) {
    return <div className="center-screen">Loading…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
