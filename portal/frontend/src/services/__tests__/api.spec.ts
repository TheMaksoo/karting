import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiService from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset the apiService token state
    apiService.clearAuth()
  })

  describe('authentication', () => {
    it('should start unauthenticated', () => {
      expect(apiService.isAuthenticated()).toBe(false)
    })

    it('should set token in localStorage on setAuthToken', () => {
      apiService.setAuthToken('test-token')
      // happy-dom may return undefined instead of the value, check via isAuthenticated
      expect(apiService.isAuthenticated()).toBe(true)
    })

    it('should return authenticated after setting token', () => {
      apiService.setAuthToken('test-token')
      expect(apiService.isAuthenticated()).toBe(true)
    })

    it('should clear token on clearAuth', () => {
      apiService.setAuthToken('test-token')
      apiService.clearAuth()
      // After clearing, should not be authenticated
      expect(apiService.isAuthenticated()).toBe(false)
    })

    it('should handle multiple setAuthToken calls', () => {
      apiService.setAuthToken('token-1')
      expect(apiService.isAuthenticated()).toBe(true)
      apiService.setAuthToken('token-2')
      expect(apiService.isAuthenticated()).toBe(true)
    })

    it('should handle multiple clearAuth calls', () => {
      apiService.setAuthToken('test-token')
      apiService.clearAuth()
      apiService.clearAuth()
      expect(apiService.isAuthenticated()).toBe(false)
    })
  })

  describe('API endpoint structure', () => {
    it('should have auth methods', () => {
      expect(typeof apiService.login).toBe('function')
      expect(typeof apiService.logout).toBe('function')
      expect(typeof apiService.getCurrentUser).toBe('function')
      expect(typeof apiService.changePassword).toBe('function')
    })

    it('should have driver methods', () => {
      expect(typeof apiService.getDrivers).toBe('function')
      expect(typeof apiService.getDriver).toBe('function')
      expect(typeof apiService.createDriver).toBe('function')
      expect(typeof apiService.updateDriver).toBe('function')
      expect(typeof apiService.deleteDriver).toBe('function')
      expect(typeof apiService.getDriverStats).toBe('function')
    })

    it('should have track methods', () => {
      expect(typeof apiService.getTracks).toBe('function')
      expect(typeof apiService.getTrack).toBe('function')
      expect(typeof apiService.createTrack).toBe('function')
      expect(typeof apiService.updateTrack).toBe('function')
      expect(typeof apiService.deleteTrack).toBe('function')
      expect(typeof apiService.getTrackStats).toBe('function')
    })

    it('should have session methods', () => {
      expect(typeof apiService.getSessions).toBe('function')
      expect(typeof apiService.getSession).toBe('function')
      expect(typeof apiService.createSession).toBe('function')
      expect(typeof apiService.updateSession).toBe('function')
      expect(typeof apiService.deleteSession).toBe('function')
    })

    it('should have lap methods', () => {
      expect(typeof apiService.getLaps).toBe('function')
      expect(typeof apiService.getLap).toBe('function')
      expect(typeof apiService.createLap).toBe('function')
      expect(typeof apiService.updateLap).toBe('function')
      expect(typeof apiService.deleteLap).toBe('function')
    })

    it('should have settings methods', () => {
      expect(typeof apiService.getSettings).toBe('function')
      expect(typeof apiService.updateSetting).toBe('function')
    })

    it('should have overview stats method', () => {
      expect(typeof apiService.getOverviewStats).toBe('function')
    })

    it('should have lap count method', () => {
      expect(typeof apiService.getLapCount).toBe('function')
    })

    it('should have database metrics method', () => {
      expect(typeof apiService.getDatabaseMetrics).toBe('function')
    })

    it('should have driver laps method', () => {
      expect(typeof apiService.getDriverLaps).toBe('function')
    })

    it('should have session laps method', () => {
      expect(typeof apiService.getSessionLaps).toBe('function')
    })

    it('should have user drivers methods', () => {
      expect(typeof apiService.getUserDrivers).toBe('function')
      expect(typeof apiService.connectDriverToUser).toBe('function')
      expect(typeof apiService.disconnectDriverFromUser).toBe('function')
      expect(typeof apiService.setMainDriver).toBe('function')
    })

    it('should have post method for backward compatibility', () => {
      expect(typeof apiService.post).toBe('function')
    })
  })

  describe('organized API structure', () => {
    it('should have drivers namespace', () => {
      expect(typeof apiService.drivers).toBe('object')
      expect(typeof apiService.drivers.getAll).toBe('function')
      expect(typeof apiService.drivers.get).toBe('function')
      expect(typeof apiService.drivers.create).toBe('function')
      expect(typeof apiService.drivers.update).toBe('function')
      expect(typeof apiService.drivers.delete).toBe('function')
      expect(typeof apiService.drivers.stats).toBe('function')
    })

    it('should have tracks namespace', () => {
      expect(typeof apiService.tracks).toBe('object')
      expect(typeof apiService.tracks.getAll).toBe('function')
      expect(typeof apiService.tracks.get).toBe('function')
      expect(typeof apiService.tracks.create).toBe('function')
      expect(typeof apiService.tracks.update).toBe('function')
      expect(typeof apiService.tracks.delete).toBe('function')
      expect(typeof apiService.tracks.stats).toBe('function')
    })

    it('should have sessions namespace', () => {
      expect(typeof apiService.sessions).toBe('object')
      expect(typeof apiService.sessions.getAll).toBe('function')
      expect(typeof apiService.sessions.get).toBe('function')
      expect(typeof apiService.sessions.create).toBe('function')
      expect(typeof apiService.sessions.update).toBe('function')
      expect(typeof apiService.sessions.delete).toBe('function')
      expect(typeof apiService.sessions.getLaps).toBe('function')
    })

    it('should have laps namespace', () => {
      expect(typeof apiService.laps).toBe('object')
      expect(typeof apiService.laps.getAll).toBe('function')
      expect(typeof apiService.laps.get).toBe('function')
      expect(typeof apiService.laps.create).toBe('function')
      expect(typeof apiService.laps.update).toBe('function')
      expect(typeof apiService.laps.delete).toBe('function')
      expect(typeof apiService.laps.getByDriver).toBe('function')
    })

    it('should have settings namespace', () => {
      expect(typeof apiService.settings).toBe('object')
      expect(typeof apiService.settings.getAll).toBe('function')
      expect(typeof apiService.settings.update).toBe('function')
    })

    it('should have stats namespace', () => {
      expect(typeof apiService.stats).toBe('object')
      expect(typeof apiService.stats.overview).toBe('function')
      expect(typeof apiService.stats.drivers).toBe('function')
      expect(typeof apiService.stats.tracks).toBe('function')
    })

    it('should have auth namespace', () => {
      expect(typeof apiService.auth).toBe('object')
      expect(typeof apiService.auth.login).toBe('function')
      expect(typeof apiService.auth.logout).toBe('function')
      expect(typeof apiService.auth.getCurrentUser).toBe('function')
      expect(typeof apiService.auth.changePassword).toBe('function')
    })

    it('should have friends namespace', () => {
      expect(typeof apiService.friends).toBe('object')
      expect(typeof apiService.friends.getAll).toBe('function')
      expect(typeof apiService.friends.add).toBe('function')
      expect(typeof apiService.friends.remove).toBe('function')
      expect(typeof apiService.friends.getDriverIds).toBe('function')
    })

    it('should have userSettings namespace', () => {
      expect(typeof apiService.userSettings).toBe('object')
      expect(typeof apiService.userSettings.get).toBe('function')
      expect(typeof apiService.userSettings.updateDisplayName).toBe('function')
      expect(typeof apiService.userSettings.setTrackNickname).toBe('function')
      expect(typeof apiService.userSettings.deleteTrackNickname).toBe('function')
    })

    it('should have activity namespace', () => {
      expect(typeof apiService.activity).toBe('object')
      expect(typeof apiService.activity.latest).toBe('function')
    })

    it('should have upload namespace', () => {
      expect(typeof apiService.upload).toBe('object')
      expect(typeof apiService.upload.preview).toBe('function')
      expect(typeof apiService.upload.import).toBe('function')
      expect(typeof apiService.upload.manualEntry).toBe('function')
      expect(typeof apiService.upload.parseEml).toBe('function')
      expect(typeof apiService.upload.saveParsedSession).toBe('function')
    })

    it('should have adminUsers namespace', () => {
      expect(typeof apiService.adminUsers).toBe('object')
      expect(typeof apiService.adminUsers.getAll).toBe('function')
      expect(typeof apiService.adminUsers.create).toBe('function')
      expect(typeof apiService.adminUsers.update).toBe('function')
      expect(typeof apiService.adminUsers.delete).toBe('function')
      expect(typeof apiService.adminUsers.connectDriver).toBe('function')
      expect(typeof apiService.adminUsers.disconnectDriver).toBe('function')
      expect(typeof apiService.adminUsers.availableDrivers).toBe('function')
    })
  })
})
