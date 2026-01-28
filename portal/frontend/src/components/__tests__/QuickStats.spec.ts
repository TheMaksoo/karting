import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickStats from '../QuickStats.vue'

describe('QuickStats', () => {
  const mockStatCategories = [
    {
      title: 'Performance',
      stats: [
        {
          icon: '🏎️',
          label: 'Total Laps',
          value: 150,
          color: 'linear-gradient(135deg, #3498db, #2980b9)',
          tooltip: 'Total laps completed'
        },
        {
          icon: '⏱️',
          label: 'Best Time',
          value: '42.5s',
          color: 'linear-gradient(135deg, #2ecc71, #27ae60)',
          tooltip: 'Personal best lap time'
        }
      ]
    },
    {
      title: 'Statistics',
      stats: [
        {
          icon: '📊',
          label: 'Sessions',
          value: 25,
          color: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
          tooltip: 'Total sessions'
        }
      ]
    }
  ]

  describe('rendering', () => {
    it('should render without errors', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('should render all categories', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const categories = wrapper.findAll('.stat-category')
      expect(categories).toHaveLength(2)
    })

    it('should render category titles', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const titles = wrapper.findAll('.category-title')
      expect(titles[0].text()).toBe('Performance')
      expect(titles[1].text()).toBe('Statistics')
    })

    it('should render all stat cards', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const cards = wrapper.findAll('.stat-card')
      expect(cards).toHaveLength(3)
    })

    it('should render stat icons', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const icons = wrapper.findAll('.stat-icon')
      expect(icons[0].text()).toBe('🏎️')
      expect(icons[1].text()).toBe('⏱️')
      expect(icons[2].text()).toBe('📊')
    })

    it('should render stat values', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const values = wrapper.findAll('.stat-value')
      expect(values[0].text()).toBe('150')
      expect(values[1].text()).toBe('42.5s')
      expect(values[2].text()).toBe('25')
    })

    it('should render stat labels', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const labels = wrapper.findAll('.stat-label')
      expect(labels[0].text()).toBe('Total Laps')
      expect(labels[1].text()).toBe('Best Time')
      expect(labels[2].text()).toBe('Sessions')
    })
  })

  describe('styling', () => {
    it('should apply background color to stat cards', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const cards = wrapper.findAll('.stat-card')
      expect(cards[0].attributes('style')).toContain('background')
    })

    it('should apply tooltip to stat cards', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: mockStatCategories
        }
      })
      
      const cards = wrapper.findAll('.stat-card')
      expect(cards[0].attributes('title')).toBe('Total laps completed')
    })
  })

  describe('empty state', () => {
    it('should handle empty categories array', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: []
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findAll('.stat-category')).toHaveLength(0)
    })

    it('should handle category with empty stats', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: [
            {
              title: 'Empty Category',
              stats: []
            }
          ]
        }
      })
      
      expect(wrapper.findAll('.stat-category')).toHaveLength(1)
      expect(wrapper.findAll('.stat-card')).toHaveLength(0)
    })
  })

  describe('data types', () => {
    it('should handle numeric values', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: [
            {
              title: 'Numbers',
              stats: [
                { icon: '1', label: 'Count', value: 999, color: '#fff', tooltip: 'Count' }
              ]
            }
          ]
        }
      })
      
      expect(wrapper.find('.stat-value').text()).toBe('999')
    })

    it('should handle string values', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: [
            {
              title: 'Strings',
              stats: [
                { icon: 'A', label: 'Text', value: 'Hello', color: '#fff', tooltip: 'Text' }
              ]
            }
          ]
        }
      })
      
      expect(wrapper.find('.stat-value').text()).toBe('Hello')
    })

    it('should handle zero values', () => {
      const wrapper = mount(QuickStats, {
        props: {
          statCategories: [
            {
              title: 'Zero',
              stats: [
                { icon: '0', label: 'Zero', value: 0, color: '#fff', tooltip: 'Zero' }
              ]
            }
          ]
        }
      })
      
      expect(wrapper.find('.stat-value').text()).toBe('0')
    })
  })
})
