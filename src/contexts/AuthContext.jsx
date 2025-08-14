// =====================================================
// 📚 CHAPTER 5: STATE MANAGEMENT WITH REACT CONTEXT
// =====================================================
// 🎓 Learning Objective: Master global state management in React applications
// 
// 🧠 The Memory Challenge:
// Imagine your React app is like a large office building:
// - Each component is a different office/room
// - Some information needs to be shared across all offices (like "who's the CEO?")
// - Without a central system, each office would need to ask every other office
// - React Context is like the building's PA system - one announcement reaches everyone
// 
// This file creates a "global memory" for authentication state that any component
// can access without prop drilling!

// =====================================================
// 🏗️ SECTION 1: UNDERSTANDING REACT CONTEXT
// =====================================================
// 🎯 Learning Goal: Understand what React Context is and when to use it
// 
// 🔍 What is React Context?
// Think of React Context like a radio station:
// - The Context Provider is the radio tower (broadcasts information)
// - Components are radios (can tune in to receive information)
// - The "frequency" is the context value (the data being shared)
// - Any radio in range can listen to the same station
// 
// 💡 When to Use Context:
// ✅ Authentication state (who's logged in?)
// ✅ Theme preferences (dark/light mode)
// ✅ Language settings (English/Hausa/Yoruba)
// ✅ Shopping cart contents
// ❌ Component-specific state (form inputs)
// ❌ Frequently changing data (search results)
// 
// 🚨 Context Anti-patterns:
// - Don't use for every piece of state
// - Don't put rapidly changing data in context
// - Don't create too many contexts (causes provider hell)

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase, getCurrentUser, signOutUser } from '../lib/supabase'

// =====================================================
// 🎭 SECTION 2: DEFINING STATE SHAPE
// =====================================================
// 🎯 Learning Goal: Learn how to design state structure
// 
// 🏗️ State Architecture: The Blueprint
// Think of state like designing a filing cabinet:
// - What information do we need to store?
// - How should it be organized?
// - What operations will we perform on it?

// Define the initial state structure
// 📋 This is like creating empty folders in our filing cabinet
const initialState = {
  // 👤 User Authentication Data
  user: null,           // Supabase auth user object
  profile: null,        // Our custom user profile data
  
  // 🔄 Loading States
  isLoading: true,      // Are we checking authentication status?
  isSigningIn: false,   // Is a login attempt in progress?
  isSigningUp: false,   // Is a registration attempt in progress?
  isSigningOut: false,  // Is a logout attempt in progress?
  
  // 📊 Authentication Status
  isAuthenticated: false,  // Is user logged in?
  isVerified: false,       // Is user's email verified?
  
  // 🚨 Error Handling
  error: null,          // Current error message
  
  // 🎯 User Permissions
  permissions: {
    canVote: false,     // Can user participate in elections?
    canAdmin: false,    // Can user manage elections?
    canSuper: false     // Can user manage the entire system?
  }
}

// 🏃‍♂️ TRY THIS: Think about what other state might be useful:
// - Last login time?
// - Failed login attempts?
// - User preferences?
// - Notification settings?

// =====================================================
// 🔄 SECTION 3: STATE MANAGEMENT WITH REDUCER
// =====================================================
// 🎯 Learning Goal: Understand the reducer pattern for state management
// 
// 🎮 Reducer Pattern: The Game Controller
// Think of a reducer like a video game controller:
// - Actions are button presses (what you want to do)
// - The reducer is the game logic (how the game responds)
// - State is the current game state (player position, score, etc.)
// - The new state is the updated game state after your action

// Define action types (what can happen to our state)
// 🏷️ These are like labels on our filing cabinet operations
const ActionTypes = {
  // Authentication Flow Actions
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Authentication Process Actions
  SIGN_IN_START: 'SIGN_IN_START',
  SIGN_IN_SUCCESS: 'SIGN_IN_SUCCESS',
  SIGN_IN_ERROR: 'SIGN_IN_ERROR',
  
  SIGN_UP_START: 'SIGN_UP_START',
  SIGN_UP_SUCCESS: 'SIGN_UP_SUCCESS',
  SIGN_UP_ERROR: 'SIGN_UP_ERROR',
  
  SIGN_OUT_START: 'SIGN_OUT_START',
  SIGN_OUT_SUCCESS: 'SIGN_OUT_SUCCESS',
  SIGN_OUT_ERROR: 'SIGN_OUT_ERROR',
  
  // Profile Management
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  
  // Permission Updates
  UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS'
}

