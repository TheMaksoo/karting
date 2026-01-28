import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandler } from '../useErrorHandler'

// Mock useNotifications
vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('should handle Error instances', () => {
      const { handleError } = useErrorHandler()
      const error = new Error('Test error message')
      const result = handleError(error)
      expect(result).toBe('Test error message')
    })

    it('should handle string errors', () => {
      const { handleError } = useErrorHandler()
      const result = handleError('String error')
      expect(result).toBe('String error')
    })

    it('should handle object errors with message', () => {
      const { handleError } = useErrorHandler()
      const error = { message: 'Object error message' }
      const result = handleError(error)
      expect(result).toBe('Object error message')
    })

    it('should handle Axios-style errors', () => {
      const { handleError } = useErrorHandler()
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      }
      const result = handleError(error)
      expect(result).toBe('API error message')
    })

    it('should include context when provided', () => {
      const { handleError } = useErrorHandler()
      const error = new Error('Test error')
      const result = handleError(error, 'Loading data')
      expect(result).toBe('Test error')
    })

    it('should handle null/undefined errors', () => {
      const { handleError } = useErrorHandler()
      const result = handleError(null)
      expect(result).toBe('An unexpected error occurred')
    })

    it('should handle undefined errors', () => {
      const { handleError } = useErrorHandler()
      const result = handleError(undefined)
      expect(result).toBe('An unexpected error occurred')
    })
  })

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const { withErrorHandling } = useErrorHandler()
      const result = await withErrorHandling(async () => 'success')
      expect(result).toBe('success')
    })

    it('should return null and handle error on failure', async () => {
      const { withErrorHandling } = useErrorHandler()
      const result = await withErrorHandling(async () => {
        throw new Error('Test failure')
      })
      expect(result).toBeNull()
    })

    it('should pass context to error handler', async () => {
      const { withErrorHandling } = useErrorHandler()
      const result = await withErrorHandling(
        async () => {
          throw new Error('API failed')
        },
        'Fetching tracks'
      )
      expect(result).toBeNull()
    })
  })

  describe('withLoadingAndError', () => {
    it('should set loading to true then false on success', async () => {
      const { withLoadingAndError } = useErrorHandler()
      const setLoading = vi.fn()
      
      await withLoadingAndError(async () => 'result', setLoading)
      
      expect(setLoading).toHaveBeenCalledWith(true)
      expect(setLoading).toHaveBeenCalledWith(false)
      expect(setLoading).toHaveBeenCalledTimes(2)
    })

    it('should set loading to false even on error', async () => {
      const { withLoadingAndError } = useErrorHandler()
      const setLoading = vi.fn()
      
      await withLoadingAndError(
        async () => {
          throw new Error('Failed')
        },
        setLoading
      )
      
      expect(setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should return result on success', async () => {
      const { withLoadingAndError } = useErrorHandler()
      const setLoading = vi.fn()
      
      const result = await withLoadingAndError(async () => ({ data: 'test' }), setLoading)
      
      expect(result).toEqual({ data: 'test' })
    })

    it('should return null on error', async () => {
      const { withLoadingAndError } = useErrorHandler()
      const setLoading = vi.fn()
      
      const result = await withLoadingAndError(
        async () => {
          throw new Error('Error')
        },
        setLoading
      )
      
      expect(result).toBeNull()
    })
  })
})
