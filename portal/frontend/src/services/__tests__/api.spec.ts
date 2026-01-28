import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiService from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authentication', () => {
    it('should start unauthenticated', () => {
      expect(apiService.isAuthenticated()).toBe(false)
    })

    it('should set token in localStorage on setAuthToken', () => {
      apiService.setAuthToken('test-token')
      expect(localStorage.getItem('api_token')).toBe('test-token')
    })

    it('should return authenticated after setting token', () => {
      apiService.setAuthToken('test-token')
      expect(apiService.isAuthenticated()).toBe(true)
    })

    it('should clear token on clearAuth', () => {
      apiService.setAuthToken('test-token')
      apiService.clearAuth()
      expect(localStorage.getItem('api_token')).toBeNull()
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
  })
})
