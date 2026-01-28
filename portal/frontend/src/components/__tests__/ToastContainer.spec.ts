import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ToastContainer from '../ToastContainer.vue'

// Mock useToast composable
const mockToasts = ref<Array<{ id: string; type: string; message: string }>>([])
const mockRemoveToast = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toasts: mockToasts,
    removeToast: mockRemoveToast
  })
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToasts.value = []
  })

  describe('rendering', () => {
    it('should render container element', () => {
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      expect(wrapper.find('.toast-container').exists()).toBe(true)
    })

    it('should render no toasts when array is empty', () => {
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      expect(wrapper.findAll('.toast')).toHaveLength(0)
    })

    it('should render toasts from array', async () => {
      mockToasts.value = [
        { id: '1', type: 'success', message: 'Success message' },
        { id: '2', type: 'error', message: 'Error message' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts).toHaveLength(2)
    })

    it('should render toast messages', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Test message' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-message').text()).toBe('Test message')
    })
  })

  describe('toast types', () => {
    it('should apply success class for success type', async () => {
      mockToasts.value = [
        { id: '1', type: 'success', message: 'Success!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-success').exists()).toBe(true)
    })

    it('should apply error class for error type', async () => {
      mockToasts.value = [
        { id: '1', type: 'error', message: 'Error!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-error').exists()).toBe(true)
    })

    it('should apply warning class for warning type', async () => {
      mockToasts.value = [
        { id: '1', type: 'warning', message: 'Warning!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-warning').exists()).toBe(true)
    })

    it('should apply info class for info type', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Info!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-info').exists()).toBe(true)
    })
  })

  describe('icons', () => {
    it('should show success icon for success toast', async () => {
      mockToasts.value = [
        { id: '1', type: 'success', message: 'Success!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-icon').text()).toBe('✓')
    })

    it('should show error icon for error toast', async () => {
      mockToasts.value = [
        { id: '1', type: 'error', message: 'Error!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-icon').text()).toBe('⚠️')
    })

    it('should show warning icon for warning toast', async () => {
      mockToasts.value = [
        { id: '1', type: 'warning', message: 'Warning!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-icon').text()).toBe('⚠')
    })

    it('should show info icon for info toast', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Info!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-icon').text()).toBe('ℹ')
    })

    it('should show default icon for unknown type', async () => {
      mockToasts.value = [
        { id: '1', type: 'unknown', message: 'Unknown!' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-icon').text()).toBe('ℹ')
    })
  })

  describe('close functionality', () => {
    it('should have close button', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Test' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-close').exists()).toBe(true)
    })

    it('should call removeToast when close button clicked', async () => {
      mockToasts.value = [
        { id: 'toast-1', type: 'info', message: 'Test' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      await wrapper.find('.toast-close').trigger('click')
      
      expect(mockRemoveToast).toHaveBeenCalledWith('toast-1')
    })
  })

  describe('accessibility', () => {
    it('should have aria-live attribute on container', () => {
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      expect(wrapper.find('.toast-container').attributes('aria-live')).toBe('polite')
    })

    it('should have aria-atomic attribute on container', () => {
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      expect(wrapper.find('.toast-container').attributes('aria-atomic')).toBe('true')
    })

    it('should have role="alert" on toasts', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Test' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast').attributes('role')).toBe('alert')
    })

    it('should have aria-label on close button', async () => {
      mockToasts.value = [
        { id: '1', type: 'info', message: 'Test' }
      ]
      
      const wrapper = mount(ToastContainer, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.toast-close').attributes('aria-label')).toBe('Close notification')
    })
  })
})
