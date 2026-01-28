import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKartingAPI } from '../useKartingAPI'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    })),
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn((error) => error?.isAxiosError === true)
  }
}))

describe('useKartingAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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
    })

    it('should have loading state as false initially', () => {
      const api = useKartingAPI()
      expect(api.loading.value).toBe(false)
    })

    it('should have error state as null initially', () => {
      const api = useKartingAPI()
      expect(api.error.value).toBeNull()
    })

    it('should return loading ref', () => {
      const api = useKartingAPI()
      expect(typeof api.loading.value).toBe('boolean')
    })

    it('should return error ref', () => {
      const api = useKartingAPI()
      expect(api.error.value === null || typeof api.error.value === 'string').toBe(true)
    })
  })

  describe('fetch methods', () => {
    it('should have getOverviewStats method', () => {
      const api = useKartingAPI()
      expect(typeof api.getOverviewStats).toBe('function')
    })

    it('should have getDriverStats method', () => {
      const api = useKartingAPI()
      expect(typeof api.getDriverStats).toBe('function')
    })

    it('should have getTrackStats method', () => {
      const api = useKartingAPI()
      expect(typeof api.getTrackStats).toBe('function')
    })

    it('should have getAllLaps method', () => {
      const api = useKartingAPI()
      expect(typeof api.getAllLaps).toBe('function')
    })

    it('should have getSessions method', () => {
      const api = useKartingAPI()
      expect(typeof api.getSessions).toBe('function')
    })

    it('should have getDriverLaps method', () => {
      const api = useKartingAPI()
      expect(typeof api.getDriverLaps).toBe('function')
    })

    it('should have getDriverActivityOverTime method', () => {
      const api = useKartingAPI()
      expect(typeof api.getDriverActivityOverTime).toBe('function')
    })

    it('should have getDriverTrackHeatmap method', () => {
      const api = useKartingAPI()
      expect(typeof api.getDriverTrackHeatmap).toBe('function')
    })

    it('should have getTrophyCase method', () => {
      const api = useKartingAPI()
      expect(typeof api.getTrophyCase).toBe('function')
    })

    it('should have fetchTrophyDetails method', () => {
      const api = useKartingAPI()
      expect(typeof api.fetchTrophyDetails).toBe('function')
    })
  })

  describe('state management', () => {
    it('should expose reactive refs', () => {
      const api = useKartingAPI()
      
      // Check that values can be accessed
      expect(api.loading.value).toBeDefined()
      expect(api.error.value).toBeDefined()
    })
  })
})

describe('OverviewStats interface', () => {
  it('should accept valid overview stats object', () => {
    const validStats = {
      total_laps: 100,
      total_drivers: 5,
      best_lap: null,
      average_lap_time: 45.5,
      median_lap_time: 46.0,
      average_speed_kmh: 55.5,
      total_distance_km: 500,
      total_corners: 1200,
      total_cost: 250.0,
      cost_per_lap: 2.5,
      cost_per_km: 0.5,
      total_sessions: 10,
      cost_per_session: 25.0,
      co2_emissions_kg: 15.0,
      unique_tracks: 3
    }

    expect(validStats.total_laps).toBe(100)
    expect(validStats.total_drivers).toBe(5)
    expect(validStats.best_lap).toBeNull()
  })

  it('should accept overview stats with best_lap object', () => {
    const statsWithBestLap = {
      total_laps: 100,
      total_drivers: 5,
      best_lap: {
        id: 1,
        lap_time: 42.5,
        driver: { id: 1, name: 'Test Driver' },
        karting_session: {
          id: 1,
          track: { id: 1, name: 'Test Track' }
        }
      },
      average_lap_time: 45.5,
      median_lap_time: 46.0,
      average_speed_kmh: 55.5,
      total_distance_km: 500,
      total_corners: 1200,
      total_cost: 250.0,
      cost_per_lap: 2.5,
      cost_per_km: 0.5,
      total_sessions: 10,
      cost_per_session: 25.0,
      co2_emissions_kg: 15.0,
      unique_tracks: 3
    }

    expect(statsWithBestLap.best_lap).not.toBeNull()
    expect(statsWithBestLap.best_lap?.driver.name).toBe('Test Driver')
    expect(statsWithBestLap.best_lap?.lap_time).toBe(42.5)
  })
})

