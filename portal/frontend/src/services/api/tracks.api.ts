/**
 * Tracks API - Track CRUD and stats endpoints.
 *
 * @module api/tracks
 */

import { apiClient } from './client'
import type { Track, TrackStats } from './types'

/**
 * Tracks API methods.
 */
export const TracksApi = {
  /**
   * Get all tracks.
   *
   * @returns Array of all tracks
   */
  async getAll(): Promise<Track[]> {
    const response = await apiClient.get<Track[]>('/tracks')
    return response.data
  },

  /**
   * Get a track by ID.
   *
   * @param id - Track ID
   * @returns The track data
   */
  async get(id: number): Promise<Track> {
    const response = await apiClient.get<Track>(`/tracks/${id}`)
    return response.data
  },

  /**
   * Create a new track.
   *
   * @param data - Track data
   * @returns The created track
   */
  async create(data: Partial<Track>): Promise<Track> {
    const response = await apiClient.post<Track>('/tracks', data)
    return response.data
  },

  /**
   * Update a track.
   *
   * @param id - Track ID
   * @param data - Updated track data
   * @returns The updated track
   */
  async update(id: number, data: Partial<Track>): Promise<Track> {
    const response = await apiClient.put<Track>(`/tracks/${id}`, data)
    return response.data
  },

  /**
   * Delete a track.
   *
   * @param id - Track ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/tracks/${id}`)
  },

  /**
   * Get track statistics.
   *
   * @returns Array of track statistics
   */
  async stats(): Promise<TrackStats[]> {
    const response = await apiClient.get<TrackStats[]>('/stats/tracks')
    return response.data
  },
}

export default TracksApi
