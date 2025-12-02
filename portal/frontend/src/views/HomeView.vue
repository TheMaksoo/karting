<template>
  <div>
    <div class="elite-dashboard">
      <!-- Loading State -->
      <div class="trophy-item-modern coal" :class="{ 'dimmed': trophyCase.coal === 0 }" @click="showTrophyDetails('coal')">
        <div class="trophy-icon-modern"><i class="fas fa-award"></i></div>
        <div class="trophy-content-modern">
          <div class="trophy-count-modern">{{ trophyCase.coal }}</div>
          <div class="trophy-label-modern">Coal</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import { useKartingAPI, type OverviewStats, type DriverStat, type TrackStat } from '@/composables/useKartingAPI'
import { useAuthStore } from '@/stores/auth'

Chart.register(...registerables)

const authStore = useAuthStore()
const loggedInDriverId = computed(() => authStore.user?.driver_id)
const resolvedDriverId = ref<number | null>(null) // Store the actual driver ID after resolution

// Responsive font sizes for Chart.js
const chartFontSizes = computed(() => {
  // Check if we're on mobile (simple check based on window width)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const isSmallMobile = typeof window !== 'undefined' && window.innerWidth < 480
  
  return {
    tooltipTitle: isSmallMobile ? 11 : isMobile ? 12 : 13,
    tooltipBody: isSmallMobile ? 10 : isMobile ? 11 : 12,
    legend: isSmallMobile ? 10 : isMobile ? 11 : 12,
    scaleTitle: isSmallMobile ? 11 : isMobile ? 12 : 13,
    scaleTicks: isSmallMobile ? 9 : isMobile ? 10 : 11
  }
})

// Update chart fonts on window resize
const updateChartFonts = () => {
  if (chartInstances.activity && cachedActivityData.length > 0) {
    // Recreate the chart with updated font sizes
    createActivityChart(cachedActivityData)
  }
}

const { getOverviewStats, getDriverStats, getTrackStats, getAllLaps, getDriverActivityOverTime, getDriverTrackHeatmap, getTrophyCase } = useKartingAPI()

const dataLoading = ref(true)
const dataError = ref<string | null>(null)

// Grouped stats with tooltips
interface StatCard {
  icon: string
  label: string
  value: string
  tooltip: string
  color: string
}

interface StatCategory {
  title: string
  stats: StatCard[]
}

const statCategories = ref<StatCategory[]>([])
const trophyCase = ref<{ emblems: number; gold: number; silver: number; bronze: number; coal: number }>({
  emblems: 0,
  gold: 0,
  silver: 0,
  bronze: 0,
  coal: 0
})
const heatmapDrivers = ref<string[]>([])
const heatmapTracks = ref<string[]>([])
const heatmapData = ref<Array<Array<{ time: string; gap: string; gapPercentage: number; performance: number; has_data: boolean; isRecord?: boolean; lapCount?: number; gapSeconds?: number; avgLap?: string; worstLap?: string; trackRecord?: string; consistency?: string }>>>([])
const heatmapApiData = ref<any>(null)
const maxGapSeconds = ref<number>(0) // Maximum gap in seconds across all drivers/tracks
const avgConsistency = ref<number>(0)
const consistencyChange = ref<{ value: number; isIncrease: boolean } | null>(null)

// Activity chart driver selection
const allActivityDrivers = ref<string[]>([])
const selectedActivityDrivers = ref<string[]>([])

// Heatmap stats panel
const selectedHeatmapCell = ref<any>(null)

// Toggle driver visibility in activity chart
const toggleActivityDriver = (driver: string) => {
  const index = selectedActivityDrivers.value.indexOf(driver)
  if (index > -1) {
    selectedActivityDrivers.value.splice(index, 1)
  } else {
    selectedActivityDrivers.value.push(driver)
  }
  // Refresh chart with new driver selection
  refreshActivityChart()
}

const selectAllActivityDrivers = () => {
  console.log('🔵 BEFORE - allActivityDrivers.value:', allActivityDrivers.value)
  selectedActivityDrivers.value = [...allActivityDrivers.value]
  console.log('🔵 AFTER - selectedActivityDrivers.value:', selectedActivityDrivers.value)
  console.log('🔵 Cached activity data length:', cachedActivityData.length)
  refreshActivityChart()
}

const deselectAllActivityDrivers = () => {
  selectedActivityDrivers.value = []
  console.log('🔴 Deselect All Drivers')
  refreshActivityChart()
}

const showOnlyMe = () => {
  const myName = authStore.user?.name || ''
  if (myName && allActivityDrivers.value.includes(myName)) {
    selectedActivityDrivers.value = [myName]
    refreshActivityChart()
  }
}

// Store activity data for re-rendering
let cachedActivityData: any[] = []

let chartCreationCount = 0

