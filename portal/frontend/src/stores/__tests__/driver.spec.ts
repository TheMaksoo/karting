import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDriverStore } from '../driver'
import apiService from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    getDrivers: vi.fn(),
    getDriver: vi.fn(),
    getDriverStats: vi.fn(),
    createDriver: vi.fn(),
    updateDriver: vi.fn(),
    deleteDriver: vi.fn(),
  },
}))

describe('Driver Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with empty drivers array', () => {
      const store = useDriverStore()
      expect(store.drivers).toEqual([])
    })

    it('should start with null currentDriver', () => {
      const store = useDriverStore()
      expect(store.currentDriver).toBeNull()
    })

    it('should start with loading false', () => {
      const store = useDriverStore()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchDrivers', () => {
    it('should fetch and set drivers', async () => {
      const mockDrivers = [
        { id: 1, name: 'Driver 1', created_at: '', updated_at: '' },
        { id: 2, name: 'Driver 2', created_at: '', updated_at: '' },
      ]
      vi.mocked(apiService.getDrivers).mockResolvedValue(mockDrivers)

      const store = useDriverStore()
      await store.fetchDrivers()

      expect(store.drivers).toEqual(mockDrivers)
    })

    it('should set loading during fetch', async () => {
      vi.mocked(apiService.getDrivers).mockImplementation(() => new Promise(() => {}))

      const store = useDriverStore()
      store.fetchDrivers()

      expect(store.loading).toBe(true)
    })

    it('should set error on failure', async () => {
      vi.mocked(apiService.getDrivers).mockRejectedValue({
        response: { data: { message: 'Failed' } },
      })

      const store = useDriverStore()
      
      await expect(store.fetchDrivers()).rejects.toBeDefined()
      expect(store.error).toBe('Failed')
    })
  })

  describe('fetchDriver', () => {
    it('should fetch and set currentDriver', async () => {
      const mockDriver = { id: 1, name: 'Driver 1', created_at: '', updated_at: '' }
      vi.mocked(apiService.getDriver).mockResolvedValue(mockDriver)

      const store = useDriverStore()
      const result = await store.fetchDriver(1)

      expect(store.currentDriver).toEqual(mockDriver)
      expect(result).toEqual(mockDriver)
    })
  })

  describe('createDriver', () => {
    it('should create driver and add to list', async () => {
      const newDriver = { id: 3, name: 'New Driver', created_at: '', updated_at: '' }
      vi.mocked(apiService.createDriver).mockResolvedValue(newDriver)

      const store = useDriverStore()
      store.drivers = [
        { id: 1, name: 'Driver 1', created_at: '', updated_at: '' },
      ]
      
      await store.createDriver({ name: 'New Driver' })

      expect(store.drivers).toHaveLength(2)
      expect(store.drivers[1]).toEqual(newDriver)
    })
  })

  describe('updateDriver', () => {
    it('should update driver in list', async () => {
      const updatedDriver = { id: 1, name: 'Updated Name', created_at: '', updated_at: '' }
      vi.mocked(apiService.updateDriver).mockResolvedValue(updatedDriver)

      const store = useDriverStore()
      store.drivers = [
        { id: 1, name: 'Old Name', created_at: '', updated_at: '' },
      ]
      
      await store.updateDriver(1, { name: 'Updated Name' })

      expect(store.drivers[0].name).toBe('Updated Name')
    })

    it('should update currentDriver if same id', async () => {
      const updatedDriver = { id: 1, name: 'Updated Name', created_at: '', updated_at: '' }
      vi.mocked(apiService.updateDriver).mockResolvedValue(updatedDriver)

      const store = useDriverStore()
      store.currentDriver = { id: 1, name: 'Old Name', created_at: '', updated_at: '' }
      
      await store.updateDriver(1, { name: 'Updated Name' })

      expect(store.currentDriver?.name).toBe('Updated Name')
    })
  })

  describe('deleteDriver', () => {
    it('should remove driver from list', async () => {
      vi.mocked(apiService.deleteDriver).mockResolvedValue(undefined)

      const store = useDriverStore()
      store.drivers = [
        { id: 1, name: 'Driver 1', created_at: '', updated_at: '' },
        { id: 2, name: 'Driver 2', created_at: '', updated_at: '' },
      ]
      
      await store.deleteDriver(1)

      expect(store.drivers).toHaveLength(1)
      expect(store.drivers[0].id).toBe(2)
    })

    it('should clear currentDriver if deleted', async () => {
      vi.mocked(apiService.deleteDriver).mockResolvedValue(undefined)

      const store = useDriverStore()
      store.currentDriver = { id: 1, name: 'Driver 1', created_at: '', updated_at: '' }
      
      await store.deleteDriver(1)

      expect(store.currentDriver).toBeNull()
    })
  })

  describe('fetchDriverStats', () => {
    it('should fetch driver stats', async () => {
      const mockStats = [
        { driver_id: 1, driver_name: 'Driver 1', total_laps: 100, total_sessions: 10, total_tracks: 5, best_lap_time: 30.5, best_lap_track: 'Track 1', average_lap_time: 32.0, median_lap_time: 31.5, total_cost: 500 },
      ]
      vi.mocked(apiService.getDriverStats).mockResolvedValue(mockStats)

      const store = useDriverStore()
      await store.fetchDriverStats()

      expect(store.driverStats).toEqual(mockStats)
    })

    it('should pass friendsOnly parameter', async () => {
      vi.mocked(apiService.getDriverStats).mockResolvedValue([])

      const store = useDriverStore()
      await store.fetchDriverStats(true)

      expect(apiService.getDriverStats).toHaveBeenCalledWith(true)
    })
  })
})
