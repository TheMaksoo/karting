/**
 * Laps API - Lap CRUD endpoints.
 *
 * @module api/laps
 */

import { apiClient } from './client'
import type { Lap, PaginatedResponse } from './types'

/**
 * Laps API methods.
 */
export const LapsApi = {
  /**
   * Get all laps with pagination.
   *
   * @param params - Query parameters for filtering/pagination
   * @returns Paginated laps response
   */
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Lap>> {
    const response = await apiClient.get<PaginatedResponse<Lap>>('/laps', { params: params || {} })
    return response.data
  },

  /**
   * Get a lap by ID.
   *
   * @param id - Lap ID
   * @returns The lap data
   */
  async get(id: number): Promise<Lap> {
    const response = await apiClient.get<Lap>(`/laps/${id}`)
    return response.data
  },

  /**
   * Create a new lap.
   *
   * @param data - Lap data
   * @returns The created lap
   */
  async create(data: Partial<Lap>): Promise<Lap> {
    const response = await apiClient.post<Lap>('/laps', data)
    return response.data
  },

  /**
   * Update a lap.
   *
   * @param id - Lap ID
   * @param data - Updated lap data
   * @returns The updated lap
   */
  async update(id: number, data: Partial<Lap>): Promise<Lap> {
    const response = await apiClient.put<Lap>(`/laps/${id}`, data)
    return response.data
  },

  /**
   * Delete a lap.
   *
   * @param id - Lap ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/laps/${id}`)
  },

  /**
   * Get laps for a specific driver.
   *
   * @param driverId - Driver ID
   * @returns Array of laps
   */
  async getByDriver(driverId: number): Promise<Lap[]> {
    const response = await apiClient.get<Lap[]>(`/laps/driver/${driverId}`)
    return response.data
  },
}

export default LapsApi
