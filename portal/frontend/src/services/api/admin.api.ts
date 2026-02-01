/**
 * Admin API - Admin user management endpoints.
 *
 * @module api/admin
 */

import { apiClient } from './client'
import type { Driver } from './types'

/**
 * Admin Users API methods.
 */
export const AdminUsersApi = {
  /**
   * Get all users.
   *
   * @returns Array of users
   */
  async getAll(): Promise<unknown[]> {
    const response = await apiClient.get('/admin/users')
    return response.data
  },

  /**
   * Create a new user.
   *
   * @param data - User data
   * @returns Created user
   */
  async create(data: { name: string; email: string; role: string; password: string }): Promise<unknown> {
    const response = await apiClient.post('/admin/users', data)
    return response.data
  },

  /**
   * Update a user.
   *
   * @param id - User ID
   * @param data - Updated user data
   * @returns Updated user
   */
  async update(
    id: number,
    data: { name?: string; email?: string; role?: string; password?: string }
  ): Promise<unknown> {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data
  },

  /**
   * Delete a user.
   *
   * @param id - User ID
   * @returns Delete response
   */
  async delete(id: number): Promise<unknown> {
    const response = await apiClient.delete(`/admin/users/${id}`)
    return response.data
  },

  /**
   * Connect a driver to a user.
   *
   * @param userId - User ID
   * @param driverId - Driver ID
   * @returns Connection response
   */
  async connectDriver(userId: number, driverId: number): Promise<unknown> {
    const response = await apiClient.post(`/admin/users/${userId}/drivers/${driverId}`)
    return response.data
  },

  /**
   * Disconnect a driver from a user.
   *
   * @param userId - User ID
   * @param driverId - Driver ID
   * @returns Disconnection response
   */
  async disconnectDriver(userId: number, driverId: number): Promise<unknown> {
    const response = await apiClient.delete(`/admin/users/${userId}/drivers/${driverId}`)
    return response.data
  },

  /**
   * Get available drivers for a user.
   *
   * @param userId - User ID
   * @returns Array of available drivers
   */
  async availableDrivers(userId: number): Promise<Driver[]> {
    const response = await apiClient.get(`/admin/users/${userId}/available-drivers`)
    return response.data
  },
}

export default AdminUsersApi
