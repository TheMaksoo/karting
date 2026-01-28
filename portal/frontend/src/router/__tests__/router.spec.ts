import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../index'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    fetchCurrentUser: vi.fn(),
  })),
}))

// Mock api service
vi.mock('@/services/api', () => ({
  default: {
    isAuthenticated: vi.fn(() => false),
  },
}))

describe('Router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('route definitions', () => {
    it('should have login route', () => {
      const loginRoute = router.getRoutes().find(r => r.name === 'login')
      expect(loginRoute).toBeDefined()
      expect(loginRoute?.path).toBe('/login')
    })

    it('should have dashboard route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      expect(dashboardRoute).toBeDefined()
      expect(dashboardRoute?.path).toBe('/')
    })

    it('should have home as child of dashboard', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const homeChild = dashboardRoute?.children?.find(c => c.name === 'home')
      expect(homeChild).toBeDefined()
      expect(homeChild?.path).toBe('home')
    })

    it('should have driver-stats route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const driverStatsChild = dashboardRoute?.children?.find(c => c.name === 'driver-stats')
      expect(driverStatsChild).toBeDefined()
    })

    it('should have geographic route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const geoChild = dashboardRoute?.children?.find(c => c.name === 'geographic')
      expect(geoChild).toBeDefined()
    })

    it('should have session-analysis route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const sessionChild = dashboardRoute?.children?.find(c => c.name === 'session-analysis')
      expect(sessionChild).toBeDefined()
    })

    it('should have temporal route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const temporalChild = dashboardRoute?.children?.find(c => c.name === 'temporal')
      expect(temporalChild).toBeDefined()
    })

    it('should have track-performance route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const trackChild = dashboardRoute?.children?.find(c => c.name === 'track-performance')
      expect(trackChild).toBeDefined()
    })

    it('should have battles route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const battlesChild = dashboardRoute?.children?.find(c => c.name === 'battles')
      expect(battlesChild).toBeDefined()
    })

    it('should have financial route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const financialChild = dashboardRoute?.children?.find(c => c.name === 'financial')
      expect(financialChild).toBeDefined()
    })

    it('should have predictive route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const predictiveChild = dashboardRoute?.children?.find(c => c.name === 'predictive')
      expect(predictiveChild).toBeDefined()
    })

    it('should have user-settings route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const settingsChild = dashboardRoute?.children?.find(c => c.name === 'user-settings')
      expect(settingsChild).toBeDefined()
    })
  })

  describe('admin routes', () => {
    it('should have admin route with children', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const adminChild = dashboardRoute?.children?.find(c => c.name === 'admin')
      expect(adminChild).toBeDefined()
      expect(adminChild?.children?.length).toBeGreaterThan(0)
    })

    it('should have track-management admin route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const adminChild = dashboardRoute?.children?.find(c => c.name === 'admin')
      const trackMgmt = adminChild?.children?.find(c => c.name === 'track-management')
      expect(trackMgmt).toBeDefined()
      expect(trackMgmt?.meta?.requiresAdmin).toBe(true)
    })

    it('should have user-management admin route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const adminChild = dashboardRoute?.children?.find(c => c.name === 'admin')
      const userMgmt = adminChild?.children?.find(c => c.name === 'user-management')
      expect(userMgmt).toBeDefined()
      expect(userMgmt?.meta?.requiresAdmin).toBe(true)
    })

    it('should have eml-upload admin route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const adminChild = dashboardRoute?.children?.find(c => c.name === 'admin')
      const emlUpload = adminChild?.children?.find(c => c.name === 'eml-upload')
      expect(emlUpload).toBeDefined()
      expect(emlUpload?.meta?.requiresAdmin).toBe(true)
    })

    it('should have driver-management admin route', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      const adminChild = dashboardRoute?.children?.find(c => c.name === 'admin')
      const driverMgmt = adminChild?.children?.find(c => c.name === 'driver-management')
      expect(driverMgmt).toBeDefined()
      expect(driverMgmt?.meta?.requiresAdmin).toBe(true)
    })
  })

  describe('route meta', () => {
    it('login route should require guest', () => {
      const loginRoute = router.getRoutes().find(r => r.name === 'login')
      expect(loginRoute?.meta?.requiresGuest).toBe(true)
    })

    it('dashboard route should require auth', () => {
      const dashboardRoute = router.getRoutes().find(r => r.name === 'dashboard')
      expect(dashboardRoute?.meta?.requiresAuth).toBe(true)
    })
  })
})
