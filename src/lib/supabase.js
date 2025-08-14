// =====================================================
// 📚 CHAPTER 4: DATABASE INTEGRATION WITH SUPABASE
// =====================================================
// 🎓 Learning Objective: Master frontend-to-backend communication
// 
// 🌉 The Bridge Challenge:
// Imagine you're building a bridge between two cities:
// - City A: Your React frontend (where users interact)
// - City B: Your Supabase backend (where data lives)
// - The Bridge: This file - it handles all communication between them
// 
// This file is your "diplomatic embassy" - it knows how to speak both languages
// (JavaScript and SQL) and handles all the paperwork (authentication, requests, responses)

// =====================================================
// 🏗️ SECTION 1: UNDERSTANDING SUPABASE
// =====================================================
// 🎯 Learning Goal: Understand what Supabase is and why we use it
// 
// 🔍 What is Supabase?
// Think of Supabase as a "Backend-as-a-Service" - like having a team of backend
// developers working for you, but they're already built the infrastructure:
// 
// 🏢 Supabase provides:
// - 🗄️ PostgreSQL Database (where we store data)
// - 🔐 Authentication System (login/logout/registration)
// - 🛡️ Row Level Security (data protection)
// - 📡 Real-time Subscriptions (live updates)
// - 📁 File Storage (for images, documents)
// - 🔧 Auto-generated APIs (no need to write backend code!)
// 
// 💡 Why Supabase for Vote-E-9ja?
// - **Security**: Built-in authentication and RLS
// - **Scalability**: Can handle millions of voters
// - **Real-time**: Live election results
// - **Compliance**: PostgreSQL is enterprise-grade
// - **Speed**: Focus on frontend, backend is ready

// Import the Supabase client library
// 📦 This is like importing a translator who speaks "Supabase language"
import { createClient } from '@supabase/supabase-js'

// =====================================================
// 🔧 SECTION 2: CONFIGURATION SETUP
// =====================================================
// 🎯 Learning Goal: Learn how to configure external services securely
// 
// 🔐 Environment Variables: The Secret Keeper
// Think of environment variables like a safe deposit box:
// - They store sensitive information (API keys, URLs)
// - Different for each environment (development, production)
// - Never committed to version control (kept in .env files)

