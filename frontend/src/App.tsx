import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext.tsx'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OperatorDashboard from './pages/OperatorDashboard'
import ClientDashboard from './pages/ClientDashboard.tsx'
import IncidentDetails from './pages/IncidentDetails.tsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/operator"
                element={
                  <ProtectedRoute requiredRole="operator">
                    <OperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incident/:id"
                element={
                  <ProtectedRoute>
                    <IncidentDetails />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
