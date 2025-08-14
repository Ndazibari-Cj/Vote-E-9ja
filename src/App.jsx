// =====================================================
// MAIN APPLICATION COMPONENT
// =====================================================
// This is the root component that sets up authentication context,
// routing, and global application state

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from './Home'
import Login from './Login'
import Register from './Register'
import './App.css'

// Loading component for authentication initialization
const AuthLoadingScreen = () => {
  return (
    <div className="auth-loading-screen">
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h2>Vote-E-9ja</h2>
        <p>Initializing secure voting platform...</p>
      </div>
    </div>
  )
}

// Main app content that has access to auth context
const AppContent = () => {
  const { initializing, isAuthenticated, userRole } = useAuth()

  // Show loading screen while initializing authentication
  if (initializing) {
    return <AuthLoadingScreen />
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={getDashboardRoute(userRole)} replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                <Navigate to={getDashboardRoute(userRole)} replace />
              ) : (
                <Register />
              )
            } 
          />

          {/* Protected Routes - We'll add these in the next steps */}
          <Route path="/voter/*" element={<div>Voter Dashboard (Coming Soon)</div>} />
          <Route path="/admin/*" element={<div>Admin Dashboard (Coming Soon)</div>} />
          <Route path="/super-admin/*" element={<div>Super Admin Dashboard (Coming Soon)</div>} />

          {/* Auth Callback Route for email verification */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

// Helper function to determine dashboard route based on user role
const getDashboardRoute = (userRole) => {
  switch (userRole) {
    case 'super_admin':
      return '/super-admin'
    case 'admin':
      return '/admin'
    case 'voter':
      return '/voter'
    default:
      return '/'
  }
}

// Auth callback component for handling email verification
const AuthCallback = () => {
  const { refreshProfile } = useAuth()

  React.useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Refresh user profile to get updated verification status
        await refreshProfile()
        
        // Redirect to appropriate dashboard
        const userRole = localStorage.getItem('userRole')
        window.location.href = getDashboardRoute(userRole)
      } catch (error) {
        console.error('Auth callback error:', error)
        window.location.href = '/'
      }
    }

    handleAuthCallback()
  }, [refreshProfile])

  return (
    <div className="auth-callback">
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h2>Verifying your account...</h2>
        <p>Please wait while we complete your email verification.</p>
      </div>
    </div>
  )
}

// Main App component with AuthProvider wrapper
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
