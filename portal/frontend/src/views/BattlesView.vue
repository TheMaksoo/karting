<template>
  <div class="battles-view">
    <div class="page-header">
      <h1>⚔️ Head-to-Head Battles</h1>
      <p class="subtitle">Compare performance against other drivers</p>
    </div>

    <!-- Driver Selector -->
    <div class="battle-selector">
      <div class="driver-select">
        <label>Driver 1</label>
        <select v-model="driver1" class="select-input">
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
      <div class="vs-icon">⚔️</div>
      <div class="driver-select">
        <label>Driver 2</label>
        <select v-model="driver2" class="select-input">
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
      </div>
      <button @click="loadBattle" class="btn-primary">
        <span>Compare</span>
      </button>
    </div>

    <!-- Battle Stats -->
    <div class="battle-stats">
      <div class="driver-card left">
        <div class="driver-avatar">{{ getInitials(getDriverName(driver1)) }}</div>
        <h3>{{ getDriverName(driver1) }}</h3>
        <div class="score-badge winner">{{ battleScore.driver1Wins }}</div>
        <p class="score-label">Wins</p>
      </div>

      <div class="battle-info">
        <div class="battle-metric">
          <div class="metric-label">Total Battles</div>
          <div class="metric-value">{{ battleScore.totalBattles }}</div>
        </div>
        <div class="battle-metric">
          <div class="metric-label">Avg Gap</div>
          <div class="metric-value">{{ battleScore.avgGap }}s</div>
        </div>
      </div>

      <div class="driver-card right">
        <div class="driver-avatar">{{ getInitials(getDriverName(driver2)) }}</div>
        <h3>{{ getDriverName(driver2) }}</h3>
        <div class="score-badge winner">{{ battleScore.driver2Wins }}</div>
        <p class="score-label">Wins</p>
      </div>
    </div>

    <!-- Comparison Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>📊 Lap Time Comparison</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📈</div>
          <p>Line chart comparing lap times over sessions</p>
          <small>Chart.js multi-line chart ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🎯 Consistency Battle</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Box plot showing consistency comparison</p>
          <small>Chart.js box plot ready</small>
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>🏁 Track-by-Track Showdown</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">🏆</div>
          <p>Bar chart showing wins per track</p>
          <small>Chart.js grouped bar chart ready</small>
        </div>
      </div>
    </div>

    <!-- Battle History -->
    <div class="history-card">
      <h3>📜 Battle History</h3>
      <div class="battle-timeline">
        <div v-for="(battle, index) in battleHistory" :key="index" class="battle-item">
          <div class="battle-date">{{ formatDate(battle.date) }}</div>
          <div class="battle-track">{{ battle.track }}</div>
          <div class="battle-times">
            <div :class="['time-box', battle.winner === 1 ? 'winner' : '']">
              <span class="driver-name">{{ getDriverName(driver1) }}</span>
              <span class="time">{{ formatTime(battle.time1) }}</span>
            </div>
            <div class="vs-divider">vs</div>
            <div :class="['time-box', battle.winner === 2 ? 'winner' : '']">
              <span class="driver-name">{{ getDriverName(driver2) }}</span>
              <span class="time">{{ formatTime(battle.time2) }}</span>
            </div>
          </div>
          <div class="battle-gap">
            Gap: {{ Math.abs(battle.time1 - battle.time2).toFixed(3) }}s
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="leaderboard-card">
      <h3>🏆 Overall Leaderboard</h3>
      <div class="leaderboard">
        <div v-for="(driver, index) in leaderboard" :key="index" class="leaderboard-item">
          <div class="rank">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="driver-info">
            <div class="driver-avatar-small">{{ getInitials(driver.name) }}</div>
            <span class="driver-name">{{ driver.name }}</span>
          </div>
          <div class="driver-stats">
            <div class="stat">
              <span class="stat-label">Wins</span>
              <span class="stat-value">{{ driver.wins }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Best Time</span>
              <span class="stat-value">{{ formatTime(driver.bestTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@/services/api'

interface Driver {
  id: number
  name: string
}

interface BattleHistory {
  date: string
  track: string
  time1: number
  time2: number
  winner: number
}

interface LeaderboardEntry {
  name: string
  wins: number
  bestTime: number
}

const driver1 = ref(1)
const driver2 = ref(2)
const drivers = ref<Driver[]>([])

const battleScore = ref({
  totalBattles: 0,
  driver1Wins: 0,
  driver2Wins: 0,
  avgGap: 0,
})

const battleHistory = ref<BattleHistory[]>([])

const leaderboard = ref<LeaderboardEntry[]>([])

const loading = ref(true)
const error = ref('')

const getDriverName = (id: number): string => {
  return drivers.value.find(d => d.id === id)?.name || 'Unknown'
}

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const loadBattle = async () => {
  loading.value = true
  error.value = ''
  try {
    // Load drivers
    const driverData = await apiService.drivers.getAll()
    drivers.value = driverData
    
    // If we have at least 2 drivers, set them
    if (drivers.value.length >= 2 && drivers.value[0] && drivers.value[1]) {
      driver1.value = drivers.value[0].id
      driver2.value = drivers.value[1].id
    }
    
    // TODO: Load real battle data from API when endpoint exists
    // For now, show empty state
    battleScore.value = {
      totalBattles: 0,
      driver1Wins: 0,
      driver2Wins: 0,
      avgGap: 0,
    }
    battleHistory.value = []
    leaderboard.value = []
    
  } catch (err: any) {
    error.value = 'Failed to load battle data'
    console.error('Failed to load battle:', err)
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  await loadBattle()
}

onMounted(() => {
  loadData()
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
  gap: 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  align-items: center;
}

.driver-card {
  text-align: center;
}

.driver-avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 auto 1rem;
}

.driver-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
}

.score-badge {
  display: inline-block;
  font-size: 3rem;
  font-weight: 700;
  color: #48bb78;
  margin-bottom: 0.5rem;
}

.score-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.battle-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-metric {
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
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
