import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import apiService from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    changePassword: vi.fn(),
    clearAuth: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with null user', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('should start with loading false', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
    })

    it('should start with no error', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('isAuthenticated returns false when no user', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated returns true when user exists', () => {
      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' }
      expect(store.isAuthenticated).toBe(true)
    })

    it('isAdmin returns true for admin role', () => {
      const store = useAuthStore()
      store.user = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }
      expect(store.isAdmin).toBe(true)
    })

    it('isAdmin returns false for driver role', () => {
      const store = useAuthStore()
      store.user = { id: 1, name: 'Driver', email: 'driver@test.com', role: 'driver' }
      expect(store.isAdmin).toBe(false)
    })

    it('mustChangePassword returns true when flag is set', () => {
      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver', must_change_password: true }
      expect(store.mustChangePassword).toBe(true)
    })
  })

  describe('login', () => {
    it('should call apiService.login with credentials', async () => {
      const mockResponse = {
        user: { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' },
        token: 'test-token',
      }
      vi.mocked(apiService.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login('test@test.com', 'password')

      expect(apiService.login).toHaveBeenCalledWith('test@test.com', 'password')
    })

    it('should set user on successful login', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' as const }
      vi.mocked(apiService.login).mockResolvedValue({ user: mockUser, token: 'test-token' })

      const store = useAuthStore()
      await store.login('test@test.com', 'password')

      expect(store.user).toEqual(mockUser)
    })

    it('should set loading during login', async () => {
      vi.mocked(apiService.login).mockImplementation(() => new Promise(() => {}))

      const store = useAuthStore()
      store.login('test@test.com', 'password')

      expect(store.loading).toBe(true)
    })

    it('should set error on login failure', async () => {
      vi.mocked(apiService.login).mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      })

      const store = useAuthStore()
      
      await expect(store.login('test@test.com', 'wrong')).rejects.toBeDefined()
      expect(store.error).toBe('Invalid credentials')
    })
  })

  describe('fetchCurrentUser', () => {
    it('should not fetch if not authenticated', async () => {
      vi.mocked(apiService.isAuthenticated).mockReturnValue(false)

      const store = useAuthStore()
      await store.fetchCurrentUser()

      expect(apiService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should fetch user if authenticated', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' as const }
      vi.mocked(apiService.isAuthenticated).mockReturnValue(true)
      vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser)

      const store = useAuthStore()
      await store.fetchCurrentUser()

      expect(store.user).toEqual(mockUser)
    })
  })

  describe('changePassword', () => {
    it('should call apiService.changePassword', async () => {
      vi.mocked(apiService.changePassword).mockResolvedValue(undefined)

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver', must_change_password: true }
      
      await store.changePassword('old', 'new')

      expect(apiService.changePassword).toHaveBeenCalledWith({
        current_password: 'old',
        new_password: 'new',
        new_password_confirmation: 'new',
      })
    })

    it('should clear must_change_password flag after success', async () => {
      vi.mocked(apiService.changePassword).mockResolvedValue(undefined)

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver', must_change_password: true }
      
      await store.changePassword('old', 'new')

      expect(store.user?.must_change_password).toBe(false)
    })

    it('should set error on password change failure', async () => {
      vi.mocked(apiService.changePassword).mockRejectedValue({
        response: { data: { message: 'Current password is incorrect' } },
      })

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' }

      await expect(store.changePassword('wrong', 'new')).rejects.toBeDefined()
      expect(store.error).toBe('Current password is incorrect')
    })

    it('should set loading during password change', async () => {
      vi.mocked(apiService.changePassword).mockImplementation(() => new Promise(() => {}))

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' }
      store.changePassword('old', 'new')

      expect(store.loading).toBe(true)
    })
  })

  describe('logout', () => {
    it('should call apiService.logout', async () => {
      vi.mocked(apiService.logout).mockResolvedValue(undefined)
      
      // Mock window.location
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      })

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' }
      
      await store.logout()

      expect(apiService.logout).toHaveBeenCalled()
      expect(apiService.clearAuth).toHaveBeenCalled()
      expect(store.user).toBeNull()
      
      // Restore
      Object.defineProperty(window, 'location', { value: originalLocation })
    })

    it('should clear user even if logout fails', async () => {
      vi.mocked(apiService.logout).mockRejectedValue(new Error('Network error'))
      
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      })

      const store = useAuthStore()
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'driver' }
      
      await store.logout()

      expect(store.user).toBeNull()
      expect(apiService.clearAuth).toHaveBeenCalled()
      
      Object.defineProperty(window, 'location', { value: originalLocation })
    })
  })

  describe('fetchCurrentUser error handling', () => {
    it('should clear auth on 401 response', async () => {
      vi.mocked(apiService.isAuthenticated).mockReturnValue(true)
      vi.mocked(apiService.getCurrentUser).mockRejectedValue({
        response: { status: 401 },
      })

      const store = useAuthStore()
      await store.fetchCurrentUser()

      expect(apiService.clearAuth).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })

    it('should set user to null on other errors', async () => {
      vi.mocked(apiService.isAuthenticated).mockReturnValue(true)
      vi.mocked(apiService.getCurrentUser).mockRejectedValue(new Error('Network error'))

      const store = useAuthStore()
      await store.fetchCurrentUser()

      expect(store.user).toBeNull()
    })
  })
})
