<template>
  <div class="elite-dashboard">
    <!-- Loading State -->
    <div v-if="dataLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading real data from database...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="dataError" class="error-state">
      <h2>⚠️ Error Loading Data</h2>
      <p class="error-message">{{ dataError }}</p>
      <div class="error-actions">
        <button @click="handleRetry" class="retry-btn">🔄 Retry</button>
        <button @click="handleLogout" class="logout-btn">🚪 Logout & Re-login</button>
      </div>
      <p class="hint">If you see "401 Unauthorized", your session may have expired. Try logging out and back in.</p>
    </div>

      <!-- Empty State -->
      <div v-else-if="statCategories.length === 0" class="empty-state">
        <h2>📭 No Data Available</h2>
        <p>Your database is empty. Upload some session data to see analytics!</p>
        <p class="hint">Navigate to Admin → Upload Data to import your karting sessions.</p>
      </div>

      <!-- Dashboard Content (Only shown when data loaded) -->
      <div v-else>
        <!-- Grouped Stats -->
        <div v-for="category in statCategories" :key="category.title" class="stat-category">
          <h2 class="category-title">{{ category.title }}</h2>
          <div class="stats-grid">
            <div
              v-for="(stat, index) in category.stats"
              :key="index"
              class="stat-card"
              :style="{ background: stat.color }"
              :title="stat.tooltip"
            >
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-content">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section" v-if="heatmapDrivers.length > 0">
          <h2 class="section-title">
            <span>🏎️</span>
            Driver Performance Overview
          </h2>
          
          <div class="charts-grid">
            <div class="chart-card wide">
              <h3 class="chart-title">📈 Driver Activity Over Time</h3>
              <p class="chart-info">Track your lap accumulation across all sessions.</p>
              
              <!-- Driver Selection Controls -->
              <div class="driver-selection-controls">
                <div class="control-label">Show Drivers:</div>
                <div class="driver-chips">
                  <button 
                    v-for="(driver, index) in allActivityDrivers" 
                    :key="driver"
                    class="driver-chip"
                    :class="{ active: selectedActivityDrivers.includes(driver) }"
                    :style="{ 
                      borderColor: selectedActivityDrivers.includes(driver) ? `hsl(${index * 60}, 70%, 60%)` : '#444',
                      backgroundColor: selectedActivityDrivers.includes(driver) ? `hsla(${index * 60}, 70%, 60%, 0.2)` : 'transparent'
                    }"
                    @click="toggleActivityDriver(driver)"
                  >
                    <span class="chip-dot" :style="{ background: `hsl(${index * 60}, 70%, 60%)` }"></span>
                    {{ driver }}
                  </button>
                </div>
                <div class="control-actions">
                  <button @click="selectAllActivityDrivers" class="control-btn">Show All Drivers</button>
                  <button @click="showOnlyMe" class="control-btn">Only Me</button>
                </div>
              </div>
              
              <canvas ref="activityCanvas"></canvas>
            </div>

            <div class="chart-card">
              <h3 class="chart-title">◉ Your Consistency</h3>
              <div class="chart-info">
                <strong>How it's calculated:</strong> Consistency = 100 - (|avg - median| / avg × 200)<br>
                <strong>What it means:</strong> Higher score = more reliable lap times. Score of 100 = perfect consistency.<br>
                <strong>How to improve:</strong>
                <ul style="margin: 0.5rem 0 0 1.5rem; font-size: 0.75rem;">
                  <li>Maintain smooth, consistent steering and throttle inputs</li>
                  <li>Use the same racing line every lap</li>
                  <li>Focus on mental clarity and avoid distractions</li>
                  <li>Practice brake points until they're muscle memory</li>
                </ul>
              </div>
              <div class="gauge-container">
                <canvas ref="consistencyCanvas"></canvas>
                <div class="gauge-score">{{ avgConsistency.toFixed(1) }}</div>
              </div>
            </div>

            <!-- Trophy Case -->
            <div class="chart-card trophy-case-card">
              <h3 class="chart-title">🏆 Trophy Case</h3>
              <div class="trophies-grid-compact">
                <div class="trophy-card-compact emblem" :class="{ 'dimmed': trophyCase.emblems === 0 }" title="Track Records - You hold the fastest lap ever on these tracks" @click="showTrophyDetails('emblems')">
                  <div class="trophy-icon-compact">🏅</div>
                  <div class="trophy-count-compact">{{ trophyCase.emblems }}</div>
                  <div class="trophy-label-compact">Records</div>
                </div>
                <div class="trophy-card-compact gold" :class="{ 'dimmed': trophyCase.gold === 0 }" title="Session Winner - You were fastest in these sessions" @click="showTrophyDetails('gold')">
                  <div class="trophy-icon-compact">🥇</div>
                  <div class="trophy-count-compact">{{ trophyCase.gold }}</div>
                  <div class="trophy-label-compact">Gold</div>
                </div>
                <div class="trophy-card-compact silver" :class="{ 'dimmed': trophyCase.silver === 0 }" title="Second Place - You finished 2nd in these sessions" @click="showTrophyDetails('silver')">
                  <div class="trophy-icon-compact">🥈</div>
                  <div class="trophy-count-compact">{{ trophyCase.silver }}</div>
                  <div class="trophy-label-compact">Silver</div>
                </div>
                <div class="trophy-card-compact bronze" :class="{ 'dimmed': trophyCase.bronze === 0 }" title="Third Place - You finished 3rd in these sessions" @click="showTrophyDetails('bronze')">
                  <div class="trophy-icon-compact">🥉</div>
                  <div class="trophy-count-compact">{{ trophyCase.bronze }}</div>
                  <div class="trophy-label-compact">Bronze</div>
                </div>
                <div class="trophy-card-compact coal" :class="{ 'dimmed': trophyCase.coal === 0 }" title="Last Place - Room for improvement in these sessions" @click="showTrophyDetails('coal')">
                  <div class="trophy-icon-compact">🪨</div>
                  <div class="trophy-count-compact">{{ trophyCase.coal }}</div>
                  <div class="trophy-label-compact">Coal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Trophy Details Modal -->
        <div v-if="showTrophyModal" class="modal-overlay" @click="closeTrophyModal">
          <div class="modal-content trophy-modal" @click.stop>
            <div class="modal-header">
              <h2>{{ trophyModalTitle }}</h2>
              <button class="modal-close" @click="closeTrophyModal">×</button>
            </div>
            <div class="modal-body">
              <div v-if="trophyDetailsLoading" class="loading-spinner">Loading...</div>
              <div v-else-if="trophyDetails.length === 0" class="empty-message">
                No {{ selectedTrophyType }} trophies yet. Keep racing!
              </div>
              <div v-else class="trophy-details-list">
                <div v-for="(detail, index) in trophyDetails" :key="index" 
                     class="trophy-detail-item"
                     :class="{ 'track-record-item': selectedTrophyType === 'emblems' }">
                  <div class="detail-icon">{{ getTrophyIcon(selectedTrophyType) }}</div>
                  <div class="detail-info">
                    <!-- Track Record Layout -->
                    <template v-if="selectedTrophyType === 'emblems'">
                      <div class="record-header">
                        <div class="record-track">
                          <span class="record-badge">🏆 TRACK RECORD</span>
                          <h3 class="record-track-name">{{ detail.track_name }}</h3>
                        </div>
                        <div class="record-time-main">
                          <span class="record-label">Your Record</span>
                          <span class="record-value">{{ formatTime(detail.time) }}</span>
                          <span class="record-date">{{ formatDate(detail.session_date) }}</span>
                        </div>
                      </div>
                      <div class="record-leaderboard">
                        <div class="leaderboard-title">All-Time Best Laps</div>
                        <div class="leaderboard-list">
                          <div 
                            v-for="(driver, idx) in detail.all_drivers" 
                            :key="idx" 
                            class="leaderboard-entry"
                            :class="{ 
                              'is-record-holder': driver.is_current_driver,
                              'is-podium': driver.position <= 3
                            }"
                          >
                            <div class="leaderboard-position">
                              <span class="position-number">#{{ driver.position }}</span>
                              <span v-if="driver.position === 1" class="position-medal">🥇</span>
                              <span v-else-if="driver.position === 2" class="position-medal">🥈</span>
                              <span v-else-if="driver.position === 3" class="position-medal">🥉</span>
                            </div>
                            <div class="leaderboard-driver">{{ driver.name }}</div>
                            <div class="leaderboard-time">{{ formatTime(driver.time) }}</div>
                            <div v-if="driver.position > 1" class="leaderboard-gap">
                              +{{ formatTime(driver.time - detail.time) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Regular Trophy Layout (Gold/Silver/Bronze/Coal) -->
                    <template v-else>
                      <div class="position-header" :class="'position-' + detail.position">
                        <div class="position-track">
                          <span class="position-badge">
                            <span v-if="detail.position === 1">🥇 1ST PLACE</span>
                            <span v-else-if="detail.position === 2">🥈 2ND PLACE</span>
                            <span v-else-if="detail.position === 3">🥉 3RD PLACE</span>
                            <span v-else>P{{ detail.position }}</span>
                          </span>
                          <h3 class="position-track-name">{{ detail.track_name }}</h3>
                        </div>
                        <div class="position-time-main">
                          <span class="position-label">Your Time</span>
                          <span class="position-value">{{ formatTime(detail.time) }}</span>
                          <span class="position-date">{{ formatDate(detail.session_date) }}</span>
                        </div>
                      </div>
                      
                      <!-- Gap Analysis -->
                      <div class="position-gaps" v-if="detail.position === 1 || detail.gap_ahead || detail.gap_behind">
                        <!-- For 1st place: show gap to 2nd -->
                        <div v-if="detail.position === 1 && detail.gap_ahead" class="gap-stat winning">
                          <span class="gap-label">Winning Margin</span>
                          <div class="gap-content">
                            <span class="gap-value">{{ detail.gap_ahead }}</span>
                            <span class="gap-driver" v-if="detail.driver_behind">ahead of {{ detail.driver_behind }}</span>
                          </div>
                        </div>
                        <!-- For other positions: show both gaps -->
                        <template v-else>
                          <div v-if="detail.gap_ahead && detail.driver_ahead" class="gap-stat losing">
                            <span class="gap-label">Behind Leader</span>
                            <div class="gap-content">
                              <span class="gap-value">{{ detail.gap_ahead }}</span>
                              <span class="gap-driver">behind {{ detail.driver_ahead }}</span>
                            </div>
                          </div>
                          <div v-if="detail.gap_behind && detail.driver_behind" class="gap-stat winning">
                            <span class="gap-label">Ahead of Next</span>
                            <div class="gap-content">
                              <span class="gap-value">{{ detail.gap_behind }}</span>
                              <span class="gap-driver">ahead of {{ detail.driver_behind }}</span>
                            </div>
                          </div>
                        </template>
                      </div>
                      
                      <!-- Session Results Leaderboard -->
                      <div class="session-leaderboard" v-if="detail.all_drivers && detail.all_drivers.length > 0">
                        <div class="leaderboard-title">Session Results</div>
                        <div class="leaderboard-list">
                          <div 
                            v-for="(driver, idx) in detail.all_drivers" 
                            :key="idx" 
                            class="leaderboard-entry"
                            :class="{ 
                              'is-current-driver': driver.is_current_driver,
                              'is-podium': driver.position <= 3
                            }"
                          >
                            <div class="leaderboard-position">
                              <span class="position-number">P{{ driver.position }}</span>
                              <span v-if="driver.position === 1" class="position-medal">🥇</span>
                              <span v-else-if="driver.position === 2" class="position-medal">🥈</span>
                              <span v-else-if="driver.position === 3" class="position-medal">🥉</span>
                            </div>
                            <div class="leaderboard-driver">{{ driver.name }}</div>
                            <div class="leaderboard-time">{{ formatTime(driver.time) }}</div>
                            <div v-if="driver.position > 1 && detail.all_drivers[0]" class="leaderboard-gap">
                              +{{ formatTime(driver.time - detail.all_drivers[0].time) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Heatmap Section -->
        <div class="section">
          <div class="charts-grid">
            <div class="chart-card ultra-wide" v-if="heatmapDrivers.length > 0 && heatmapTracks.length > 0">
              <div class="chart-header">
                <h3><i class="fas fa-fire"></i> Best Lap Time Heatmap</h3>
              </div>
              
              <div class="heatmap-container-pro">
                <div class="heatmap-wrapper">
                  <div class="heatmap-scroll-container">
                    <table class="heatmap-table">
                      <thead>
                        <tr>
                          <th class="hm-corner">Driver / Track</th>
                          <th v-for="(track, index) in heatmapTracks" :key="`th-${index}`" class="hm-track-col">
                            <div class="track-header-content">
                              <i class="fas fa-flag-checkered track-icon"></i>
                              <span class="track-name">{{ track }}</span>
                              <span class="track-laps">{{ getTrackLapCount(index) }} laps</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(driver, driverIndex) in heatmapDrivers" :key="`row-${driverIndex}`">
                          <td class="hm-driver-row">{{ driver }}</td>
                          <td
                            v-for="(track, trackIndex) in heatmapTracks"
                            :key="`cell-${driverIndex}-${trackIndex}`"
                            class="hm-cell"
                            :class="getHeatmapCellClass(driverIndex, trackIndex)"
                            :style="getHeatmapCellStyle(driverIndex, trackIndex)"
                            @mouseenter="showHeatmapStats(driverIndex, trackIndex)"
                            @mouseleave="hideHeatmapStats()"
                            @click="toggleHeatmapStats(driverIndex, trackIndex)"
                          >
                            <div class="cell-content" v-if="heatmapData[driverIndex]?.[trackIndex]?.has_data">
                              <i v-if="heatmapData[driverIndex][trackIndex].isRecord" class="fas fa-trophy hm-trophy"></i>
                              <div class="hm-time">{{ heatmapData[driverIndex][trackIndex].time }}</div>
                              <div class="hm-laps">{{ heatmapData[driverIndex][trackIndex].lapCount }} laps</div>
                              <div class="hm-gap">{{ formatGapDisplay(heatmapData[driverIndex][trackIndex].gap) }}</div>
                            </div>
                            <div class="no-data" v-else>No Data</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Stats Panel -->
                  <div class="heatmap-stats-panel">
                    <div class="stats-panel-header">
                      <i class="fas fa-chart-line"></i>
                      <span>Performance Details</span>
                    </div>
                    <div class="stats-panel-content" v-if="selectedHeatmapCell">
                      <div class="stat-row stat-driver">
                        <span class="stat-label">Driver</span>
                        <span class="stat-value">{{ selectedHeatmapCell.driver }}</span>
                      </div>
                      <div class="stat-row stat-track">
                        <span class="stat-label">Track</span>
                        <span class="stat-value">{{ selectedHeatmapCell.track }}</span>
                      </div>
                      <div class="stat-row stat-highlight">
                        <span class="stat-label">Best Lap</span>
                        <span class="stat-value">{{ selectedHeatmapCell.time }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Average Lap</span>
                        <span class="stat-value">{{ selectedHeatmapCell.avgLap }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Worst Lap</span>
                        <span class="stat-value">{{ selectedHeatmapCell.worstLap }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Track Record</span>
                        <span class="stat-value">{{ selectedHeatmapCell.trackRecord }}</span>
                      </div>
                      <div class="stat-row stat-highlight">
                        <span class="stat-label">Gap to Record</span>
                        <span class="stat-value">{{ selectedHeatmapCell.gapToRecord }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Consistency Range</span>
                        <span class="stat-value">{{ selectedHeatmapCell.consistency }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Total Laps</span>
                        <span class="stat-value">{{ selectedHeatmapCell.lapCount }}</span>
                      </div>
                    </div>
                    <div class="stats-panel-content" v-else>
                      <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <i class="fas fa-mouse-pointer" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                        <p>Hover over a cell to see detailed performance stats</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="heatmap-legend">
                <div class="legend-title">Gap to Track Record:</div>
                <div class="legend-items">
                  <div class="legend-item">
                    <div class="legend-box" style="background: linear-gradient(135deg, #10B981, #059669);"></div>
                    <span>{{ (maxGapSeconds * 0.01).toFixed(2) }}s</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-box" style="background: linear-gradient(135deg, #FBBF24, #F59E0B);"></div>
                    <span>{{ (maxGapSeconds * 0.05).toFixed(2) }}s</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-box" style="background: linear-gradient(135deg, #FB923C, #F97316);"></div>
                    <span>{{ (maxGapSeconds * 0.10).toFixed(2) }}s</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-box" style="background: linear-gradient(135deg, #EF4444, #DC2626);"></div>
                    <span>{{ (maxGapSeconds * 0.50).toFixed(2) }}s</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-box" style="background: linear-gradient(135deg, #B91C1C, #991B1B);"></div>
                    <span>{{ maxGapSeconds.toFixed(2) }}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Regional Analysis Section with OpenStreetMap -->
        <div class="section">
          <h2 class="section-title">
            <span>🗺️</span>
            Regional Analysis
          </h2>
          <div class="chart-card map-card">
            <p class="section-description">
              Explore karting tracks you've visited. 
              Click on markers to see your stats: laps, average speed, fastest lap, sessions, distance driven, and wins.
            </p>
            <div class="map-container">
              <TrackMap :driver-id="resolvedDriverId || loggedInDriverId" />
            </div>
          </div>
        </div>
      </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import TrackMap from '@/components/TrackMap.vue'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import { useKartingAPI, type OverviewStats, type DriverStat, type TrackStat } from '@/composables/useKartingAPI'
import { useAuthStore } from '@/stores/auth'

Chart.register(...registerables)

const authStore = useAuthStore()
const loggedInDriverId = computed(() => authStore.user?.driver_id)
const resolvedDriverId = ref<number | null>(null) // Store the actual driver ID after resolution

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
const heatmapData = ref<Array<Array<{ time: string; gap: string; gapPercentage: number; performance: number; has_data: boolean }>>>([])
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
    emblems: '🏅',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    coal: '🪨'
  }
  return icons[type] || '🏆'
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
        console.log('🗺️ First driver has data for', heatmapData.value[0].filter((c: any) => c.has_data).length, 'tracks')
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
    
    const dateMap = driverDateMap[item.driver_name]
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
            added: driverDataForDate.added
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
            font: { size: 12 },
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
            size: 13,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          bodyFont: {
            size: 12,
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
            font: { size: 13, weight: 'bold' }
          },
          ticks: { 
            color: '#8B949E',
            font: { size: 11 }
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
            font: { size: 11 },
            callback: function(value: any) {
              return formattedDates[value] || ''
            }
          },
          title: { 
            display: true, 
            text: 'Session Date', 
            color: '#F0F6FC',
            font: { size: 13, weight: 'bold' }
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
    console.log('   - Chart is attached:', chartInstances.activity.attached)
    console.log('   - Visible datasets:', chartInstances.activity.getVisibleDatasetCount())
    console.log('   - Chart canvas parent:', activityCanvas.value?.parentElement)
  }, 100)
  
  })  // Close nextTick
}  // Close createActivityChart

const createConsistencyGauge = (userScore: number) => {
  if (!consistencyCanvas.value) return
  
  if (chartInstances.consistency) {
    chartInstances.consistency.destroy()
  }
  
  // Determine color based on score with gradient
  let gaugeColor = '#B91C1C' // Very poor (0-50)
  if (userScore >= 95) {
    gaugeColor = '#10B981' // Excellent (95-100) - Bright Green
  } else if (userScore >= 85) {
    gaugeColor = '#84CC16' // Very Good (85-95) - Light Green
  } else if (userScore >= 70) {
    gaugeColor = '#FBBF24' // Good (70-85) - Yellow
  } else if (userScore >= 50) {
    gaugeColor = '#FB923C' // Fair (50-70) - Orange
  }
  
  // Create a doughnut chart as a gauge
  chartInstances.consistency = new Chart(consistencyCanvas.value, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [userScore, 100 - userScore],
        backgroundColor: [
          gaugeColor,
          '#30363D'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      rotation: -90,
      circumference: 180,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  })
}

// Retry and logout handlers
const handleRetry = async () => {
  await loadRealData()
}

const handleLogout = async () => {
  localStorage.removeItem('api_token')
  window.location.href = '/login'
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
})

onUnmounted(() => {
  Object.values(chartInstances).forEach(chart => chart.destroy())
})
</script>
<style scoped src="../styles/HomeView.css"></style>

<style scoped>
/* Component-specific styles that couldn't be extracted */

.trophy-case-card {
  min-width: 280px;
}

.trophies-grid-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.trophy-card-compact {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trophy-card-compact.emblem {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
}

.trophy-card-compact.gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
}

.trophy-card-compact.silver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(169, 169, 169, 0.1));
  border-color: rgba(192, 192, 192, 0.3);
}

.trophy-card-compact.bronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.1));
  border-color: rgba(205, 127, 50, 0.3);
}

.trophy-card-compact.coal {
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.15), rgba(70, 70, 70, 0.1));
  border-color: rgba(100, 100, 100, 0.3);
}

