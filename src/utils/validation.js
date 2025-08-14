// =====================================================
// 📚 CHAPTER 3: INPUT VALIDATION & BUSINESS RULES
// =====================================================
// 🎓 Learning Objective: Master input validation and Nigerian-specific business logic
// 
// 🛡️ The Validation Challenge:
// Imagine you're working at INEC's voter registration center. You need to ensure:
// - Only valid Nigerian phone numbers are accepted
// - NIN numbers follow the correct 11-digit format
// - Email addresses are properly formatted
// - Passwords are strong enough to protect voter accounts
// - Only adults (18+) can register to vote
// 
// This file is your digital "quality control department" - it checks every piece
// of data before it enters our system!

// =====================================================
// 🏗️ SECTION 1: UNDERSTANDING VALIDATION
// =====================================================
// 🎯 Learning Goal: Understand why validation is crucial
// 
// 🔍 Real-World Analogy:
// Think of validation like a security checkpoint at the airport:
// - Every passenger (data) must pass through security (validation)
// - Invalid items (bad data) are rejected before boarding (entering database)
// - Multiple checks ensure safety (multiple validation rules)
// - Clear feedback helps passengers fix issues (user-friendly error messages)
// 
// 💡 Why Validation Matters:
// 1. **Security**: Prevents malicious data injection
// 2. **Data Quality**: Ensures consistent, clean data
// 3. **User Experience**: Provides helpful feedback
// 4. **Business Rules**: Enforces Nigerian electoral requirements
// 5. **System Stability**: Prevents crashes from unexpected data

// =====================================================
// 📱 SECTION 2: NIGERIAN PHONE NUMBER VALIDATION
// =====================================================
// 🎯 Learning Goal: Validate Nigerian mobile phone numbers
// 
// 🇳🇬 Nigerian Phone Number Facts:
// - Format: Country code (234) + Network code (80x, 81x, 70x, etc.) + 7 digits
// - Common formats: 08012345678, +2348012345678, 2348012345678
// - Major networks: MTN (803, 806, 813, 816, etc.), Airtel (802, 808, 812, etc.)
// - Glo (805, 807, 815, etc.), 9mobile (809, 817, 818, etc.)

/**
 * 📱 NIGERIAN PHONE NUMBER VALIDATOR
 * 
 * 🎯 Purpose: Validate Nigerian mobile phone numbers
 * 
 * 🔍 What it checks:
 * - Correct length (11 digits for local format)
 * - Valid network prefixes (080, 081, 070, etc.)
 * - Proper format (removes spaces, dashes, country codes)
 * 
 * 🏃‍♂️ TRY THIS: Test with these numbers:
 * - Valid: "08012345678", "+2348012345678", "2348012345678"
 * - Invalid: "12345678", "08112345678" (wrong prefix), "080123456789" (too long)
 */
export const validatePhoneNumber = (phone) => {
  // 📝 Step 1: Handle empty input
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      message: 'Phone number is required'
    }
  }

  // 📝 Step 2: Clean the phone number (remove spaces, dashes, parentheses)
  // 🔧 Real-world users type numbers in many formats: "080 1234 5678", "080-123-4567"
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // 📝 Step 3: Handle international format (+234 or 234 prefix)
  let localPhone = cleanPhone
  if (cleanPhone.startsWith('+234')) {
    localPhone = '0' + cleanPhone.substring(4) // +2348012345678 → 08012345678
  } else if (cleanPhone.startsWith('234') && cleanPhone.length === 13) {
    localPhone = '0' + cleanPhone.substring(3) // 2348012345678 → 08012345678
  }

  // 📝 Step 4: Validate length (must be exactly 11 digits)
  if (localPhone.length !== 11) {
    return {
      isValid: false,
      message: 'Phone number must be 11 digits (e.g., 08012345678)'
    }
  }

  // 📝 Step 5: Check if it starts with 0 (Nigerian local format)
  if (!localPhone.startsWith('0')) {
    return {
      isValid: false,
      message: 'Phone number must start with 0 (e.g., 08012345678)'
    }
  }

  // 📝 Step 6: Validate Nigerian network prefixes
  // 🇳🇬 These are the official prefixes assigned by NCC (Nigerian Communications Commission)
  const validPrefixes = [
    // MTN Nigeria
    '0803', '0806', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916',
    // Airtel Nigeria  
    '0802', '0808', '0812', '0701', '0708', '0902', '0907', '0901', '0904', '0912',
    // Glo Mobile
    '0805', '0807', '0815', '0811', '0905', '0915',
    // 9mobile (formerly Etisalat)
    '0809', '0817', '0818', '0908', '0909',
    // Other networks
    '0704', '0706', '0702' // Visafone, Multilinks, etc.
  ]

  const prefix = localPhone.substring(0, 4) // Get first 4 digits (e.g., "0801")
  
  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      message: `Invalid network prefix. Phone number must start with a valid Nigerian network code (e.g., 080, 081, 070)`
    }
  }

  // 📝 Step 7: Ensure remaining digits are numeric
  const remainingDigits = localPhone.substring(4)
  if (!/^\d{7}$/.test(remainingDigits)) {
    return {
      isValid: false,
      message: 'Phone number must contain only digits'
    }
  }

  // ✅ Success! Return the cleaned, validated phone number
  return {
    isValid: true,
    cleanedValue: localPhone,
    message: 'Valid Nigerian phone number'
  }
}

