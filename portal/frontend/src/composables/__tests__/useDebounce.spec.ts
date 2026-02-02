import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce, useDebouncedFn, useDebouncedSearch } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useDebounce', () => {
    it('should return initial value immediately', () => {
      const value = ref('initial')
      const debounced = useDebounce(value)

      expect(debounced.value).toBe('initial')
    })

    it('should debounce value changes', async () => {
      const value = ref('initial')
      const debounced = useDebounce(value, 300)

      value.value = 'changed'
      await nextTick()

      // Value should not have changed yet
      expect(debounced.value).toBe('initial')

      // Advance timer
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debounced.value).toBe('changed')
    })

    it('should use default delay of 300ms', async () => {
      const value = ref('initial')
      const debounced = useDebounce(value)

      value.value = 'changed'
      await nextTick()

      // Should not change before 300ms
      vi.advanceTimersByTime(299)
      await nextTick()
      expect(debounced.value).toBe('initial')

      // Should change at 300ms
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(debounced.value).toBe('changed')
    })

    it('should reset timer on rapid changes', async () => {
      const value = ref('initial')
      const debounced = useDebounce(value, 300)

      value.value = 'first'
      await nextTick()
      vi.advanceTimersByTime(100)

      value.value = 'second'
      await nextTick()
      vi.advanceTimersByTime(100)

      value.value = 'third'
      await nextTick()
      vi.advanceTimersByTime(100)

      // Should still be initial since timer keeps resetting
      expect(debounced.value).toBe('initial')

      // Wait for full delay after last change
      vi.advanceTimersByTime(200)
      await nextTick()

      expect(debounced.value).toBe('third')
    })

    it('should work with number values', async () => {
      const value = ref(0)
      const debounced = useDebounce(value, 100)

      value.value = 42
      await nextTick()

      vi.advanceTimersByTime(100)
      await nextTick()

      expect(debounced.value).toBe(42)
    })

    it('should work with object values', async () => {
      const value = ref({ name: 'initial' })
      const debounced = useDebounce(value, 100)

      value.value = { name: 'updated' }
      await nextTick()

      vi.advanceTimersByTime(100)
      await nextTick()

      expect(debounced.value).toEqual({ name: 'updated' })
    })

    it('should work with custom delay', async () => {
      const value = ref('initial')
      const debounced = useDebounce(value, 500)

      value.value = 'changed'
      await nextTick()

      vi.advanceTimersByTime(400)
      await nextTick()
      expect(debounced.value).toBe('initial')

      vi.advanceTimersByTime(100)
      await nextTick()
      expect(debounced.value).toBe('changed')
    })
  })

  describe('useDebouncedFn', () => {
    it('should return debounced function and cancel method', () => {
      const callback = vi.fn()
      const { debouncedFn, cancel, pending } = useDebouncedFn(callback)

      expect(typeof debouncedFn).toBe('function')
      expect(typeof cancel).toBe('function')
      expect(pending.value).toBe(false)
    })

    it('should debounce function calls', async () => {
      const callback = vi.fn()
      const { debouncedFn } = useDebouncedFn(callback, 300)

      debouncedFn()
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to callback', async () => {
      const callback = vi.fn()
      const { debouncedFn } = useDebouncedFn(callback, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should set pending to true during debounce', async () => {
      const callback = vi.fn()
      const { debouncedFn, pending } = useDebouncedFn(callback, 300)

      expect(pending.value).toBe(false)

      debouncedFn()
      expect(pending.value).toBe(true)

      vi.advanceTimersByTime(300)
      expect(pending.value).toBe(false)
    })

    it('should cancel pending call', async () => {
      const callback = vi.fn()
      const { debouncedFn, cancel, pending } = useDebouncedFn(callback, 300)

      debouncedFn()
      expect(pending.value).toBe(true)

      cancel()
      expect(pending.value).toBe(false)

      vi.advanceTimersByTime(300)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should reset timer on repeated calls', async () => {
      const callback = vi.fn()
      const { debouncedFn } = useDebouncedFn(callback, 300)

      debouncedFn()
      vi.advanceTimersByTime(200)

      debouncedFn()
      vi.advanceTimersByTime(200)

      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should use default delay of 300ms', async () => {
      const callback = vi.fn()
      const { debouncedFn } = useDebouncedFn(callback)

      debouncedFn()
      vi.advanceTimersByTime(299)
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle cancel when no pending call', () => {
      const callback = vi.fn()
      const { cancel, pending } = useDebouncedFn(callback, 300)

      // Should not throw
      expect(() => cancel()).not.toThrow()
      expect(pending.value).toBe(false)
    })
  })

  describe('useDebouncedSearch', () => {
    it('should return search value, debounced value, and clear function', () => {
      const { searchValue, debouncedSearch, isSearching, clear } = useDebouncedSearch()

      expect(searchValue.value).toBe('')
      expect(debouncedSearch.value).toBe('')
      expect(isSearching.value).toBe(false)
      expect(typeof clear).toBe('function')
    })

    it('should use initial value', () => {
      const { searchValue, debouncedSearch } = useDebouncedSearch('initial query')

      expect(searchValue.value).toBe('initial query')
      expect(debouncedSearch.value).toBe('initial query')
    })

    it('should debounce search value', async () => {
      const { searchValue, debouncedSearch } = useDebouncedSearch('', 300)

      searchValue.value = 'search term'
      await nextTick()

      expect(debouncedSearch.value).toBe('')

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedSearch.value).toBe('search term')
    })

    it('should set isSearching during debounce', async () => {
      const { searchValue, isSearching } = useDebouncedSearch('', 300)

      expect(isSearching.value).toBe(false)

      searchValue.value = 'search'
      await nextTick()

      expect(isSearching.value).toBe(true)

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(isSearching.value).toBe(false)
    })

    it('should clear search value', async () => {
      const { searchValue, clear } = useDebouncedSearch('initial')

      expect(searchValue.value).toBe('initial')

      clear()
      expect(searchValue.value).toBe('')
    })

    it('should use custom delay', async () => {
      const { searchValue, debouncedSearch } = useDebouncedSearch('', 500)

      searchValue.value = 'query'
      await nextTick()

      vi.advanceTimersByTime(400)
      await nextTick()
      expect(debouncedSearch.value).toBe('')

      vi.advanceTimersByTime(100)
      await nextTick()
      expect(debouncedSearch.value).toBe('query')
    })
  })
})