// Get Supabase configuration from environment variables
// 🌍 These come from your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🛡️ Security Check: Ensure configuration is present
// This prevents the app from starting with missing configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    🚨 CONFIGURATION ERROR 🚨
    
    Missing Supabase configuration! Please check your .env.local file.
    
    Required variables:
    - VITE_SUPABASE_URL=your_supabase_project_url
    - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    📚 How to get these:
    1. Go to https://supabase.com
    2. Create a new project
    3. Go to Settings > API
    4. Copy the URL and anon key
    5. Add them to your .env.local file
  `)
}

// =====================================================
// 🌉 SECTION 3: CREATING THE SUPABASE CLIENT
// =====================================================
// 🎯 Learning Goal: Understand how to initialize API clients
// 
// 🔗 The Client: Your Communication Channel
// Think of the Supabase client like a phone line to your database:
// - It handles all the technical details of communication
// - It manages authentication tokens automatically
// - It provides methods for all database operations

// Create the Supabase client with configuration
// 🏗️ This is like establishing a secure phone line to your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 🔄 Auto-refresh tokens before they expire
    autoRefreshToken: true,
    
    // 💾 Persist authentication across browser sessions
    persistSession: true,
    
    // 🔍 Detect when user switches browser tabs (for security)
    detectSessionInUrl: true,
    
    // 🎯 Redirect configuration for OAuth providers
    redirectTo: `${window.location.origin}/auth/callback`
  },
  
  // 📡 Real-time configuration for live updates
  realtime: {
    // 🔧 Parameters for WebSocket connection
    params: {
      eventsPerSecond: 10 // Limit events to prevent overwhelming the client
    }
  }
})

// 🏃‍♂️ TRY THIS: Open browser console and type: window.supabase = supabase
// Then you can test: supabase.auth.getUser()

// =====================================================
// 🔐 SECTION 4: AUTHENTICATION HELPERS
// =====================================================
// 🎯 Learning Goal: Create reusable authentication functions
// 
// 🎭 Authentication: Proving Who You Are
// Think of authentication like showing your ID at a voting booth:
// - Registration: Getting your voter's card for the first time
// - Login: Showing your card to vote
// - Logout: Leaving the voting booth
// - Session: The time you're allowed to stay in the booth

/**
 * 🔐 USER REGISTRATION FUNCTION
 * 
 * 🎯 Purpose: Register a new user with email and password
 * 
 * 🔍 What happens:
 * 1. Supabase creates user in auth.users table
 * 2. Sends verification email
 * 3. User clicks link to verify
 * 4. We create profile in public.users table
 * 
 * 🏃‍♂️ TRY THIS: Think about the user journey:
 * User fills form → We validate → Supabase creates account → Email sent → User verifies → Profile created
 */
export const signUpUser = async (userData) => {
  try {
    // 📝 Step 1: Extract email and password for Supabase auth
    const { email, password, ...profileData } = userData
    
    // 📝 Step 2: Create user account with Supabase Auth
    // 🔐 This creates the user in the auth.users table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // 📧 Email confirmation required for security
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        
        // 📋 Additional metadata (optional)
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName
        }
      }
    })
    
    // 🚨 Handle authentication errors
    if (authError) {
      console.error('Authentication error:', authError)
      return {
        success: false,
        message: authError.message || 'Failed to create account'
      }
    }
    
    // 📝 Step 3: Check if user was created successfully
    if (!authData.user) {
      return {
        success: false,
        message: 'Failed to create user account'
      }
    }
    
    // 📝 Step 4: Create user profile in public.users table
    // 🔗 This extends the auth.users with our custom fields
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id, // Link to auth.users
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        surname: profileData.surname || null,
        phone_number: profileData.phoneNumber,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        address: profileData.address,
        occupation: profileData.occupation,
        nin: profileData.nin || null,
        role: 'voter', // Default role
        is_verified: false // Will be verified after email confirmation
      }])
    
    // 🚨 Handle profile creation errors
    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // 🧹 Cleanup: If profile creation fails, we should ideally delete the auth user
      // But Supabase doesn't allow this from client side for security
      return {
        success: false,
        message: 'Account created but profile setup failed. Please contact support.'
      }
    }
    
    // ✅ Success!
    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: authData.user
    }
    
  } catch (error) {
    // 🚨 Handle unexpected errors
    console.error('Unexpected error during registration:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * 🔑 USER LOGIN FUNCTION
 * 
 * 🎯 Purpose: Authenticate existing user
 * 
 * 🔍 What happens:
 * 1. Supabase checks email/password
 * 2. Returns JWT token if valid
 * 3. Token is automatically stored in browser
 * 4. All future requests include this token
 */
export const signInUser = async (email, password, rememberMe = false) => {
  try {
    // 📝 Step 1: Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    // 🚨 Handle authentication errors
    if (error) {
      console.error('Login error:', error)
      
      // 🔍 Provide user-friendly error messages
      let message = 'Login failed'
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please verify your email address before logging in'
      } else if (error.message.includes('Too many requests')) {
        message = 'Too many login attempts. Please try again later'
      }
      
      return {
        success: false,
        message: message
      }
    }
    
    // 📝 Step 2: Check if user exists
    if (!data.user) {
      return {
        success: false,
        message: 'Login failed - no user data received'
      }
    }
    
    // 📝 Step 3: Get user profile from our custom table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return {
        success: false,
        message: 'Login successful but failed to load profile'
      }
    }
    
    // 📝 Step 4: Update last login timestamp
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        login_count: (profile.login_count || 0) + 1
      })
      .eq('id', data.user.id)
    
    // ✅ Success!
    return {
      success: true,
      message: 'Login successful',
      user: data.user,
      profile: profile
    }
    
  } catch (error) {
    // 🚨 Handle unexpected errors
    console.error('Unexpected error during login:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * 🚪 USER LOGOUT FUNCTION
 * 
 * 🎯 Purpose: Sign out user and clear session
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        message: 'Failed to logout'
      }
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
    
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during logout'
    }
  }
}

/**
 * 👤 GET CURRENT USER FUNCTION
 * 
 * 🎯 Purpose: Get currently authenticated user
 */
export const getCurrentUser = async () => {
  try {
    // 📝 Get user from Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get user error:', error)
      return { user: null, profile: null }
    }
    
    if (!user) {
      return { user: null, profile: null }
    }
    
    // 📝 Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return { user, profile: null }
    }
    
    return { user, profile }
    
  } catch (error) {
    console.error('Unexpected error getting current user:', error)
    return { user: null, profile: null }
  }
}

// =====================================================
// 🗳️ SECTION 5: ELECTION DATA FUNCTIONS
// =====================================================
// 🎯 Learning Goal: Learn how to work with relational data
// 
// 🏛️ Election Data: The Heart of Our System
// Think of election data like organizing a real election:
// - Elections: The overall event (e.g., "2027 Presidential Election")
// - Positions: What we're voting for (e.g., "President", "Governor")
// - Candidates: Who we can vote for (e.g., "John Doe - APC")
// - Votes: The actual choices made by voters

/**
 * 🗳️ GET ACTIVE ELECTIONS FUNCTION
 * 
 * 🎯 Purpose: Fetch elections that users can currently vote in
 */
export const getActiveElections = async () => {
  try {
    const { data, error } = await supabase
      .from('elections')
      .select(`
        *,
        positions (
          *,
          candidates (*)
        )
      `)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching active elections:', error)
      return { success: false, data: [], message: 'Failed to load elections' }
    }
    
    return { success: true, data: data || [], message: 'Elections loaded successfully' }
    
  } catch (error) {
    console.error('Unexpected error fetching elections:', error)
    return { success: false, data: [], message: 'An unexpected error occurred' }
  }
}

/**
 * 🗳️ CAST VOTE FUNCTION
 * 
 * 🎯 Purpose: Record a user's vote securely
 * 
 * 🔐 Security Note: This function relies on RLS policies to ensure:
 * - Users can only vote once per position
 * - Users can only vote in active elections
 * - Vote integrity is maintained
 */
export const castVote = async (electionId, positionId, candidateId) => {
  try {
    // 📝 Insert vote (RLS policies will handle validation)
    const { data, error } = await supabase
      .from('votes')
      .insert([{
        election_id: electionId,
        position_id: positionId,
        candidate_id: candidateId,
        voter_id: (await getCurrentUser()).user?.id
      }])
      .select()
    
    if (error) {
      console.error('Error casting vote:', error)
      
      // 🔍 Provide specific error messages
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, message: 'You have already voted for this position' }
      }
      
      return { success: false, message: 'Failed to cast vote' }
    }
    
    return { success: true, data: data[0], message: 'Vote cast successfully' }
    
  } catch (error) {
    console.error('Unexpected error casting vote:', error)
    return { success: false, message: 'An unexpected error occurred while voting' }
  }
}

/**
 * 📊 GET USER VOTES FUNCTION
 * 
 * 🎯 Purpose: Get votes cast by current user (for verification)
 */
export const getUserVotes = async (electionId = null) => {
  try {
    let query = supabase
      .from('votes')
      .select(`
        *,
        elections (title),
        positions (title),
        candidates (full_name, party_affiliation)
      `)
      .eq('voter_id', (await getCurrentUser()).user?.id)
    
    if (electionId) {
      query = query.eq('election_id', electionId)
    }
    
    const { data, error } = await query.order('cast_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user votes:', error)
      return { success: false, data: [], message: 'Failed to load votes' }
    }
    
    return { success: true, data: data || [], message: 'Votes loaded successfully' }
    
  } catch (error) {
    console.error('Unexpected error fetching votes:', error)
    return { success: false, data: [], message: 'An unexpected error occurred' }
  }
}

// =====================================================
// 🔄 SECTION 6: REAL-TIME SUBSCRIPTIONS
// =====================================================
// 🎯 Learning Goal: Implement live updates for better user experience
// 
// 📡 Real-time Updates: Live Election Results
// Think of real-time subscriptions like watching live TV:
// - You don't need to refresh to see new content
// - Updates appear automatically as they happen
// - Multiple people can watch the same "channel" simultaneously

/**
 * 📡 SUBSCRIBE TO ELECTION RESULTS
 * 
 * 🎯 Purpose: Get live updates when votes are cast
 */
export const subscribeToElectionResults = (electionId, callback) => {
  // 🔗 Create subscription to votes table
  const subscription = supabase
    .channel(`election-${electionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'votes',
        filter: `election_id=eq.${electionId}`
      },
      (payload) => {
        console.log('New vote received:', payload)
        callback(payload)
      }
    )
    .subscribe()
  
  // 🔄 Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

