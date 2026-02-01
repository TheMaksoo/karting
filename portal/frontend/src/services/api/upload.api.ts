/**
 * Upload API - File upload and parsing endpoints.
 *
 * @module api/upload
 */

import { apiClient } from './client'
import type { Lap, UploadPreviewResponse, SaveSessionData } from './types'

/**
 * Upload API methods.
 */
export const UploadApi = {
  /**
   * Preview an uploaded file.
   *
   * @param file - File to preview
   * @param trackId - Track ID
   * @returns Preview response
   */
  async preview(file: File, trackId: string): Promise<UploadPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('track_id', trackId)
    const response = await apiClient.post('/upload/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Import session data.
   *
   * @param data - Import data
   * @returns Import response
   */
  async import(data: {
    track_id: string
    session_date: string
    session_type: string
    laps: Partial<Lap>[]
    temp_path?: string
  }): Promise<unknown> {
    const response = await apiClient.post('/upload/import', data)
    return response.data
  },

  /**
   * Manual lap entry.
   *
   * @param data - Manual entry data
   * @returns Entry response
   */
  async manualEntry(data: {
    track_id: string
    driver_id: string
    lap_time: number
    lap_number?: number
    kart_number?: number
    session_date: string
    session_type?: string
    notes?: string
  }): Promise<unknown> {
    const response = await apiClient.post('/upload/manual-entry', data)
    return response.data
  },

  /**
   * Parse an EML file.
   *
   * @param file - EML file to parse
   * @param trackId - Optional track ID override
   * @returns Parse response
   */
  async parseEml(file: File, trackId?: number): Promise<UploadPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (trackId) formData.append('track_id', String(trackId))
    const response = await apiClient.post('/sessions/upload-eml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Save a parsed session.
   *
   * @param data - Session data to save
   * @returns Save response
   */
  async saveParsedSession(data: SaveSessionData): Promise<unknown> {
    const response = await apiClient.post('/sessions/save-parsed', data)
    return response.data
  },
}

export default UploadApi
