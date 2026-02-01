/**
 * Settings API - Settings endpoints.
 *
 * @module api/settings
 */

import { apiClient } from './client'
import type { Setting } from './types'

/**
 * Settings API methods.
 */
export const SettingsApi = {
  /**
   * Get all settings.
   *
   * @returns Settings object
   */
  async getAll(): Promise<Record<string, unknown>> {
    const response = await apiClient.get<Record<string, unknown>>('/settings')
    return response.data
  },

  /**
   * Update a setting.
   *
   * @param key - Setting key
   * @param value - New value
   * @param description - Optional description
   * @returns The updated setting
   */
  async update(key: string, value: unknown, description?: string): Promise<Setting> {
    const response = await apiClient.put<Setting>(`/settings/${key}`, { value, description })
    return response.data
  },
}

export default SettingsApi
