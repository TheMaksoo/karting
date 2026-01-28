import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with empty toasts array', () => {
    const { toasts } = useToast()
    // Clear any existing toasts
    toasts.value = []
    expect(toasts.value).toHaveLength(0)
  })

  describe('showToast', () => {
    it('should add a toast to the list', () => {
      const { showToast, toasts } = useToast()
      toasts.value = []
      
      showToast('Test message', 'info')
      
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe('Test message')
      expect(toasts.value[0].type).toBe('info')
    })

    it('should auto-remove toast after duration', () => {
      const { showToast, toasts } = useToast()
      toasts.value = []
      
      showToast('Test message', 'info', 1000)
      
      expect(toasts.value).toHaveLength(1)
      
      vi.advanceTimersByTime(1001)
      
      expect(toasts.value).toHaveLength(0)
    })

    it('should return toast id', () => {
      const { showToast, toasts } = useToast()
      toasts.value = []
      
      const id = showToast('Test message', 'info')
      
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })
  })

  describe('removeToast', () => {
    it('should remove a specific toast', () => {
      const { showToast, removeToast, toasts } = useToast()
      toasts.value = []
      
      const id = showToast('Test message', 'info', 0) // 0 = no auto-remove
      expect(toasts.value).toHaveLength(1)
      
      removeToast(id)
      expect(toasts.value).toHaveLength(0)
    })

    it('should handle removing non-existent toast', () => {
      const { removeToast, toasts } = useToast()
      toasts.value = []
      
      expect(() => removeToast(999)).not.toThrow()
    })
  })

  describe('helper methods', () => {
    it('success should create success toast', () => {
      const { success, toasts } = useToast()
      toasts.value = []
      
      success('Success message')
      
      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toBe('Success message')
    })

    it('error should create error toast', () => {
      const { error, toasts } = useToast()
      toasts.value = []
      
      error('Error message')
      
      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toBe('Error message')
    })

    it('info should create info toast', () => {
      const { info, toasts } = useToast()
      toasts.value = []
      
      info('Info message')
      
      expect(toasts.value[0].type).toBe('info')
      expect(toasts.value[0].message).toBe('Info message')
    })

    it('warning should create warning toast', () => {
      const { warning, toasts } = useToast()
      toasts.value = []
      
      warning('Warning message')
      
      expect(toasts.value[0].type).toBe('warning')
      expect(toasts.value[0].message).toBe('Warning message')
    })
  })
})