.trophy-card-compact.dimmed {
  opacity: 0.3;
  filter: grayscale(0.8);
}

.trophy-icon-compact {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.trophy-count-compact {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 2rem;
  text-align: center;
}

.trophy-label-compact {
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex: 1;
}


.chart-card.ultra-wide {
  grid-column: 1 / -1;
}

@media (max-width: 1200px) {
  .chart-card.wide {
    grid-column: span 1;
  }
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.chart-info {
  background: var(--bg-tertiary);
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  min-height: 180px;
  position: relative;
}

.gauge-score {
  position: absolute;
  top: 70%;
  font-size: 2.5rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--primary-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.consistency-change {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.consistency-change.positive {
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
}

.consistency-change.negative {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}

.heatmap-container {
  overflow-x: auto;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 100px repeat(6, 1fr);
  gap: 4px;
  min-width: 600px;
}

.hm-row-wrapper {
  display: contents;
}

.hm-corner {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.hm-header {
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--primary-color);
}

.hm-cell {
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  min-height: 45px;
  min-width: 70px;
  max-width: 70px;
}

.hm-cell:hover {
  transform: scale(1.05);
  z-index: 10;
}

.cell-time {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.cell-gap {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  margin-top: 0.25rem;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.legend-item span {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .elite-dashboard {
    padding: var(--spacing-4);
  }

  .header {
    flex-direction: column;
    gap: var(--spacing-4);
    text-align: center;
  }

  .title {
    font-size: var(--text-2xl);
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-3);
  }
  
  .stat-card {
    padding: var(--spacing-4);
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  .stat-icon {
    font-size: var(--text-3xl);
  }
  
  .stat-value {
    font-size: var(--text-xl);
  }
  
  .stat-label {
    font-size: 0.625rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }

  .chart-card.wide,
  .chart-card.ultra-wide {
    grid-column: span 1;
  }
}

/* Mobile Optimization for Stats and QuickStats */
@media (max-width: 768px) {
  .header {
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-6);
    flex-direction: row;
    gap: var(--spacing-3);
  }
  
  .title {
    font-size: var(--text-2xl);
    gap: var(--spacing-2);
  }
  
  .title span {
    font-size: 1.75rem;
  }
  
  .clock {
    text-align: right;
  }
  
  .time {
    font-size: 1.1rem;
  }
  
  .date {
    font-size: 0.75rem;
  }
  
  .stat-category {
    margin-bottom: 1.5rem;
  }
  
  .category-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.4rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
  }
  
  .stat-card {
    padding: 0.85rem;
    gap: 0.65rem;
    border-radius: var(--radius-md);
    flex-direction: column;
    text-align: center;
    justify-content: center;
  }
  
  .stat-icon {
    font-size: 2rem;
  }
  
  .stat-content {
    width: 100%;
    align-items: center;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .stat-label {
    font-size: 1rem;
    margin-top: 0.2rem;
  }
  
  .stat-card::after {
    padding: 0.6rem 0.85rem;
    font-size: 0.7rem;
    max-width: 220px;
    min-width: 160px;
  }
  
  .section {
    margin-bottom: 2rem;
  }
  
  .section-title {
    font-size: 1.35rem;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .section-title span {
    font-size: 1.5rem;
  }
  
  .charts-grid {
    gap: 1rem;
  }
  
  .chart-card {
    padding: 1rem;
  }
  
  .chart-title {
    font-size: 1rem;
  }
  
  .chart-info {
    font-size: 0.75rem;
    line-height: 1.4;
    margin-bottom: 0.85rem;
  }
  
  .chart-info ul {
    margin: 0.4rem 0 0 1.25rem;
  }
  
  .chart-info ul li {
    font-size: 0.7rem;
    margin-bottom: 0.2rem;
  }
  
  .chart-card {
    padding: var(--card-padding-mobile);
  }
  
  .chart-card canvas {
    min-height: 280px !important;
    max-height: 350px !important;
    height: 300px !important;
  }
  
  canvas {
    max-width: 100% !important;
  }
  
  .gauge-container {
    max-width: 100%;
  }

  .gauge-container canvas {
    max-width: 250px !important;
    min-height: 220px !important;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .header {
    padding: var(--spacing-3);
    margin-bottom: var(--spacing-4);
    flex-direction: column;
    gap: var(--spacing-2);
    align-items: flex-start;
  }
  
  .title {
    font-size: var(--text-lg);
    gap: var(--spacing-2);
  }
  
  .title span {
    font-size: var(--text-xl);
  }
  
  .clock {
    text-align: left;
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-2);
  }
  
  .stat-card {
    padding: var(--spacing-3);
    gap: var(--spacing-1);
  }
  
  .stat-icon {
    font-size: var(--text-2xl);
  }
  
  .stat-value {
    font-size: var(--text-lg);
  }
  
  .stat-label {
    font-size: 0.5625rem;
    letter-spacing: 0.02em;
  }
  
  .time {
    font-size: 0.95rem;
  }
  
  .date {
    font-size: 0.65rem;
    margin-top: 0.15rem;
  }
  
  .stat-category {
    margin-bottom: 1rem;
  }
  
  .category-title {
    font-size: 0.85rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.35rem;
    border-bottom-width: 1px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.6rem 0.65rem;
    gap: 0.5rem;
    border-radius: var(--radius-sm);
    min-height: 65px;
    flex-direction: column;
    text-align: center;
    justify-content: center;
  }
  
  .stat-card::after {
    display: none; /* Hide tooltips on mobile */
  }
  
  .stat-icon {
    font-size: 1.75rem;
  }
  
  .stat-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }
  
  .stat-value {
    font-size: 1.65rem;
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: 0.85rem;
    letter-spacing: 0.3px;
    margin-top: 0.15rem;
    line-height: 1.1;
  }
  
  .section {
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1.1rem;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }
  
  .section-title span {
    font-size: 1.2rem;
  }
  
  .charts-grid {
    gap: 0.75rem;
  }
  
  .chart-card {
    padding: 0.75rem;
    min-height: 350px;
  }
  
  canvas {
    min-height: 250px !important;
  }
  
  .gauge-container {
    min-height: 220px;
  }
  
  .chart-title {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .chart-info {
    font-size: 0.68rem;
    line-height: 1.35;
    margin-bottom: 0.65rem;
    padding: 0.6rem 0.75rem;
  }
  
  .chart-info strong {
    font-size: 0.7rem;
  }
  
  .chart-info ul {
    margin: 0.3rem 0 0 1rem;
  }
  
  .chart-info ul li {
    font-size: 0.62rem;
    margin-bottom: 0.15rem;
    line-height: 1.3;
  }
  
  .driver-selection-controls {
    margin-bottom: 0.75rem;
    padding: 0.65rem;
    gap: 0.5rem;
  }
  
  .control-label {
    font-size: 0.7rem;
    margin-bottom: 0.4rem;
  }
  
  .driver-chips {
    gap: 0.35rem;
    margin-bottom: 0.5rem;
  }
  
  .driver-chip {
    padding: 0.35rem 0.6rem;
    font-size: 0.75rem;
    gap: 0.35rem;
    border-radius: 14px;
    border-width: 1.5px;
  }
  
  .chip-dot {
    width: 6px;
    height: 6px;
  }
  
  .control-actions {
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  
  .control-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.55rem;
  }
  
  .chart-card {
    padding: var(--card-padding-mobile);
  }
  
  .chart-card canvas {
    min-height: 240px !important;
    max-height: 300px !important;
    height: 260px !important;
  }
  
  .gauge-container {
    max-width: 200px;
    margin: 0.75rem auto;
    padding: 0.75rem;
  }
  
  .gauge-container canvas {
    max-width: 100% !important;
    width: 100% !important;
    min-height: 200px !important;
    height: 200px !important;
  }
  
  canvas {
    max-width: 100% !important;
  }
  
  .gauge-score {
    font-size: 1.5rem;
  }
  
  .trophies-grid-compact {
    gap: 0.5rem;
    margin-top: 0.65rem;
  }
  
  .trophy-card-compact {
    padding: 0.5rem 0.7rem;
    gap: 0.7rem;
  }
  
  .trophy-icon-compact {
    font-size: 1.1rem;
  }
  
  .trophy-details-compact {
    gap: 0.15rem;
  }
  
  .trophy-name-compact {
    font-size: 0.7rem;
  }
  
  .trophy-count-compact {
    font-size: 0.8rem;
  }
}

/* Extra small phones (< 375px) */
@media (max-width: 374px) {
  .header {
    padding: 0.6rem 0.7rem;
  }
  
  .title {
    font-size: 0.95rem;
    gap: 0.4rem;
  }
  
  .title span {
    font-size: 1.1rem;
  }
  
  .time {
    font-size: 0.85rem;
  }
  
  .date {
    font-size: 0.6rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }
  
  .stat-card {
    padding: 0.5rem 0.55rem;
    gap: 0.4rem;
    min-height: 58px;
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    font-size: 1rem;
  }
  
  .stat-content {
    width: 100%;
  }
  
  .stat-value {
    font-size: 0.85rem;
  }
  
  .stat-label {
    font-size: 0.5rem;
    letter-spacing: 0.2px;
  }
  
  .category-title {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.3rem;
  }
  
  .section-title {
    font-size: 0.95rem;
    gap: 0.35rem;
  }
  
  .section-title span {
    font-size: 1rem;
  }
  
  .chart-card {
    padding: 0.6rem;
  }
  
  .chart-title {
    font-size: 0.8rem;
  }
  
  .chart-info {
    font-size: 0.62rem;
    padding: 0.5rem 0.6rem;
  }
  
  .trophies-grid-compact {
    gap: 0.3rem;
    margin-top: 0.4rem;
  }
  
  .trophy-card-compact {
    padding: 0.3rem 0.4rem;
    gap: 0.4rem;
  }
  
  .trophy-icon-compact {
    font-size: 0.75rem;
  }
  
  .trophy-count-compact {
    font-size: 0.6rem;
    min-width: 1.2rem;
  }
  
  .trophy-label-compact {
    font-size: 0.55rem;
  }
  
  .trophy-label-compact {
    font-size: 0.62rem;
  }
  
  .driver-chip {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
    gap: 0.3rem;
    border-radius: 12px;
  }
  
  .chip-dot {
    width: 5px;
    height: 5px;
  }
  
  .control-label {
    font-size: 0.6rem;
  }
  
  .control-actions {
    flex-direction: row;
    gap: 0.25rem;
  }
  
  .control-btn {
    padding: 0.25rem 0.45rem;
    font-size: 0.5rem;
  }
}

/* Mobile optimization for loading/error states */
@media (max-width: 768px) {
  .loading-state,
  .error-state {
    min-height: 50vh;
    padding: 1.5rem;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border-width: 3px;
  }
  
  .loading-state p {
    font-size: 0.95rem;
  }
  
  .error-state h2 {
    font-size: 1.5rem;
  }
  
  .error-state .error-message {
    font-size: 0.95rem;
  }
  
  .error-actions {
    gap: 0.75rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }
  
  .retry-btn,
  .logout-btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .loading-state,
  .error-state {
    min-height: 40vh;
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border-width: 2.5px;
  }
  
  .loading-state p {
    font-size: 0.85rem;
  }
  
  .error-state h2 {
    font-size: 1.2rem;
  }
  
  .error-state .error-message {
    font-size: 0.8rem;
    padding: 0 0.5rem;
  }
  
  .error-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }
  
  .retry-btn,
  .logout-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
  
  /* Trophy Modal Mobile */
  .modal-content {
    width: 96%;
    max-height: 92vh;
    max-width: 100%;
    border-radius: var(--radius-md);
  }
  
  .modal-header {
    padding: 0.75rem 0.85rem;
    flex-wrap: wrap;
  }
  
  .modal-header h2 {
    font-size: 0.9rem;
    flex: 1;
  }
  
  .modal-close {
    font-size: 1.4rem;
    width: 28px;
    height: 28px;
  }
  
  .modal-body {
    padding: 0.75rem;
  }
  
  .trophy-details-list {
    gap: 0.6rem;
    max-height: 75vh;
  }
  
  .trophy-detail-item {
    gap: 0.6rem;
    padding: 0.65rem;
    flex-direction: column;
  }
  
  .detail-icon {
    font-size: 1.5rem;
    align-self: flex-start;
  }
  
  .detail-info {
    width: 100%;
  }
  
  /* Record Styles */
  .record-header {
    gap: 0.65rem;
    padding-bottom: 0.65rem;
    margin-bottom: 0.65rem;
  }
  
  .record-badge {
    font-size: 0.55rem;
    padding: 0.15rem 0.4rem;
  }
  
  .record-track-name {
    font-size: 0.85rem !important;
    line-height: 1.2;
  }
  
  .record-time-main {
    padding: 0.6rem;
    gap: 0.2rem;
  }
  
  .record-label {
    font-size: 0.6rem;
  }
  
  .record-value {
    font-size: 1.3rem !important;
  }
  
  .record-date {
    font-size: 0.65rem;
  }
  
  /* Position Styles */
  .position-header {
    gap: 0.65rem;
    padding-bottom: 0.65rem;
    margin-bottom: 0.65rem;
  }
  
  .position-badge {
    font-size: 0.55rem;
    padding: 0.15rem 0.4rem;
  }
  
  .position-track-name {
    font-size: 0.85rem !important;
    line-height: 1.2;
  }
  
  .position-time-main {
    padding: 0.6rem;
    gap: 0.2rem;
  }
  
  .position-label {
    font-size: 0.6rem;
  }
  
  .position-value {
    font-size: 1.3rem !important;
  }
  
  .position-date {
    font-size: 0.65rem;
  }
  
  /* Leaderboard */
  .leaderboard-title {
    font-size: 0.75rem;
    padding: 0.35rem;
  }
  
  .record-leaderboard,
  .session-leaderboard {
    gap: 0.6rem;
  }
  
  .leaderboard-list {
    gap: 0.3rem;
    padding: 0.35rem;
    max-height: 200px;
  }
  
  .leaderboard-entry {
    grid-template-columns: 2.2rem 1fr 3.5rem 3rem;
    gap: 0.35rem;
    padding: 0.35rem 0.4rem;
    font-size: 0.65rem;
  }
  
  .leaderboard-position {
    font-size: 0.6rem;
  }
  
  .position-number {
    font-size: 0.6rem;
  }
  
  .position-medal {
    font-size: 0.7rem;
  }
  
  .leaderboard-driver {
    font-size: 0.65rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .leaderboard-time {
    font-size: 0.65rem;
  }
  
  .leaderboard-gap {
    font-size: 0.6rem;
  }
  
  /* Gap Stats */
  .position-gaps {
    gap: 0.45rem;
  }
  
  .gap-stat {
    padding: 0.45rem;
  }
  
  .gap-label {
    font-size: 0.6rem;
  }
  
  .gap-value {
    font-size: 0.8rem;
  }
  
  .gap-driver {
    font-size: 0.65rem;
  }
}

/* Map Card Styles */
.chart-card.map-card {
  width: 100%;
  padding: 1.5rem;
}

.map-container {
  width: 100%;
  min-height: 500px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-tertiary);
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

/* Trophy Case Styles */
.trophy-case {
  margin-bottom: 2rem;
}

.trophies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.trophy-card {
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  text-align: center;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.trophy-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.trophy-card:hover {
  transform: translateY(-4px) scale(1.02);
}

.trophy-card:hover::before {
  opacity: 1;
}

.trophy-card.emblem {
  background: linear-gradient(135deg, #DC2626, #991B1B);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.trophy-card.gold {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.trophy-card.silver {
  background: linear-gradient(135deg, #94A3B8, #64748B);
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.3);
}

.trophy-card.bronze {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.3);
}

.trophy-card.coal {
  background: linear-gradient(135deg, #374151, #1F2937);
  box-shadow: 0 4px 12px rgba(55, 65, 81, 0.3);
}

.trophy-card.dimmed {
  opacity: 0.3;
  filter: grayscale(0.8);
}

.trophy-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.trophy-count {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  margin-bottom: 0.25rem;
}

.trophy-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Stat Category Styles */
.stat-category {
  margin-bottom: 2rem;
}

.category-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-color);
}

/* Professional Table-Based Heatmap Styles */
.info-badge {
  background: rgba(59, 130, 246, 0.1);
  color: #60A5FA;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.heatmap-container-pro {
  width: 100%;
  max-width: 100%;
  position: relative;
  overflow: hidden;
}

.heatmap-container-pro {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.heatmap-wrapper {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  align-items: flex-start;
  overflow: hidden;
}

.heatmap-scroll-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  max-width: calc(100vw - 3rem);
  padding-bottom: 1rem;
}

.heatmap-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-width: 600px;
}

.heatmap-legend-inline {
  background: linear-gradient(135deg, #2d3748, #4a5568);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.heatmap-legend-inline p {
  margin: 0 0 0.5rem 0;
  color: rgba(255,255,255,0.9);
  font-size: 0.7rem;
  line-height: 1.4;
}

.heatmap-legend-inline p:last-child {
  margin-bottom: 0;
  margin-top: 0.5rem;
}

.legend-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.legend-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.2);
}

.track-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.6rem 0.5rem;
  height: 100%;
}

.track-icon {
  color: var(--primary-color);
  font-size: 1rem;
  margin-bottom: 0.2rem;
  line-height: 1;
  font-family: "Font Awesome 6 Free" !important;
  font-weight: 900 !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  display: inline-block;
}

/* Fallback for flag icon */
.track-icon.fa-flag-checkered::before {
  content: "\f11e" !important;
}

.track-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  font-size: 0.6rem;
  max-width: 100%;
  line-height: 1.2;
  text-align: center;
}

.track-laps {
  font-size: 0.55rem;
  color: rgba(255,255,255,0.5);
  font-weight: 500;
  line-height: 1.2;
}

.hm-gap {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin-top: 0;
  line-height: 1.2;
}

.stat-driver .stat-value,
.stat-track .stat-value {
  color: var(--primary-color);
  font-weight: 700;
  font-family: inherit;
}

.hm-corner {
  background: linear-gradient(135deg, #2d3748, #4a5568);
  padding: 1rem 1.25rem;
  font-weight: 700;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  left: 0;
  z-index: 11;
  min-width: 140px;
  max-width: 140px;
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}

.hm-track-col {
  background: linear-gradient(135deg, #2d3748, #4a5568);
  padding: 0.75rem 0.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  border-left: 1px solid rgba(255,255,255,0.1);
  min-width: 130px;
  max-width: 130px;
  width: 130px;
  display: table-cell;
  vertical-align: middle;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}

.hm-driver-row {
  background: linear-gradient(135deg, #2d3748, #374151);
  padding: 0.6rem 0.85rem;
  font-weight: 600;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.9);
  border-right: 1px solid rgba(255,255,255,0.1);
  border-top: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  left: 0;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 85px;
  max-width: 85px;
  text-align: center;
  vertical-align: middle;
  display: table-cell;
}

.hm-cell {
  padding: 0;
  text-align: center;
  border-left: 1px solid rgba(255,255,255,0.1);
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative;
  min-width: 130px;
  max-width: 130px;
  width: 130px;
  height: 85px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: table-cell;
  vertical-align: middle;
}

.hm-cell:hover {
  z-index: 10;
  box-shadow: inset 0 0 0 2px var(--primary-color);
  filter: brightness(1.1);
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 100%;
  padding: 0.75rem 0.5rem;
  position: relative;
}

.hm-trophy {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #FFD700;
  font-size: 1rem;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6));
  line-height: 1;
  z-index: 1;
  font-family: "Font Awesome 6 Free" !important;
  font-weight: 900 !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  display: inline-block;
}

/* Fallback for when FontAwesome doesn't load */
.hm-trophy::before {
  content: "\f091" !important;
}

.hm-time {
  font-weight: 700;
  font-size: 1.05rem;
  color: #ffffff;
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  line-height: 1.2;
  margin-top: 0;
}

.hm-laps {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  line-height: 1.2;
}

.no-data {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.15);
  font-weight: 300;
  line-height: 1;
}

.hm-cell:has(.no-data) {
  background: rgba(30, 35, 45, 0.4) !important;
  cursor: not-allowed;
  opacity: 0.5;
}

.hm-cell:has(.no-data):hover {
  box-shadow: none;
  filter: none;
}

/* Heatmap Stats Panel */
.heatmap-stats-panel {
  min-width: 160px;
  max-width: 160px;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
  align-self: flex-start;
  position: sticky;
  top: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.stats-panel-header {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  padding: 0.5rem 0.6rem;
  font-weight: 700;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.stats-panel-header i {
  font-size: 0.7rem;
}

.stats-panel-content {
  padding: 0.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.stat-highlight {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1));
  border-radius: var(--radius-md);
  padding: 0.5rem 0.6rem;
  margin: 0.25rem -0.35rem;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.stat-label {
  color: rgba(255,255,255,0.6);
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-highlight .stat-label {
  color: rgba(255,255,255,0.85);
}

.stat-value {
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-mono);
  text-align: right;
}

.stat-highlight .stat-value {
  color: #fdba74;
  font-size: 0.75rem;
}

.stat-highlight {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%);
  border-left: 3px solid var(--primary-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin: 0.75rem 0;
}

.stat-highlight .stat-label {
  color: var(--primary-color);
  font-weight: 600;
}

.stat-highlight .stat-value {
  color: var(--primary-color);
  font-size: 1.125rem;
}

/* Heatmap Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 1.5rem;
  padding: 1.25rem 1.75rem;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

.legend-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

.legend-items {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.legend-box {
  width: 40px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

.legend-item span {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.8);
  font-weight: 600;
  font-family: var(--font-mono);
}

/* Driver Selection Controls */
.driver-selection-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.driver-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.driver-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  border: 2px solid;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.driver-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.driver-chip.active {
  font-weight: 600;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.control-actions {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-light);
}

/* Clickable Trophies */
.trophy-card-compact {
  cursor: pointer;
  user-select: none;
}

.trophy-card-compact:not(.dimmed):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}

.trophy-card-compact:not(.dimmed):active {
  transform: translateY(0);
}

/* Trophy Details Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.trophy-details-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.trophy-details-list::-webkit-scrollbar {
  width: 8px;
}

.trophy-details-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.trophy-details-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.trophy-details-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-light);
}

.trophy-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.trophy-detail-item:hover {
  border-color: var(--border-light);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.detail-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-position {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.detail-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-date {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.detail-time {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-gaps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gap-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gap-value-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-time .label,
.gap-item .label,
.detail-opponents .label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.detail-time .value {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
}

.gap-value {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.gap-losing {
  color: #EF4444; /* Red for losing/slower */
}

.gap-winning {
  color: #10B981; /* Green for winning/faster */
}

.gap-driver {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  font-family: 'Inter', sans-serif;
}

.detail-opponents {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.driver-result {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.driver-result:hover {
  background: var(--bg-secondary);
}

.driver-result.current-driver {
  border-left-color: var(--accent);
  background: var(--bg-secondary);
  font-weight: 600;
}

.driver-position {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--accent);
  min-width: 2rem;
}

.driver-name {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.driver-result.current-driver .driver-name {
  color: var(--accent);
}

.driver-time {
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-opponents .value {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.trophy-modal .modal-content {
  max-width: 700px;
  max-height: 85vh;
}

/* Track Record Specific Styles */
.track-record-item {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 2px solid #FFD700;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
}

.track-record-item .detail-icon {
  font-size: 3rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #FFD700;
  margin-bottom: 1rem;
}

.record-track {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.1em;
  width: fit-content;
}

.record-track-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFD700;
  margin: 0;
}

.record-time-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.record-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.record-value {
  font-size: 2.5rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.record-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.record-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.leaderboard-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  text-align: center;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.leaderboard-entry {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.leaderboard-entry:hover {
  transform: translateX(4px);
  background: var(--bg-primary);
}

.leaderboard-entry.is-record-holder {
  border-left-color: #FFD700;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, var(--bg-secondary) 50%);
  font-weight: 700;
}

.leaderboard-entry.is-podium {
  border-left-color: var(--accent);
}

.leaderboard-position {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.position-number {
  font-size: 1.125rem;
  font-weight: 900;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.position-medal {
  font-size: 1.25rem;
}

.leaderboard-driver {
  font-size: 1rem;
  color: var(--text-primary);
}

.leaderboard-entry.is-record-holder .leaderboard-driver {
  color: #FFD700;
  font-weight: 700;
}

.leaderboard-time {
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
  text-align: right;
}

.leaderboard-gap {
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  color: #EF4444;
  text-align: right;
  min-width: 4.5rem;
}

/* Position-Based Trophy Styling */
.position-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid;
}

.position-header.position-1 {
  border-bottom-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.position-header.position-2 {
  border-bottom-color: #C0C0C0;
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.05) 0%, transparent 100%);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.position-header.position-3 {
  border-bottom-color: #CD7F32;
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.05) 0%, transparent 100%);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.position-track {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.position-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.1em;
  width: fit-content;
}

.position-1 .position-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
}

.position-2 .position-badge {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
  color: #000;
}

.position-3 .position-badge {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  color: #000;
}

.position-track-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.position-1 .position-track-name {
  color: #FFD700;
}

.position-2 .position-track-name {
  color: #C0C0C0;
}

.position-3 .position-track-name {
  color: #CD7F32;
}

.position-time-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.position-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.position-value {
  font-size: 2rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
}

.position-1 .position-value {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.position-2 .position-value {
  color: #C0C0C0;
  text-shadow: 0 0 10px rgba(192, 192, 192, 0.3);
}

.position-3 .position-value {
  color: #CD7F32;
  text-shadow: 0 0 10px rgba(205, 127, 50, 0.3);
}

.position-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.position-gaps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.gap-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid;
}

.gap-stat.winning {
  background: rgba(16, 185, 129, 0.1);
  border-left-color: #10B981;
}

.gap-stat.losing {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #EF4444;
}

.gap-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.gap-content {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.gap-value {
  font-size: 1.25rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
}

.gap-stat.winning .gap-value {
  color: #10B981;
}

.gap-stat.losing .gap-value {
  color: #EF4444;
}

.gap-driver {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.session-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-leaderboard .leaderboard-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  text-align: center;
}

.session-leaderboard .leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.session-leaderboard .leaderboard-entry.is-current-driver {
  border-left-width: 3px;
  border-left-style: solid;
  font-weight: 700;
}

.session-leaderboard .position-1 ~ * .leaderboard-entry.is-current-driver {
  border-left-color: #FFD700;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, var(--bg-secondary) 50%);
}

.session-leaderboard .position-2 ~ * .leaderboard-entry.is-current-driver {
  border-left-color: #C0C0C0;
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, var(--bg-secondary) 50%);
}

.session-leaderboard .position-3 ~ * .leaderboard-entry.is-current-driver {
  border-left-color: #CD7F32;
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.1) 0%, var(--bg-secondary) 50%);
}

.session-leaderboard .leaderboard-entry.is-current-driver .leaderboard-driver {
  font-weight: 700;
}

/* Mobile Responsive Styles */
@media (max-width: 1200px) {
  .heatmap-wrapper {
    flex-direction: column;
  }
  
  .heatmap-stats-panel {
    position: relative;
    top: 0;
    min-width: 100%;
    max-width: 100%;
    margin-top: 1rem;
  }
  
  .stats-panel-header {
    padding: 0.65rem 0.85rem;
    font-size: 0.75rem;
  }
  
  .stats-panel-content {
    padding: 0.6rem;
    max-height: 55vh;
    font-size: 0.75rem;
  }
  
  .stat-row {
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.35rem;
  }
  
  .stat-label {
    font-size: 0.65rem;
  }
  
  .stat-value {
    font-size: 0.7rem;
  }
  
  .stat-highlight .stat-value {
    font-size: 0.75rem;
  }
}

@media (max-width: 1024px) {
  .heatmap-scroll-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 1rem;
  }
  
  .chart-header h3 {
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .chart-header h3 i {
    font-size: 1.1rem;
  }
  
  .hm-track-col,
  .hm-cell {
    min-width: 110px;
    max-width: 110px;
  }
  
  .hm-time {
    font-size: 0.95rem;
  }
  
  .hm-laps {
    font-size: 0.65rem;
  }
  
  .hm-gap {
    font-size: 0.6rem;
  }
}

@media (max-width: 768px) {
  .chart-card.ultra-wide {
    padding: 1.25rem;
  }
  
  .chart-header h3 {
    font-size: 1.1rem;
    gap: 0.4rem;
  }
  
  .chart-header h3 i {
    font-size: 1rem;
  }
  
  .heatmap-legend-inline {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .heatmap-legend-inline p {
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  
  .heatmap-legend-inline p i {
    margin: 0 0.25rem;
  }
  
  .legend-list {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  
  .legend-list li {
    font-size: 0.8rem;
  }
  
  .color-dot {
    width: 14px;
    height: 14px;
  }
  
  .hm-corner,
  .hm-driver-row {
    min-width: 120px;
    max-width: 120px;
    font-size: 0.75rem;
    padding: 0.75rem 0.85rem;
  }
  
  .hm-track-col,
  .hm-cell {
    min-width: 95px;
    max-width: 95px;
    height: 72px;
  }
  
  .track-header-content {
    padding: 0.5rem 0.35rem;
    gap: 0.25rem;
  }
  
  .track-icon {
    font-size: 0.9rem;
    margin-bottom: 0.15rem;
  }
  
  .track-name {
    font-size: 0.72rem;
    line-height: 1.2;
  }
  
  .track-laps {
    font-size: 0.62rem;
  }
  
  .cell-content {
    gap: 0.3rem;
    padding: 0.65rem;
  }
  
  .hm-time {
    font-size: 0.88rem;
    line-height: 1.1;
  }
  
  .hm-laps {
    font-size: 0.62rem;
  }
  
  .hm-gap {
    font-size: 0.6rem;
  }
  
  .hm-trophy {
    font-size: 0.9rem;
    top: 3px;
    right: 3px;
  }
  
  .stats-panel-header {
    padding: 1rem 1.25rem;
    font-size: 0.95rem;
    gap: 0.6rem;
  }
  
  .stats-panel-header i {
    font-size: 1.1rem;
  }
  
  .stats-panel-content {
    padding: 1.25rem;
  }
  
  .stat-row {
    padding: 0.75rem 0;
    gap: 0.85rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .stat-value {
    font-size: 0.9rem;
  }
  
  .stat-highlight {
    padding: 0.85rem 1.15rem;
    margin: 0.6rem -0.65rem;
  }
  
  .stat-highlight .stat-value {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .chart-card.ultra-wide {
    padding: 0.85rem;
  }
  
  .chart-header {
    padding: 0.85rem;
    margin: -0.85rem -0.85rem 1rem -0.85rem;
  }
  
  .chart-header h3 {
    font-size: 0.95rem;
    gap: 0.35rem;
  }
  
  .chart-header h3 i {
    font-size: 0.9rem;
  }
  
  .chart-explanation {
    font-size: 0.75rem;
    padding: 0.75rem;
    margin: 0 -0.85rem 0.85rem -0.85rem;
  }
  
  .heatmap-legend-inline {
    padding: 0.85rem;
    margin-bottom: 0.85rem;
  }
  
  .heatmap-legend-inline p {
    font-size: 0.75rem;
    margin-bottom: 0.65rem;
  }
  
  .heatmap-legend-inline p i {
    font-size: 0.7rem;
    margin: 0 0.2rem;
  }
  
  .legend-list {
    gap: 0.5rem;
  }
  
  .legend-list li {
    font-size: 0.72rem;
  }
  
  .color-dot {
    width: 12px;
    height: 12px;
  }
  
  .heatmap-container-pro {
    max-width: 100vw;
    padding: 0;
    margin: 0 -1rem;
  }

  .heatmap-wrapper {
    flex-direction: column;
    gap: 1rem;
  }

  .heatmap-scroll-container {
    max-width: calc(100vw - 2rem);
    overflow-x: auto !important;
    padding: 0 1rem;
  }

  .heatmap-table {
    min-width: 500px;
  }
  
  .hm-corner,
  .hm-driver-row {
    min-width: 90px;
    max-width: 90px;
    font-size: 0.75rem;
    padding: 0.6rem 0.7rem;
  }
  
  .hm-track-col,
  .hm-cell {
    min-width: 90px;
    max-width: 90px;
    min-height: 65px;
    padding: 0.5rem;
  }
  
  .track-name {
    font-size: 0.7rem;
    font-weight: 700;
  }
  
  .track-laps {
    font-size: 0.65rem;
  }
  
  .hm-time {
    font-size: 0.85rem;
    font-weight: 700;
  }
  
  .hm-laps {
    font-size: 0.68rem;
  }
  
  .hm-gap {
    font-size: 0.68rem;
  }
  
  .hm-trophy {
    font-size: 0.9rem;
  }
  
  .no-data {
    font-size: 0.7rem;
  }
  
  .heatmap-scroll-container {
    overflow-x: auto !important;
    overflow-y: visible !important;
    -webkit-overflow-scrolling: touch;
    max-width: 100% !important;
  }
  
  .heatmap-wrapper {
    position: relative;
    overflow: hidden;
    max-width: 100%;
  }
  
  .heatmap-container-pro {
    overflow: hidden;
    max-width: 100%;
  }
  
  .chart-card.ultra-wide {
    overflow: hidden;
    max-width: 100%;
  }
  
  .track-header-content {
    padding: 0.4rem 0.25rem;
    gap: 0.2rem;
  }
  
  .track-icon {
    font-size: 0.75rem;
    margin-bottom: 0.1rem;
  }
  
  .track-name {
    font-size: 0.65rem;
    line-height: 1.15;
  }
  
  .track-laps {
    font-size: 0.55rem;
  }
  
  .cell-content {
    gap: 0.25rem;
    padding: 0.5rem 0.35rem;
  }
  
  .hm-time {
    font-size: 0.72rem;
    line-height: 1.1;
  }
  
  .hm-laps {
    font-size: 0.52rem;
    line-height: 1.1;
  }
  
  .hm-gap {
    font-size: 0.5rem;
    line-height: 1.1;
    margin-top: 0;
  }
  
  .hm-trophy {
    font-size: 0.75rem;
    top: 2px;
    right: 2px;
  }
  
  .no-data {
    font-size: 1rem;
  }
  
  .stats-panel-header {
    padding: 0.6rem 0.75rem;
    font-size: 0.7rem;
    gap: 0.35rem;
  }
  
  .stats-panel-header i {
    font-size: 0.85rem;
  }
  
  .stats-panel-content {
    padding: 0.65rem;
    max-height: 50vh;
  }
  
  .stat-row {
    padding: 0.35rem 0.45rem;
    margin-bottom: 0.3rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
  
  .stat-label {
    font-size: 0.6rem;
    font-weight: 600;
  }
  
  .stat-value {
    font-size: 0.68rem;
    word-break: break-word;
  }
  
  .stat-highlight {
    padding: 0.4rem 0.5rem;
  }
  
  .stat-highlight .stat-label {
    font-size: 0.62rem;
  }
  
  .stat-highlight .stat-value {
    font-size: 0.72rem;
    font-weight: 700;
  }
}

/* Add horizontal scroll indicator on mobile */
@media (max-width: 768px) {
  .heatmap-scroll-container {
    position: relative;
  }
  
  .heatmap-scroll-container::after {
    content: '← Scroll →';
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95));
    color: white;
    padding: 0.45rem 0.85rem;
    border-radius: var(--radius-sm);
    font-size: 0.65rem;
    font-weight: 700;
    pointer-events: none;
    opacity: 0;
    animation: scrollHint 3s ease-in-out 1s infinite;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    z-index: 5;
  }
  
  @keyframes scrollHint {
    0%, 100% { opacity: 0; transform: translateX(0); }
    10%, 90% { opacity: 0.9; }
    50% { transform: translateX(-5px); }
  }
}

</style>