const refreshActivityChart = () => {
  console.log('🔄 Refreshing activity chart...')
  console.log('   - Cached data entries:', cachedActivityData.length)
  console.log('   - Selected drivers:', selectedActivityDrivers.value)
  console.log('   - Refresh call #', ++chartCreationCount)
  
  if (cachedActivityData.length > 0) {
    createActivityChart(cachedActivityData)
  } else {
    console.warn('⚠️ No cached activity data to refresh chart')
  }
}

// Trophy modal state
const showTrophyModal = ref(false)
const selectedTrophyType = ref<string>('')
const trophyModalTitle = ref('')
const trophyDetails = ref<any[]>([])
const trophyDetailsLoading = ref(false)

const getTrophyIcon = (type: string) => {
  const icons: Record<string, string> = {
    emblems: '<i class="fas fa-trophy"></i>',
    gold: '<i class="fas fa-medal"></i>',
    silver: '<i class="fas fa-medal"></i>',
    bronze: '<i class="fas fa-medal"></i>',
    coal: '<i class="fas fa-award"></i>'
  }
  return icons[type] || '<i class="fas fa-trophy"></i>'
}

const showTrophyDetails = async (type: string) => {
  if (type === 'emblems' && trophyCase.value.emblems === 0) return
  if (type === 'gold' && trophyCase.value.gold === 0) return
  if (type === 'silver' && trophyCase.value.silver === 0) return
  if (type === 'bronze' && trophyCase.value.bronze === 0) return
  if (type === 'coal' && trophyCase.value.coal === 0) return
  
  selectedTrophyType.value = type
  showTrophyModal.value = true
  trophyDetailsLoading.value = true
  
  const titles: Record<string, string> = {
    emblems: '🏅 Track Records',
    gold: '🥇 Gold Trophies',
    silver: '🥈 Silver Trophies',
    bronze: '🥉 Bronze Trophies',
    coal: '🪨 Coal Awards'
  }
  trophyModalTitle.value = titles[type] || 'Trophies'
  
  // Fetch trophy details from API
  try {
    const { fetchTrophyDetails } = useKartingAPI()
    const driverId = resolvedDriverId.value || loggedInDriverId.value
    
    if (!driverId) {
      console.error('No driver ID available for trophy details')
      console.log('Resolved ID:', resolvedDriverId.value, 'Logged-in ID:', loggedInDriverId.value)
      trophyDetails.value = []
      trophyDetailsLoading.value = false
      return
    }
    
    console.log('🏆 Fetching trophy details for driver ID:', driverId, 'type:', type)
    const details = await fetchTrophyDetails(driverId, type)
    console.log('🏆 Trophy details received:', details)
    trophyDetails.value = details || []
  } catch (error) {
    console.error('Failed to fetch trophy details:', error)
    trophyDetails.value = []
  } finally {
    trophyDetailsLoading.value = false
  }
}

