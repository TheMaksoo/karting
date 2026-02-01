/**
 * Optimistic Updates Composable - Instant UI updates before API confirmation.
 *
 * @module composables/useOptimisticUpdate
 */

import { ref, type Ref } from 'vue'

/**
 * Options for optimistic updates.
 */
export interface OptimisticUpdateOptions<T> {
  /** The reactive data to update */
  data: Ref<T>
  /** Function to apply the optimistic update */
  update: (data: T) => T
  /** API call to perform */
  apiCall: () => Promise<unknown>
  /** Optional callback on success */
  onSuccess?: () => void
  /** Optional callback on error */
  onError?: (error: Error) => void
  /** Delay before rolling back on error (ms) */
  rollbackDelay?: number
}

/**
 * State for tracking pending updates.
 */
export interface OptimisticState {
  isPending: boolean
  error: Error | null
}

/**
 * Optimistic updates composable for instant UI feedback.
 *
 * @returns Optimistic update utilities
 *
 * @example
 * ```vue
 * <script setup>
 * import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'
 *
 * const drivers = ref([{ id: 1, name: 'Max' }])
 *
 * const { execute, isPending, error } = useOptimisticUpdate()
 *
 * async function deleteDriver(id: number) {
 *   await execute({
 *     data: drivers,
 *     update: (data) => data.filter(d => d.id !== id),
 *     apiCall: () => api.drivers.delete(id)
 *   })
 * }
 * </script>
 * ```
 */
export function useOptimisticUpdate() {
  const isPending = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Execute an optimistic update.
   *
   * @param options - Update options
   */
  async function execute<T>(options: OptimisticUpdateOptions<T>): Promise<void> {
    const { data, update, apiCall, onSuccess, onError, rollbackDelay = 0 } = options

    // Store original value for rollback
    const originalValue = JSON.parse(JSON.stringify(data.value))

    // Apply optimistic update immediately
    data.value = update(data.value)

    isPending.value = true
    error.value = null

    try {
      // Perform the actual API call
      await apiCall()

      isPending.value = false
      onSuccess?.()
    } catch (err) {
      // Rollback on error
      const rollback = () => {
        data.value = originalValue
        isPending.value = false
        error.value = err instanceof Error ? err : new Error(String(err))
        onError?.(error.value)
      }

      if (rollbackDelay > 0) {
        setTimeout(rollback, rollbackDelay)
      } else {
        rollback()
      }
    }
  }

  /**
   * Execute an optimistic update for array operations.
   *
   * @param options - Update options for array
   */
  async function executeArray<T>(options: {
    data: Ref<T[]>
    type: 'add' | 'update' | 'delete'
    item: T
    idKey?: keyof T
    apiCall: () => Promise<T | void>
    onSuccess?: (result?: T) => void
    onError?: (error: Error) => void
  }): Promise<void> {
    const { data, type, item, idKey = 'id' as keyof T, apiCall, onSuccess, onError } = options

    const originalValue = [...data.value]

    // Apply optimistic update
    switch (type) {
      case 'add':
        data.value = [...data.value, item]
        break
      case 'update': {
        const index = data.value.findIndex((i) => i[idKey] === item[idKey])
        if (index >= 0) {
          data.value = [...data.value.slice(0, index), item, ...data.value.slice(index + 1)]
        }
        break
      }
      case 'delete':
        data.value = data.value.filter((i) => i[idKey] !== item[idKey])
        break
    }

    isPending.value = true
    error.value = null

    try {
      const result = await apiCall()
      isPending.value = false

      // Update with server response if available (for created items with new IDs)
      if (type === 'add' && result) {
        const index = data.value.length - 1
        data.value = [...data.value.slice(0, index), result as T, ...data.value.slice(index + 1)]
      }

      onSuccess?.(result as T | undefined)
    } catch (err) {
      // Rollback
      data.value = originalValue
      isPending.value = false
      error.value = err instanceof Error ? err : new Error(String(err))
      onError?.(error.value)
    }
  }

  return {
    /** Whether an update is pending */
    isPending,
    /** Last error that occurred */
    error,
    /** Execute an optimistic update */
    execute,
    /** Execute an optimistic array update */
    executeArray,
  }
}

export default useOptimisticUpdate
