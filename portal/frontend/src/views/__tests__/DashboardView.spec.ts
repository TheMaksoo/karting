import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'

// Mock router-view
vi.mock('vue-router', () => ({
  RouterView: {
    name: 'RouterView',
    template: '<div class="router-view-stub">Router View</div>'
  }
}))

// Mock the layout component
vi.mock('@/components/layout/ModernDashboardLayout.vue', () => ({
  default: {
    name: 'ModernDashboardLayout',
    template: '<div class="mock-layout"><slot /></div>'
  }
}))

describe('DashboardView', () => {
  const mountComponent = () => {
    return mount(DashboardView, {
      global: {
        stubs: {
          RouterView: true,
          ModernDashboardLayout: {
            template: '<div class="mock-layout"><slot /></div>'
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

    it('should use ModernDashboardLayout component', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.mock-layout').exists()).toBe(true)
    })

    it('should contain router-view for child routes', () => {
      const wrapper = mountComponent()
      expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
    })
  })

  describe('structure', () => {
    it('should have correct component structure', () => {
      const wrapper = mountComponent()
      const layout = wrapper.find('.mock-layout')
      
      expect(layout.exists()).toBe(true)
    })
  })
})