// =====================================================
// 🧪 SECTION 7: TESTING AND DEBUGGING HELPERS
// =====================================================
// 🎯 Learning Goal: Learn how to debug database connections
// 
// 🔍 Debugging: Finding and Fixing Problems
// Think of debugging like being a detective:
// - Gather evidence (logs, error messages)
// - Test theories (try different approaches)
// - Solve the mystery (fix the bug)

/**
 * 🧪 TEST DATABASE CONNECTION
 * 
 * 🎯 Purpose: Verify that Supabase connection is working
 */
export const testConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...')
    
    // 📝 Test 1: Check if client is configured
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // 📝 Test 2: Try to fetch from a simple table
    const { data, error } = await supabase
      .from('elections')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error)
      return { success: false, message: error.message }
    }
    
    console.log('✅ Database connection successful')
    return { success: true, message: 'Connection successful' }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 🔍 GET CONNECTION STATUS
 * 
 * 🎯 Purpose: Get current authentication and connection status
 */
export const getConnectionStatus = async () => {
  try {
    const { user, profile } = await getCurrentUser()
    
    return {
      isConnected: !!supabase,
      isAuthenticated: !!user,
      hasProfile: !!profile,
      user: user,
      profile: profile
    }
    
  } catch (error) {
    console.error('Error getting connection status:', error)
    return {
      isConnected: false,
      isAuthenticated: false,
      hasProfile: false,
      user: null,
      profile: null
    }
  }
}

