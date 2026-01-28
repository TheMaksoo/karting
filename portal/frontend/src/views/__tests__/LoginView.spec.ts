import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import LoginView from '../LoginView.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }),
  TYPE: {
    DEFAULT: 'default',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
}))

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (options = {}) => {
    return mount(LoginView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: null,
                loading: false,
                error: null
              }
            }
          })
        ]
      },
      ...options
    })
  }

  describe('rendering', () => {
    it('should render login form', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.login-form').exists()).toBe(true)
    })

    it('should render email input', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('input#email').exists()).toBe(true)
    })

    it('should render password input', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('input#password').exists()).toBe(true)
    })

    it('should render login button', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.login-button').exists()).toBe(true)
    })

    it('should render logo section', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.logo-section').exists()).toBe(true)
    })

    it('should render karting dashboard title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('Karting Dashboard')
    })

    it('should render help text', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.help-text').exists()).toBe(true)
    })
  })

  describe('form inputs', () => {
    it('should update email on input', async () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('input#email')
      
      await emailInput.setValue('test@example.com')
      
      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
    })

    it('should update password on input', async () => {
      const wrapper = mountComponent()
      const passwordInput = wrapper.find('input#password')
      
      await passwordInput.setValue('password123')
      
      expect((passwordInput.element as HTMLInputElement).value).toBe('password123')
    })

    it('should have email type on email input', () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('input#email')
      
      expect(emailInput.attributes('type')).toBe('email')
    })

    it('should have password type on password input', () => {
      const wrapper = mountComponent()
      const passwordInput = wrapper.find('input#password')
      
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('should have required attribute on email input', () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('input#email')
      
      expect(emailInput.attributes('required')).toBeDefined()
    })

    it('should have required attribute on password input', () => {
      const wrapper = mountComponent()
      const passwordInput = wrapper.find('input#password')
      
      expect(passwordInput.attributes('required')).toBeDefined()
    })
  })

  describe('button states', () => {
    it('should show "Login" text when not loading', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.button-text').text()).toBe('Login')
    })

    it('should not be disabled when not loading', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.login-button')
      
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  describe('accessibility', () => {
    it('should have labels for inputs', () => {
      const wrapper = mountComponent()
      
      expect(wrapper.find('label[for="email"]').exists()).toBe(true)
      expect(wrapper.find('label[for="password"]').exists()).toBe(true)
    })

    it('should have autocomplete attributes', () => {
      const wrapper = mountComponent()
      
      expect(wrapper.find('input#email').attributes('autocomplete')).toBe('email')
      expect(wrapper.find('input#password').attributes('autocomplete')).toBe('current-password')
    })

    it('should have placeholder text', () => {
      const wrapper = mountComponent()
      
      expect(wrapper.find('input#email').attributes('placeholder')).toBe('your@email.com')
      expect(wrapper.find('input#password').attributes('placeholder')).toBe('••••••••')
    })
  })

  describe('visual elements', () => {
    it('should render racing lines background', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.racing-lines').exists()).toBe(true)
    })

    it('should render floating shapes', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.floating-shapes').exists()).toBe(true)
    })

    it('should render logo icon', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.logo-icon').text()).toBe('🏎️')
    })
  })
})