const closeTrophyModal = () => {
  showTrophyModal.value = false
  trophyDetails.value = []
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper function to format time
const formatTime = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

// Helper function to calculate consistency score (100 = perfect, 0 = highly variable)
const calculateConsistencyScore = (avgTime: number | null, medianTime: number | null): number => {
  if (!avgTime || !medianTime || avgTime === 0) return 0
  // Lower variation = higher score
  // If avg and median are very close, consistency is high
  const variation = Math.abs(avgTime - medianTime) / avgTime
  return Math.max(0, Math.min(100, 100 - (variation * 200)))
}

// Load real data from API
const loadRealData = async () => {
  try {
    dataLoading.value = true
    dataError.value = null

    let driverId = loggedInDriverId.value

    console.log('🔍 Loading data for driver ID:', driverId)
    console.log('🔍 Auth store user:', authStore.user)
    console.log('🔍 Driver ID type:', typeof driverId)
    
    // If no driver_id, try to find driver by name
    if (!driverId || driverId === undefined) {
      console.warn('⚠️ No driver_id in user object, attempting to find driver by name...')
      
      if (authStore.user?.name) {
        try {
          // Fetch all drivers and find by name
          const driversData = await getDriverStats()
          if (driversData) {
            const matchingDriver = driversData.find((d: any) => 
              d.driver_name.toLowerCase() === authStore.user?.name.toLowerCase()
            )
            
            if (matchingDriver) {
              driverId = matchingDriver.driver_id
              resolvedDriverId.value = driverId // Store resolved ID
              console.log('✅ Found driver by name match:', matchingDriver.driver_name, 'ID:', driverId)
            } else {
              console.error('❌ No driver found matching user name:', authStore.user.name)
              dataError.value = `No driver profile found for "${authStore.user.name}". Please contact an administrator.`
              dataLoading.value = false
              return
            }
          }
        } catch (err) {
          console.error('❌ Error finding driver by name:', err)
        }
      }
      
      // Still no driver ID
      if (!driverId) {
        console.error('❌ Driver ID is null or undefined! Auth user:', authStore.user)
        dataError.value = 'Driver ID not found. Please contact an administrator to link your account to a driver profile.'
        dataLoading.value = false
        return
      }
    }

    console.log('✅ Using driver ID:', driverId)
    resolvedDriverId.value = driverId // Store resolved ID

    // Fetch all data from API including new analytics endpoints - filtered by logged-in driver
    const [overviewData, driversData, tracksData, activityData, heatmapApiData, trophyData] = await Promise.all([
      getOverviewStats(driverId),
      getDriverStats(), 
      getTrackStats(),
      getDriverActivityOverTime(), // Remove driverId to get ALL drivers' activity
      getDriverTrackHeatmap(),
      getTrophyCase(driverId)
    ])

    console.log('📊 Overview data:', overviewData)
    console.log('🏆 Trophy case data:', trophyData)

    if (!overviewData) {
      dataError.value = 'Failed to load data. Please try logging out and logging back in.'
      return
    }

    // Set trophy case data
    if (trophyData) {
      trophyCase.value = trophyData
      console.log('🏆 Trophy case set:', trophyCase.value)
    } else {
      console.warn('⚠️ No trophy data available')
    }

    // Get consistency score for logged-in driver from overview stats
    if (overviewData.average_lap_time && overviewData.median_lap_time) {
      avgConsistency.value = calculateConsistencyScore(overviewData.average_lap_time, overviewData.median_lap_time)
      console.log('✅ Consistency calculated:', avgConsistency.value, 'avg:', overviewData.average_lap_time, 'median:', overviewData.median_lap_time)
    } else {
      console.log('❌ No lap time data for consistency:', overviewData)
      avgConsistency.value = 0
    }

    // Build grouped stat categories with tooltips
    statCategories.value = [
      {
        title: 'Performance',
        stats: [
          { icon: '◆', label: 'Best Lap', value: overviewData.best_lap ? formatTime(overviewData.best_lap.lap_time) : 'N/A', tooltip: 'Your fastest lap time across all sessions and tracks', color: '#1A1F26' },
          { icon: '◷', label: 'Avg Lap Time', value: formatTime(overviewData.average_lap_time), tooltip: 'Average lap time = Sum of all lap times ÷ Total laps', color: '#1A1F26' },
          { icon: '⚡', label: 'Avg Speed', value: (overviewData.average_speed_kmh && typeof overviewData.average_speed_kmh === 'number') ? `${overviewData.average_speed_kmh.toFixed(0)} km/h` : 'N/A', tooltip: 'Average speed = (Track distance ÷ Lap time) × 3.6', color: '#1A1F26' },
          { icon: '◌', label: 'Total Corners', value: formatNumber(overviewData.total_corners || 0), tooltip: 'Total corners = Sum of all track corners × Total laps', color: '#1A1F26' },
        ]
      },
      {
        title: 'Sessions & Activity',
        stats: [
          { icon: '▸', label: 'Total Laps', value: formatNumber(overviewData.total_laps || 0), tooltip: 'Total number of laps completed across all sessions', color: '#1A1F26' },
          { icon: '◎', label: 'Sessions', value: formatNumber(overviewData.total_sessions || 0), tooltip: 'Total karting sessions attended', color: '#1A1F26' },
          { icon: '⟳', label: 'Laps/Session', value: overviewData.total_sessions > 0 ? (overviewData.total_laps / overviewData.total_sessions).toFixed(1) : '0.0', tooltip: 'Laps per session = Total laps ÷ Total sessions', color: '#1A1F26' },
          { icon: '◈', label: 'Distance', value: `${overviewData.total_distance_km || 0} km`, tooltip: 'Total distance = Sum of all track lengths × Laps driven', color: '#1A1F26' },
          { icon: '▸', label: 'Tracks', value: formatNumber(overviewData.unique_tracks || 0), tooltip: 'Number of unique tracks you have driven on', color: '#1A1F26' },
        ]
      },
      {
        title: 'Financial',
        stats: [
          { icon: '€', label: 'Total Cost', value: `€${overviewData.total_cost?.toFixed(2) || '0.00'}`, tooltip: 'Total cost = Sum of all session costs', color: '#1A1F26' },
          { icon: '€', label: 'Per Lap', value: `€${overviewData.cost_per_lap?.toFixed(2) || '0.00'}`, tooltip: 'Cost per lap = Total cost ÷ Total laps', color: '#1A1F26' },
          { icon: '€', label: 'Per Km', value: `€${overviewData.cost_per_km?.toFixed(2) || '0.00'}`, tooltip: 'Cost per km = Total cost ÷ Total distance (km)', color: '#1A1F26' },
          { icon: '€', label: 'Per Session', value: `€${overviewData.cost_per_session?.toFixed(2) || '0.00'}`, tooltip: 'Cost per session = Total cost ÷ Total sessions', color: '#1A1F26' },
        ]
      },
      {
        title: 'Environmental',
        stats: [
          { icon: '◐', label: 'CO₂ Emissions', value: `${overviewData.co2_emissions_kg || 0} kg`, tooltip: 'CO₂ emissions = Total distance (km) × 0.2 kg/km', color: '#1A1F26' },
          { icon: '🌲', label: 'Trees to Offset', value: `${((overviewData.co2_emissions_kg || 0) / 21.77).toFixed(2)}`, tooltip: 'Trees needed = CO₂ emissions (kg) ÷ 21.77 kg/tree/year', color: '#1A1F26' },
        ]
      }
    ]

    // Build heatmap from NEW API endpoint with professional data structure
    if (heatmapApiData) {
      // Store the full API data for reference
      heatmapApiData.value = heatmapApiData
      
      console.log('Heatmap API data:', heatmapApiData)
      console.log('Drivers:', heatmapApiData.drivers)
      console.log('Tracks:', heatmapApiData.tracks)
      console.log('Drivers:', heatmapApiData.drivers)
      console.log('Heatmap data array:', heatmapApiData.heatmap_data)
      
      if (heatmapApiData.tracks && heatmapApiData.drivers && heatmapApiData.heatmap_data) {
        heatmapDrivers.value = heatmapApiData.drivers.map((d: any) => d.name)
        heatmapTracks.value = heatmapApiData.tracks.map((t: any) => t.name)
        
        console.log('🗺️ heatmapDrivers:', heatmapDrivers.value)
        console.log('🗺️ heatmapTracks:', heatmapTracks.value)
        console.log('🗺️ Number of drivers:', heatmapDrivers.value.length)
        console.log('🗺️ Number of tracks:', heatmapTracks.value.length)
        
        // Use pre-built matrix from API
        let calculatedMaxGap = 0
        console.log('🔍 First row of heatmap data:', heatmapApiData.heatmap_data[0])
        console.log('🔍 First cell:', heatmapApiData.heatmap_data[0]?.[0])
        
        heatmapData.value = heatmapApiData.heatmap_data.map((row: any[]) => {
          return row.map((cell: any) => {
            if (!cell.has_data) {
              return { 
                time: 'N/A', 
                gap: 'N/A', 
                gapPercentage: 0, 
                performance: 0,
                has_data: false,
                isRecord: false,
                lapCount: 0,
                gapSeconds: 0
              }
            }

            const isRecord = cell.gap === 0 || Math.abs(cell.gap) < 0.01
            const gapInSeconds = Math.abs(cell.gap)
            
            // Track maximum gap
            if (gapInSeconds > calculatedMaxGap) {
              calculatedMaxGap = gapInSeconds
            }
            
            return {
              time: formatTime(cell.best_lap_time),
              gap: isRecord ? cell.best_lap_time : (cell.gap >= 0 ? `+${cell.gap.toFixed(2)}s` : `${cell.gap.toFixed(2)}s`),
              gapPercentage: cell.gap_percentage,
              performance: 100 - cell.gap_percentage,
              has_data: true,
              isRecord: isRecord,
              lapCount: cell.lap_count,
              gapSeconds: gapInSeconds,
              avgLap: cell.avg_lap_time ? formatTime(cell.avg_lap_time) : 'N/A',
              worstLap: cell.worst_lap_time ? formatTime(cell.worst_lap_time) : 'N/A',
              trackRecord: cell.track_record ? formatTime(cell.track_record) : 'N/A',
              consistency: cell.consistency_range ? `${cell.consistency_range.toFixed(2)}s` : 'N/A'
            }
          })
        })
        
        // Set the maximum gap for color grading
        maxGapSeconds.value = calculatedMaxGap
        console.log('🗺️ Maximum gap across all drivers/tracks:', maxGapSeconds.value, 'seconds')
        
        console.log('🗺️ Processed heatmapData:', heatmapData.value)
        console.log('🗺️ First driver row:', heatmapData.value[0])
        console.log('🗺️ First driver has data for', heatmapData.value[0]?.filter((c: any) => c.has_data).length || 0, 'tracks')
      }
    }

    // Create charts with real data (use nextTick to ensure canvas refs are ready)
    if (activityData && activityData.length > 0) {
      await nextTick()
      setTimeout(() => {
        createActivityChart(activityData)
        // Use logged-in driver's consistency score for personal gauge
        createConsistencyGauge(avgConsistency.value)
      }, 100)
    }

  } catch (error: any) {
    console.error('Error loading real data:', error)
    dataError.value = 'Failed to load dashboard data. Please check your connection.'
  } finally {
    dataLoading.value = false
  }
}

// Heatmap cell styling functions// New heatmap helper functions
// Heatmap cell styling functions
const getHeatmapCellClass = (driverIndex: number, trackIndex: number) => {
  const cell = heatmapData.value[driverIndex]?.[trackIndex]
  if (!cell || !cell.has_data) return 'no-data'
  
  const perf = cell.performance || 0
  if (perf >= 95) return 'perf-excellent'
  if (perf >= 90) return 'perf-good'
  if (perf >= 85) return 'perf-average'
  return 'perf-poor'
}

const getHeatmapCellStyle = (driverIndex: number, trackIndex: number) => {
  const cell = heatmapData.value[driverIndex]?.[trackIndex]
  if (!cell || !cell.has_data) return {}
  
  // Calculate percentage based on gap in seconds vs max gap
  const maxGap = maxGapSeconds.value
  if (maxGap === 0) return {}
  
  const gapPct = ((cell as any).gapSeconds / maxGap) * 100
  let color1, color2
  
  // Color scale based on gap percentage relative to maximum gap
  // Green = close to record (0%), Red = far from record (100%)
  if (gapPct <= 1) {
    // Within 1% of max gap - Bright Green
    color1 = '#10B981'
    color2 = '#059669'
  } else if (gapPct <= 2.5) {
    // Within 2.5% - Green-Yellow
    color1 = '#84CC16'
    color2 = '#65A30D'
  } else if (gapPct <= 5) {
    // Within 5% - Yellow
    color1 = '#FBBF24'
    color2 = '#F59E0B'
  } else if (gapPct <= 10) {
    // Within 10% - Orange
    color1 = '#FB923C'
    color2 = '#F97316'
  } else if (gapPct <= 25) {
    // Within 25% - Light Red
    color1 = '#F87171'
    color2 = '#EF4444'
  } else if (gapPct <= 50) {
    // Within 50% - Red
    color1 = '#EF4444'
    color2 = '#DC2626'
  } else if (gapPct <= 80) {
    // Within 80% - Dark Red
    color1 = '#DC2626'
    color2 = '#B91C1C'
  } else {
    // Over 80% - Very Dark Red
    color1 = '#B91C1C'
    color2 = '#991B1B'
  }
  
  return {
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    boxShadow: `0 2px 6px ${color1}40`
  }
}

const getCellTooltip = (driverIndex: number, trackIndex: number) => {
  const cell = heatmapData.value[driverIndex]?.[trackIndex]
  if (!cell || !cell.has_data) {
    return 'No data - Driver has not raced at this track'
  }
  const driver = heatmapDrivers.value[driverIndex]
  const track = heatmapTracks.value[trackIndex]
  return `${driver} @ ${track}\nBest: ${cell.time}\nGap: ${cell.gap}\nPerformance: ${cell.performance.toFixed(1)}%`
}

const showHeatmapStats = (driverIndex: number, trackIndex: number) => {
  const cell = heatmapData.value[driverIndex]?.[trackIndex]
  if (!cell || !cell.has_data) {
    selectedHeatmapCell.value = null
    return
  }
  
  const cellData = cell as any
  selectedHeatmapCell.value = {
    driver: heatmapDrivers.value[driverIndex],
    track: heatmapTracks.value[trackIndex],
    time: cellData.time,
    avgLap: cellData.avgLap,
    worstLap: cellData.worstLap,
    trackRecord: cellData.trackRecord,
    gapToRecord: cellData.gap,
    consistency: cellData.consistency,
    lapCount: cellData.lapCount
  }
}

const hideHeatmapStats = () => {
  selectedHeatmapCell.value = null
}

const toggleHeatmapStats = (driverIndex: number, trackIndex: number) => {
  const cellData = heatmapData.value[driverIndex]?.[trackIndex]
  if (!cellData?.has_data) return
  
  // If clicking the same cell, toggle it off; otherwise show new cell
  if (selectedHeatmapCell.value?.driver === heatmapDrivers.value[driverIndex] &&
      selectedHeatmapCell.value?.track === heatmapTracks.value[trackIndex]) {
    selectedHeatmapCell.value = null
  } else {
    showHeatmapStats(driverIndex, trackIndex)
  }
}

const formatGapDisplay = (gap: string): string => {
  if (!gap || gap === 'N/A' || gap === '—') return '—'
  return gap
}

const getTrackLapCount = (trackIndex: number): number => {
  let total = 0
  heatmapDrivers.value.forEach((_, driverIndex) => {
    const cell = heatmapData.value[driverIndex]?.[trackIndex]
    if (cell?.has_data && cell.lapCount) {
      total += cell.lapCount
    }
  })
  return total
}

const activityCanvas = ref<HTMLCanvasElement | null>(null)
const consistencyCanvas = ref<HTMLCanvasElement | null>(null)

let chartInstances: { [key: string]: Chart } = {}

const createActivityChart = (activityData: any[]) => {
  if (!activityCanvas.value) {
    console.warn('⚠️ Activity canvas not available')
    return
  }
  
  console.log('🔨 Creating activity chart with', activityData.length, 'data entries')
  
  // Cache the data for filtering
  cachedActivityData = activityData
  
  // Destroy existing chart
  if (chartInstances.activity) {
    console.log('🗑️ Destroying previous chart instance')
    chartInstances.activity.destroy()
    chartInstances.activity = null as any
  }
  
  // Wait for next tick to ensure canvas is ready
  nextTick(() => {
    if (!activityCanvas.value) {
      console.warn('⚠️ Activity canvas lost after nextTick')
      return
    }
    
    console.log('✅ Canvas is ready, proceeding with chart creation')

  // Group by driver, then aggregate multiple sessions on same date
  const driverDateMap: { [driver: string]: { [date: string]: { cumulative: number, added: number } } } = {}
  
  activityData.forEach(item => {
    if (!driverDateMap[item.driver_name]) {
      driverDateMap[item.driver_name] = {}
    }
    
    const dateMap = driverDateMap[item.driver_name]!
    const date = item.session_date
    
    if (!dateMap[date]) {
      // First session on this date for this driver
      dateMap[date] = {
        cumulative: item.cumulative_laps,
        added: item.laps_added || 0
      }
    } else {
      // Another session on same date - take the highest cumulative (end of day)
      // and sum the laps added
      const existing = dateMap[date]
      if (item.cumulative_laps > existing.cumulative) {
        existing.cumulative = item.cumulative_laps
      }
      existing.added += (item.laps_added || 0)
    }
  })

  // Extract all driver names and update the available drivers list
  const allDriverNames = Object.keys(driverDateMap)
  console.log('🔍 ALL DRIVER NAMES FROM DATA:', allDriverNames, 'Count:', allDriverNames.length)
  
  const previousDrivers = [...allActivityDrivers.value]
  console.log('🔍 PREVIOUS allActivityDrivers.value:', previousDrivers, 'Count:', previousDrivers.length)
  
  allActivityDrivers.value = allDriverNames
  console.log('🔍 AFTER ASSIGNMENT allActivityDrivers.value:', allActivityDrivers.value, 'Count:', allActivityDrivers.value.length)
  
  console.log('👥 Previous drivers:', previousDrivers)
  console.log('👥 New drivers list:', allDriverNames)
  console.log('👥 Current selectedActivityDrivers:', selectedActivityDrivers.value)
  
  // Set up selection ONLY on the VERY FIRST load (when there are no previous drivers and no selection)
  if (previousDrivers.length === 0 && selectedActivityDrivers.value.length === 0) {
    // First time - auto-select ALL drivers to show everyone by default
    selectedActivityDrivers.value = [...allDriverNames]
    console.log('� FIRST LOAD - Auto-selected ALL drivers:', allDriverNames)
  } else {
    // NOT first load - do NOT modify selectedActivityDrivers, keep whatever the user selected
    console.log('👥 NOT FIRST LOAD - Keeping user selection unchanged:', selectedActivityDrivers.value)
  }

  // Get all unique dates across all drivers (sorted)
  const allDatesSet = new Set<string>()
  Object.values(driverDateMap).forEach(dateMap => {
    Object.keys(dateMap).forEach(date => allDatesSet.add(date))
  })
  const allSessionDates = [...allDatesSet].sort()
  
  console.log('📅 All session dates:', allSessionDates)
  
  // Create datasets - only for selected drivers
  console.log('🎯 Creating datasets for selected drivers:', selectedActivityDrivers.value)
  console.log('📋 Available drivers:', Object.keys(driverDateMap))
  
  const datasets = Object.entries(driverDateMap)
    .filter(([driverName]) => {
      const isSelected = selectedActivityDrivers.value.includes(driverName)
      console.log(`  - ${driverName}: ${isSelected ? '✅ SELECTED' : '❌ FILTERED'}`)
      return isSelected
    })
    .map(([driverName, dateMap], index) => {
      // Create data array - for cumulative data, maintain last value when driver doesn't race
      let lastCumulative = 0
      const chartData = allSessionDates.map((date, dateIndex) => {
        const driverDataForDate = dateMap[date]
        
        if (driverDataForDate) {
          // Driver has data for this date - update cumulative
          lastCumulative = driverDataForDate.cumulative
          return {
            x: dateIndex,
            y: lastCumulative,
            added: driverDataForDate.laps_added
          }
        } else {
          // Driver did NOT race on this date - maintain last cumulative value
          return {
            x: dateIndex,
            y: lastCumulative,
            added: 0
          }
        }
      })
      
      console.log(`📊 ${driverName} chart data points:`, chartData.filter(d => d !== null).length, '/', allSessionDates.length)
      
      // Log actual data for debugging
      if (chartData.filter(d => d !== null).length < 13) {
        const nonNullPoints = chartData.map((d, i) => d !== null ? `[${i}:${d?.y}]` : 'null').join(' ')
        console.log(`   Data: ${nonNullPoints}`)
      }
      
      // Find the original index for consistent colors
      const originalIndex = allDriverNames.indexOf(driverName)
      
      return {
        label: driverName,
        data: chartData,
        borderColor: `hsl(${originalIndex * 60}, 70%, 60%)`,
        backgroundColor: `hsla(${originalIndex * 60}, 70%, 60%, 0.1)`,
        borderWidth: 3,  // Make lines thicker
        tension: 0.4,
        fill: false,
        hidden: false,  // Explicitly show this dataset
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: `hsl(${originalIndex * 60}, 70%, 60%)`,
        pointBorderColor: '#0D1117',
        pointBorderWidth: 2,
        spanGaps: true  // Connect lines across missing data points
    }
  })

  console.log('📈 FINAL CHECK - Datasets being passed to chart:')
  console.log('   - Number of datasets:', datasets.length)
  datasets.forEach((ds, idx) => {
    const validPoints = ds.data.filter((d: any) => d !== null).length
    console.log(`   - Dataset ${idx + 1}: ${ds.label} (${validPoints} points, color: ${ds.borderColor})`)
  })
  
  // Format dates as "Mon 25" for x-axis
  const formattedDates = allSessionDates.map(dateStr => {
    const date = new Date(dateStr)
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
    const day = date.getDate()
    return `${weekday} ${day}`
  })

  console.log('📈 Final datasets count:', datasets.length)
  console.log('📈 Dataset labels:', datasets.map(d => d.label))
  
  console.log('🎨 Creating Chart.js instance...')
  console.log('   - Canvas element:', activityCanvas.value)
  console.log('   - Canvas width:', activityCanvas.value.width)
  console.log('   - Canvas height:', activityCanvas.value.height)
  
  chartInstances.activity = new Chart(activityCanvas.value, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { 
          display: true, 
          labels: { 
            color: '#F0F6FC',
            font: { size: chartFontSizes.value.legend },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#E5E7EB',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          padding: 16,
          displayColors: true,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          bodySpacing: 6,
          titleSpacing: 8,
          titleFont: {
            size: chartFontSizes.value.tooltipTitle,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          bodyFont: {
            size: chartFontSizes.value.tooltipBody,
            weight: 'normal',
            family: "'Inter', sans-serif"
          },
          cornerRadius: 8,
          caretSize: 6,
          caretPadding: 10,
          callbacks: {
            title: (context: any) => {
              const dateIndex = context[0].parsed.x
              const dateStr = allSessionDates[dateIndex]
              if (!dateStr) return 'Unknown Date'
              const date = new Date(dateStr)
              return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
              })
            },
            label: (context: any) => {
              const driverName = context.dataset.label
              const dataPoint = context.dataset.data[context.dataIndex]
              
              if (!dataPoint) {
                return ''
              }
              
              const totalLaps = dataPoint.y
              const lapsAdded = dataPoint.added || 0
              
              return `${driverName}: ${totalLaps} (+${lapsAdded})`
            },
            labelTextColor: function(context: any) {
              return context.dataset.borderColor
            }
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: { 
            display: true, 
            text: 'Cumulative Laps', 
            color: '#F0F6FC',
            font: { size: chartFontSizes.value.scaleTitle, weight: 'bold' }
          },
          ticks: { 
            color: '#8B949E',
            font: { size: chartFontSizes.value.scaleTicks }
          },
          grid: { color: '#30363D' }
        },
        x: { 
          type: 'linear',
          min: 0,
          max: allSessionDates.length - 1,
          ticks: {
            stepSize: 1,
            color: '#8B949E',
            font: { size: chartFontSizes.value.scaleTicks },
            callback: function(value: any) {
              return formattedDates[value] || ''
            }
          },
          title: { 
            display: true, 
            text: 'Session Date', 
            color: '#F0F6FC',
            font: { size: chartFontSizes.value.scaleTitle, weight: 'bold' }
          },
          grid: { color: '#30363D' }
        }
      }
    }
  })
  
  console.log('✅ Chart created successfully!')
  console.log('   - Chart instance:', chartInstances.activity)
  console.log('   - Chart data:', chartInstances.activity.data)
  console.log('   - Chart datasets:', chartInstances.activity.data.datasets.length)
  
  // Log each dataset's visibility
  chartInstances.activity.data.datasets.forEach((ds: any, idx: number) => {
    console.log(`   - Dataset ${idx + 1}: ${ds.label}, hidden: ${ds.hidden}, data points: ${ds.data.length}`)
  })
  
  // Force update to ensure chart renders
  chartInstances.activity.update('none')
  console.log('✅ Chart updated')
  
  // Check if datasets are actually visible in the chart
  setTimeout(() => {
    console.log('🔍 POST-RENDER CHECK:')
    if (chartInstances.activity) {
      console.log('   - Chart is attached:', chartInstances.activity.attached)
      console.log('   - Visible datasets:', chartInstances.activity.getVisibleDatasetCount())
    } else {
      console.log('   - Chart instance not available')
    }
    console.log('   - Chart canvas parent:', activityCanvas.value?.parentElement)
  }, 100)
  
  })  // Close nextTick
}  // Close createActivityChart

