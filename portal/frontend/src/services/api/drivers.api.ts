/**
 * Drivers API - Driver CRUD and stats endpoints.
 *
 * @module api/drivers
 */

import { apiClient } from './client'
import type { Driver, DriverStats } from './types'

/**
 * Drivers API methods.
 */
export const DriversApi = {
  /**
   * Get all drivers.
   *
   * @returns Array of all drivers
   */
  async getAll(): Promise<Driver[]> {
    const response = await apiClient.get<Driver[]>('/drivers')
    return response.data
  },

  /**
   * Get a driver by ID.
   *
   * @param id - Driver ID
   * @returns The driver data
   */
  async get(id: number): Promise<Driver> {
    const response = await apiClient.get<Driver>(`/drivers/${id}`)
    return response.data
  },

  /**
   * Create a new driver.
   *
   * @param data - Driver data
   * @returns The created driver
   */
  async create(data: Partial<Driver>): Promise<Driver> {
    const response = await apiClient.post<Driver>('/drivers', data)
    return response.data
  },

  /**
   * Update a driver.
   *
   * @param id - Driver ID
   * @param data - Updated driver data
   * @returns The updated driver
   */
  async update(id: number, data: Partial<Driver>): Promise<Driver> {
    const response = await apiClient.put<Driver>(`/drivers/${id}`, data)
    return response.data
  },

  /**
   * Delete a driver.
   *
   * @param id - Driver ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/drivers/${id}`)
  },

  /**
   * Get driver statistics.
   *
   * @param friendsOnly - Only include friends' stats
   * @returns Array of driver statistics
   */
  async stats(friendsOnly = false): Promise<DriverStats[]> {
    const response = await apiClient.get<DriverStats[]>('/stats/drivers', {
      params: { friends_only: friendsOnly },
    })
    return response.data
  },

  /**
   * Get lap count.
   *
   * @returns Total lap count
   */
  async getLapCount(): Promise<{ total: number }> {
    const response = await apiClient.get<{ total: number }>('/laps/count')
    return response.data
  },

  /**
   * Get database metrics.
   *
   * @returns Database metrics with breakdown
   */
  async getDatabaseMetrics(): Promise<{ total_data_points: number; breakdown: Record<string, number> }> {
    const response = await apiClient.get<{ total_data_points: number; breakdown: Record<string, number> }>(
      '/stats/database-metrics'
    )
    return response.data
  },
}

export default DriversApi
