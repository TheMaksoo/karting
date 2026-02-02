import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKartingAPI } from '../useKartingAPI'

// Create hoisted mock functions that can be accessed in vi.mock
const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}))

// Mock axios module
vi.mock('axios', () => {
  return {
    default: {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      create: vi.fn(() => ({
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
      })),
    },
  }
})

describe('useKartingAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('api_token', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties', () => {
      const api = useKartingAPI()
      
      expect(api).toHaveProperty('loading')
      expect(api).toHaveProperty('error')
      expect(api).toHaveProperty('getOverviewStats')
      expect(api).toHaveProperty('getDriverStats')
      expect(api).toHaveProperty('getTrackStats')
      expect(api).toHaveProperty('getAllLaps')
      expect(api).toHaveProperty('getDriverLaps')
      expect(api).toHaveProperty('getSessions')
      expect(api).toHaveProperty('getDriverActivityOverTime')
      expect(api).toHaveProperty('getDriverTrackHeatmap')
      expect(api).toHaveProperty('getTrophyCase')
      expect(api).toHaveProperty('fetchTrophyDetails')
    })

    it('should have loading state as false initially', () => {
      const api = useKartingAPI()
      expect(api.loading.value).toBe(false)
    })

    it('should have error state as null initially', () => {
      const api = useKartingAPI()
      expect(api.error.value).toBeNull()
    })
  })

  describe('getOverviewStats', () => {
    it('should fetch overview stats successfully', async () => {
      const mockData = {
        data: {
          total_laps: 100,
          total_drivers: 5,
          best_lap: null,
          average_lap_time: 45.5,
          total_sessions: 10
        }
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getOverviewStats()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/overview'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json'
          }),
          params: {}
        })
      )
      expect(result).toEqual(mockData.data)
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBeNull()
    })

    it('should fetch overview stats with driver filter', async () => {
      const mockData = { data: { total_laps: 50 } }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      await api.getOverviewStats(123)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/overview'),
        expect.objectContaining({
          params: { driver_id: 123 }
        })
      )
    })

    it('should handle error when fetching overview stats', async () => {
      const errorMessage = 'Server error'
      mockGet.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      })

      const api = useKartingAPI()
      const result = await api.getOverviewStats()

      expect(result).toBeNull()
      expect(api.error.value).toBe(errorMessage)
      expect(api.loading.value).toBe(false)
    })

    it('should use default error message when no message provided', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      const result = await api.getOverviewStats()

      expect(result).toBeNull()
      expect(api.error.value).toBe('Failed to fetch overview stats')
    })

    it('should set loading to true during fetch', async () => {
      let loadingDuringFetch = false
      mockGet.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: { data: {} } }), 10)
        })
      })

      const api = useKartingAPI()
      const promise = api.getOverviewStats()
      
      // Check loading state immediately after starting
      await new Promise(resolve => setTimeout(resolve, 1))
      loadingDuringFetch = api.loading.value
      
      await promise
      
      expect(loadingDuringFetch).toBe(true)
      expect(api.loading.value).toBe(false)
    })
  })

  describe('getDriverStats', () => {
    it('should fetch driver stats successfully', async () => {
      const mockData = {
        data: [
          { driver_id: 1, driver_name: 'Max', total_laps: 100 },
          { driver_id: 2, driver_name: 'Lewis', total_laps: 80 }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getDriverStats()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/drivers'),
        expect.any(Object)
      )
      expect(result).toEqual(mockData.data)
    })

    it('should handle error when fetching driver stats', async () => {
      mockGet.mockRejectedValueOnce({
        response: { data: { message: 'Unauthorized' } }
      })

      const api = useKartingAPI()
      const result = await api.getDriverStats()

      expect(result).toBeNull()
      expect(api.error.value).toBe('Unauthorized')
    })

    it('should use default error message on failure', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      await api.getDriverStats()

      expect(api.error.value).toBe('Failed to fetch driver stats')
    })
  })

  describe('getTrackStats', () => {
    it('should fetch track stats successfully', async () => {
      const mockData = {
        data: [
          { track_id: 1, track_name: 'Spa', total_sessions: 10 },
          { track_id: 2, track_name: 'Monaco', total_sessions: 5 }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getTrackStats()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/tracks'),
        expect.any(Object)
      )
      expect(result).toEqual(mockData.data)
    })

    it('should handle error when fetching track stats', async () => {
      mockGet.mockRejectedValueOnce({
        response: { data: { message: 'Not found' } }
      })

      const api = useKartingAPI()
      const result = await api.getTrackStats()

      expect(result).toBeNull()
      expect(api.error.value).toBe('Not found')
    })

    it('should use default error message on failure', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      await api.getTrackStats()

      expect(api.error.value).toBe('Failed to fetch track stats')
    })
  })

  describe('getAllLaps', () => {
    it('should fetch all laps successfully', async () => {
      const mockData = {
        data: [
          { id: 1, lap_time: 45.5, driver_name: 'Max' },
          { id: 2, lap_time: 46.2, driver_name: 'Lewis' }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getAllLaps()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/laps'),
        expect.objectContaining({
          params: {}
        })
      )
      expect(result).toEqual(mockData.data)
    })

    it('should fetch laps with driver filter', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const api = useKartingAPI()
      await api.getAllLaps(123)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/laps'),
        expect.objectContaining({
          params: { driver_id: 123 }
        })
      )
    })

    it('should fetch laps with track filter', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const api = useKartingAPI()
      await api.getAllLaps(undefined, 456)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/laps'),
        expect.objectContaining({
          params: { track_id: 456 }
        })
      )
    })

    it('should fetch laps with both filters', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const api = useKartingAPI()
      await api.getAllLaps(123, 456)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/laps'),
        expect.objectContaining({
          params: { driver_id: 123, track_id: 456 }
        })
      )
    })

    it('should handle error when fetching laps', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      const result = await api.getAllLaps()

      expect(result).toBeNull()
      expect(api.error.value).toBe('Failed to fetch laps')
    })
  })

  describe('getDriverLaps', () => {
    it('should fetch driver laps successfully', async () => {
      const mockData = {
        data: [
          { id: 1, lap_time: 45.5, lap_number: 1 },
          { id: 2, lap_time: 44.8, lap_number: 2 }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getDriverLaps(123)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/laps/driver/123'),
        expect.any(Object)
      )
      expect(result).toEqual(mockData.data)
    })

    it('should handle error when fetching driver laps', async () => {
      mockGet.mockRejectedValueOnce({
        response: { data: { message: 'Driver not found' } }
      })

      const api = useKartingAPI()
      const result = await api.getDriverLaps(999)

      expect(result).toBeNull()
      expect(api.error.value).toBe('Driver not found')
    })

    it('should use default error message on failure', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      await api.getDriverLaps(123)

      expect(api.error.value).toBe('Failed to fetch driver laps')
    })
  })

  describe('getSessions', () => {
    it('should fetch sessions successfully', async () => {
      const mockData = {
        data: [
          { id: 1, date: '2024-01-01', track_name: 'Spa' },
          { id: 2, date: '2024-01-02', track_name: 'Monaco' }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getSessions()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.any(Object)
      )
      expect(result).toEqual(mockData.data)
    })

    it('should handle error when fetching sessions', async () => {
      mockGet.mockRejectedValueOnce({})

      const api = useKartingAPI()
      const result = await api.getSessions()

      expect(result).toBeNull()
      expect(api.error.value).toBe('Failed to fetch sessions')
    })
  })

  describe('getDriverActivityOverTime', () => {
    it('should fetch activity data successfully', async () => {
      const mockData = [
        { date: '2024-01', laps: 50 },
        { date: '2024-02', laps: 75 }
      ]
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getDriverActivityOverTime()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/driver-activity-over-time'),
        expect.objectContaining({
          params: {}
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should fetch activity data with driver filter', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })

      const api = useKartingAPI()
      await api.getDriverActivityOverTime(123)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/driver-activity-over-time'),
        expect.objectContaining({
          params: { driver_id: 123 }
        })
      )
    })

    it('should return null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'))

      const api = useKartingAPI()
      const result = await api.getDriverActivityOverTime()

      expect(result).toBeNull()
    })
  })

  describe('getDriverTrackHeatmap', () => {
    it('should fetch heatmap data successfully', async () => {
      const mockData = {
        drivers: ['Max', 'Lewis'],
        tracks: ['Spa', 'Monaco'],
        data: [[10, 5], [8, 12]]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getDriverTrackHeatmap()

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/driver-track-heatmap'),
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })

    it('should return null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'))

      const api = useKartingAPI()
      const result = await api.getDriverTrackHeatmap()

      expect(result).toBeNull()
    })
  })

  describe('getTrophyCase', () => {
    it('should fetch trophy case successfully', async () => {
      const mockData = {
        trophies: [
          { type: 'fastest_lap', count: 5 },
          { type: 'most_consistent', count: 3 }
        ]
      }
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.getTrophyCase(123)

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/trophy-case'),
        expect.objectContaining({
          params: { driver_id: 123 }
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should return null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'))

      const api = useKartingAPI()
      const result = await api.getTrophyCase(123)

      expect(result).toBeNull()
    })
  })

  describe('fetchTrophyDetails', () => {
    it('should fetch trophy details successfully', async () => {
      const mockData = [
        { date: '2024-01-01', track: 'Spa', time: 45.5 },
        { date: '2024-01-02', track: 'Monaco', time: 44.8 }
      ]
      mockGet.mockResolvedValueOnce({ data: mockData })

      const api = useKartingAPI()
      const result = await api.fetchTrophyDetails(123, 'fastest_lap')

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/stats/trophy-details'),
        expect.objectContaining({
          params: { driver_id: 123, type: 'fastest_lap' }
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should return empty array on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'))

      const api = useKartingAPI()
      const result = await api.fetchTrophyDetails(123, 'fastest_lap')

      expect(result).toEqual([])
    })

    it('should return empty array when response has no data', async () => {
      mockGet.mockResolvedValueOnce({ data: null })

      const api = useKartingAPI()
      const result = await api.fetchTrophyDetails(123, 'fastest_lap')

      expect(result).toEqual([])
    })
  })

  describe('auth headers', () => {
    it('should include auth token from localStorage', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      const api = useKartingAPI()
      await api.getOverviewStats()

      // Verify headers are included in the request
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json'
          })
        })
      )
      // Verify Authorization header is present with Bearer prefix
      const call = mockGet.mock.calls[0]
      expect(call[1].headers.Authorization).toMatch(/^Bearer /)
    })

    it('should handle missing token gracefully', async () => {
      localStorage.removeItem('api_token')
      mockGet.mockResolvedValueOnce({ data: {} })

      const api = useKartingAPI()
      await api.getOverviewStats()

      // Token will be null or undefined depending on environment
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer (null|undefined)$/)
          })
        })
      )
    })
  })

  describe('response data extraction', () => {
    it('should extract data from nested response', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { total_laps: 100 } }
      })

      const api = useKartingAPI()
      const result = await api.getOverviewStats()

      expect(result).toEqual({ total_laps: 100 })
    })

    it('should use direct data when not nested', async () => {
      mockGet.mockResolvedValueOnce({
        data: { total_laps: 100 }
      })

      const api = useKartingAPI()
      const result = await api.getOverviewStats()

      expect(result).toEqual({ total_laps: 100 })
    })
  })
})

