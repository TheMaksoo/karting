/**
 * Stats API - Statistics endpoints.
 *
 * @module api/stats
 */

import { apiClient } from './client'
import type { OverviewStats, DriverStats, TrackStats } from './types'

/**
 * Stats API methods.
 */
export const StatsApi = {
  /**
   * Get overview statistics.
   *
   * @returns Overview stats
   */
  async overview(): Promise<OverviewStats> {
    const response = await apiClient.get<OverviewStats>('/stats/overview')
    return response.data
  },

  /**
   * Get driver statistics.
   *
   * @param friendsOnly - Only include friends' stats
   * @returns Array of driver statistics
   */
  async drivers(friendsOnly = false): Promise<DriverStats[]> {
    const response = await apiClient.get<DriverStats[]>('/stats/drivers', {
      params: { friends_only: friendsOnly },
    })
    return response.data
  },

  /**
   * Get track statistics.
   *
   * @returns Array of track statistics
   */
  async tracks(): Promise<TrackStats[]> {
    const response = await apiClient.get<TrackStats[]>('/stats/tracks')
    return response.data
  },
}

export default StatsApi
