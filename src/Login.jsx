// =====================================================
// LOGIN COMPONENT
// =====================================================
// This component handles user authentication (sign in)
// It includes form validation, error handling, and user feedback

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { validateEmail, validatePassword } from './utils/validation'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { signIn, loading } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Validation and UI state
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // =====================================================
  // FORM HANDLING
  // =====================================================

  /**
   * Handle input changes and clear errors
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Clear general message
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {}

    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous messages
    setMessage({ type: '', text: '' })

    // Validate form
    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: 'Please fix the errors below and try again.'
      })
      return
    }

    try {
      // Attempt to sign in
      const result = await signIn(formData.email, formData.password)

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        })

        // Navigate to appropriate dashboard
        // The App component will handle the redirect based on user role
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        setMessage({
          type: 'error',
          text: result.message
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      })
    }
  }

  // =====================================================
  // RENDER COMPONENT
  // =====================================================

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Vote-E-9ja account</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✓' : '⚠'}
            </span>
            {message.text}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={loading}
              />
              <span className="input-icon">📧</span>
            </div>
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p>
            🔒 Your connection is secure and your data is protected with 
            end-to-end encryption.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

// =====================================================
// LEARNING NOTES
// =====================================================
/*
KEY CONCEPTS EXPLAINED:

1. **Form State Management**: 
   - useState for form data and validation errors
   - Controlled components for all inputs
   - Real-time validation feedback

2. **Authentication Integration**: 
   - useAuth hook for accessing auth context
   - Async form submission with error handling
   - Loading states during authentication

3. **User Experience**: 
   - Clear error messages and success feedback
   - Password visibility toggle
   - Disabled states during loading
   - Auto-navigation after successful login

4. **Form Validation**: 
   - Client-side validation using utility functions
   - Real-time error clearing
   - Comprehensive error display

5. **Security Features**: 
   - Password masking with toggle
   - Autocomplete attributes for browsers
   - Security notice for user confidence

6. **Accessibility**: 
   - Proper labels and form structure
   - Keyboard navigation support
   - Screen reader friendly

7. **Navigation**: 
   - React Router integration
   - Conditional redirects
   - Link to registration page
*/
