import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrackStore } from '../track'
import apiService from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    getTracks: vi.fn(),
    getTrack: vi.fn(),
    getTrackStats: vi.fn(),
    createTrack: vi.fn(),
    updateTrack: vi.fn(),
    deleteTrack: vi.fn(),
  },
}))

describe('Track Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with empty tracks array', () => {
      const store = useTrackStore()
      expect(store.tracks).toEqual([])
    })

    it('should start with null currentTrack', () => {
      const store = useTrackStore()
      expect(store.currentTrack).toBeNull()
    })
  })

  describe('fetchTracks', () => {
    it('should fetch and set tracks', async () => {
      const mockTracks = [
        { id: 1, name: 'Track 1', city: 'City', country: 'Country', distance: 800, created_at: '', updated_at: '' },
      ]
      vi.mocked(apiService.getTracks).mockResolvedValue(mockTracks)

      const store = useTrackStore()
      await store.fetchTracks()

      expect(store.tracks).toEqual(mockTracks)
    })

    it('should set error on failure', async () => {
      vi.mocked(apiService.getTracks).mockRejectedValue({
        response: { data: { message: 'Failed to fetch' } },
      })

      const store = useTrackStore()
      
      await expect(store.fetchTracks()).rejects.toBeDefined()
      expect(store.error).toBe('Failed to fetch')
    })
  })

  describe('fetchTrack', () => {
    it('should fetch and set currentTrack', async () => {
      const mockTrack = { id: 1, name: 'Track 1', city: 'City', country: 'Country', distance: 800, created_at: '', updated_at: '' }
      vi.mocked(apiService.getTrack).mockResolvedValue(mockTrack)

      const store = useTrackStore()
      const result = await store.fetchTrack(1)

      expect(store.currentTrack).toEqual(mockTrack)
      expect(result).toEqual(mockTrack)
    })
  })

  describe('createTrack', () => {
    it('should create track and add to list', async () => {
      const newTrack = { id: 2, name: 'New Track', city: 'City', country: 'Country', distance: 1000, created_at: '', updated_at: '' }
      vi.mocked(apiService.createTrack).mockResolvedValue(newTrack)

      const store = useTrackStore()
      store.tracks = []
      
      await store.createTrack({ name: 'New Track', city: 'City', country: 'Country' })

      expect(store.tracks).toHaveLength(1)
      expect(store.tracks[0]).toEqual(newTrack)
    })
  })

  describe('updateTrack', () => {
    it('should update track in list', async () => {
      const updatedTrack = { id: 1, name: 'Updated Track', city: 'City', country: 'Country', distance: 900, created_at: '', updated_at: '' }
      vi.mocked(apiService.updateTrack).mockResolvedValue(updatedTrack)

      const store = useTrackStore()
      store.tracks = [
        { id: 1, name: 'Old Track', city: 'City', country: 'Country', distance: 800, created_at: '', updated_at: '' },
      ]
      
      await store.updateTrack(1, { name: 'Updated Track' })

      expect(store.tracks[0].name).toBe('Updated Track')
    })
  })

  describe('deleteTrack', () => {
    it('should remove track from list', async () => {
      vi.mocked(apiService.deleteTrack).mockResolvedValue(undefined)

      const store = useTrackStore()
      store.tracks = [
        { id: 1, name: 'Track 1', city: 'City', country: 'Country', distance: 800, created_at: '', updated_at: '' },
        { id: 2, name: 'Track 2', city: 'City', country: 'Country', distance: 900, created_at: '', updated_at: '' },
      ]
      
      await store.deleteTrack(1)

      expect(store.tracks).toHaveLength(1)
      expect(store.tracks[0].id).toBe(2)
    })
  })

  describe('fetchTrackStats', () => {
    it('should fetch track stats', async () => {
      const mockStats = [
        { track_id: 1, track_name: 'Track 1', total_sessions: 10, total_laps: 100, unique_drivers: 5, best_lap_time: 30.5, best_lap_driver: 'Driver 1', average_lap_time: 32.0, fastest_speed: 60.0 },
      ]
      vi.mocked(apiService.getTrackStats).mockResolvedValue(mockStats)

      const store = useTrackStore()
      await store.fetchTrackStats()

      expect(store.trackStats).toEqual(mockStats)
    })
  })
})
