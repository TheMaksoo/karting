import { useNotifications } from './useNotifications'

/**
 * Interface for axios-like error responses
 */
interface AxiosLikeError {
  response?: {
    status?: number
    data?: {
      message?: string
      errors?: string[] | Record<string, string[]>
      duplicate_file?: boolean
      existing_upload?: unknown
    }
  }
  message?: string
}

/**
 * Type guard to check if error is an axios-like error
 */
export function isAxiosError(error: unknown): error is AxiosLikeError {
  return typeof error === 'object' && error !== null && 'response' in error
}

/**
 * Get the response data from an axios error
 */
export function getAxiosErrorResponse(error: unknown): AxiosLikeError['response'] | undefined {
  if (isAxiosError(error)) {
    return error.response
  }
  return undefined
}

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Unknown error'
  }
  return 'An unexpected error occurred'
}

/**
 * Shared error handler composable
 * Reduces code duplication and fixes 'any' type usage
 */
export function useErrorHandler() {
  const { showError } = useNotifications()

  /**
   * Handle API errors with proper typing
   */
  const handleError = (error: unknown, context?: string): string => {
    let message = 'An unexpected error occurred'

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object') {
      // Handle Axios/fetch error responses
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      message = err.response?.data?.message || err.message || message
    }

    const fullMessage = context ? `${context}: ${message}` : message
    
    // Use the notification system instead of console.error
    showError(fullMessage)
    
    return message
  }

  /**
   * Handle async operations with automatic error handling
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error: unknown) {
      handleError(error, context)
      return null
    }
  }

  /**
   * Wrap a function with loading state and error handling
   */
  const withLoadingAndError = async <T>(
    operation: () => Promise<T>,
    setLoading: (loading: boolean) => void,
    context?: string
  ): Promise<T | null> => {
    setLoading(true)
    try {
      return await operation()
    } catch (error: unknown) {
      handleError(error, context)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    handleError,
    withErrorHandling,
    withLoadingAndError,
  }
}
