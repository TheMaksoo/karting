import { ref } from 'vue'
import axios from 'axios'

// Use environment variable for API URL, fallback to local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export interface OverviewStats {
  total_laps: number
  total_drivers: number
  best_lap: {
    id: number
    lap_time: number
    driver: {
      id: number
      name: string
    }
    karting_session: {
      id: number
      track: {
        id: number
        name: string
      }
    }
  } | null
  average_lap_time: number | null
  median_lap_time: number | null
  average_speed_kmh: number | null
  total_distance_km: number
  total_corners: number
  total_cost: number
  cost_per_lap: number
  cost_per_km: number
  total_sessions: number
  cost_per_session: number
  co2_emissions_kg: number
  unique_tracks: number
}

export interface DriverStat {
  driver_id: number
  driver_name: string
  total_laps: number
  total_sessions: number
  total_tracks: number
  best_lap_time: number | null
  best_lap_track: string | null
  average_lap_time: number | null
  median_lap_time: number | null
  total_cost: number
  consistency_score?: number
  avg_gap_to_record?: number
}

export interface TrackStat {
  track_id: number
  track_name: string
  city: string | null
  country: string | null
  region: string | null
  distance: number | null
  corners: number | null
  indoor: boolean | null
  total_sessions: number
  total_laps: number
  unique_drivers: number
  track_record: number | null
  record_holder: string | null
  avg_lap_time: number | null
  median_lap_time: number | null
  fastest_speed: number | null
  avg_speed_kmh: number | null
  total_distance_km: number | null
  latitude?: number
  longitude?: number
}

export interface LapData {
  id: number
  session_id: number
  driver_id: number
  driver_name: string
  track_id: number
  track_name: string
  lap_number: number
  lap_time: number
  created_at: string
}

export interface SessionData {
  id: number
  date: string
  track_id: number
  track_name: string
  driver_id: number
  driver_name: string
  total_laps: number
  best_lap_time: number | null
  average_lap_time: number | null
  cost: number
}

export function useKartingAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('api_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }

  const getOverviewStats = async (driverId?: number): Promise<OverviewStats | null> => {
    try {
      loading.value = true
      error.value = null
      const params = driverId ? { driver_id: driverId } : {}
      const response = await axios.get(`${API_BASE_URL}/stats/overview`, {
        headers: getAuthHeaders(),
        params
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch overview stats'
      console.error('Error fetching overview stats:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getDriverStats = async (): Promise<DriverStat[] | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`${API_BASE_URL}/stats/drivers`, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch driver stats'
      console.error('Error fetching driver stats:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getTrackStats = async (): Promise<TrackStat[] | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`${API_BASE_URL}/stats/tracks`, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch track stats'
      console.error('Error fetching track stats:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getAllLaps = async (driverId?: number, trackId?: number): Promise<LapData[] | null> => {
    try {
      loading.value = true
      error.value = null
      const params: any = {}
      if (driverId) params.driver_id = driverId
      if (trackId) params.track_id = trackId
      
      const response = await axios.get(`${API_BASE_URL}/laps`, {
        headers: getAuthHeaders(),
        params
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch laps'
      console.error('Error fetching laps:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getDriverLaps = async (driverId: number): Promise<LapData[] | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`${API_BASE_URL}/laps/driver/${driverId}`, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch driver laps'
      console.error('Error fetching driver laps:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getSessions = async (): Promise<SessionData[] | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`${API_BASE_URL}/sessions`, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch sessions'
      console.error('Error fetching sessions:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getDriverActivityOverTime = async (driverId?: number): Promise<any[] | null> => {
    try {
      const params = driverId ? { driver_id: driverId } : {}
      const response = await axios.get(`${API_BASE_URL}/stats/driver-activity-over-time`, {
        headers: getAuthHeaders(),
        params
      })
      return response.data
    } catch (err: any) {
      console.error('Error fetching driver activity over time:', err)
      return null
    }
  }

  const getDriverTrackHeatmap = async (): Promise<any | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/driver-track-heatmap`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (err: any) {
      console.error('Error fetching driver track heatmap:', err)
      return null
    }
  }

  const getTrophyCase = async (driverId: number): Promise<any | null> => {
    try {
      const params = { driver_id: driverId }
      const response = await axios.get(`${API_BASE_URL}/stats/trophy-case`, {
        headers: getAuthHeaders(),
        params
      })
      return response.data
    } catch (err: any) {
      console.error('Error fetching trophy case:', err)
      return null
    }
  }

  const fetchTrophyDetails = async (driverId: number, type: string): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/trophy-details`, {
        headers: getAuthHeaders(),
        params: { driver_id: driverId, type }
      })
      return response.data || []
    } catch (err: any) {
      console.error('Error fetching trophy details:', err)
      return []
    }
  }

  return {
    loading,
    error,
    getOverviewStats,
    getDriverStats,
    getTrackStats,
    getAllLaps,
    getDriverLaps,
    getSessions,
    getDriverActivityOverTime,
    getDriverTrackHeatmap,
    getTrophyCase,
    fetchTrophyDetails
  }
}