const createConsistencyGauge = (userScore: number) => {
  if (!consistencyCanvas.value) return
  
  if (chartInstances.consistency) {
    chartInstances.consistency.destroy()
  }
  
  // Create a progress bar meter instead of doughnut chart
  // Red to green gradient based on score
  const progressPercent = userScore
  const gradientColor = userScore >= 95 ? '#10B981' : // Bright Green
                       userScore >= 85 ? '#84CC16' : // Light Green  
                       userScore >= 70 ? '#FBBF24' : // Yellow
                       userScore >= 50 ? '#FB923C' : // Orange
                       '#EF4444' // Red
  
  // Create a simple progress bar using canvas
  const canvas = consistencyCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(canvas.width, canvas.height) * 0.35
  const barWidth = radius * 0.4
  const barHeight = barWidth * 0.3
  
  // Draw background bar (gray)
  ctx.fillStyle = '#30363D'
  ctx.fillRect(centerX - radius, centerY - barHeight/2, radius * 2, barHeight)
  
  // Draw progress bar (red to green gradient)
  const progressWidth = (progressPercent / 100) * (radius * 2)
  if (progressWidth > 0) {
    const gradient = ctx.createLinearGradient(centerX - radius, 0, centerX + radius, 0)
    gradient.addColorStop(0, '#EF4444') // Red at start
    gradient.addColorStop(1, '#10B981') // Green at end
    
    ctx.fillStyle = gradient
    ctx.fillRect(centerX - radius, centerY - barHeight/2, progressWidth, barHeight)
  }
  
  // Draw border
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2
  ctx.strokeRect(centerX - radius, centerY - barHeight/2, radius * 2, barHeight)
  
  // Draw percentage markers
  ctx.fillStyle = '#8B949E'
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  
  // 0% marker
  ctx.fillText('0%', centerX - radius, centerY + barHeight)
  
  // 50% marker  
  ctx.fillText('50%', centerX, centerY + barHeight)
  
  // 100% marker
  ctx.fillText('100%', centerX + radius, centerY + barHeight)
}

