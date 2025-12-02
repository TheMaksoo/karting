<template>
  <div class="battles-view">
    <header class="page-header">
      <h1>⚔️ Head-to-Head Battles</h1>
      <p>Compare performance against other drivers</p>
    </header>

    <!-- Driver Selector -->
    <div class="battle-selector">
      <div class="driver-select">
        <label>Driver 1</label>
        <select v-model="driver1" @change="resetComparison" class="select-input">
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
      <div class="vs-icon">⚔️</div>
      <div class="driver-select">
        <label>Driver 2</label>
        <select v-model="driver2" @change="resetComparison" class="select-input">
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
      <button @click="loadBattle" :disabled="loading" class="btn-primary">
        <span v-if="loading">Loading...</span>
        <span v-else>Compare</span>
      </button>
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing battle data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadBattle" class="retry-btn">Retry</button>
    </div>

    <!-- Battle Stats -->
    <div v-else-if="battleData.totalBattles > 0" class="battle-stats">
      <div class="driver-card left">
        <div class="driver-avatar">{{ driver1 ? getInitials(getDriverName(driver1)) : '?' }}</div>
        <h3>{{ driver1 ? getDriverName(driver1) : 'Unknown' }}</h3>
        <div class="score-badge winner">{{ battleData.driver1Wins }}</div>
        <p class="score-label">Wins</p>
      </div>

      <div class="battle-info">
        <div class="battle-metric">
          <div class="metric-label">Total Battles</div>
          <div class="metric-value">{{ battleData.totalBattles }}</div>
        </div>
        <div class="battle-metric">
          <div class="metric-label">Avg Gap</div>
          <div class="metric-value">{{ formatTime(battleData.avgGap) }}</div>
        </div>
        <div class="battle-metric">
          <div class="metric-label">Closest Battle</div>
          <div class="metric-value">{{ formatTime(battleData.closestGap) }}</div>
        </div>
      </div>

      <div class="driver-card right">
        <div class="driver-avatar">{{ driver2 ? getInitials(getDriverName(driver2)) : '?' }}</div>
        <h3>{{ driver2 ? getDriverName(driver2) : 'Unknown' }}</h3>
        <div class="score-badge winner">{{ battleData.driver2Wins }}</div>
        <p class="score-label">Wins</p>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!loading && !error" class="empty-state">
      <p>⚔️ No battle data available</p>
      <p class="hint">Select two different drivers to compare their performance</p>
    </div>

    <!-- Comparison Charts -->
    <div v-if="battleData.totalBattles > 0 && !loading" class="charts-section">
      <div class="chart-container">
        <h3>📊 Lap Time Comparison</h3>
        <canvas ref="lapTimeChart"></canvas>
      </div>

      <div class="chart-container">
        <h3>🎯 Performance Gap</h3>
        <canvas ref="gapChart"></canvas>
      </div>

      <div class="chart-container full-width">
        <h3>🏁 Track-by-Track Results</h3>
        <canvas ref="trackComparisonChart"></canvas>
      </div>
    </div>

    <!-- Battle History -->
    <div v-if="battleHistory.length > 0" class="history-card">
      <h3>📜 Battle History</h3>
      <div class="battle-timeline">
        <div v-for="(battle, index) in battleHistory.slice(0, 10)" :key="index" class="battle-item">
          <div class="battle-date">{{ formatDate(battle.date) }}</div>
          <div class="battle-track">{{ battle.track_name }}</div>
          <div class="battle-times">
            <div :class="['time-box', battle.winner === driver1 ? 'winner' : '']">
              <span class="driver-name">{{ driver1 ? getDriverName(driver1) : 'Unknown' }}</span>
              <span class="time">{{ formatTime(battle.driver1_time) }}</span>
            </div>
            <div class="vs-divider">vs</div>
            <div :class="['time-box', battle.winner === driver2 ? 'winner' : '']">
              <span class="driver-name">{{ driver2 ? getDriverName(driver2) : 'Unknown' }}</span>
              <span class="time">{{ formatTime(battle.driver2_time) }}</span>
            </div>
          </div>
          <div class="battle-gap">
            Gap: {{ formatTime(Math.abs(battle.driver1_time - battle.driver2_time)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useChartConfig } from '@/composables/useChartConfig'
import { useKartingAPI } from '@/composables/useKartingAPI'

// Register Chart.js components
Chart.register(...registerables)

const { getColor } = useChartConfig()
const { getAllLaps, getDriverStats, loading, error } = useKartingAPI()

// State
const driver1 = ref<number | null>(null)
const driver2 = ref<number | null>(null)
const drivers = ref<any[]>([])
const battleData = ref({
  totalBattles: 0,
  driver1Wins: 0,
  driver2Wins: 0,
  avgGap: 0,
  closestGap: 0,
})
const battleHistory = ref<any[]>([])

// Chart refs
const lapTimeChart = ref<HTMLCanvasElement>()
const gapChart = ref<HTMLCanvasElement>()
const trackComparisonChart = ref<HTMLCanvasElement>()

// Chart instances
let lapTimeChartInstance: Chart | null = null
let gapChartInstance: Chart | null = null
let trackComparisonChartInstance: Chart | null = null

async function loadDrivers() {
  try {
    const driverStats = await getDriverStats()
    if (driverStats && driverStats.length > 0) {
      drivers.value = driverStats.map(d => ({
        id: d.driver_id,
        name: d.driver_name
      }))

      // Set default drivers if available
      if (drivers.value.length >= 2) {
        driver1.value = drivers.value[0].id
        driver2.value = drivers.value[1].id
      }
    }
  } catch (err) {
    console.error('Failed to load drivers:', err)
  }
}

function resetComparison() {
  battleData.value = {
    totalBattles: 0,
    driver1Wins: 0,
    driver2Wins: 0,
    avgGap: 0,
    closestGap: 0,
  }
  battleHistory.value = []
}

async function loadBattle() {
  if (!driver1.value || !driver2.value || driver1.value === driver2.value) {
    error.value = 'Please select two different drivers'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Get lap data for both drivers
    const [driver1Laps, driver2Laps] = await Promise.all([
      getAllLaps(driver1.value),
      getAllLaps(driver2.value)
    ])

    if (!driver1Laps || !driver2Laps) {
      throw new Error('Failed to load lap data')
    }

    // Group laps by track and session to find battles
    const battles = findBattles(driver1Laps, driver2Laps)

    // Calculate battle statistics
    calculateBattleStats(battles)

    // Create battle history
    battleHistory.value = battles
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20) // Keep most recent 20

    await nextTick()
    createCharts()

  } catch (err: any) {
    error.value = err.message || 'Failed to load battle data'
    console.error('Battle load error:', err)
  } finally {
    loading.value = false
  }
}

function findBattles(driver1Laps: any[], driver2Laps: any[]) {
  const battles: any[] = []

  // Group laps by track
  const driver1ByTrack = groupBy(driver1Laps, 'track_id')
  const driver2ByTrack = groupBy(driver2Laps, 'track_id')

  // Find tracks where both drivers have laps
  const commonTracks = Object.keys(driver1ByTrack).filter(trackId =>
    driver2ByTrack[trackId]
  )

  commonTracks.forEach(trackId => {
    const d1Laps = driver1ByTrack[trackId]
    const d2Laps = driver2ByTrack[trackId]

    // Find sessions where both drivers participated
    const d1Sessions = groupBy(d1Laps, 'session_id')
    const d2Sessions = groupBy(d2Laps, 'session_id')

    const commonSessions = Object.keys(d1Sessions).filter(sessionId =>
      d2Sessions[sessionId]
    )

    commonSessions.forEach(sessionId => {
      const sessionD1Laps = d1Sessions[sessionId]
      const sessionD2Laps = d2Sessions[sessionId]

      // Get best lap for each driver in this session
      const d1Best = sessionD1Laps.reduce((best: any, lap: any) =>
        !best || lap.lap_time < best.lap_time ? lap : best
      )
      const d2Best = sessionD2Laps.reduce((best: any, lap: any) =>
        !best || lap.lap_time < best.lap_time ? lap : best
      )

      if (d1Best && d2Best) {
        battles.push({
          track_id: trackId,
          track_name: d1Best.track_name,
          session_id: sessionId,
          date: d1Best.created_at,
          driver1_time: d1Best.lap_time,
          driver2_time: d2Best.lap_time,
          winner: d1Best.lap_time < d2Best.lap_time ? driver1.value : driver2.value,
          gap: Math.abs(d1Best.lap_time - d2Best.lap_time)
        })
      }
    })
  })

  return battles
}

function calculateBattleStats(battles: any[]) {
  if (battles.length === 0) {
    battleData.value = {
      totalBattles: 0,
      driver1Wins: 0,
      driver2Wins: 0,
      avgGap: 0,
      closestGap: 0,
    }
    return
  }

  const driver1Wins = battles.filter(b => b.winner === driver1.value).length
  const driver2Wins = battles.filter(b => b.winner === driver2.value).length
  const gaps = battles.map(b => b.gap)
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const closestGap = Math.min(...gaps)

  battleData.value = {
    totalBattles: battles.length,
    driver1Wins,
    driver2Wins,
    avgGap,
    closestGap,
  }
}

function groupBy(array: any[], key: string) {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

function createCharts() {
  if (battleHistory.value.length === 0) return

  // Destroy existing charts
  if (lapTimeChartInstance) lapTimeChartInstance.destroy()
  if (gapChartInstance) gapChartInstance.destroy()
  if (trackComparisonChartInstance) trackComparisonChartInstance.destroy()

  const battles = battleHistory.value.slice().reverse() // Chronological order

  // Lap Time Comparison Chart
  if (lapTimeChart.value) {
    const labels = battles.map((_, i) => `Battle ${i + 1}`)

    lapTimeChartInstance = new Chart(lapTimeChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: driver1.value ? getDriverName(driver1.value) : 'Driver 1',
            data: battles.map(b => b.driver1_time),
            borderColor: getColor(0),
            backgroundColor: getColor(0) + '20',
            tension: 0.4,
          },
          {
            label: driver2.value ? getDriverName(driver2.value) : 'Driver 2',
            data: battles.map(b => b.driver2_time),
            borderColor: getColor(1),
            backgroundColor: getColor(1) + '20',
            tension: 0.4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }

  // Performance Gap Chart
  if (gapChart.value) {
    const gaps = battles.map(b => b.gap)

    gapChartInstance = new Chart(gapChart.value, {
      type: 'bar',
      data: {
        labels: battles.map((_, i) => `Battle ${i + 1}`),
        datasets: [{
          label: 'Time Gap (seconds)',
          data: gaps,
          backgroundColor: gaps.map(gap => gap < 1 ? '#10B981' : gap < 2 ? '#F59E0B' : '#EF4444'),
          borderColor: gaps.map(gap => gap < 1 ? '#10B981' : gap < 2 ? '#F59E0B' : '#EF4444'),
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

  // Track Comparison Chart
  if (trackComparisonChart.value) {
    const trackStats = calculateTrackStats(battles)
    const tracks = Object.keys(trackStats)

    trackComparisonChartInstance = new Chart(trackComparisonChart.value, {
      type: 'bar',
      data: {
        labels: tracks,
        datasets: [
          {
            label: `${driver1.value ? getDriverName(driver1.value) : 'Driver 1'} Wins`,
            data: tracks.map(track => trackStats[track].driver1Wins),
            backgroundColor: getColor(0),
          },
          {
            label: `${driver2.value ? getDriverName(driver2.value) : 'Driver 2'} Wins`,
            data: tracks.map(track => trackStats[track].driver2Wins),
            backgroundColor: getColor(1),
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    })
  }
}

function calculateTrackStats(battles: any[]) {
  const trackStats: any = {}

  battles.forEach(battle => {
    const track = battle.track_name
    if (!trackStats[track]) {
      trackStats[track] = { driver1Wins: 0, driver2Wins: 0 }
    }

    if (battle.winner === driver1.value) {
      trackStats[track].driver1Wins++
    } else {
      trackStats[track].driver2Wins++
    }
  })

  return trackStats
}

function getDriverName(id: number): string {
  return drivers.value.find(d => d.id === id)?.name || 'Unknown'
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatTime(seconds: number): string {
  if (!seconds) return '0.000'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(async () => {
  await loadDrivers()
})
</script>

<style scoped>
.battles-view {
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

.battle-selector {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.driver-select {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.driver-select label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.select-input {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.select-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.vs-icon {
  font-size: 2rem;
  padding-bottom: 0.75rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.battle-stats {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  align-items: center;
}

.driver-card {
  text-align: center;
}

.driver-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 auto 0.75rem;
}

.driver-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.75rem 0;
}

.score-badge {
  display: inline-block;
  font-size: 2rem;
  font-weight: 700;
  color: #48bb78;
  margin-bottom: 0.25rem;
}

.score-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.battle-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-metric {
  text-align: center;
}

.metric-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  height: 280px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
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

.history-card,
.leaderboard-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.history-card h3,
.leaderboard-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1.5rem 0;
}

.battle-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.battle-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 1.5rem;
  align-items: center;
}

.battle-date {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.battle-track {
  font-weight: 600;
  color: white;
}

.battle-times {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.time-box.winner {
  background: rgba(72, 187, 120, 0.1);
  border-color: rgba(72, 187, 120, 0.3);
}

.time-box .driver-name {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.time-box .time {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: white;
}

.time-box.winner .time {
  color: #48bb78;
}

.vs-divider {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.battle-gap {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  transition: all 0.3s ease;
}

.leaderboard-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.rank {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 40px;
  text-align: center;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.driver-avatar-small {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.driver-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .battle-stats {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .battle-info {
    flex-direction: row;
    border-left: none;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem 0;
  }
}

@media (max-width: 768px) {
  .battle-selector {
    flex-direction: column;
  }

  .vs-icon {
    padding: 0;
  }

  .battle-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .driver-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
