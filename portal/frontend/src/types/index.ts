/**
 * Shared TypeScript types for the karting portal
 * Re-exports from api.ts and adds additional utility types
 */

// Re-export all types from API service
export type {
  User,
  Friend,
  FriendResponse,
  FriendsListResponse,
  DriverIdsResponse,
  Driver,
  Track,
  KartingSession,
  Lap,
  Setting,
  LoginResponse,
  DriverStats,
  TrackStats,
  OverviewStats,
  PaginatedResponse,
} from '@/services/api'

/**
 * Chart.js callback context types
 */
export interface ChartTooltipContext {
  chart: unknown
  dataIndex: number
  dataset: ChartDataset
  datasetIndex: number
  parsed: { x?: number; y?: number }
  raw: number | string | null
  formattedValue: string
  label: string
}

export interface ChartDataset {
  label?: string
  data: (number | null)[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean | string
  tension?: number
}

export interface ChartCallbackContext {
  chart: unknown
  dataIndex: number
  dataset: ChartDataset
  datasetIndex: number
  tick?: {
    value: number | string
    label: string
  }
}

export interface ChartAxisContext {
  tick: {
    value: number | string
    label: string
  }
  index: number
  ticks: Array<{ value: number | string }>
}

/**
 * API filter/params types
 */
export interface ApiQueryParams {
  page?: number
  per_page?: number
  driver_id?: number
  track_id?: number
  session_id?: number
  start_date?: string
  end_date?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  [key: string]: string | number | boolean | undefined
}

export interface SessionFilters {
  driver_id?: number | null
  track_id?: number | null
  date_from?: string | null
  date_to?: string | null
  session_type?: string | null
}

/**
 * Form/Edit state types
 */
export interface DriverEditForm {
  id?: number
  name: string
  email?: string
  nickname?: string
  color?: string
}

export interface TrackEditForm {
  id?: number
  name: string
  city: string
  country: string
  distance: number
  corners?: number
  width?: number
  elevation_change?: number
}

export interface LapEditForm {
  id?: number
  lap_number: number
  lap_time: number
  sector_1_time?: number
  sector_2_time?: number
  sector_3_time?: number
  position?: number
}

export interface SessionEditForm {
  id?: number
  track_id: number
  session_date: string
  session_type?: string
  weather_conditions?: string
  notes?: string
}

/**
 * Analysis/Statistics types
 */
export interface LapStatistics {
  total: number
  best: number | null
  worst: number | null
  average: number | null
  median: number | null
  standardDeviation: number | null
}

export interface TimeRange {
  start: Date | string
  end: Date | string
}

export interface BattleData {
  driver1Id: number
  driver2Id: number
  sessionId: number
  lapNumber: number
  driver1Time: number
  driver2Time: number
  gap: number
  winner: number
}

export interface TrackAnalysis {
  trackId: number
  trackName: string
  bestLap: number | null
  averageLap: number | null
  totalLaps: number
  improvement: number | null
}

/**
 * Import/Upload types
 */
export interface ParsedSessionData {
  trackName: string
  sessionDate: string
  sessionType?: string
  laps: ParsedLapData[]
}

export interface ParsedLapData {
  driverName: string
  lapNumber: number
  lapTime: number
  position?: number
  gap?: number
}

export interface BatchUploadResult {
  success: boolean
  filename: string
  message: string
  sessionId?: number
  lapCount?: number
  trackId?: number
  availableTracks?: Track[]
  errors?: string[]
}

import type { Track } from '@/services/api'

export interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  message?: string
}

/**
 * Activity/Heatmap types
 */
export interface ActivityData {
  date: string
  count: number
  sessions: number
  laps: number
}

export interface HeatmapCell {
  row: number
  col: number
  value: number
  label: string
}

/**
 * UI State types
 */
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string | number
}

/**
 * Theme/Style types
 */
export interface ThemeVariable {
  name: string
  value: string
  category: 'color' | 'spacing' | 'typography' | 'animation'
}

/**
 * Trophy types
 */
export interface Trophy {
  id: number
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
}

export interface TrophyDetails {
  trophy: Trophy
  progress: number
  target: number
  isUnlocked: boolean
}

/**
 * Prediction types
 */
export interface Prediction {
  predictedTime: number
  confidence: number
  factors: PredictionFactor[]
}

export interface PredictionFactor {
  name: string
  impact: number
  description: string
}

/**
 * Financial types
 */
export interface CostBreakdown {
  sessionCost: number
  lapCost: number
  totalCost: number
  date: string
}

export interface MonthlyExpense {
  month: string
  year: number
  totalCost: number
  sessionCount: number
  lapCount: number
}

/**
 * Utility type guards
 */
export function isLap(obj: unknown): obj is import('@/services/api').Lap {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'lap_time' in obj &&
    'lap_number' in obj
  )
}

export function isDriver(obj: unknown): obj is import('@/services/api').Driver {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as Record<string, unknown>).name === 'string'
  )
}

export function isTrack(obj: unknown): obj is import('@/services/api').Track {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'city' in obj
  )
}

export function isSession(obj: unknown): obj is import('@/services/api').KartingSession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'track_id' in obj &&
    'session_date' in obj
  )
}

/**
 * Error handling type guard
 */
export function isAxiosError(error: unknown): error is {
  response?: { data?: { message?: string }; status?: number }
  message?: string
  code?: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Unknown error'
  }
  return 'An unexpected error occurred'
}
