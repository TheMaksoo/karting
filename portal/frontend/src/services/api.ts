import axios, { type AxiosInstance, type AxiosError } from 'axios'

// Types for API responses
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'driver'
  driver_id?: number
  must_change_password?: boolean
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
  value: any
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

class ApiService {
  private api: AxiosInstance
  private token: string | null = null

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    // Load token from localStorage
    this.token = localStorage.getItem('api_token')
    if (this.token) {
      this.setAuthToken(this.token)
    }

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || ''
          // Never clear auth on /auth/me or /auth/login requests
          // These are used to check current status and shouldn't log user out
          if (!url.includes('/auth/me') && !url.includes('/auth/login')) {
            console.log('401 on non-auth endpoint, clearing session:', url)
            this.clearAuth()
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  setAuthToken(token: string) {
    this.token = token
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('api_token', token)
  }

  clearAuth() {
    this.token = null
    delete this.api.defaults.headers.common['Authorization']
    localStorage.removeItem('api_token')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', { email, password })
    this.setAuthToken(response.data.token)
    return response.data
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout')
    this.clearAuth()
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me')
    return response.data
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  // Driver endpoints
  async getDrivers(): Promise<Driver[]> {
    const response = await this.api.get<Driver[]>('/drivers')
    return response.data
  }

  async getDriver(id: number): Promise<Driver> {
    const response = await this.api.get<Driver>(`/drivers/${id}`)
    return response.data
  }

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    const response = await this.api.post<Driver>('/drivers', data)
    return response.data
  }

  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    const response = await this.api.put<Driver>(`/drivers/${id}`, data)
    return response.data
  }

  async deleteDriver(id: number): Promise<void> {
    await this.api.delete(`/drivers/${id}`)
  }

  async getDriverStats(friendsOnly = false): Promise<DriverStats[]> {
    const response = await this.api.get<DriverStats[]>('/stats/drivers', {
      params: { friends_only: friendsOnly },
    })
    return response.data
  }

  // Track endpoints
  async getTracks(): Promise<Track[]> {
    const response = await this.api.get<Track[]>('/tracks')
    return response.data
  }

  async getTrack(id: number): Promise<Track> {
    const response = await this.api.get<Track>(`/tracks/${id}`)
    return response.data
  }

  async createTrack(data: Partial<Track>): Promise<Track> {
    const response = await this.api.post<Track>('/tracks', data)
    return response.data
  }

  async updateTrack(id: number, data: Partial<Track>): Promise<Track> {
    const response = await this.api.put<Track>(`/tracks/${id}`, data)
    return response.data
  }

  async deleteTrack(id: number): Promise<void> {
    await this.api.delete(`/tracks/${id}`)
  }

  async getTrackStats(): Promise<TrackStats[]> {
    const response = await this.api.get<TrackStats[]>('/stats/tracks')
    return response.data
  }

  // Session endpoints
  async getSessions(params?: any): Promise<PaginatedResponse<KartingSession>> {
    const queryParams = { per_page: 25, ...params }
    const response = await this.api.get<PaginatedResponse<KartingSession>>('/sessions', { params: queryParams })
    return response.data
  }

  async getSession(id: number): Promise<KartingSession> {
    const response = await this.api.get<KartingSession>(`/sessions/${id}`)
    return response.data
  }

  async createSession(data: Partial<KartingSession>): Promise<KartingSession> {
    const response = await this.api.post<KartingSession>('/sessions', data)
    return response.data
  }

  async updateSession(id: number, data: Partial<KartingSession>): Promise<KartingSession> {
    const response = await this.api.put<KartingSession>(`/sessions/${id}`, data)
    return response.data
  }

  async deleteSession(id: number): Promise<void> {
    await this.api.delete(`/sessions/${id}`)
  }

  async getSessionLaps(sessionId: number): Promise<Lap[]> {
    const response = await this.api.get<Lap[]>(`/sessions/${sessionId}/laps`)
    return response.data
  }

  // Lap endpoints
  async getLaps(params?: any): Promise<PaginatedResponse<Lap>> {
    const response = await this.api.get<PaginatedResponse<Lap>>('/laps', { params: params || {} })
    return response.data
  }

  async getLap(id: number): Promise<Lap> {
    const response = await this.api.get<Lap>(`/laps/${id}`)
    return response.data
  }

  async createLap(data: Partial<Lap>): Promise<Lap> {
    const response = await this.api.post<Lap>('/laps', data)
    return response.data
  }

  async updateLap(id: number, data: Partial<Lap>): Promise<Lap> {
    const response = await this.api.put<Lap>(`/laps/${id}`, data)
    return response.data
  }

  async deleteLap(id: number): Promise<void> {
    await this.api.delete(`/laps/${id}`)
  }

  async getDriverLaps(driverId: number): Promise<Lap[]> {
    const response = await this.api.get<Lap[]>(`/laps/driver/${driverId}`)
    return response.data
  }

