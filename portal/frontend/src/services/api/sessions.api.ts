/**
 * Sessions API - Session CRUD endpoints.
 *
 * @module api/sessions
 */

import { apiClient } from './client'
import type { KartingSession, Lap, PaginatedResponse } from './types'

/**
 * Sessions API methods.
 */
export const SessionsApi = {
  /**
   * Get all sessions with pagination.
   *
   * @param params - Query parameters for filtering/pagination
   * @returns Paginated sessions response
   */
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<KartingSession>> {
    const queryParams = { per_page: 25, ...params }
    const response = await apiClient.get<PaginatedResponse<KartingSession>>('/sessions', { params: queryParams })
    return response.data
  },

  /**
   * Get a session by ID.
   *
   * @param id - Session ID
   * @returns The session data
   */
  async get(id: number): Promise<KartingSession> {
    const response = await apiClient.get<KartingSession>(`/sessions/${id}`)
    return response.data
  },

  /**
   * Create a new session.
   *
   * @param data - Session data
   * @returns The created session
   */
  async create(data: Partial<KartingSession>): Promise<KartingSession> {
    const response = await apiClient.post<KartingSession>('/sessions', data)
    return response.data
  },

  /**
   * Update a session.
   *
   * @param id - Session ID
   * @param data - Updated session data
   * @returns The updated session
   */
  async update(id: number, data: Partial<KartingSession>): Promise<KartingSession> {
    const response = await apiClient.put<KartingSession>(`/sessions/${id}`, data)
    return response.data
  },

  /**
   * Delete a session.
   *
   * @param id - Session ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/sessions/${id}`)
  },

  /**
   * Get laps for a session.
   *
   * @param sessionId - Session ID
   * @returns Array of laps
   */
  async getLaps(sessionId: number): Promise<Lap[]> {
    const response = await apiClient.get<Lap[]>(`/sessions/${sessionId}/laps`)
    return response.data
  },
}

export default SessionsApi