// Retry and logout handlers
const handleRetry = async () => {
  await loadRealData()
}

const handleLogout = async () => {
  localStorage.removeItem('api_token')
  window.location.href = '/login'
}

// Heatmap tooltip state
const heatmapTooltip = ref({
  visible: false,
  driverIndex: -1,
  trackIndex: -1,
  driver: '',
  track: '',
  gap: '',
  time: '',
  isRecord: false,
  consistency: ''
})

function showHeatmapTooltip(event: MouseEvent, driverIndex: number, trackIndex: number) {
  const driver = heatmapDrivers.value[driverIndex]
  const track = heatmapTracks.value[trackIndex]
  const cell = heatmapData.value[driverIndex]?.[trackIndex]
  heatmapTooltip.value = {
    visible: true,
    driverIndex,
    trackIndex,
    driver,
    track,
    gap: cell?.gap || '',
    time: cell?.time || '',
    isRecord: !!cell?.isRecord,
    consistency: cell?.consistency || ''
  }
}

function hideHeatmapTooltip() {
  heatmapTooltip.value.visible = false
}

onMounted(async () => {
  // Ensure auth store has loaded the user
  console.log('🎯 Component mounted, auth store user:', authStore.user)
  
  // If user is not loaded, try to fetch it
  if (!authStore.user) {
    console.log('⏳ User not loaded, fetching current user...')
    await authStore.fetchCurrentUser()
    console.log('✅ User fetched:', authStore.user)
  }
  
  // Load real data from database
  await loadRealData()

  // Add window resize listener for responsive chart fonts
  window.addEventListener('resize', updateChartFonts)
})

onUnmounted(() => {
  Object.values(chartInstances).forEach(chart => chart.destroy())
  
  // Remove window resize listener
  window.removeEventListener('resize', updateChartFonts)
})
</script>
<style src="../styles/HomeView.css"></style>