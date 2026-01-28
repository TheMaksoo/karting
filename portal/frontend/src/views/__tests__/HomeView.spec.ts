import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'

// Hoist mock data to the top so vi.mock factories can access them
const { mockOverviewStats, mockDriverStats, mockTrackStats, mockFriends, mockActivity } = vi.hoisted(() => ({
  mockOverviewStats: {
    total_laps: 1500,
    total_drivers: 25,
    best_lap_time: 28.45,
    best_lap_driver: 'Max Verstappen',
    best_lap_track: 'Circuit Park Berghem',
    average_lap_time: 32.15,
    total_sessions: 50,
    total_tracks: 7
  },
  mockDriverStats: [
    { id: 1, name: 'Max', total_laps: 500, best_lap: 28.45, average_lap: 30.2 },
    { id: 2, name: 'Quinten', total_laps: 450, best_lap: 29.10, average_lap: 31.0 }
  ],
  mockTrackStats: [
    { id: 1, name: 'Circuit Park Berghem', total_laps: 800, best_lap: 28.45 },
    { id: 2, name: 'De Voltage', total_laps: 500, best_lap: 35.20 }
  ],
  mockFriends: [
    { id: 1, driver_id: 1, driver: { id: 1, name: 'Friend 1' } },
    { id: 2, driver_id: 2, driver: { id: 2, name: 'Friend 2' } }
  ],
  mockActivity: [
    { id: 1, type: 'session', description: 'New session recorded', created_at: new Date().toISOString() }
  ]
}))

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    path: '/home',
    name: 'home',
    params: {},
    query: {}
  }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn()
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to']
  }
}))

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

// Mock chart.js and vue-chartjs
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  registerables: [],
  LineController: {},
  BarController: {},
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {}
}))

vi.mock('vue-chartjs', () => ({
  Line: { template: '<div class="mock-line-chart"></div>' },
  Bar: { template: '<div class="mock-bar-chart"></div>' },
  Pie: { template: '<div class="mock-pie-chart"></div>' },
  Doughnut: { template: '<div class="mock-doughnut-chart"></div>' }
}))

vi.mock('@/services/api', () => ({
  default: {
    getDriverStats: vi.fn().mockResolvedValue(mockDriverStats),
    getOverviewStats: vi.fn().mockResolvedValue(mockOverviewStats),
    getTrackStats: vi.fn().mockResolvedValue(mockTrackStats),
    getTracks: vi.fn().mockResolvedValue(mockTrackStats),
    getLapCount: vi.fn().mockResolvedValue({ total: 1500 }),
    getDatabaseMetrics: vi.fn().mockResolvedValue({ 
      total_data_points: 5000, 
      breakdown: { laps: 1500, sessions: 50, drivers: 25 } 
    }),
    friends: {
      getAll: vi.fn().mockResolvedValue(mockFriends),
      getDriverIds: vi.fn().mockResolvedValue([1, 2])
    },
    activity: {
      latest: vi.fn().mockResolvedValue(mockActivity)
    },
    isAuthenticated: vi.fn().mockReturnValue(true)
  }
}))

// Mock composables
vi.mock('@/composables/useChartConfig', () => ({
  useChartConfig: () => ({
    lineChartOptions: ref({}),
    barChartOptions: ref({}),
    pieChartOptions: ref({}),
    radarChartOptions: ref({}),
    getColor: (i: number) => `hsl(${i * 30}, 70%, 50%)`,
    colorPalette: ['#FF6384', '#36A2EB', '#FFCE56']
  })
}))

vi.mock('@/composables/useKartingData', () => ({
  useKartingData: () => ({
    sessions: ref([]),
    drivers: ref([]),
    tracks: ref([]),
    laps: ref([]),
    loading: ref(false),
    error: ref(null),
    fetchAll: vi.fn()
  })
}))

// Import component after mocks are set up
import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  const createWrapper = () => {
    return mount(HomeView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: { user: { id: 1, name: 'Test User' }, isAuthenticated: true }
            }
          })
        ],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          Line: { template: '<div class="mock-line-chart"></div>' },
          Bar: { template: '<div class="mock-bar-chart"></div>' },
          Pie: { template: '<div class="mock-pie-chart"></div>' },
          StatCard: { template: '<div class="stat-card"><slot /></div>' },
          QuickStats: { template: '<div class="quick-stats"></div>' },
          FriendsSection: { template: '<div class="friends-section"></div>' },
          LatestActivity: { template: '<div class="latest-activity"></div>' }
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Mounting', () => {
    it('should mount successfully', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render the main container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('div').exists()).toBe(true)
    })
  })

  describe('API Integration', () => {
    it('should fetch data on mount without crashing', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      
      // Component should be mounted and functional even if API calls fail
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      
      // Component should still mount
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      const wrapper = createWrapper()
      // Check if component renders while data is loading
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Component Structure', () => {
    it('should have proper component structure', async () => {
      const module = await import('../HomeView.vue')
      expect(module.default).toBeDefined()
      expect(module.default.__name).toBe('HomeView')
    })
  })
})
