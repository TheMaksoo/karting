/**
 * Auth API - Authentication endpoints.
 *
 * @module api/auth
 */

import { apiClient, setAuthToken, clearAuth } from './client'
import type { User, LoginResponse } from './types'

/**
 * Authentication API methods.
 */
export const AuthApi = {
  /**
   * Login with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Login response with token and user data
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
    setAuthToken(response.data.token)
    return response.data
  },

  /**
   * Logout the current user.
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
    clearAuth()
  },

  /**
   * Get the currently authenticated user.
   *
   * @returns The current user's data
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  /**
   * Change the current user's password.
   *
   * @param data - Password change data
   */
  async changePassword(data: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }): Promise<void> {
    await apiClient.post('/auth/change-password', data)
  },
}

export default AuthApi
