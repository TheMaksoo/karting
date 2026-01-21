<template>
  <div class="track-performance-view">
    <header class="page-header">
      <h1>�️ Track Performance Analysis</h1>
      <p>Compare lap times, speeds, and performance across all tracks</p>
    </header>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Sort by:</label>
        <select v-model="sortBy" @change="sortTracks" class="filter-select">
          <option value="total_laps">Total Laps</option>
          <option value="avg_lap_time">Average Lap Time</option>
          <option value="track_record">Track Record</option>
          <option value="avg_speed_kmh">Average Speed</option>
          <option value="total_sessions">Total Sessions</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter driver:</label>
        <select v-model="selectedDriver" @change="loadTrackStats" class="filter-select">
          <option value="">All Drivers</option>
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading track performance data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadTrackStats" class="retry-btn">Retry</button>
    </div>

    <!-- Charts Section -->
    <div v-else-if="trackStats.length > 0" class="charts-section">
      <div class="chart-container">
        <h3>🏁 Track Records Comparison</h3>
        <canvas ref="trackRecordsChart"></canvas>
      </div>

      <div class="chart-container">
        <h3>⏱️ Average Lap Times by Track</h3>
        <canvas ref="avgLapTimesChart"></canvas>
      </div>

      <div class="chart-container">
        <h3>🚀 Average Speeds by Track</h3>
        <canvas ref="avgSpeedsChart"></canvas>
      </div>

      <div class="chart-container">
        <h3>📊 Activity by Track</h3>
        <canvas ref="activityChart"></canvas>
      </div>
    </div>

    <!-- Track Cards -->
    <div v-if="trackStats.length > 0" class="tracks-grid">
      <div
        v-for="track in sortedTracks"
        :key="track.track_id"
        class="track-card"
        :style="{ borderLeftColor: getTrackColor(track.track_name) }"
      >
        <div class="track-header">
          <h3>{{ track.track_name }}</h3>
          <div class="track-location">
            <span v-if="track.city">{{ track.city }}, </span>{{ track.country || 'Unknown' }}
          </div>
        </div>

        <div class="track-stats">
          <div class="stat-item">
            <span class="stat-label">Track Record</span>
            <span class="stat-value highlight">{{ formatTime(track.track_record) }}</span>
            <span class="stat-subtext" v-if="track.record_holder">by {{ track.record_holder }}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Avg Lap Time</span>
            <span class="stat-value">{{ formatTime(track.avg_lap_time) }}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Avg Speed</span>
            <span class="stat-value">{{ track.avg_speed_kmh ? track.avg_speed_kmh + ' km/h' : 'N/A' }}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Total Laps</span>
            <span class="stat-value">{{ track.total_laps }}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Sessions</span>
            <span class="stat-value">{{ track.total_sessions }}</span>
          </div>

          <div class="stat-item">
            <span class="stat-label">Unique Drivers</span>
            <span class="stat-value">{{ track.unique_drivers }}</span>
          </div>
        </div>

        <div class="track-details">
          <div v-if="track.distance" class="detail-item">
            <span>Distance: {{ track.distance }}m</span>
          </div>
          <div v-if="track.corners" class="detail-item">
            <span>Corners: {{ track.corners }}</span>
          </div>
          <div v-if="track.indoor !== null" class="detail-item">
            <span>{{ track.indoor ? 'Indoor' : 'Outdoor' }}</span>
          </div>
          <div v-if="track.total_distance_km" class="detail-item">
            <span>Total Distance: {{ track.total_distance_km }} km</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>🏁 No track performance data available</p>
      <p class="hint">Complete some karting sessions to see track performance analysis</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useChartConfig } from '@/composables/useChartConfig'
import { useKartingAPI } from '@/composables/useKartingAPI'

// Register Chart.js components
Chart.register(...registerables)

const { getColor } = useChartConfig()
const { getTrackStats, loading, error } = useKartingAPI()

// State
const trackStats = ref<any[]>([])
const drivers = ref<any[]>([])
const selectedDriver = ref('')
const sortBy = ref('total_laps')

// Chart refs
const trackRecordsChart = ref<HTMLCanvasElement>()
const avgLapTimesChart = ref<HTMLCanvasElement>()
const avgSpeedsChart = ref<HTMLCanvasElement>()
const activityChart = ref<HTMLCanvasElement>()

// Chart instances
let recordsChartInstance: Chart | null = null
let lapTimesChartInstance: Chart | null = null
let speedsChartInstance: Chart | null = null
let activityChartInstance: Chart | null = null

const sortedTracks = computed(() => {
  const tracks = [...trackStats.value]

  switch (sortBy.value) {
    case 'avg_lap_time':
      return tracks.sort((a, b) => (a.avg_lap_time || Infinity) - (b.avg_lap_time || Infinity))
    case 'track_record':
      return tracks.sort((a, b) => (a.track_record || Infinity) - (b.track_record || Infinity))
    case 'avg_speed_kmh':
      return tracks.sort((a, b) => (b.avg_speed_kmh || 0) - (a.avg_speed_kmh || 0))
    case 'total_sessions':
      return tracks.sort((a, b) => b.total_sessions - a.total_sessions)
    case 'total_laps':
    default:
      return tracks.sort((a, b) => b.total_laps - a.total_laps)
  }
})

async function loadTrackStats() {
  const params = selectedDriver.value ? { driver_id: parseInt(selectedDriver.value) } : undefined
  const data = await getTrackStats()
  trackStats.value = data || []

  await nextTick()
  createCharts()
}