// Helper function to calculate user permissions
// 🔐 This is like checking someone's ID card to see what they're allowed to do
const calculatePermissions = (profile) => {
  if (!profile) {
    return {
      canVote: false,
      canAdmin: false,
      canSuper: false
    }
  }
  
  return {
    canVote: profile.is_verified && profile.role === 'voter',
    canAdmin: profile.is_verified && ['admin', 'super_admin'].includes(profile.role),
    canSuper: profile.is_verified && profile.role === 'super_admin'
  }
}

// The reducer function - handles all state changes
// 🎯 This is the "brain" of our state management
const authReducer = (state, action) => {
  // 📝 The reducer receives the current state and an action
  // It returns a new state based on the action type
  
  switch (action.type) {
    // 🔄 Loading State Management
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }
    
    // 👤 User Data Management
    case ActionTypes.SET_USER:
      const { user, profile } = action.payload
      const permissions = calculatePermissions(profile)
      
      return {
        ...state,
        user,
        profile,
        permissions,
        isAuthenticated: !!user,
        isVerified: profile?.is_verified || false,
        isLoading: false,
        error: null
      }
    
    // 🚨 Error Management
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isSigningIn: false,
        isSigningUp: false,
        isSigningOut: false
      }
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    // 🔑 Sign In Flow
    case ActionTypes.SIGN_IN_START:
      return {
        ...state,
        isSigningIn: true,
        error: null
      }
    
    case ActionTypes.SIGN_IN_SUCCESS:
      const signInPermissions = calculatePermissions(action.payload.profile)
      
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        permissions: signInPermissions,
        isAuthenticated: true,
        isVerified: action.payload.profile?.is_verified || false,
        isSigningIn: false,
        error: null
      }
    
    case ActionTypes.SIGN_IN_ERROR:
      return {
        ...state,
        isSigningIn: false,
        error: action.payload
      }
    
    // 📝 Sign Up Flow
    case ActionTypes.SIGN_UP_START:
      return {
        ...state,
        isSigningUp: true,
        error: null
      }
    
    case ActionTypes.SIGN_UP_SUCCESS:
      return {
        ...state,
        isSigningUp: false,
        error: null
        // Note: We don't set user data here because email verification is required
      }
    
    case ActionTypes.SIGN_UP_ERROR:
      return {
        ...state,
        isSigningUp: false,
        error: action.payload
      }
    
    // 🚪 Sign Out Flow
    case ActionTypes.SIGN_OUT_START:
      return {
        ...state,
        isSigningOut: true,
        error: null
      }
    
    case ActionTypes.SIGN_OUT_SUCCESS:
      return {
        ...initialState,
        isLoading: false
      }
    
    case ActionTypes.SIGN_OUT_ERROR:
      return {
        ...state,
        isSigningOut: false,
        error: action.payload
      }
    
    // 📋 Profile Updates
    case ActionTypes.UPDATE_PROFILE:
      const updatedPermissions = calculatePermissions(action.payload)
      
      return {
        ...state,
        profile: action.payload,
        permissions: updatedPermissions,
        isVerified: action.payload?.is_verified || false
      }
    
    // 🔐 Permission Updates
    case ActionTypes.UPDATE_PERMISSIONS:
      return {
        ...state,
        permissions: {
          ...state.permissions,
          ...action.payload
        }
      }
    
    // 🚨 Unknown Action Handler
    default:
      console.warn(`Unknown action type: ${action.type}`)
      return state
  }
}

// 🏃‍♂️ TRY THIS: Add a console.log in the reducer to see all actions:
// console.log('Action dispatched:', action.type, action.payload)

// =====================================================
// 🌍 SECTION 4: CREATING THE CONTEXT
// =====================================================
// 🎯 Learning Goal: Learn how to create and structure React Context
// 
// 📡 Context Creation: Setting Up the Radio Station
// Think of creating context like setting up a radio station:
// - We need to define what frequency we'll broadcast on
// - We need to decide what information we'll share
// - We need to make sure everyone can tune in

// Create the authentication context
// 🎯 This is like creating the radio frequency that components can tune into
const AuthContext = createContext()

// Create a custom hook to use the auth context
// 🔧 This is like creating a "smart radio" that automatically tunes to our station
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  // 🚨 Error handling: Make sure the hook is used within the provider
  if (!context) {
    throw new Error(`
      🚨 useAuth must be used within an AuthProvider!
      
      Make sure your component is wrapped with <AuthProvider>:
      
      ❌ Wrong:
      function App() {
        const { user } = useAuth() // This will fail!
        return <div>...</div>
      }
      
      ✅ Correct:
      function App() {
        return (
          <AuthProvider>
            <MyComponent />
          </AuthProvider>
        )
      }
      
      function MyComponent() {
        const { user } = useAuth() // This works!
        return <div>...</div>
      }
    `)
  }
  
  return context
}

