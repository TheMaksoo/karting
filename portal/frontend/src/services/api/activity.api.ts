/**
 * Activity API - Activity feed endpoints.
 *
 * @module api/activity
 */

import { apiClient } from './client'

/**
 * Activity API methods.
 */
export const ActivityApi = {
  /**
   * Get latest activity.
   *
   * @param friendsOnly - Only include friends' activity
   * @param limit - Maximum number of activities to return
   * @returns Activity feed
   */
  async latest(friendsOnly = false, limit = 10): Promise<unknown[]> {
    const response = await apiClient.get('/activity/latest', {
      params: { friends_only: friendsOnly, limit },
    })
    return response.data
  },
}

export default ActivityApi
