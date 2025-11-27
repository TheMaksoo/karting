<template>
  <div class="driver-stats">
    <header class="page-header">
      <h1>📊 Driver Statistics</h1>
      <p>Your complete performance analysis</p>
    </header>

    <div v-if="driverStore.loading" class="loading">
      Loading driver statistics...
    </div>

    <div v-else-if="driverStore.error" class="error">
      {{ driverStore.error }}
    </div>

    <div v-else class="stats-grid">
      <div v-for="stat in driverStore.driverStats" :key="stat.driver_id" class="stat-card">
        <div class="driver-header" :style="{ borderLeftColor: getDriverColor(stat.driver_id) }">
          <h3>{{ stat.driver_name }}</h3>
        </div>
        
        <div class="stat-row">
          <span class="label">Total Laps:</span>
          <span class="value">{{ stat.total_laps }}</span>
        </div>
        
        <div class="stat-row">
          <span class="label">Sessions:</span>
          <span class="value">{{ stat.total_sessions }}</span>
        </div>
        
        <div class="stat-row">
          <span class="label">Tracks Visited:</span>
          <span class="value">{{ stat.total_tracks }}</span>
        </div>
        
        <div class="stat-row highlight">
          <span class="label">Best Lap:</span>
          <span class="value">{{ formatTime(stat.best_lap_time) }}</span>
        </div>
        
        <div class="stat-row">
          <span class="label">Track:</span>
          <span class="value small">{{ stat.best_lap_track || 'N/A' }}</span>
        </div>
        
        <div class="stat-row">
          <span class="label">Average Time:</span>
          <span class="value">{{ formatTime(stat.average_lap_time) }}</span>
        </div>
        
        <div class="stat-row">
          <span class="label">Median Time:</span>
          <span class="value">{{ formatTime(stat.median_lap_time) }}</span>
        </div>
        
        <div class="stat-row total">
          <span class="label">Total Cost:</span>
          <span class="value">€{{ stat.total_cost.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="coming-soon">
      <h2>📈 Advanced Charts Coming Soon</h2>
      <p>Lap time progression, performance distribution, track comparisons, and more!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDriverStore } from '@/stores/driver'

const driverStore = useDriverStore()

onMounted(async () => {
  await driverStore.fetchDriverStats()
})

function formatTime(seconds: number | null): string {
  if (seconds === null) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

function getDriverColor(driverId: number): string {
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
  return colors[(driverId - 1) % colors.length]
}
</script>

<style scoped>
.driver-stats {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 32px;
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

.loading, .error {
  padding: 40px;
  text-align: center;
  font-size: 18px;
  color: #8B949E;
}

.error {
  color: #F87171;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.2);
  border-color: #FF6B35;
}

.driver-header {
  padding: 20px;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8555 100%);
  color: white;
  border-left: 4px solid;
}

.driver-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  font-family: 'Orbitron', sans-serif;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #30363D;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.highlight {
  background: rgba(255, 107, 53, 0.1);
}

.stat-row.total {
  background: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}

.stat-row .label {
  color: #8B949E;
  font-size: 14px;
}

.stat-row .value {
  color: #F0F6FC;
  font-weight: 600;
  font-size: 16px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.stat-row .value.small {
  font-size: 13px;
}

.coming-soon {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.coming-soon h2 {
  margin: 0 0 12px 0;
  color: #F0F6FC;
  font-family: 'Orbitron', sans-serif;
}

.coming-soon p {
  margin: 0;
  color: #8B949E;
  font-size: 16px;
}
</style>
