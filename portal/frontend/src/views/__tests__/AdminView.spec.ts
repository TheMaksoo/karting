import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminView from '../AdminView.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'settings'
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to']
  }
}))

describe('AdminView', () => {
  const mountComponent = (routeName = 'settings') => {
    vi.mocked(vi.importActual('vue-router')).useRoute = vi.fn(() => ({
      name: routeName
    })) as unknown as typeof vi.importActual

    return mount(AdminView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })
  }

  describe('rendering', () => {
    it('should render without errors', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render admin view container', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.admin-view').exists()).toBe(true)
    })

    it('should render placeholder card', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.placeholder-card').exists()).toBe(true)
    })

    it('should render construction icon', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.placeholder-icon').text()).toBe('🚧')
    })

    it('should render coming soon subtitle', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.subtitle').text()).toBe('This feature is coming soon!')
    })

    it('should render description text', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.description').exists()).toBe(true)
    })
  })

  describe('feature links', () => {
    it('should render feature links section', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.feature-links').exists()).toBe(true)
    })

    it('should have track management link', () => {
      const wrapper = mountComponent()
      const links = wrapper.findAll('.feature-link')
      
      expect(links.length).toBeGreaterThan(0)
    })

    it('should have link icons', () => {
      const wrapper = mountComponent()
      const icons = wrapper.findAll('.link-icon')
      
      expect(icons.length).toBe(2)
    })

    it('should display track icon', () => {
      const wrapper = mountComponent()
      const icons = wrapper.findAll('.link-icon')
      
      expect(icons[0].text()).toBe('🏁')
    })

    it('should display upload icon', () => {
      const wrapper = mountComponent()
      const icons = wrapper.findAll('.link-icon')
      
      expect(icons[1].text()).toBe('📤')
    })
  })

  describe('title computation', () => {
    it('should display Settings title for settings route', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('Settings')
    })
  })
})
