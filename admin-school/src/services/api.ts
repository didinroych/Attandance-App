import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests for refreshToken
})

// Track if we're currently refreshing the token
let isRefreshing = false
// Queue of failed requests waiting for token refresh
let failedRequestsQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}> = []

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors globally and refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized or 403 Forbidden (expired token)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('[Token Refresh] Auth error detected:', {
        status: error.response?.status,
        url: originalRequest?.url,
        message: error.response?.data,
        hasConfig: !!error.config
      })

      // If no config, we can't retry the request
      if (!originalRequest) {
        console.error('[Token Refresh] No original request config, cannot retry')
        return Promise.reject(error)
      }

      // Don't try to refresh if this IS the refresh token request itself
      if (originalRequest.url?.includes('/auth/access-token')) {
        console.log('[Token Refresh] Refresh token endpoint failed - logging out')
        // Refresh token is invalid, logout user
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/signin'
        return Promise.reject(error)
      }

      // Don't try to refresh on login/register endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error)
      }

      // If not already retrying and we have a refresh token (cookie)
      if (!originalRequest._retry) {
        if (isRefreshing) {
          console.log('[Token Refresh] Already refreshing, queueing request')
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({ resolve, reject })
          })
            .then(() => {
              // Retry original request with new token
              return api(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          console.log('[Token Refresh] Attempting to refresh token...')
          // Try to refresh the token
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/access-token`,
            {},
            { withCredentials: true }
          )

          console.log('[Token Refresh] Success! New token received')
          const newAccessToken = response.data.data.accessToken
          localStorage.setItem('access_token', newAccessToken)

          // Update the authorization header for the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }

          // Resolve all queued requests
          failedRequestsQueue.forEach((req) => req.resolve())
          failedRequestsQueue = []

          isRefreshing = false

          // Retry the original request
          console.log('[Token Refresh] Retrying original request')
          return api(originalRequest)
        } catch (refreshError) {
          console.error('[Token Refresh] Failed to refresh token:', refreshError)
          // Refresh token failed, reject all queued requests
          failedRequestsQueue.forEach((req) => req.reject(refreshError))
          failedRequestsQueue = []
          isRefreshing = false

          // Clear auth data and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          window.location.href = '/signin'

          return Promise.reject(refreshError)
        }
      }
    }

    // Handle other errors
    // Backend returns errors in 'errors' field
    const errorData = error.response?.data as any
    const errorMessage =
      errorData?.errors ||
      errorData?.message ||
      error.message ||
      'An error occurred'
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    })
  }
)

export default api