// 🏃‍♂️ TRY THIS: Test the phone validator
// console.log(validatePhoneNumber("08012345678")) // Should be valid
// console.log(validatePhoneNumber("+2348012345678")) // Should be valid
// console.log(validatePhoneNumber("12345678")) // Should be invalid

// =====================================================
// 🆔 SECTION 3: NIGERIAN NIN VALIDATION
// =====================================================
// 🎯 Learning Goal: Validate National Identification Numbers
// 
// 🇳🇬 NIN (National Identification Number) Facts:
// - Format: 11 digits (e.g., 12345678901)
// - Issued by NIMC (National Identity Management Commission)
// - Unique identifier for every Nigerian citizen and legal resident
// - Required for many government services

/**
 * 🆔 NIGERIAN NIN VALIDATOR
 * 
 * 🎯 Purpose: Validate National Identification Numbers
 * 
 * 🔍 What it checks:
 * - Exactly 11 digits
 * - Contains only numeric characters
 * - Not all the same digit (e.g., 11111111111)
 * 
 * 💡 Note: We can't verify if a NIN actually exists (that requires NIMC API)
 * but we can check if it follows the correct format
 */
export const validateNIN = (nin) => {
  // 📝 Step 1: Handle empty input (NIN is optional in our system)
  if (!nin || nin.trim() === '') {
    return {
      isValid: true, // NIN is optional
      message: 'NIN is optional but recommended for enhanced security'
    }
  }

  // 📝 Step 2: Clean the NIN (remove spaces and dashes)
  const cleanNIN = nin.replace(/[\s\-]/g, '')

  // 📝 Step 3: Check length (must be exactly 11 digits)
  if (cleanNIN.length !== 11) {
    return {
      isValid: false,
      message: 'NIN must be exactly 11 digits'
    }
  }

  // 📝 Step 4: Check if all characters are digits
  if (!/^\d{11}$/.test(cleanNIN)) {
    return {
      isValid: false,
      message: 'NIN must contain only digits'
    }
  }

  // 📝 Step 5: Check for obviously invalid patterns
  // Reject if all digits are the same (e.g., 11111111111)
  if (/^(\d)\1{10}$/.test(cleanNIN)) {
    return {
      isValid: false,
      message: 'Invalid NIN format'
    }
  }

  // ✅ Success!
  return {
    isValid: true,
    cleanedValue: cleanNIN,
    message: 'Valid NIN format'
  }
}

// =====================================================
// 📧 SECTION 4: EMAIL VALIDATION
// =====================================================
// 🎯 Learning Goal: Validate email addresses with comprehensive checks
// 
// 📧 Email Validation Challenges:
// - Many possible formats (user@domain.com, user+tag@domain.co.uk)
// - International domains and characters
// - Common typos (gmail.co instead of gmail.com)

/**
 * 📧 EMAIL VALIDATOR
 * 
 * 🎯 Purpose: Validate email addresses comprehensively
 * 
 * 🔍 What it checks:
 * - Basic format (user@domain.extension)
 * - Valid characters in local part (before @)
 * - Valid domain format
 * - Common typos in popular domains
 * - Length restrictions
 */
export const validateEmail = (email) => {
  // 📝 Step 1: Handle empty input
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Email address is required'
    }
  }

  // 📝 Step 2: Basic cleanup (trim whitespace)
  const cleanEmail = email.trim().toLowerCase()

  // 📝 Step 3: Check length (email addresses can't be too long)
  if (cleanEmail.length > 254) { // RFC 5321 limit
    return {
      isValid: false,
      message: 'Email address is too long'
    }
  }

  // 📝 Step 4: Basic format check using regex
  // 🔍 This regex checks for: localpart@domain.extension
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g., user@example.com)'
    }
  }

  // 📝 Step 5: Split email into local and domain parts
  const [localPart, domain] = cleanEmail.split('@')

  // 📝 Step 6: Validate local part (before @)
  if (localPart.length > 64) { // RFC 5321 limit
    return {
      isValid: false,
      message: 'Email address local part is too long'
    }
  }

  // Check for consecutive dots in local part
  if (localPart.includes('..')) {
    return {
      isValid: false,
      message: 'Email address cannot contain consecutive dots'
    }
  }

  // 📝 Step 7: Check for common domain typos
  // 🔧 Help users catch common mistakes
  const commonDomainTypos = {
    'gmail.co': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.cm': 'yahoo.com',
    'hotmail.co': 'hotmail.com',
    'outlook.co': 'outlook.com'
  }

  if (commonDomainTypos[domain]) {
    return {
      isValid: false,
      message: `Did you mean ${localPart}@${commonDomainTypos[domain]}?`,
      suggestion: `${localPart}@${commonDomainTypos[domain]}`
    }
  }

  // ✅ Success!
  return {
    isValid: true,
    cleanedValue: cleanEmail,
    message: 'Valid email address'
  }
}

// =====================================================
// 🔐 SECTION 5: PASSWORD VALIDATION
// =====================================================
// 🎯 Learning Goal: Implement strong password requirements
// 
// 🔐 Password Security Principles:
// - Length matters more than complexity
// - Mix of character types increases entropy
// - Avoid common passwords and patterns
// - Provide clear feedback to users

/**
 * 🔐 PASSWORD STRENGTH CALCULATOR
 * 
 * 🎯 Purpose: Calculate password strength on a scale of 0-5
 * 
 * 🔍 Scoring system:
 * - Length: Longer passwords get more points
 * - Character variety: Uppercase, lowercase, numbers, symbols
 * - Pattern detection: Penalize common patterns
 * - Dictionary check: Penalize common passwords
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return 0

  let score = 0
  const length = password.length

  // 📝 Length scoring (most important factor)
  if (length >= 8) score += 1
  if (length >= 12) score += 1
  if (length >= 16) score += 1

  // 📝 Character variety scoring
  if (/[a-z]/.test(password)) score += 0.5 // lowercase
  if (/[A-Z]/.test(password)) score += 0.5 // uppercase
  if (/[0-9]/.test(password)) score += 0.5 // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5 // symbols

  // 📝 Pattern penalties
  // Penalize repeated characters (e.g., "aaa", "111")
  if (/(.)\1{2,}/.test(password)) score -= 0.5

  // Penalize sequential characters (e.g., "abc", "123")
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 0.5
  }

  // 📝 Common password penalties
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'nigeria', 'lagos', 'abuja', 'naija'
  ]

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 1
  }

  // Ensure score is between 0 and 5
  return Math.max(0, Math.min(5, score))
}

/**
 * 🔐 PASSWORD VALIDATOR
 * 
 * 🎯 Purpose: Validate password strength and provide feedback
 */
export const validatePassword = (password) => {
  // 📝 Step 1: Handle empty input
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required',
      strength: 0
    }
  }

  // 📝 Step 2: Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      strength: 0
    }
  }

  // 📝 Step 3: Check maximum length (prevent DoS attacks)
  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password is too long (maximum 128 characters)',
      strength: 0
    }
  }

  // 📝 Step 4: Calculate strength
  const strength = calculatePasswordStrength(password)

  // 📝 Step 5: Determine if password is acceptable
  if (strength < 2) {
    return {
      isValid: false,
      message: 'Password is too weak. Please include uppercase, lowercase, numbers, and symbols.',
      strength: strength
    }
  }

  // ✅ Success!
  return {
    isValid: true,
    message: 'Password meets security requirements',
    strength: strength
  }
}

/**
 * 🔐 PASSWORD CONFIRMATION VALIDATOR
 * 
 * 🎯 Purpose: Ensure password and confirmation match
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return {
      isValid: false,
      message: 'Please confirm your password'
    }
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match'
    }
  }

  return {
    isValid: true,
    message: 'Passwords match'
  }
}

/**
 * 🎨 PASSWORD STRENGTH DISPLAY HELPER
 * 
 * 🎯 Purpose: Get user-friendly strength information for UI
 */
export const getPasswordStrengthInfo = (strength) => {
  const strengthLevels = [
    { text: 'Very Weak', color: '#ff4757' },
    { text: 'Weak', color: '#ff6b7a' },
    { text: 'Fair', color: '#ffa502' },
    { text: 'Good', color: '#3742fa' },
    { text: 'Strong', color: '#2ed573' },
    { text: 'Very Strong', color: '#1e90ff' }
  ]

  const level = Math.floor(strength)
  return strengthLevels[level] || strengthLevels[0]
}

// =====================================================
// 📅 SECTION 6: DATE OF BIRTH VALIDATION
// =====================================================
// 🎯 Learning Goal: Validate dates and check voting age eligibility
// 
// 🗳️ Nigerian Voting Requirements:
// - Must be 18 years or older on election day
// - Date must be realistic (not in future, not too far in past)

/**
 * 📅 DATE OF BIRTH VALIDATOR
 * 
 * 🎯 Purpose: Validate date of birth and check voting eligibility
 */
export const validateDateOfBirth = (dateOfBirth) => {
  // 📝 Step 1: Handle empty input
  if (!dateOfBirth) {
    return {
      isValid: false,
      message: 'Date of birth is required'
    }
  }

  // 📝 Step 2: Parse the date
  const birthDate = new Date(dateOfBirth)
  const today = new Date()

  // 📝 Step 3: Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      message: 'Please enter a valid date'
    }
  }

  // 📝 Step 4: Check if date is in the future
  if (birthDate > today) {
    return {
      isValid: false,
      message: 'Date of birth cannot be in the future'
    }
  }

  // 📝 Step 5: Check if date is too far in the past (reasonable limit)
  const maxAge = 120
  const minBirthDate = new Date()
  minBirthDate.setFullYear(today.getFullYear() - maxAge)

  if (birthDate < minBirthDate) {
    return {
      isValid: false,
      message: 'Please enter a valid date of birth'
    }
  }

  // 📝 Step 6: Calculate age
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  // Adjust age if birthday hasn't occurred this year
  const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age

  // 📝 Step 7: Check voting age requirement (18+)
  if (actualAge < 18) {
    return {
      isValid: false,
      message: 'You must be at least 18 years old to register to vote'
    }
  }

  // ✅ Success!
  return {
    isValid: true,
    message: `Valid date of birth (Age: ${actualAge})`,
    age: actualAge
  }
}

// =====================================================
// 📝 SECTION 7: TEXT FIELD VALIDATION
// =====================================================
// 🎯 Learning Goal: Validate text inputs with length and content checks

/**
 * 📝 REQUIRED TEXT VALIDATOR
 * 
 * 🎯 Purpose: Validate required text fields with customizable rules
 */
export const validateRequiredText = (value, fieldName, minLength = 2, maxLength = 100) => {
  // 📝 Step 1: Handle empty input
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return {
      isValid: false,
      message: `${fieldName} is required`
    }
  }

  const trimmedValue = value.trim()

  // 📝 Step 2: Check minimum length
  if (trimmedValue.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters long`
    }
  }

  // 📝 Step 3: Check maximum length
  if (trimmedValue.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must be no more than ${maxLength} characters long`
    }
  }

  // 📝 Step 4: Check for valid characters (letters, spaces, common punctuation)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedValue)) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    }
  }

  // ✅ Success!
  return {
    isValid: true,
    cleanedValue: trimmedValue,
    message: `Valid ${fieldName.toLowerCase()}`
  }
}

// =====================================================
// 🧪 SECTION 8: TESTING AND EXAMPLES
// =====================================================
// 🎯 Learning Goal: Learn how to test validation functions
// 
// 🏃‍♂️ TRY THIS: Uncomment and run these tests in your browser console