async function loadDrivers() {
  try {
    // For now, we'll load drivers from a simple API call
    // This should be replaced with a proper getDrivers function in useKartingAPI
    const response = await fetch('http://127.0.0.1:8000/api/drivers', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('api_token')}`,
        'Accept': 'application/json'
      }
    })
    const data = await response.json()
    drivers.value = data.data || data || []
  } catch (err) {
    console.error('Failed to load drivers:', err)
  }
}

function sortTracks() {
  // Charts will update automatically due to computed property
  nextTick(() => {
    createCharts()
  })
}

function createCharts() {
  if (trackStats.value.length === 0) return

  const tracks = sortedTracks.value

  // Destroy existing charts
  if (recordsChartInstance) recordsChartInstance.destroy()
  if (lapTimesChartInstance) lapTimesChartInstance.destroy()
  if (speedsChartInstance) speedsChartInstance.destroy()
  if (activityChartInstance) activityChartInstance.destroy()

  // Track Records Chart
  if (trackRecordsChart.value) {
    const recordsData = tracks
      .filter(t => t.track_record)
      .slice(0, 10) // Top 10

    recordsChartInstance = new Chart(trackRecordsChart.value, {
      type: 'bar',
      data: {
        labels: recordsData.map(t => t.track_name),
        datasets: [{
          label: 'Track Record (seconds)',
          data: recordsData.map(t => t.track_record),
          backgroundColor: recordsData.map((t, i) => getColor(i)),
          borderColor: recordsData.map((t, i) => getColor(i)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }

  // Average Lap Times Chart
  if (avgLapTimesChart.value) {
    const lapTimesData = tracks
      .filter(t => t.avg_lap_time)
      .slice(0, 10)

    lapTimesChartInstance = new Chart(avgLapTimesChart.value, {
      type: 'bar',
      data: {
        labels: lapTimesData.map(t => t.track_name),
        datasets: [{
          label: 'Average Lap Time (seconds)',
          data: lapTimesData.map(t => t.avg_lap_time),
          backgroundColor: lapTimesData.map((t, i) => getColor(i)),
          borderColor: lapTimesData.map((t, i) => getColor(i)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }

  // Average Speeds Chart
  if (avgSpeedsChart.value) {
    const speedsData = tracks
      .filter(t => t.avg_speed_kmh)
      .slice(0, 10)

    speedsChartInstance = new Chart(avgSpeedsChart.value, {
      type: 'bar',
      data: {
        labels: speedsData.map(t => t.track_name),
        datasets: [{
          label: 'Average Speed (km/h)',
          data: speedsData.map(t => t.avg_speed_kmh),
          backgroundColor: speedsData.map((t, i) => getColor(i)),
          borderColor: speedsData.map((t, i) => getColor(i)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  // Activity Chart (Sessions and Laps)
  if (activityChart.value) {
    const activityData = tracks.slice(0, 10)

    activityChartInstance = new Chart(activityChart.value, {
      type: 'radar',
      data: {
        labels: activityData.map(t => t.track_name),
        datasets: [
          {
            label: 'Total Sessions',
            data: activityData.map(t => t.total_sessions),
            backgroundColor: 'rgba(255, 107, 53, 0.2)',
            borderColor: '#FF6B35',
            borderWidth: 2,
            pointBackgroundColor: '#FF6B35'
          },
          {
            label: 'Total Laps',
            data: activityData.map(t => t.total_laps),
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: '#10B981',
            borderWidth: 2,
            pointBackgroundColor: '#10B981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          r: {
            beginAtZero: true
          }
        }
      }
    })
  }
}

function getTrackColor(trackName: string): string {
  const colors = ['#FF6B35', '#10B981', '#4F46E5', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']
  const index = trackName.length % colors.length
  return colors[index] || '#FF6B35'
}

function formatTime(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

onMounted(async () => {
  await Promise.all([
    loadTrackStats(),
    loadDrivers()
  ])
})

onUnmounted(() => {
  // Clean up chart instances to prevent memory leaks
  if (recordsChartInstance) recordsChartInstance.destroy()
  if (lapTimesChartInstance) lapTimesChartInstance.destroy()
  if (speedsChartInstance) speedsChartInstance.destroy()
  if (activityChartInstance) activityChartInstance.destroy()
})

watch(sortBy, sortTracks)
</script>

<style scoped>
.track-performance-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #F0F6FC;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #8B949E;
  font-size: 16px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #8B949E;
  font-weight: 500;
}

.filter-select {
  padding: 8px 16px;
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 6px;
  color: #F0F6FC;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: #FF6B35;
}

.filter-select:focus {
  outline: none;
  border-color: #FF6B35;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #8B949E;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #30363D;
  border-top: 3px solid #FF6B35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #F87171;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #FF8555;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-container {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 12px;
  padding: 16px;
  height: 280px;
}

.chart-container h3 {
  margin: 0 0 12px 0;
  color: #F0F6FC;
  font-size: 14px;
  font-weight: 600;
}

.tracks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.track-card {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.track-card:hover {
  transform: translateY(-2px);
  border-color: #FF6B35;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
}

.track-header {
  margin-bottom: 12px;
}

.track-header h3 {
  margin: 0 0 4px 0;
  color: #F0F6FC;
  font-size: 16px;
  font-weight: 600;
}

.track-location {
  margin: 0;
  color: #8B949E;
  font-size: 12px;
}

.track-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #8B949E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #F0F6FC;
}

.stat-value.highlight {
  color: #FF6B35;
}

.stat-subtext {
  display: block;
  font-size: 10px;
  color: #8B949E;
  margin-top: 2px;
}

.track-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #8B949E;
}

.detail-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8B949E;
}

.empty-state p {
  margin: 8px 0;
  font-size: 18px;
}

.empty-state .hint {
  color: #8B949E;
  font-size: 14px;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }

  .tracks-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
    align-items: center;
  }
}
</style>
