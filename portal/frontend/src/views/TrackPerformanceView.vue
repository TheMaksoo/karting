<template>
  <div class="track-performance">
    <div class="page-header">
      <h1>🏁 Track Performance</h1>
      <p class="subtitle">Analyze your performance at different tracks</p>
    </div>

    <!-- Track Cards Grid -->
    <div class="track-grid">
      <div v-for="track in trackPerformance" :key="track.id" class="track-card">
        <div class="track-header">
          <div class="track-info">
            <h3>{{ track.name }}</h3>
            <p class="track-location">{{ track.city }}, {{ track.country }}</p>
          </div>
          <div class="track-emoji">{{ getTrackEmoji(track.indoor) }}</div>
        </div>

        <div class="track-stats">
          <div class="track-stat">
            <div class="stat-label">Best Lap</div>
            <div class="stat-value best">{{ formatTime(track.bestLap) }}</div>
          </div>
          <div class="track-stat">
            <div class="stat-label">Avg Lap</div>
            <div class="stat-value">{{ formatTime(track.avgLap) }}</div>
          </div>
          <div class="track-stat">
            <div class="stat-label">Sessions</div>
            <div class="stat-value">{{ track.sessions }}</div>
          </div>
          <div class="track-stat">
            <div class="stat-label">Total Laps</div>
            <div class="stat-value">{{ track.totalLaps }}</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>Improvement</span>
            <span :class="['improvement-badge', track.improvement > 0 ? 'positive' : 'negative']">
              {{ track.improvement > 0 ? '↗' : '↘' }} {{ Math.abs(track.improvement).toFixed(1) }}%
            </span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: Math.min(Math.abs(track.improvement) * 2, 100) + '%' }"
            ></div>
          </div>
        </div>

        <div class="track-actions">
          <button class="btn-track-detail">View Details</button>
          <button class="btn-icon-small" title="Compare">📊</button>
        </div>
      </div>
    </div>

    <!-- Track Comparison Chart -->
    <div class="comparison-card">
      <h3>📊 Track Comparison</h3>
      <div class="chart-placeholder large">
        <div class="chart-icon">📈</div>
        <p>Radar chart comparing performance across all tracks</p>
        <small>Chart.js radar chart with best/avg lap times ready</small>
      </div>
    </div>

    <!-- Track Records Table -->
    <div class="records-card">
      <h3>🏆 Track Records</h3>
      <div class="table-wrapper">
        <table class="records-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Track</th>
              <th>Best Lap</th>
              <th>Set On</th>
              <th>Conditions</th>
              <th>Kart</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in records" :key="index">
              <td>
                <span class="rank-badge" :class="'rank-' + (index + 1)">
                  {{ index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1 }}
                </span>
              </td>
              <td class="track-name">{{ record.track }}</td>
              <td class="time-cell">{{ formatTime(record.time) }}</td>
              <td>{{ formatDate(record.date) }}</td>
              <td><span class="condition-badge">{{ record.conditions }}</span></td>
              <td>{{ record.kart }}</td>
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

interface TrackPerformance {
  id: number
  name: string
  city: string
  country: string
  indoor: boolean
  bestLap: number
  avgLap: number
  sessions: number
  totalLaps: number
  improvement: number
}

interface Record {
  track: string
  time: number
  date: string
  conditions: string
  kart: string
}

const trackPerformance = ref<TrackPerformance[]>([
  {
    id: 1,
    name: 'Circuit Park Berghem',
    city: 'Berghem',
    country: 'Netherlands',
    indoor: false,
    bestLap: 43.521,
    avgLap: 45.234,
    sessions: 8,
    totalLaps: 124,
    improvement: 12.3
  },
  {
    id: 2,
    name: 'De Voltage',
    city: 'Delft',
    country: 'Netherlands',
    indoor: true,
    bestLap: 44.892,
    avgLap: 46.123,
    sessions: 15,
    totalLaps: 203,
    improvement: 8.7
  },
  {
    id: 3,
    name: 'Lot66',
    city: 'Oosterhout',
    country: 'Netherlands',
    indoor: true,
    bestLap: 42.345,
    avgLap: 44.567,
    sessions: 12,
    totalLaps: 156,
    improvement: 15.2
  },
])

const records = ref<Record[]>([
  { track: 'Lot66', time: 42.345, date: '2025-11-15', conditions: 'Dry', kart: '#12' },
  { track: 'Circuit Park Berghem', time: 43.521, date: '2025-11-10', conditions: 'Dry', kart: '#7' },
  { track: 'De Voltage', time: 44.892, date: '2025-11-05', conditions: 'Indoor', kart: '#23' },
])

const getTrackEmoji = (indoor: boolean): string => {
  return indoor ? '🏢' : '🌳'
}

const formatTime = (seconds: number): string => {
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

const loadData = async () => {
  try {
    // Would load real track performance data
    const tracks = await apiService.tracks.getAll()
    console.log('Loaded tracks:', tracks)
  } catch (error) {
    console.error('Failed to load track data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.track-performance {
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

.track-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.track-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.track-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.track-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.track-location {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.track-emoji {
  font-size: 2rem;
}

.track-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.track-stat {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.stat-value.best {
  color: #48bb78;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.improvement-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.75rem;
}

.improvement-badge.positive {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.3);
}

.improvement-badge.negative {
  background: rgba(245, 101, 101, 0.2);
  color: #f56565;
  border: 1px solid rgba(245, 101, 101, 0.3);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.track-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-track-detail {
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-track-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-icon-small {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon-small:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}

.comparison-card,
.records-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.comparison-card h3,
.records-card h3 {
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

.chart-placeholder.large {
  min-height: 400px;
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

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.records-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.records-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.25rem;
}

.track-name {
  font-weight: 600;
  color: white;
}

.time-cell {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #48bb78;
  font-size: 1rem;
}

.condition-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .track-grid {
    grid-template-columns: 1fr;
  }
}
</style>