  async getOverviewStats(): Promise<OverviewStats> {
    const response = await this.api.get<OverviewStats>('/stats/overview')
    return response.data
  }

  // Settings endpoints
  async getSettings(): Promise<Record<string, any>> {
    const response = await this.api.get<Record<string, any>>('/settings')
    return response.data
  }

  async updateSetting(key: string, value: any, description?: string): Promise<Setting> {
    const response = await this.api.put<Setting>(`/settings/${key}`, { value, description })
    return response.data
  }

  // Organized API structure
  drivers = {
    getAll: () => this.getDrivers(),
    get: (id: number) => this.getDriver(id),
    create: (data: Partial<Driver>) => this.createDriver(data),
    update: (id: number, data: Partial<Driver>) => this.updateDriver(id, data),
    delete: (id: number) => this.deleteDriver(id),
    stats: () => this.getDriverStats(),
  }

  tracks = {
    getAll: () => this.getTracks(),
    get: (id: number) => this.getTrack(id),
    create: (data: Partial<Track>) => this.createTrack(data),
    update: (id: number, data: Partial<Track>) => this.updateTrack(id, data),
    delete: (id: number) => this.deleteTrack(id),
    stats: () => this.getTrackStats(),
  }

  sessions = {
    getAll: (params?: any) => this.getSessions(params),
    get: (id: number) => this.getSession(id),
    create: (data: Partial<KartingSession>) => this.createSession(data),
    update: (id: number, data: Partial<KartingSession>) => this.updateSession(id, data),
    delete: (id: number) => this.deleteSession(id),
    getLaps: (sessionId: number) => this.getSessionLaps(sessionId),
  }

  laps = {
    getAll: (page = 1, driverId?: number, sessionId?: number) => this.getLaps(page, driverId, sessionId),
    get: (id: number) => this.getLap(id),
    create: (data: Partial<Lap>) => this.createLap(data),
    update: (id: number, data: Partial<Lap>) => this.updateLap(id, data),
    delete: (id: number) => this.deleteLap(id),
    getByDriver: (driverId: number) => this.getDriverLaps(driverId),
  }

  settings = {
    getAll: () => this.getSettings(),
    update: (key: string, value: any, description?: string) => this.updateSetting(key, value, description),
  }

  stats = {
    overview: () => this.getOverviewStats(),
    drivers: (friendsOnly = false) => this.getDriverStats(friendsOnly),
    tracks: () => this.getTrackStats(),
  }

  auth = {
    login: (email: string, password: string) => this.login(email, password),
    logout: () => this.logout(),
    getCurrentUser: () => this.getCurrentUser(),
    changePassword: (currentPassword: string, newPassword: string) => this.changePassword(currentPassword, newPassword),
  }

  friends = {
    getAll: async () => {
      const response = await this.api.get('/friends')
      return response.data
    },
    add: async (driverId: number) => {
      const response = await this.api.post('/friends', { driver_id: driverId })
      return response.data
    },
    remove: async (friendId: number) => {
      const response = await this.api.delete(`/friends/${friendId}`)
      return response.data
    },
    getDriverIds: async () => {
      const response = await this.api.get('/friends/driver-ids')
      return response.data.driver_ids
    },
  }

  userSettings = {
    get: async () => {
      const response = await this.api.get('/user/settings')
      return response.data
    },
    updateDisplayName: async (displayName: string) => {
      const response = await this.api.put('/user/display-name', { display_name: displayName })
      return response.data
    },
    setTrackNickname: async (trackId: number, nickname: string) => {
      const response = await this.api.post('/user/track-nickname', { track_id: trackId, nickname })
      return response.data
    },
    deleteTrackNickname: async (id: number) => {
      const response = await this.api.delete(`/user/track-nickname/${id}`)
      return response.data
    },
  }

  activity = {
    latest: async (friendsOnly = false, limit = 10) => {
      const response = await this.api.get('/activity/latest', {
        params: { friends_only: friendsOnly, limit },
      })
      return response.data
    },
  }

  // Upload endpoints (admin only)
  upload = {
    preview: async (file: File, trackId: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('track_id', trackId)
      const response = await this.api.post('/upload/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    import: async (data: {
      track_id: string
      session_date: string
      session_type: string
      laps: any[]
      temp_path?: string
    }) => {
      const response = await this.api.post('/upload/import', data)
      return response.data
    },
    manualEntry: async (data: {
      track_id: string
      driver_id: string
      lap_time: number
      lap_number?: number
      kart_number?: number
      session_date: string
      session_type?: string
      notes?: string
    }) => {
      const response = await this.api.post('/upload/manual-entry', data)
      return response.data
    },
    // EML Upload
    parseEml: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await this.api.post('/sessions/upload-eml', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    saveParsedSession: async (data: {
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
    }) => {
      const response = await this.api.post('/sessions/save-parsed', data)
      return response.data
    },
  }

  // Generic post method for backward compatibility
  async post(url: string, data?: any, config?: any) {
    const response = await this.api.post(url, data, config)
    return response
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService
