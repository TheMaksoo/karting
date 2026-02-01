/**
 * User Settings API - User preference endpoints.
 *
 * @module api/user-settings
 */

import { apiClient } from './client'
import type { Driver } from './types'

/**
 * User Settings API methods.
 */
export const UserSettingsApi = {
  /**
   * Get user settings.
   *
   * @returns User settings
   */
  async get(): Promise<unknown> {
    const response = await apiClient.get('/user/settings')
    return response.data
  },

  /**
   * Update display name.
   *
   * @param displayName - New display name
   * @returns Update response
   */
  async updateDisplayName(displayName: string): Promise<unknown> {
    const response = await apiClient.put('/user/display-name', { display_name: displayName })
    return response.data
  },

  /**
   * Set a track nickname.
   *
   * @param trackId - Track ID
   * @param nickname - Nickname for the track
   * @returns Update response
   */
  async setTrackNickname(trackId: number, nickname: string): Promise<unknown> {
    const response = await apiClient.post('/user/track-nickname', { track_id: trackId, nickname })
    return response.data
  },

  /**
   * Delete a track nickname.
   *
   * @param id - Nickname ID
   * @returns Delete response
   */
  async deleteTrackNickname(id: number): Promise<unknown> {
    const response = await apiClient.delete(`/user/track-nickname/${id}`)
    return response.data
  },

  /**
   * Get user's connected drivers.
   *
   * @returns Array of connected drivers
   */
  async getDrivers(): Promise<Driver[]> {
    const response = await apiClient.get<Driver[]>('/user/drivers')
    return response.data
  },

  /**
   * Connect a driver to the user.
   *
   * @param driverId - Driver ID
   */
  async connectDriver(driverId: number): Promise<void> {
    await apiClient.post(`/user/drivers/${driverId}`)
  },

  /**
   * Disconnect a driver from the user.
   *
   * @param driverId - Driver ID
   */
  async disconnectDriver(driverId: number): Promise<void> {
    await apiClient.delete(`/user/drivers/${driverId}`)
  },

  /**
   * Set the main driver for the user.
   *
   * @param driverId - Driver ID
   */
  async setMainDriver(driverId: number): Promise<void> {
    await apiClient.post(`/user/drivers/${driverId}/set-main`)
  },
}

export default UserSettingsApi
