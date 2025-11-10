// User roles
export type UserRole = 'admin' | 'teacher' | 'student'

// User interface
export interface User {
  id: number
  username: string
  email?: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

// Authentication request/response types
export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupData {
  username: string
  email: string
  password: string
  role: UserRole
}

// Backend response for registration
export interface RegisterResponse {
  data: {
    username: string
    email: string
  }
}

// Backend response for login
export interface LoginResponse {
  data: {
    user: User
    accessToken: string
  }
}

// Unified auth response for internal use
export interface AuthResponse {
  user: User
  accessToken: string
}

// Forgot password flow types
export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

export interface VerifyOtpResponse {
  data: {
    message: string
  }
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

// Error response
export interface ApiError {
  status: number
  message: string
  data?: any
}