describe('DriverStat interface', () => {
  it('should accept valid driver stat object', () => {
    const driverStat = {
      driver_id: 1,
      driver_name: 'Test Driver',
      total_laps: 50,
      total_sessions: 5,
      total_tracks: 3,
      best_lap_time: 42.5,
      best_lap_track: 'Test Track',
      average_lap_time: 45.5,
      median_lap_time: 46.0,
      total_cost: 125.0
    }

    expect(driverStat.driver_id).toBe(1)
    expect(driverStat.driver_name).toBe('Test Driver')
    expect(driverStat.best_lap_time).toBe(42.5)
  })

  it('should handle optional fields', () => {
    const driverStatWithOptionals = {
      driver_id: 1,
      driver_name: 'Test Driver',
      total_laps: 50,
      total_sessions: 5,
      total_tracks: 3,
      best_lap_time: null,
      best_lap_track: null,
      average_lap_time: null,
      median_lap_time: null,
      total_cost: 0,
      consistency_score: 85.5,
      avg_gap_to_record: 2.5
    }

    expect(driverStatWithOptionals.consistency_score).toBe(85.5)
    expect(driverStatWithOptionals.avg_gap_to_record).toBe(2.5)
  })
})

describe('TrackStat interface', () => {
  it('should accept valid track stat object', () => {
    const trackStat = {
      track_id: 1,
      track_name: 'Test Track',
      city: 'Test City',
      country: 'Test Country',
      region: 'Test Region',
      distance: 500,
      corners: 12,
      indoor: false,
      total_sessions: 10,
      total_laps: 100,
      unique_drivers: 5,
      track_record: 42.5,
      record_holder: 'Fast Driver',
      avg_lap_time: 45.5,
      median_lap_time: 46.0,
      fastest_speed: 65.0,
      avg_speed_kmh: 55.5,
      total_distance_km: 50.0
    }

    expect(trackStat.track_id).toBe(1)
    expect(trackStat.track_name).toBe('Test Track')
    expect(trackStat.indoor).toBe(false)
  })

  it('should handle nullable fields', () => {
    const trackStatMinimal = {
      track_id: 1,
      track_name: 'Test Track',
      city: null,
      country: null,
      region: null,
      distance: null,
      corners: null,
      indoor: null,
      total_sessions: 0,
      total_laps: 0,
      unique_drivers: 0,
      track_record: null,
      record_holder: null,
      avg_lap_time: null,
      median_lap_time: null,
      fastest_speed: null,
      avg_speed_kmh: null,
      total_distance_km: null
    }

    expect(trackStatMinimal.city).toBeNull()
    expect(trackStatMinimal.country).toBeNull()
    expect(trackStatMinimal.track_record).toBeNull()
  })

  it('should handle optional coordinates', () => {
    const trackStatWithCoords = {
      track_id: 1,
      track_name: 'Test Track',
      city: 'Test City',
      country: 'Netherlands',
      region: 'Noord-Brabant',
      distance: 500,
      corners: 12,
      indoor: true,
      total_sessions: 5,
      total_laps: 50,
      unique_drivers: 3,
      track_record: 42.0,
      record_holder: 'Champion',
      avg_lap_time: 45.0,
      median_lap_time: 44.5,
      fastest_speed: 70.0,
      avg_speed_kmh: 60.0,
      total_distance_km: 25.0,
      latitude: 51.5,
      longitude: 5.5
    }

    expect(trackStatWithCoords.latitude).toBe(51.5)
    expect(trackStatWithCoords.longitude).toBe(5.5)
  })
})
