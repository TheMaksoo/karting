import { useToast, TYPE } from 'vue-toastification'

/**
 * Toast notification composable for consistent UI feedback
 */
export function useNotifications() {
  const toast = useToast()

  return {
    /**
     * Show a success notification
     */
    success(message: string, options = {}) {
      toast.success(message, {
        timeout: 3000,
        ...options,
      })
    },

    /**
     * Show an error notification
     */
    error(message: string, options = {}) {
      toast.error(message, {
        timeout: 8000,
        ...options,
      })
    },

    /**
     * Show a warning notification
     */
    warning(message: string, options = {}) {
      toast.warning(message, {
        timeout: 5000,
        ...options,
      })
    },

    /**
     * Show an info notification
     */
    info(message: string, options = {}) {
      toast.info(message, {
        timeout: 4000,
        ...options,
      })
    },

    /**
     * Show API error notification with formatted message
     */
    apiError(error: unknown, fallbackMessage = 'An error occurred') {
      let message = fallbackMessage
      
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>
        
        if (err.response && typeof err.response === 'object') {
          const response = err.response as Record<string, unknown>
          const data = response.data as Record<string, unknown> | undefined
          
          if (data?.message && typeof data.message === 'string') {
            message = data.message
          } else if (data?.error && typeof data.error === 'string') {
            message = data.error
          }
          
          // Handle validation errors
          if (data?.errors && typeof data.errors === 'object') {
            const errors = Object.values(data.errors as Record<string, string[]>)
            message = errors.flat().join(', ')
          }
        } else if (err.message && typeof err.message === 'string') {
          message = err.message
        }
      }
      
      toast.error(message, {
        timeout: 8000,
      })
    },

    /**
     * Show a loading toast that can be updated
     */
    loading(message: string) {
      return toast(message, {
        type: TYPE.DEFAULT,
        timeout: false,
        closeOnClick: false,
        closeButton: false,
        icon: '⏳',
      })
    },

    /**
     * Dismiss a specific toast
     */
    dismiss(toastId: string | number) {
      toast.dismiss(toastId)
    },

    /**
     * Dismiss all toasts
     */
    dismissAll() {
      toast.clear()
    },
  }
}
