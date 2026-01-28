import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '../AboutView.vue'

describe('AboutView', () => {
  const mountComponent = () => {
    return mount(AboutView)
  }

  describe('rendering', () => {
    it('should render without errors', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render about container', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.about').exists()).toBe(true)
    })

    it('should render heading', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('h1').exists()).toBe(true)
    })

    it('should display about page text', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('This is an about page')
    })
  })

  describe('structure', () => {
    it('should have correct component structure', () => {
      const wrapper = mountComponent()
      const aboutDiv = wrapper.find('.about')
      const heading = aboutDiv.find('h1')
      
      expect(heading.exists()).toBe(true)
    })
  })
})