/*
// Test phone number validation
console.log('=== PHONE NUMBER TESTS ===')
console.log(validatePhoneNumber('08012345678')) // Should be valid
console.log(validatePhoneNumber('+2348012345678')) // Should be valid
console.log(validatePhoneNumber('12345678')) // Should be invalid
console.log(validatePhoneNumber('08112345678')) // Should be invalid (wrong prefix)

// Test email validation
console.log('=== EMAIL TESTS ===')
console.log(validateEmail('user@example.com')) // Should be valid
console.log(validateEmail('user@gmail.co')) // Should suggest gmail.com
console.log(validateEmail('invalid-email')) // Should be invalid

// Test password validation
console.log('=== PASSWORD TESTS ===')
console.log(validatePassword('password123')) // Should be weak
console.log(validatePassword('MyStr0ng!P@ssw0rd')) // Should be strong
console.log(validatePassword('123')) // Should be invalid (too short)

// Test date of birth validation
console.log('=== DATE OF BIRTH TESTS ===')
console.log(validateDateOfBirth('1990-01-01')) // Should be valid
console.log(validateDateOfBirth('2010-01-01')) // Should be invalid (too young)
console.log(validateDateOfBirth('2025-01-01')) // Should be invalid (future date)
*/

// =====================================================
// 🎓 CONGRATULATIONS! YOU'VE COMPLETED CHAPTER 3!
// =====================================================
// 
// 🏆 What You've Learned:
// ✅ Input validation principles and best practices
// ✅ Nigerian-specific business rules (phone, NIN)
// ✅ Email validation with typo detection
// ✅ Password strength calculation and validation
// ✅ Date validation and age verification
// ✅ Text field validation with customizable rules
// ✅ User-friendly error messaging
// ✅ Security considerations in validation
// 
// 🏃‍♂️ TRY THIS: 
// 1. Create validation functions for other Nigerian data (e.g., BVN, voter card number)
// 2. Add validation for address fields (state, LGA)
// 3. Implement real-time validation feedback in forms
// 4. Create unit tests for all validation functions
// 
// 🤔 THINK ABOUT:
// - How would you handle validation for different languages?
// - What other Nigerian-specific validations might be needed?
// - How would you validate data that requires external API calls?
// - How would you handle validation errors gracefully in the UI?
// 
// 📚 NEXT CHAPTER: Database Integration (src/lib/supabase.js)
// We'll learn how to connect our frontend to the Supabase backend!

// =====================================================
// 💡 PRO TIPS FOR VALIDATION
// =====================================================
// 
// 🎯 Best Practices:
// 1. **Validate Early**: Check data as soon as user types
// 2. **Be Helpful**: Provide clear, actionable error messages
// 3. **Be Forgiving**: Accept multiple formats when possible
// 4. **Be Secure**: Never trust client-side validation alone
// 5. **Be Consistent**: Use the same validation rules everywhere
// 
// 🔧 Performance Tips:
// - Debounce validation for real-time feedback
// - Cache validation results when appropriate
// - Use efficient regex patterns
// - Validate incrementally (don't re-validate unchanged fields)
// 
// 🛡️ Security Reminders:
// - Always validate on the server side too
// - Sanitize data before storing in database
// - Use parameterized queries to prevent SQL injection
// - Log validation failures for security monitoring
// 
// 🌍 Internationalization:
// - Consider different date formats
// - Support multiple languages for error messages
// - Handle different character sets and scripts
// - Respect cultural differences in naming conventions

// =====================================================
// 📖 VALIDATION PATTERNS REFERENCE
// =====================================================
// 
// 🔍 Common Regex Patterns:
// - Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// - Phone: /^\+?[\d\s\-\(\)]+$/
// - Numbers only: /^\d+$/
// - Letters only: /^[a-zA-Z]+$/
// - Alphanumeric: /^[a-zA-Z0-9]+$/
// 
// 📱 Nigerian Specific:
// - NIN: /^\d{11}$/
// - Phone: /^0[789][01]\d{8}$/
// - Postal Code: /^\d{6}$/
// 
// 🔐 Password Patterns:
// - Has uppercase: /[A-Z]/
// - Has lowercase: /[a-z]/
// - Has number: /\d/
// - Has symbol: /[^a-zA-Z0-9]/
// - No spaces: /^\S+$/

export default {
  validatePhoneNumber,
  validateNIN,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateDateOfBirth,
  validateRequiredText,
  calculatePasswordStrength,
  getPasswordStrengthInfo
}
