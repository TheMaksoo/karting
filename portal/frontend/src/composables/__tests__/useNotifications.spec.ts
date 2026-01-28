import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotifications } from '../useNotifications'

// Mock vue-toastification
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  clear: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
  TYPE: {
    DEFAULT: 'default',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
}))

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('success', () => {
    it('should call toast.success with message', () => {
      const notifications = useNotifications()
      notifications.success('Test success message')
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Test success message',
        expect.objectContaining({ timeout: 3000 })
      )
    })

    it('should accept custom options', () => {
      const notifications = useNotifications()
      notifications.success('Custom success', { timeout: 5000 })
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Custom success',
        expect.objectContaining({ timeout: 5000 })
      )
    })
  })

  describe('error', () => {
    it('should call toast.error with message', () => {
      const notifications = useNotifications()
      notifications.error('Test error message')
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Test error message',
        expect.objectContaining({ timeout: 8000 })
      )
    })

    it('should use longer timeout for errors', () => {
      const notifications = useNotifications()
      notifications.error('Error message')
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error message',
        expect.objectContaining({ timeout: 8000 })
      )
    })
  })

  describe('warning', () => {
    it('should call toast.warning with message', () => {
      const notifications = useNotifications()
      notifications.warning('Test warning message')
      
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Test warning message',
        expect.objectContaining({ timeout: 5000 })
      )
    })
  })

  describe('info', () => {
    it('should call toast.info with message', () => {
      const notifications = useNotifications()
      notifications.info('Test info message')
      
      expect(mockToast.info).toHaveBeenCalledWith(
        'Test info message',
        expect.objectContaining({ timeout: 4000 })
      )
    })
  })

  describe('apiError', () => {
    it('should use fallback message when error is null', () => {
      const notifications = useNotifications()
      notifications.apiError(null, 'Fallback message')
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Fallback message',
        expect.any(Object)
      )
    })

    it('should use fallback message when error is undefined', () => {
      const notifications = useNotifications()
      notifications.apiError(undefined)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'An error occurred',
        expect.any(Object)
      )
    })

    it('should extract message from axios error response', () => {
      const notifications = useNotifications()
      const axiosError = {
        response: {
          data: {
            message: 'Server error message'
          }
        }
      }
      
      notifications.apiError(axiosError)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Server error message',
        expect.any(Object)
      )
    })

    it('should extract error from response.data.error', () => {
      const notifications = useNotifications()
      const axiosError = {
        response: {
          data: {
            error: 'Custom error field'
          }
        }
      }
      
      notifications.apiError(axiosError)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom error field',
        expect.any(Object)
      )
    })

    it('should handle validation errors', () => {
      const notifications = useNotifications()
      const axiosError = {
        response: {
          data: {
            errors: {
              email: ['Email is required', 'Email must be valid'],
              name: ['Name is required']
            }
          }
        }
      }
      
      notifications.apiError(axiosError)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('required'),
        expect.any(Object)
      )
    })

    it('should use error.message as fallback', () => {
      const notifications = useNotifications()
      const error = {
        message: 'Network error'
      }
      
      notifications.apiError(error)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Network error',
        expect.any(Object)
      )
    })
  })

  describe('return type', () => {
    it('should return object with expected methods', () => {
      const notifications = useNotifications()
      
      expect(typeof notifications.success).toBe('function')
      expect(typeof notifications.error).toBe('function')
      expect(typeof notifications.warning).toBe('function')
      expect(typeof notifications.info).toBe('function')
      expect(typeof notifications.apiError).toBe('function')
    })

    it('should have loading method', () => {
      const notifications = useNotifications()
      expect(typeof notifications.loading).toBe('function')
    })

    it('should have dismiss method', () => {
      const notifications = useNotifications()
      expect(typeof notifications.dismiss).toBe('function')
    })

    it('should have dismissAll method', () => {
      const notifications = useNotifications()
      expect(typeof notifications.dismissAll).toBe('function')
    })
  })
})
