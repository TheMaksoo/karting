<template>
  <div class="session-analysis">
    <div class="page-header">
      <h1>📊 Session Analysis</h1>
      <p class="subtitle">Detailed analysis of karting sessions and performance metrics</p>
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="filter-group">
        <label>Track</label>
        <select v-model="selectedTrack" class="select-input">
          <option value="">All Tracks</option>
          <option v-for="track in tracks" :key="track.id" :value="track.id">
            {{ track.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Driver</label>
        <select v-model="selectedDriver" class="select-input">
          <option value="">All Drivers</option>
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Date Range</label>
        <select v-model="dateRange" class="select-input">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="all">All time</option>
        </select>
      </div>
      <button @click="loadData" class="btn-primary">
        <span class="btn-icon">🔄</span>
        Refresh
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏁</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalSessions }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalLaps }}</div>
          <div class="stat-label">Total Laps</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatTime(stats.averageLapTime) }}</div>
          <div class="stat-label">Avg Lap Time</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatTime(stats.bestLapTime) }}</div>
          <div class="stat-label">Best Lap Time</div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>📈 Session Performance Trend</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Line chart showing lap time improvements over sessions</p>
          <small>Chart.js integration ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🎯 Consistency Analysis</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📉</div>
          <p>Standard deviation and consistency metrics</p>
          <small>Chart.js integration ready</small>
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>🏁 Session Comparison</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Compare multiple sessions side-by-side</p>
          <small>Chart.js integration ready</small>
        </div>
      </div>
    </div>

    <!-- Recent Sessions Table -->
    <div class="sessions-table-card">
      <h3>Recent Sessions</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Track</th>
              <th>Driver</th>
              <th>Laps</th>
              <th>Best Time</th>
              <th>Avg Time</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td>{{ formatDate(session.session_date) }}</td>
              <td>{{ session.track?.name || 'N/A' }}</td>
              <td>{{ session.driver?.name || 'N/A' }}</td>
              <td>{{ session.lap_count || 0 }}</td>
              <td class="time-cell">{{ formatTime(session.best_lap) }}</td>
              <td class="time-cell">{{ formatTime(session.avg_lap) }}</td>
              <td><span class="session-type-badge">{{ session.session_type || 'practice' }}</span></td>
              <td>
                <button class="btn-icon" title="View Details">👁️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@/services/api'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler()

interface Track {
  id: number
  name: string
}

interface Driver {
  id: number
  name: string
}

interface Session {
  id: number
  session_date: string
  session_type?: string
  track?: Track
  driver?: Driver
  lap_count?: number
  best_lap?: number
  avg_lap?: number
}

const selectedTrack = ref('')
const selectedDriver = ref('')
const dateRange = ref('30')
const tracks = ref<Track[]>([])
const drivers = ref<Driver[]>([])
const sessions = ref<Session[]>([])

const stats = ref({
  totalSessions: 0,
  totalLaps: 0,
  averageLapTime: 0,
  bestLapTime: 0,
})

const loadData = async () => {
  try {
    // Load tracks and drivers for filters
    tracks.value = await apiService.tracks.getAll()
    drivers.value = await apiService.drivers.getAll()
    
    // Load sessions (placeholder - would filter based on selections)
    const sessionsData = await apiService.sessions.getAll()
    sessions.value = sessionsData.data || []
    
    // Calculate stats
    stats.value.totalSessions = sessions.value.length
    stats.value.totalLaps = sessions.value.reduce((sum, s) => sum + (s.lap_count || 0), 0)
    
    const lapTimes = sessions.value.map(s => s.avg_lap).filter((t): t is number => t !== null && t !== undefined)
    stats.value.averageLapTime = lapTimes.length ? lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length : 0
    
    const bestTimes = sessions.value.map(s => s.best_lap).filter((t): t is number => t !== null && t !== undefined)
    stats.value.bestLapTime = bestTimes.length ? Math.min(...bestTimes) : 0
  } catch (error: unknown) {
    handleError(error, 'Failed to load session data')
  }
}

const formatTime = (seconds?: number): string => {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.session-analysis {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 0;
}

.filters-card {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.select-input {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.select-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon {
  font-size: 3rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1.5rem 0;
}

.chart-placeholder {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.chart-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.chart-placeholder p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
}

.chart-placeholder small {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.sessions-table-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

.sessions-table-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1.5rem 0;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.time-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #48bb78;
}

.session-type-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-icon {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filters-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-primary {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