// =====================================================
// 🏗️ SECTION 5: THE CONTEXT PROVIDER COMPONENT
// =====================================================
// 🎯 Learning Goal: Build a provider component that manages state and side effects
// 
// 📻 The Provider: The Radio Tower
// Think of the provider like a radio tower:
// - It broadcasts information to all listeners
// - It manages the content being broadcast
// - It handles technical details (signal strength, frequency management)

export const AuthProvider = ({ children }) => {
  // 🔄 Initialize state with useReducer
  // This gives us state and a dispatch function to update it
  const [state, dispatch] = useReducer(authReducer, initialState)
  
  // =====================================================
  // 🔧 SECTION 5A: AUTHENTICATION ACTIONS
  // =====================================================
  // 🎯 Learning Goal: Create action functions that components can call
  
  /**
   * 🔑 SIGN IN ACTION
   * 
   * 🎯 Purpose: Handle user login
   */
  const signIn = async (email, password, rememberMe = false) => {
    try {
      // 📝 Step 1: Start the sign-in process
      dispatch({ type: ActionTypes.SIGN_IN_START })
      
      // 📝 Step 2: Import and call the sign-in function
      const { signInUser } = await import('../lib/supabase')
      const result = await signInUser(email, password, rememberMe)
      
      // 📝 Step 3: Handle the result
      if (result.success) {
        dispatch({
          type: ActionTypes.SIGN_IN_SUCCESS,
          payload: {
            user: result.user,
            profile: result.profile
          }
        })
        return result
      } else {
        dispatch({
          type: ActionTypes.SIGN_IN_ERROR,
          payload: result.message
        })
        return result
      }
      
    } catch (error) {
      console.error('Sign in error:', error)
      dispatch({
        type: ActionTypes.SIGN_IN_ERROR,
        payload: 'An unexpected error occurred during sign in'
      })
      return {
        success: false,
        message: 'An unexpected error occurred during sign in'
      }
    }
  }
  
  /**
   * 📝 SIGN UP ACTION
   * 
   * 🎯 Purpose: Handle user registration
   */
  const signUp = async (userData) => {
    try {
      // 📝 Step 1: Start the sign-up process
      dispatch({ type: ActionTypes.SIGN_UP_START })
      
      // 📝 Step 2: Import and call the sign-up function
      const { signUpUser } = await import('../lib/supabase')
      const result = await signUpUser(userData)
      
      // 📝 Step 3: Handle the result
      if (result.success) {
        dispatch({ type: ActionTypes.SIGN_UP_SUCCESS })
        return result
      } else {
        dispatch({
          type: ActionTypes.SIGN_UP_ERROR,
          payload: result.message
        })
        return result
      }
      
    } catch (error) {
      console.error('Sign up error:', error)
      dispatch({
        type: ActionTypes.SIGN_UP_ERROR,
        payload: 'An unexpected error occurred during registration'
      })
      return {
        success: false,
        message: 'An unexpected error occurred during registration'
      }
    }
  }
  
  /**
   * 🚪 SIGN OUT ACTION
   * 
   * 🎯 Purpose: Handle user logout
   */
  const signOut = async () => {
    try {
      // 📝 Step 1: Start the sign-out process
      dispatch({ type: ActionTypes.SIGN_OUT_START })
      
      // 📝 Step 2: Call the sign-out function
      const result = await signOutUser()
      
      // 📝 Step 3: Handle the result
      if (result.success) {
        dispatch({ type: ActionTypes.SIGN_OUT_SUCCESS })
        return result
      } else {
        dispatch({
          type: ActionTypes.SIGN_OUT_ERROR,
          payload: result.message
        })
        return result
      }
      
    } catch (error) {
      console.error('Sign out error:', error)
      dispatch({
        type: ActionTypes.SIGN_OUT_ERROR,
        payload: 'An unexpected error occurred during sign out'
      })
      return {
        success: false,
        message: 'An unexpected error occurred during sign out'
      }
    }
  }
  
  /**
   * 🔄 REFRESH USER DATA ACTION
   * 
   * 🎯 Purpose: Reload user data from the server
   */
  const refreshUser = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true })
      
      const { user, profile } = await getCurrentUser()
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, profile }
      })
      
      return { success: true, user, profile }
      
    } catch (error) {
      console.error('Refresh user error:', error)
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: 'Failed to refresh user data'
      })
      return { success: false, message: 'Failed to refresh user data' }
    }
  }
  
  /**
   * 🧹 CLEAR ERROR ACTION
   * 
   * 🎯 Purpose: Clear any error messages
   */
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR })
  }
  
  // =====================================================
  // 🔄 SECTION 5B: SIDE EFFECTS AND INITIALIZATION
  // =====================================================
  // 🎯 Learning Goal: Handle authentication state initialization and changes
  
  // Initialize authentication state when the provider mounts
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // 📝 Check if user is already authenticated
        const { user, profile } = await getCurrentUser()
        
        // 🔍 Only update state if component is still mounted
        if (mounted) {
          dispatch({
            type: ActionTypes.SET_USER,
            payload: { user, profile }
          })
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          dispatch({
            type: ActionTypes.SET_ERROR,
            payload: 'Failed to initialize authentication'
          })
        }
      }
    }
    
    initializeAuth()
    
    // 📝 Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          // 👤 User signed in - fetch their profile
          const { user, profile } = await getCurrentUser()
          dispatch({
            type: ActionTypes.SET_USER,
            payload: { user, profile }
          })
        } else if (event === 'SIGNED_OUT') {
          // 🚪 User signed out - clear state
          dispatch({ type: ActionTypes.SIGN_OUT_SUCCESS })
        } else if (event === 'TOKEN_REFRESHED') {
          // 🔄 Token refreshed - update user data
          const { user, profile } = await getCurrentUser()
          dispatch({
            type: ActionTypes.SET_USER,
            payload: { user, profile }
          })
        }
      }
    )
    
    // 🧹 Cleanup function
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])
  
  // =====================================================
  // 📦 SECTION 5C: CONTEXT VALUE PREPARATION
  // =====================================================
  // 🎯 Learning Goal: Structure the context value for optimal performance
  
  // Prepare the context value
  // 🎁 This is like packaging everything we want to share
  const contextValue = {
    // 📊 Current State
    ...state,
    
    // 🎬 Actions
    signIn,
    signUp,
    signOut,
    refreshUser,
    clearError,
    
    // 🔧 Utility Functions
    isAdmin: state.permissions.canAdmin,
    isSuperAdmin: state.permissions.canSuper,
    canVote: state.permissions.canVote,
    
    // 📋 Computed Values
    displayName: state.profile 
      ? `${state.profile.first_name} ${state.profile.last_name}`
      : state.user?.email || 'Guest',
    
    initials: state.profile
      ? `${state.profile.first_name?.[0] || ''}${state.profile.last_name?.[0] || ''}`
      : state.user?.email?.[0]?.toUpperCase() || 'G'
  }
  
  // 🏃‍♂️ TRY THIS: Add more computed values:
  // - fullName: Complete name with surname
  // - age: Calculated from date_of_birth
  // - memberSince: How long they've been registered
  
  // =====================================================
  // 🎨 SECTION 5D: RENDER THE PROVIDER
  // =====================================================
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// =====================================================
// 🎓 CONGRATULATIONS! YOU'VE COMPLETED CHAPTER 5!
// =====================================================
// 
// 🏆 What You've Learned:
// ✅ React Context API fundamentals
// ✅ useReducer for complex state management
// ✅ Custom hooks for clean API design
// ✅ Side effects with useEffect
// ✅ Authentication state management
// ✅ Error handling in context
// ✅ Performance considerations
// ✅ Real-world state architecture
// 
// 🏃‍♂️ TRY THIS: 
// 1. Use the context in a component: const { user, signIn } = useAuth()
// 2. Add console.logs to see state changes
// 3. Test the authentication flow
// 4. Try accessing context outside the provider (see the error!)
// 
// 🤔 THINK ABOUT:
// - How would you add theme management to this context?
// - What other global state might your app need?
// - How would you optimize for performance with many consumers?
// - How would you test this context provider?
// 
// 📚 NEXT CHAPTER: Application Structure (src/App.jsx)
// We'll learn how to build the main application component and routing!

