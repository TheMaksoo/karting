/**
 * API Configuration
 * 
 * Centralized configuration for API client including versioning support.
 */

export const API_CONFIG = {
  // Base URL for the API (from environment variable)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  
  // API Version - Change this to use different API versions
  version: 'v1', // Options: '' (latest), 'v1', 'v2', etc.
  
  // Timeout for API requests (milliseconds)
  timeout: 30000,
  
  // Whether to use versioned endpoints
  useVersioning: true,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
  },
} as const

/**
 * Get the full API URL with optional versioning
 * @param endpoint - The API endpoint (e.g., '/drivers', '/sessions')
 * @param useVersion - Whether to include version prefix (default: true)
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string, useVersion: boolean = API_CONFIG.useVersioning): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  if (useVersion && API_CONFIG.version) {
    return `${API_CONFIG.baseURL}/${API_CONFIG.version}${cleanEndpoint}`
  }
  
  return `${API_CONFIG.baseURL}${cleanEndpoint}`
}

/**
 * API Version information
 */
export const API_VERSIONS = {
  V1: 'v1',
  LATEST: '', // Empty string uses the latest/unversioned API
} as const

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS]
