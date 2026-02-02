import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isAxiosError,
  getAxiosErrorResponse,
  getErrorMessage,
  useErrorHandler,
} from '../useErrorHandler'

// Mock useNotifications
vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAxiosError', () => {
    it('should return true for axios-like errors', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      }

      expect(isAxiosError(axiosError)).toBe(true)
    })

    it('should return false for regular Error objects', () => {
      const error = new Error('Regular error')
      expect(isAxiosError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAxiosError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAxiosError(undefined)).toBe(false)
    })

    it('should return false for strings', () => {
      expect(isAxiosError('error string')).toBe(false)
    })

    it('should return false for numbers', () => {
      expect(isAxiosError(500)).toBe(false)
    })

    it('should return false for objects without response', () => {
      expect(isAxiosError({ message: 'error' })).toBe(false)
    })

    it('should return true for objects with response property', () => {
      expect(isAxiosError({ response: {} })).toBe(true)
    })
  })

  describe('getAxiosErrorResponse', () => {
    it('should return response for axios-like errors', () => {
      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      }

      const response = getAxiosErrorResponse(axiosError)

      expect(response).toEqual({
        status: 404,
        data: { message: 'Not found' },
      })
    })

    it('should return undefined for non-axios errors', () => {
      const error = new Error('Regular error')
      expect(getAxiosErrorResponse(error)).toBeUndefined()
    })

    it('should return undefined for null', () => {
      expect(getAxiosErrorResponse(null)).toBeUndefined()
    })

    it('should return undefined for string errors', () => {
      expect(getAxiosErrorResponse('error')).toBeUndefined()
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('This is an error message')
      expect(getErrorMessage(error)).toBe('This is an error message')
    })

    it('should return string errors directly', () => {
      expect(getErrorMessage('Direct error string')).toBe('Direct error string')
    })

    it('should extract message from axios errors', () => {
      const axiosError = {
        response: {
          data: { message: 'Server error occurred' },
        },
      }
      expect(getErrorMessage(axiosError)).toBe('Server error occurred')
    })

    it('should fallback to error.message for axios errors without response message', () => {
      const axiosError = {
        response: { data: {} },
        message: 'Network error',
      }
      expect(getErrorMessage(axiosError)).toBe('Network error')
    })

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred')
      expect(getErrorMessage(123)).toBe('An unexpected error occurred')
      expect(getErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
    })

    it('should handle axios error with only response property', () => {
      const axiosError = { response: {} }
      expect(getErrorMessage(axiosError)).toBe('Unknown error')
    })
  })

  describe('useErrorHandler composable', () => {
    describe('handleError', () => {
      it('should handle Error objects', () => {
        const { handleError } = useErrorHandler()
        const result = handleError(new Error('Test error'))
        expect(result).toBe('Test error')
      })

      it('should handle string errors', () => {
        const { handleError } = useErrorHandler()
        const result = handleError('String error')
        expect(result).toBe('String error')
      })

      it('should handle axios-like errors', () => {
        const { handleError } = useErrorHandler()
        const axiosError = {
          response: { data: { message: 'API error' } },
        }
        const result = handleError(axiosError)
        expect(result).toBe('API error')
      })

      it('should include context in error message', () => {
        const { handleError } = useErrorHandler()
        const result = handleError(new Error('Test error'), 'Context')
        expect(result).toBe('Test error')
      })

      it('should handle unknown error types', () => {
        const { handleError } = useErrorHandler()
        const result = handleError({ weird: 'object' })
        expect(result).toBe('An unexpected error occurred')
      })
    })

    describe('withErrorHandling', () => {
      it('should return result on success', async () => {
        const { withErrorHandling } = useErrorHandler()
        const result = await withErrorHandling(async () => 'success')
        expect(result).toBe('success')
      })

      it('should return null on error', async () => {
        const { withErrorHandling } = useErrorHandler()
        const result = await withErrorHandling(async () => {
          throw new Error('Failed')
        })
        expect(result).toBeNull()
      })

      it('should work with complex return types', async () => {
        const { withErrorHandling } = useErrorHandler()
        const result = await withErrorHandling(async () => ({
          data: [1, 2, 3],
          total: 3,
        }))
        expect(result).toEqual({ data: [1, 2, 3], total: 3 })
      })

      it('should handle async errors with context', async () => {
        const { withErrorHandling } = useErrorHandler()
        const result = await withErrorHandling(async () => {
          throw new Error('Async error')
        }, 'Loading data')
        expect(result).toBeNull()
      })
    })

    describe('withLoadingAndError', () => {
      it('should set loading to true then false on success', async () => {
        const { withLoadingAndError } = useErrorHandler()
        const loadingStates: boolean[] = []
        const setLoading = (state: boolean) => loadingStates.push(state)

        await withLoadingAndError(async () => 'success', setLoading)

        expect(loadingStates).toEqual([true, false])
      })

      it('should set loading to false on error', async () => {
        const { withLoadingAndError } = useErrorHandler()
        const loadingStates: boolean[] = []
        const setLoading = (state: boolean) => loadingStates.push(state)

        await withLoadingAndError(async () => {
          throw new Error('Failed')
        }, setLoading)

        expect(loadingStates).toEqual([true, false])
      })

      it('should return result on success', async () => {
        const { withLoadingAndError } = useErrorHandler()
        const setLoading = vi.fn()

        const result = await withLoadingAndError(async () => ({ id: 1 }), setLoading)

        expect(result).toEqual({ id: 1 })
      })

      it('should return null on error', async () => {
        const { withLoadingAndError } = useErrorHandler()
        const setLoading = vi.fn()

        const result = await withLoadingAndError(async () => {
          throw new Error('Error')
        }, setLoading)

        expect(result).toBeNull()
      })

      it('should work with context parameter', async () => {
        const { withLoadingAndError } = useErrorHandler()
        const setLoading = vi.fn()

        const result = await withLoadingAndError(
          async () => {
            throw new Error('Error')
          },
          setLoading,
          'Fetching data'
        )

        expect(result).toBeNull()
      })
    })
  })
})
