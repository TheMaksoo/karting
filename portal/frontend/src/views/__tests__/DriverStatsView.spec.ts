import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import DriverStatsView from '../DriverStatsView.vue'

// Note: flushPromises available if needed
// import { flushPromises } from '@vue/test-utils'

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

describe('DriverStatsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDriverStats = [
    {
      driver_id: 1,
      driver_name: 'Max Verstappen',
      total_laps: 150,
      total_sessions: 25,
      total_tracks: 5,
      best_lap_time: 42.5,
      best_lap_track: 'Circuit Berghem',
      average_lap_time: 45.2,
      median_lap_time: 44.8,
      total_cost: 250.00
    },
    {
      driver_id: 2,
      driver_name: 'Lewis Hamilton',
      total_laps: 120,
      total_sessions: 20,
      total_tracks: 4,
      best_lap_time: 43.1,
      best_lap_track: 'De Voltage',
      average_lap_time: 46.0,
      median_lap_time: 45.5,
      total_cost: 200.00
    }
  ]

  const mountComponent = (options = {}) => {
    return mount(DriverStatsView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              driver: {
                drivers: [],
                driverStats: mockDriverStats,
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
    it('should render page header', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.page-header').exists()).toBe(true)
    })

    it('should render page title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toContain('Driver Statistics')
    })

    it('should render filter toggle', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.filter-toggle').exists()).toBe(true)
    })

    it('should render friends only checkbox', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    })

    it('should render coming soon section', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.coming-soon').exists()).toBe(true)
    })
  })

  describe('driver stats cards', () => {
    it('should render stat cards for each driver', () => {
      const wrapper = mountComponent()
      const cards = wrapper.findAll('.stat-card')
      
      expect(cards.length).toBe(2)
    })

    it('should display driver names', () => {
      const wrapper = mountComponent()
      const headers = wrapper.findAll('.driver-header h3')
      
      expect(headers[0].text()).toBe('Max Verstappen')
      expect(headers[1].text()).toBe('Lewis Hamilton')
    })

    it('should display total laps', () => {
      const wrapper = mountComponent()
      const statRows = wrapper.findAll('.stat-row')
      
      const lapRow = statRows.find(row => row.text().includes('Total Laps'))
      expect(lapRow?.text()).toContain('150')
    })

    it('should display sessions count', () => {
      const wrapper = mountComponent()
      const html = wrapper.html()
      
      expect(html).toContain('25')
      expect(html).toContain('Sessions')
    })

    it('should display total cost with euro symbol', () => {
      const wrapper = mountComponent()
      const html = wrapper.html()
      
      expect(html).toContain('€250.00')
    })
  })

  describe('loading state', () => {
    it('should show loading message when loading', () => {
      const wrapper = mount(DriverStatsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                driver: {
                  drivers: [],
                  driverStats: [],
                  loading: true,
                  error: null
                }
              }
            })
          ]
        }
      })

      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading driver statistics')
    })

    it('should not show stats grid when loading', () => {
      const wrapper = mount(DriverStatsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                driver: {
                  drivers: [],
                  driverStats: [],
                  loading: true,
                  error: null
                }
              }
            })
          ]
        }
      })

      expect(wrapper.find('.stats-grid').exists()).toBe(false)
    })
  })

  describe('error state', () => {
    it('should show error message when error occurs', () => {
      const wrapper = mount(DriverStatsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                driver: {
                  drivers: [],
                  driverStats: [],
                  loading: false,
                  error: 'Failed to load driver stats'
                }
              }
            })
          ]
        }
      })

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to load driver stats')
    })
  })

  describe('filter functionality', () => {
    it('should have friends only checkbox unchecked by default', () => {
      const wrapper = mountComponent()
      const checkbox = wrapper.find('input[type="checkbox"]')
      
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    })

    it('should toggle friends only filter', async () => {
      const wrapper = mountComponent()
      const checkbox = wrapper.find('input[type="checkbox"]')
      
      await checkbox.setValue(true)
      
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('stat row styling', () => {
    it('should highlight best lap row', () => {
      const wrapper = mountComponent()
      const highlightRow = wrapper.find('.stat-row.highlight')
      
      expect(highlightRow.exists()).toBe(true)
      expect(highlightRow.text()).toContain('Best Lap')
    })

    it('should have total row for cost', () => {
      const wrapper = mountComponent()
      const totalRow = wrapper.find('.stat-row.total')
      
      expect(totalRow.exists()).toBe(true)
      expect(totalRow.text()).toContain('Total Cost')
    })
  })

  describe('empty state', () => {
    it('should handle empty driver stats', () => {
      const wrapper = mount(DriverStatsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                driver: {
                  drivers: [],
                  driverStats: [],
                  loading: false,
                  error: null
                }
              }
            })
          ]
        }
      })

      expect(wrapper.find('.stats-grid').exists()).toBe(true)
      expect(wrapper.findAll('.stat-card').length).toBe(0)
    })
  })
})
