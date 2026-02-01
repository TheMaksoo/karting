/**
 * API Module - Unified API exports.
 *
 * This module provides a unified interface for all API endpoints.
 * It maintains backward compatibility with the original ApiService class
 * while also providing modular, tree-shakeable imports.
 *
 * @module api
 *
 * @example
 * // Import specific API modules (recommended - tree-shakeable)
 * import { AuthApi, DriversApi } from '@/services/api'
 *
 * @example
 * // Import the unified API object (backward compatible)
 * import api from '@/services/api'
 * api.auth.login(email, password)
 */

// Re-export all types
export * from './types'

// Re-export client utilities
export { apiClient, setAuthToken, clearAuth, isAuthenticated, getAuthToken } from './client'

// Re-export individual APIs
export { AuthApi } from './auth.api'
export { DriversApi } from './drivers.api'
export { TracksApi } from './tracks.api'
export { SessionsApi } from './sessions.api'
export { LapsApi } from './laps.api'
export { StatsApi } from './stats.api'
export { SettingsApi } from './settings.api'
export { FriendsApi } from './friends.api'
export { UploadApi } from './upload.api'
export { AdminUsersApi } from './admin.api'
export { UserSettingsApi } from './user-settings.api'
export { ActivityApi } from './activity.api'

// Import for unified object
import { apiClient, setAuthToken, clearAuth, isAuthenticated } from './client'
import { AuthApi } from './auth.api'
import { DriversApi } from './drivers.api'
import { TracksApi } from './tracks.api'
import { SessionsApi } from './sessions.api'
import { LapsApi } from './laps.api'
import { StatsApi } from './stats.api'
import { SettingsApi } from './settings.api'
import { FriendsApi } from './friends.api'
import { UploadApi } from './upload.api'
import { AdminUsersApi } from './admin.api'
import { UserSettingsApi } from './user-settings.api'
import { ActivityApi } from './activity.api'

import type {
  Driver,
  Track,
  KartingSession,
  Lap,
  User,
  LoginResponse,
  DriverStats,
  TrackStats,
  OverviewStats,
  PaginatedResponse,
  Setting,
} from './types'

/**
 * Unified API service class for backward compatibility.
 *
 * This class wraps all the individual API modules and provides
 * the same interface as the original monolithic ApiService.
 */
