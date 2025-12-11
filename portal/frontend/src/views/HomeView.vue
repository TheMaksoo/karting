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
        <!-- Friends and Activity Sections -->
        <div class="home-sections-grid">
          <FriendsSection 
            :friends="friends"
            :loading="friendsLoading"
            @add-friend="handleAddFriend"
            @remove-friend="removeFriend"
          />
          
          <LatestActivity 
            :activities="activities"
            :loading="activityLoading"
            :user-driver-id="loggedInDriverId"
          />
        </div>

        <!-- Quick Stats from Grouped Stats -->
        <QuickStats 
          v-if="statCategories.length > 0"
          :stats="statCategories.flatMap(c => c.stats)"
        />

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
                  <div class="detail-info">
                    <!-- Track Record Layout -->
                    <template v-if="selectedTrophyType === 'emblems'">
                      <div class="record-header">
                        <div class="record-track">
                          <span class="record-badge">TRACK RECORD</span>
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

      <!-- Add Friend Modal -->
      <Teleport to="body">
        <div v-if="showAddFriendModal" class="modal-overlay" @click="showAddFriendModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Add Friend</h3>
              <button @click="showAddFriendModal = false" class="close-btn">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-hint">Select a driver to add to your friends list:</p>
              <div v-if="driversLoading" class="loading-state">Loading drivers...</div>
              <div v-else class="drivers-grid">
                <button 
                  v-for="driver in allDrivers.filter(d => d.id !== loggedInDriverId && !friends.some(f => f.driver_id === d.id))" 
                  :key="driver.id"
                  @click="addFriend(driver.id)"
                  class="driver-option"
                >
                  <div class="driver-avatar">{{ driver.name.charAt(0) }}</div>
                  <div class="driver-name">{{ driver.name }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import TrackMap from '@/components/TrackMap.vue'
import FriendsSection from '@/components/home/FriendsSection.vue'
import LatestActivity from '@/components/home/LatestActivity.vue'
import QuickStats from '@/components/home/QuickStats.vue'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import { useKartingAPI, type OverviewStats, type DriverStat, type TrackStat } from '@/composables/useKartingAPI'
import { useAuthStore } from '@/stores/auth'
import apiService from '@/services/api'

Chart.register(...registerables)

const authStore = useAuthStore()
const loggedInDriverId = computed(() => authStore.user?.driver_id)
const resolvedDriverId = ref<number | null>(null) // Store the actual driver ID after resolution

const { getOverviewStats, getDriverStats, getTrackStats, getAllLaps, getDriverActivityOverTime, getDriverTrackHeatmap, getTrophyCase } = useKartingAPI()

const dataLoading = ref(true)
const dataError = ref<string | null>(null)

// Friends and Activity Data
const friends = ref<any[]>([])
const activities = ref<any[]>([])
const allDrivers = ref<any[]>([])
const friendsLoading = ref(false)
const activityLoading = ref(false)
const driversLoading = ref(false)
const showAddFriendModal = ref(false)

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

// Friends and Activity Methods
const loadFriends = async () => {
  friendsLoading.value = true
  try {
    friends.value = await apiService.friends.getAll()
  } catch (error) {
    console.error('Failed to load friends:', error)
  } finally {
    friendsLoading.value = false
  }
}

const loadActivity = async () => {
  activityLoading.value = true
  try {
    activities.value = await apiService.activity.latest(true, 10)
  } catch (error) {
    console.error('Failed to load activity:', error)
  } finally {
    activityLoading.value = false
  }
}

const loadAllDrivers = async () => {
  driversLoading.value = true
  try {
    const response = await apiService.drivers.getAll()
    allDrivers.value = response
  } catch (error) {
    console.error('Failed to load drivers:', error)
  } finally {
    driversLoading.value = false
  }
}

const handleAddFriend = () => {
  showAddFriendModal.value = true
  if (allDrivers.value.length === 0) {
    loadAllDrivers()
  }
}

const addFriend = async (driverId: number) => {
  try {
    await apiService.friends.add(driverId)
    await loadFriends()
    await loadActivity()
    showAddFriendModal.value = false
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to add friend')
  }
}

const removeFriend = async (friendId: number) => {
  if (!confirm('Remove this friend from your list?')) return
  
  try {
    await apiService.friends.remove(friendId)
    await loadFriends()
    await loadActivity()
  } catch (error) {
    alert('Failed to remove friend')
  }
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
  
  // Load friends and activity
  await Promise.all([
    loadFriends(),
    loadActivity(),
  ])
  
  // Load real data from database
  await loadRealData()
})

onUnmounted(() => {
  Object.values(chartInstances).forEach(chart => chart.destroy())
})
</script>
<style scoped lang="scss" src="../styles/HomeView.scss"></style>
<style scoped lang="scss" src="../styles/heatmap.scss"></style>
<style scoped lang="scss" src="../styles/trophy.scss"></style>
<style scoped lang="scss" src="../styles/driver-activity.scss"></style>
<style scoped lang="scss" src="../styles/gauge.scss"></style>
