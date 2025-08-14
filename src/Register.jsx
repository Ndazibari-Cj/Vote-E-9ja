// =====================================================
// REGISTER COMPONENT
// =====================================================
// This component handles user registration with comprehensive form validation
// It includes all required fields for voter registration in Nigeria

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhoneNumber,
  validateNIN,
  validateDateOfBirth,
  validateRequiredText,
  getPasswordStrengthInfo
} from './utils/validation'
import './Register.css'

const Register = () => {
  const navigate = useNavigate()
  const { signUp, loading } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    address: '',
    nin: '',
    agreeToTerms: false
  })

  // Validation and UI state
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentStep, setCurrentStep] = useState(1)

  // =====================================================
  // FORM HANDLING
  // =====================================================

  /**
   * Handle input changes and real-time validation
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const inputValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Real-time password strength checking
    if (name === 'password') {
      const validation = validatePassword(value)
      setPasswordStrength(validation.strength || 0)
    }

    // Clear general message
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  /**
   * Validate current step
   */
  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      // Personal Information
      const firstNameValidation = validateRequiredText(formData.firstName, 'First name', 2, 50)
      if (!firstNameValidation.isValid) {
        newErrors.firstName = firstNameValidation.message
      }

      const lastNameValidation = validateRequiredText(formData.lastName, 'Last name', 2, 50)
      if (!lastNameValidation.isValid) {
        newErrors.lastName = lastNameValidation.message
      }

      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message
      }

      const phoneValidation = validatePhoneNumber(formData.phoneNumber)
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber = phoneValidation.message
      }

      const dobValidation = validateDateOfBirth(formData.dateOfBirth)
      if (!dobValidation.isValid) {
        newErrors.dateOfBirth = dobValidation.message
      }

      if (!formData.gender) {
        newErrors.gender = 'Please select your gender'
      }
    }

    if (step === 2) {
      // Additional Information
      const occupationValidation = validateRequiredText(formData.occupation, 'Occupation', 2, 100)
      if (!occupationValidation.isValid) {
        newErrors.occupation = occupationValidation.message
      }

      const addressValidation = validateRequiredText(formData.address, 'Address', 10, 500)
      if (!addressValidation.isValid) {
        newErrors.address = addressValidation.message
      }

      // NIN is optional but validate if provided
      const ninValidation = validateNIN(formData.nin)
      if (!ninValidation.isValid) {
        newErrors.nin = ninValidation.message
      }
    }

    if (step === 3) {
      // Security Information
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message
      }

      const confirmPasswordValidation = validatePasswordConfirmation(
        formData.password, 
        formData.confirmPassword
      )
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.message
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle next step
   */
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    } else {
      setMessage({
        type: 'error',
        text: 'Please fix the errors below before continuing.'
      })
    }
  }

  /**
   * Handle previous step
   */
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1)
    setMessage({ type: '', text: '' })
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous messages
    setMessage({ type: '', text: '' })

    // Validate all steps
    const isStep1Valid = validateStep(1)
    const isStep2Valid = validateStep(2)
    const isStep3Valid = validateStep(3)

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setMessage({
        type: 'error',
        text: 'Please fix all errors before submitting.'
      })
      return
    }

    try {
      // Attempt to register
      const result = await signUp(formData)

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        })

        // Navigate to login after successful registration
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.message
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      })
    }
  }

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3].map(step => (
        <div 
          key={step} 
          className={`step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
        >
          <span className="step-number">{step}</span>
          <span className="step-label">
            {step === 1 && 'Personal Info'}
            {step === 2 && 'Additional Info'}
            {step === 3 && 'Security'}
          </span>
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="form-step">
      <h3>Personal Information</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={errors.firstName ? 'error' : ''}
            placeholder="Enter your first name"
            disabled={loading}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={errors.lastName ? 'error' : ''}
            placeholder="Enter your last name"
            disabled={loading}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="surname">Surname</label>
        <input
          type="text"
          id="surname"
          name="surname"
          value={formData.surname}
          onChange={handleInputChange}
          placeholder="Enter your surname (optional)"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
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
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number *</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          className={errors.phoneNumber ? 'error' : ''}
          placeholder="e.g., 08012345678"
          disabled={loading}
        />
        {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={errors.dateOfBirth ? 'error' : ''}
            disabled={loading}
          />
          {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
        </div>

        <div className="form-group">
          <label>Gender *</label>
          <div className="radio-group">
            {['male', 'female', 'other'].map(gender => (
              <label key={gender} className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="radio-custom"></span>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </label>
            ))}
          </div>
          {errors.gender && <span className="error-message">{errors.gender}</span>}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="form-step">
      <h3>Additional Information</h3>
      
      <div className="form-group">
        <label htmlFor="occupation">Occupation *</label>
        <input
          type="text"
          id="occupation"
          name="occupation"
          value={formData.occupation}
          onChange={handleInputChange}
          className={errors.occupation ? 'error' : ''}
          placeholder="Enter your occupation"
          disabled={loading}
        />
        {errors.occupation && <span className="error-message">{errors.occupation}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">Full Address *</label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className={errors.address ? 'error' : ''}
          placeholder="Enter your complete address"
          rows="4"
          disabled={loading}
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="nin">NIN (National Identification Number)</label>
        <input
          type="text"
          id="nin"
          name="nin"
          value={formData.nin}
          onChange={handleInputChange}
          className={errors.nin ? 'error' : ''}
          placeholder="Enter your 11-digit NIN (optional)"
          maxLength="11"
          disabled={loading}
        />
        {errors.nin && <span className="error-message">{errors.nin}</span>}
        <small className="field-hint">
          NIN is optional but recommended for enhanced security
        </small>
      </div>
    </div>
  )

  const renderStep3 = () => {
    const strengthInfo = getPasswordStrengthInfo(passwordStrength)
    
    return (
      <div className="form-step">
        <h3>Security Information</h3>
        
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
              placeholder="Create a strong password"
              autoComplete="new-password"
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
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: strengthInfo.color
                  }}
                ></div>
              </div>
              <span style={{ color: strengthInfo.color }}>
                {strengthInfo.text}
              </span>
            </div>
          )}
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              disabled={loading}
            />
            <span className="checkmark"></span>
            I agree to the{' '}
            <Link to="/terms" target="_blank">Terms and Conditions</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank">Privacy Policy</Link> *
          </label>
          {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER COMPONENT
  // =====================================================

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <h1>Create Your Account</h1>
          <p>Join Vote-E-9ja for secure and transparent voting</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✓' : '⚠'}
            </span>
            {message.text}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn-secondary"
                disabled={loading}
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary"
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
