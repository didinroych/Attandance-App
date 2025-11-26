import api from './api'
import type {
  LoginCredentials,
  SignupData,
  AuthResponse,
  RegisterResponse,
  LoginResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
  ApiResponse,
} from '@/types/auth.types'

class AuthService {
  /**
   * Register a new user
   * POST /auth/register
   * Returns user data (no token - requires login after)
   */
  async register(data: SignupData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/api/auth/register', data)
    return response.data
  }

  /**
   * Login user
   * POST /auth/login
   * Returns { data: { user, accessToken } }
   * refreshToken is in cookies automatically
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials) 
    return {
      user: response.data.data.user,
      accessToken: response.data.data.accessToken,
    }
  }

  /**
   * Request password reset (step 1)
   * POST /auth/request-reset-password
   */
  async requestPasswordReset(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/api/auth/request-reset-password', data)
    return response.data
  }

  /**
   * Verify OTP (step 2)
   * POST /auth/verify-otp
   * Returns resetToken needed for password reset
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await api.post<VerifyOtpResponse>('/api/auth/verify-otp', data)
    return response.data
  }

  /**
   * Reset password with OTP (step 4)
   * POST /auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/api/auth/reset-password', data)
    return response.data
  }

  /**
   * Refresh access token
   * POST /auth/access-token
   * Uses refresh token from cookies
   */
  async refreshAccessToken(): Promise<string> {
    const response = await api.post<LoginResponse>('/api/auth/access-token')
    const accessToken = response.data.data.accessToken
    localStorage.setItem('access_token', accessToken)
    return accessToken
  }

  /**
   * Logout user
   * POST /auth/logout
   * Clears refresh token cookie on backend
   */
  async logout(): Promise<void> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')

    try {
      await api.post('/api/auth/logout')
      console.log('🟠 [authService] Logout API call successful')
    } catch (error) {
      console.error('🟠 [authService] Logout API error (continuing anyway):', error)
    }
  }
}

export default new AuthService()
