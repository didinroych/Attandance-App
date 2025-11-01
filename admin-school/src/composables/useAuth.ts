import { ref, provide, inject, type InjectionKey } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/auth.service'
import type { User, LoginCredentials, SignupData } from '@/types/auth.types'

interface AuthContext {
  user: ReturnType<typeof ref<User | null>>
  token: ReturnType<typeof ref<string | null>>
  isAuthenticated: ReturnType<typeof ref<boolean>>
  isLoading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<string | null>>
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
  clearError: () => void
}

const AuthContextKey: InjectionKey<AuthContext> = Symbol('AuthContext')

export function createAuth() {
  const router = useRouter()

  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // Initialize auth state from localStorage
  const initAuth = () => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        isAuthenticated.value = false
      }
    } else {
      isAuthenticated.value = false
    }
  }

  // Login
  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = null

      console.log('Attempting login with:', credentials)
      const response = await authService.login(credentials)
      console.log('Login successful, response:', response)

      // Store accessToken and user
      token.value = response.accessToken
      user.value = response.user
      isAuthenticated.value = true
      localStorage.setItem('access_token', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.user))

      // Role-based redirection
      if (response.user.role === 'admin') {
        router.push('/admin')
      } else if (response.user.role === 'teacher') {
        router.push('/teacher')
      } else {
        router.push('/') // Fallback to dashboard
      }
    } catch (err: any) {
      console.error('Login error:', err)
      error.value = err.message || 'Login failed'
      isAuthenticated.value = false
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Signup
  const signup = async (data: SignupData) => {
    try {
      isLoading.value = true
      error.value = null

      await authService.register(data)

      // After registration, user must login
      // Backend returns user data but no token on registration
      // Automatically log them in
      await login({ username: data.username, password: data.password })
    } catch (err: any) {
      error.value = err.message || 'Signup failed'
      isAuthenticated.value = false
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  const logout = async () => {
    console.log('🔴 [useAuth] logout() called')
    try {
      console.log('🔴 [useAuth] Calling authService.logout()')
      await authService.logout()
      console.log('🔴 [useAuth] authService.logout() completed')
    } catch (error) {
      console.error('🔴 [useAuth] Error in logout:', error)
    } finally {
      // Always clear local state and redirect, even if API call fails
      console.log('🔴 [useAuth] Clearing auth state')
      user.value = null
      token.value = null
      isAuthenticated.value = false
      console.log('🔴 [useAuth] Redirecting to /signin')
      // Use window.location for a hard redirect to ensure clean state
      window.location.href = '/signin'
    }
  }

  // Check auth status
  const checkAuth = () => {
    initAuth()
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  const authContext: AuthContext = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    checkAuth,
    clearError,
  }

  // Initialize on creation
  initAuth()

  return authContext
}

// Provide auth context
export function provideAuth() {
  const auth = createAuth()
  provide(AuthContextKey, auth)
  return auth
}

// Use auth context
export function useAuth(): AuthContext {
  const auth = inject(AuthContextKey)
  if (!auth) {
    throw new Error('useAuth must be used within an auth provider')
  }
  return auth
}
