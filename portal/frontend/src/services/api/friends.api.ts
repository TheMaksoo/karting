/**
 * Friends API - Friends management endpoints.
 *
 * @module api/friends
 */

import { apiClient } from './client'
import type { Friend, FriendResponse, DriverIdsResponse } from './types'

/**
 * Friends API methods.
 */
export const FriendsApi = {
  /**
   * Get all friends.
   *
   * @returns Array of friends
   */
  async getAll(): Promise<Friend[]> {
    const response = await apiClient.get<Friend[]>('/friends')
    return response.data
  },

  /**
   * Add a friend.
   *
   * @param driverId - Driver ID to add as friend
   * @returns Friend response
   */
  async add(driverId: number): Promise<FriendResponse> {
    const response = await apiClient.post<FriendResponse>('/friends', { driver_id: driverId })
    return response.data
  },

  /**
   * Remove a friend.
   *
   * @param friendId - Friend ID to remove
   * @returns Friend response
   */
  async remove(friendId: number): Promise<FriendResponse> {
    const response = await apiClient.delete<FriendResponse>(`/friends/${friendId}`)
    return response.data
  },

  /**
   * Get friend driver IDs.
   *
   * @returns Array of driver IDs
   */
  async getDriverIds(): Promise<number[]> {
    const response = await apiClient.get<DriverIdsResponse>('/friends/driver-ids')
    return response.data.driver_ids || []
  },
}

export default FriendsApi
