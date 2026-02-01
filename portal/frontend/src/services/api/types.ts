/**
 * API Types - Shared type definitions for all API modules.
 *
 * @module api/types
 */

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'driver'
  driver_id?: number
  must_change_password?: boolean
}

export interface Friend {
  id: number
  driver_id: number
  name: string
  added_at: string
}

export interface FriendResponse {
  success: boolean
  message?: string
  friend?: Friend
}

export interface FriendsListResponse {
  data?: Friend[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface DriverIdsResponse {
  success: boolean
  driver_ids: number[]
  message?: string
}

export interface Driver {
  id: number
  name: string
  email?: string
  nickname?: string
  color?: string
  created_at: string
  updated_at: string
  laps?: Lap[]
  sessions?: KartingSession[]
}

export interface Track {
  id: number
  name: string
  city: string
  country: string
  distance: number
  corners?: number
  width?: number
  elevation_change?: number
  record_lap_time?: number
  features?: {
    timing_system?: string
    facilities?: string[]
    kart_specs?: string
  }
  pricing?: {
    session?: number
    per_lap?: number
    membership?: number
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  created_at: string
  updated_at: string
  sessions?: KartingSession[]
}

export interface KartingSession {
  id: number
  track_id: number
  session_date: string
  session_type?: string
  weather_conditions?: string
  notes?: string
  created_at: string
  updated_at: string
  track?: Track
  laps?: Lap[]
}

export interface Lap {
  id: number
  session_id: number
  driver_id: number
  lap_number: number
  lap_time: number
  sector_1_time?: number
  sector_2_time?: number
  sector_3_time?: number
  position?: number
  gap_to_leader?: number
  gap_to_previous?: number
  top_speed?: number
  average_speed?: number
  created_at: string
  updated_at: string
  driver?: Driver
  session?: KartingSession
}

export interface Setting {
  id: number
  key: string
  value: unknown
  description?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface DriverStats {
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
}

export interface TrackStats {
  track_id: number
  track_name: string
  total_sessions: number
  total_laps: number
  unique_drivers: number
  best_lap_time: number | null
  best_lap_driver: string | null
  average_lap_time: number | null
  fastest_speed: number | null
}

export interface OverviewStats {
  total_laps: number
  total_drivers: number
  best_lap_time: number | null
  best_lap_driver: string | null
  best_lap_track: string | null
  average_lap_time: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface UploadPreviewResponse {
  success: boolean
  file_name: string
  track?: Track
  data?: {
    session_date: string
    session_time?: string
    session_number?: string
    laps_count: number
    drivers_detected: number
    drivers: string[]
    laps: Array<{
      driver_name: string
      lap_number: number
      lap_time: number
      position?: number
      kart_number?: string
    }>
    file_hash: string
  }
  errors?: string[]
  warnings?: string[]
}

export interface SaveSessionData {
  track_id: number
  session_date: string
  heat_price?: number
  session_type?: string
  session_number?: string
  file_name?: string
  file_hash?: string
  replace_duplicate?: boolean
  laps: Array<{
    driver_name: string
    lap_number: number
    lap_time: number
    position?: number
    kart_number?: string
    sector1?: number
    sector2?: number
    sector3?: number
    gap_to_best_lap?: number
    interval?: number
    gap_to_previous?: number
    avg_speed?: number
  }>
}
