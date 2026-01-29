import { ref, watch, type Ref } from 'vue'

/**
 * Composable for debouncing reactive values
 * @param value - The reactive value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A debounced ref that updates after the delay
 */
export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
      timeoutId = null
    }, delay)
  })

  return debouncedValue
}

/**
 * Composable for creating a debounced callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced function and cancel method
 */
export function useDebouncedFn<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300
): {
  debouncedFn: (...args: Parameters<T>) => void
  cancel: () => void
  pending: Ref<boolean>
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const pending = ref(false)

  const debouncedFn = (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    pending.value = true

    timeoutId = setTimeout(() => {
      callback(...args)
      pending.value = false
      timeoutId = null
    }, delay)
  }

  const cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      pending.value = false
    }
  }

  return { debouncedFn, cancel, pending }
}

/**
 * Composable for debounced search input
 * @param initialValue - Initial search value (default: '')
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Search value, debounced value, and clear function
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const searchValue = ref(initialValue)
  const debouncedSearch = useDebounce(searchValue, delay)
  const isSearching = ref(false)

  watch(searchValue, () => {
    isSearching.value = true
  })

  watch(debouncedSearch, () => {
    isSearching.value = false
  })

  const clear = (): void => {
    searchValue.value = ''
  }

  return {
    searchValue,
    debouncedSearch,
    isSearching,
    clear,
  }
}
