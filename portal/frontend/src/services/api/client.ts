/**
 * API Client - Base axios instance and authentication management.
 *
 * @module api/client
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios'

/**
 * Base API client instance with interceptors.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Current authentication token.
 */
let authToken: string | null = localStorage.getItem('api_token')

// Initialize token if present
if (authToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
}

/**
 * Request interceptor for logging/debugging.
 */
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

/**
 * Response interceptor for handling 401 errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Always clear auth on 401 except for login attempts
      if (!url.includes('/auth/login')) {
        console.warn('401 unauthorized on:', url)
        clearAuth()
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/karting/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Set the authentication token.
 *
 * @param token - The JWT token to use for authentication
 */
export function setAuthToken(token: string): void {
  authToken = token
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  localStorage.setItem('api_token', token)
}

/**
 * Clear all authentication data.
 */
export function clearAuth(): void {
  authToken = null
  delete apiClient.defaults.headers.common['Authorization']
  localStorage.removeItem('api_token')
}

/**
 * Check if user is currently authenticated.
 *
 * @returns True if a token is present
 */
export function isAuthenticated(): boolean {
  return !!authToken
}

/**
 * Get the current auth token.
 *
 * @returns The current token or null
 */
export function getAuthToken(): string | null {
  return authToken
}

export { apiClient }
export default apiClient