class ApiService {
  // Expose auth utilities
  setAuthToken = setAuthToken
  clearAuth = clearAuth
  isAuthenticated = isAuthenticated

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    return AuthApi.login(email, password)
  }

  async logout(): Promise<void> {
    return AuthApi.logout()
  }

  async getCurrentUser(): Promise<User> {
    return AuthApi.getCurrentUser()
  }

  async changePassword(data: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }): Promise<void> {
    return AuthApi.changePassword(data)
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    return DriversApi.getAll()
  }

  async getDriver(id: number): Promise<Driver> {
    return DriversApi.get(id)
  }

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    return DriversApi.create(data)
  }

  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    return DriversApi.update(id, data)
  }

  async deleteDriver(id: number): Promise<void> {
    return DriversApi.delete(id)
  }

  async getDriverStats(friendsOnly = false): Promise<DriverStats[]> {
    return DriversApi.stats(friendsOnly)
  }

  async getLapCount(): Promise<{ total: number }> {
    return DriversApi.getLapCount()
  }

  async getDatabaseMetrics(): Promise<{ total_data_points: number; breakdown: Record<string, number> }> {
    return DriversApi.getDatabaseMetrics()
  }

  // Track methods
  async getTracks(): Promise<Track[]> {
    return TracksApi.getAll()
  }

  async getTrack(id: number): Promise<Track> {
    return TracksApi.get(id)
  }

  async createTrack(data: Partial<Track>): Promise<Track> {
    return TracksApi.create(data)
  }

  async updateTrack(id: number, data: Partial<Track>): Promise<Track> {
    return TracksApi.update(id, data)
  }

  async deleteTrack(id: number): Promise<void> {
    return TracksApi.delete(id)
  }

  async getTrackStats(): Promise<TrackStats[]> {
    return TracksApi.stats()
  }

  // Session methods
  async getSessions(params?: Record<string, unknown>): Promise<PaginatedResponse<KartingSession>> {
    return SessionsApi.getAll(params)
  }

  async getSession(id: number): Promise<KartingSession> {
    return SessionsApi.get(id)
  }

  async createSession(data: Partial<KartingSession>): Promise<KartingSession> {
    return SessionsApi.create(data)
  }

  async updateSession(id: number, data: Partial<KartingSession>): Promise<KartingSession> {
    return SessionsApi.update(id, data)
  }

  async deleteSession(id: number): Promise<void> {
    return SessionsApi.delete(id)
  }

  async getSessionLaps(sessionId: number): Promise<Lap[]> {
    return SessionsApi.getLaps(sessionId)
  }

  // Lap methods
  async getLaps(params?: Record<string, unknown>): Promise<PaginatedResponse<Lap>> {
    return LapsApi.getAll(params)
  }

  async getLap(id: number): Promise<Lap> {
    return LapsApi.get(id)
  }

  async createLap(data: Partial<Lap>): Promise<Lap> {
    return LapsApi.create(data)
  }

  async updateLap(id: number, data: Partial<Lap>): Promise<Lap> {
    return LapsApi.update(id, data)
  }

  async deleteLap(id: number): Promise<void> {
    return LapsApi.delete(id)
  }

  async getDriverLaps(driverId: number): Promise<Lap[]> {
    return LapsApi.getByDriver(driverId)
  }

  // Stats methods
  async getOverviewStats(): Promise<OverviewStats> {
    return StatsApi.overview()
  }

  // Settings methods
  async getSettings(): Promise<Record<string, unknown>> {
    return SettingsApi.getAll()
  }

  async updateSetting(key: string, value: unknown, description?: string): Promise<Setting> {
    return SettingsApi.update(key, value, description)
  }

  // User driver connections
  async getUserDrivers(): Promise<Driver[]> {
    return UserSettingsApi.getDrivers()
  }

  async connectDriverToUser(driverId: number): Promise<void> {
    return UserSettingsApi.connectDriver(driverId)
  }

  async disconnectDriverFromUser(driverId: number): Promise<void> {
    return UserSettingsApi.disconnectDriver(driverId)
  }

  async setMainDriver(driverId: number): Promise<void> {
    return UserSettingsApi.setMainDriver(driverId)
  }

  // Organized API structure for object-style access
  auth = AuthApi
  drivers = {
    getAll: () => DriversApi.getAll(),
    get: (id: number) => DriversApi.get(id),
    create: (data: Partial<Driver>) => DriversApi.create(data),
    update: (id: number, data: Partial<Driver>) => DriversApi.update(id, data),
    delete: (id: number) => DriversApi.delete(id),
    stats: () => DriversApi.stats(),
  }
  tracks = {
    getAll: () => TracksApi.getAll(),
    get: (id: number) => TracksApi.get(id),
    create: (data: Partial<Track>) => TracksApi.create(data),
    update: (id: number, data: Partial<Track>) => TracksApi.update(id, data),
    delete: (id: number) => TracksApi.delete(id),
    stats: () => TracksApi.stats(),
  }
  sessions = {
    getAll: (params?: Record<string, unknown>) => SessionsApi.getAll(params),
    get: (id: number) => SessionsApi.get(id),
    create: (data: Partial<KartingSession>) => SessionsApi.create(data),
    update: (id: number, data: Partial<KartingSession>) => SessionsApi.update(id, data),
    delete: (id: number) => SessionsApi.delete(id),
    getLaps: (sessionId: number) => SessionsApi.getLaps(sessionId),
  }
  laps = {
    getAll: (params?: Record<string, unknown>) => LapsApi.getAll(params),
    get: (id: number) => LapsApi.get(id),
    create: (data: Partial<Lap>) => LapsApi.create(data),
    update: (id: number, data: Partial<Lap>) => LapsApi.update(id, data),
    delete: (id: number) => LapsApi.delete(id),
    getByDriver: (driverId: number) => LapsApi.getByDriver(driverId),
  }
  settings = SettingsApi
  stats = StatsApi
  friends = FriendsApi
  userSettings = UserSettingsApi
  activity = ActivityApi
  upload = UploadApi
  adminUsers = AdminUsersApi

  // Generic methods for backward compatibility
  async post(url: string, data?: unknown, config?: Record<string, unknown>) {
    const response = await apiClient.post(url, data, config)
    return response
  }

  async get(url: string, config?: Record<string, unknown>) {
    const response = await apiClient.get(url, config)
    return response.data
  }

  async delete(url: string) {
    const response = await apiClient.delete(url)
    return response.data
  }
}

// Create singleton instance for backward compatibility
const apiService = new ApiService()

export default apiService