// =====================================================
// 🎓 CONGRATULATIONS! YOU'VE COMPLETED CHAPTER 4!
// =====================================================
// 
// 🏆 What You've Learned:
// ✅ Supabase client configuration and initialization
// ✅ Environment variable management
// ✅ Authentication functions (signup, login, logout)
// ✅ Database operations (select, insert, update)
// ✅ Real-time subscriptions for live updates
// ✅ Error handling and user feedback
// ✅ Security considerations in API design
// ✅ Testing and debugging database connections
// 
// 🏃‍♂️ TRY THIS: 
// 1. Open browser console and test: testConnection()
// 2. Try: getConnectionStatus()
// 3. Create a test user and verify the flow
// 4. Monitor network tab to see API calls
// 
// 🤔 THINK ABOUT:
// - How would you handle offline scenarios?
// - What caching strategies could improve performance?
// - How would you implement data synchronization?
// - What additional security measures might be needed?
// 
// 📚 NEXT CHAPTER: State Management (src/contexts/AuthContext.jsx)
// We'll learn how to manage global application state with React Context!

// =====================================================
// 💡 PRO TIPS FOR DATABASE INTEGRATION
// =====================================================
// 
// 🎯 Best Practices:
// 1. **Always handle errors gracefully**
// 2. **Provide meaningful user feedback**
// 3. **Use environment variables for configuration**
// 4. **Implement proper loading states**
// 5. **Cache data when appropriate**
// 6. **Use real-time updates sparingly**
// 
// 🔧 Performance Tips:
// - Use select() to fetch only needed columns
// - Implement pagination for large datasets
// - Use indexes on frequently queried columns
// - Cache frequently accessed data
// - Debounce real-time subscriptions
// 
// 🛡️ Security Reminders:
// - Never expose service role keys in frontend
// - Always validate data on both client and server
// - Use RLS policies for data protection
// - Implement rate limiting for sensitive operations
// - Log security-related events
// 
// 🔍 Debugging Tips:
// - Use browser network tab to inspect requests
// - Check Supabase logs in dashboard
// - Test with different user roles
// - Verify RLS policies are working
// - Use console.log strategically

// Export the configured Supabase client as default
// 🎯 This allows other files to import and use: import supabase from './lib/supabase'
export default supabase

// 🏃‍♂️ TRY THIS: Add this to your browser console to test:
// window.supabaseHelpers = { testConnection, getConnectionStatus, getCurrentUser }