// =====================================================
// 💡 PRO TIPS FOR CONTEXT MANAGEMENT
// =====================================================
// 
// 🎯 Best Practices:
// 1. **Keep context focused** - Don't put everything in one context
// 2. **Use custom hooks** - Provide clean APIs for components
// 3. **Handle loading states** - Show users what's happening
// 4. **Implement error boundaries** - Gracefully handle context errors
// 5. **Optimize re-renders** - Split contexts if needed
// 
// 🔧 Performance Tips:
// - Split large contexts into smaller, focused ones
// - Use useMemo for expensive computations
// - Consider using useCallback for action functions
// - Avoid putting rapidly changing data in context
// 
// 🛡️ Security Considerations:
// - Never store sensitive data in context
// - Validate user permissions before actions
// - Handle authentication errors gracefully
// - Implement proper session management
// 
// 🧪 Testing Tips:
// - Create test providers for unit tests
// - Mock the Supabase client for testing
// - Test error scenarios
// - Verify state transitions work correctly

// Export the context for advanced use cases
export { AuthContext }

// 🏃‍♂️ TRY THIS: Create additional contexts for your app:
// - ThemeContext (dark/light mode)
// - LanguageContext (English/Hausa/Yoruba)
// - ElectionContext (current election data)
// - NotificationContext (app notifications)
