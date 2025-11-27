<template>
  <div class="temporal-view">
    <div class="page-header">
      <h1>⏰ Temporal Analysis</h1>
      <p class="subtitle">Performance trends over time and seasonal patterns</p>
    </div>

    <!-- Time Period Selector -->
    <div class="period-selector">
      <button 
        v-for="period in periods" 
        :key="period.value"
        :class="['period-btn', { active: selectedPeriod === period.value }]"
        @click="selectedPeriod = period.value; loadData()"
      >
        <span class="period-icon">{{ period.icon }}</span>
        {{ period.label }}
      </button>
    </div>

    <!-- Time-based Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-value">{{ timeStats.sessionsThisPeriod }}</div>
          <div class="stat-label">Sessions This {{ selectedPeriod }}</div>
        </div>
        <div class="stat-trend positive">
          <span>↗</span> {{ timeStats.sessionGrowth }}%
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatTime(timeStats.avgImprovement) }}</div>
          <div class="stat-label">Avg Time Improvement</div>
        </div>
        <div class="stat-trend positive">
          <span>↗</span> Getting faster!
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <div class="stat-value">{{ timeStats.streakDays }}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-trend">
          <span>📊</span> Keep it up!
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <div class="stat-value">{{ timeStats.bestMonth }}</div>
          <div class="stat-label">Best Month</div>
        </div>
        <div class="stat-trend">
          <span>⭐</span> {{ timeStats.bestMonthSessions }} sessions
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card large">
        <h3>📈 Performance Over Time</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Line chart showing lap time progression over selected period</p>
          <small>Chart.js with time-series data ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>📅 Activity Heatmap</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">🗓️</div>
          <p>GitHub-style contribution heatmap showing session frequency</p>
          <small>Calendar heatmap integration ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🕐 Time of Day Performance</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">⏰</div>
          <p>Polar chart showing best performance times</p>
          <small>Chart.js polar/radar chart ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>📆 Day of Week Analysis</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Bar chart showing performance by weekday</p>
          <small>Chart.js bar chart ready</small>
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>🌡️ Seasonal Trends</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">🍂</div>
          <p>Multi-line chart comparing performance across seasons</p>
          <small>Chart.js multi-dataset line chart ready</small>
        </div>
      </div>
    </div>

    <!-- Milestones Timeline -->
    <div class="timeline-card">
      <h3>🎯 Performance Milestones</h3>
      <div class="timeline">
        <div v-for="(milestone, index) in milestones" :key="index" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-date">{{ milestone.date }}</div>
            <div class="timeline-title">{{ milestone.title }}</div>
            <div class="timeline-description">{{ milestone.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const selectedPeriod = ref('month')

const periods = [
  { value: 'week', label: 'Week', icon: '📅' },
  { value: 'month', label: 'Month', icon: '📆' },
  { value: 'quarter', label: 'Quarter', icon: '📊' },
  { value: 'year', label: 'Year', icon: '🗓️' },
]

const timeStats = ref({
  sessionsThisPeriod: 0,
  sessionGrowth: 0,
  avgImprovement: 0,
  streakDays: 0,
  bestMonth: '-',
  bestMonthSessions: 0,
})

const milestones = ref<Array<{
  date: string
  title: string
  description: string
}>>([])

const loading = ref(true)
const error = ref('')

const loadData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // TODO: Implement API endpoints for temporal analysis
    // const temporalData = await apiService.temporal.getAnalysis(selectedPeriod.value)
    // const milestoneData = await apiService.temporal.getMilestones()
    
    // For now, set empty data
    timeStats.value = {
      sessionsThisPeriod: 0,
      sessionGrowth: 0,
      avgImprovement: 0,
      streakDays: 0,
      bestMonth: '-',
      bestMonthSessions: 0,
    }
    milestones.value = []
  } catch (err) {
    console.error('Error loading temporal data:', err)
    error.value = 'Failed to load temporal data'
  } finally {
    loading.value = false
  }
}

// Load data on mount
loadData()

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.temporal-view {
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

.period-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
}

.period-btn {
  flex: 1;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.period-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.period-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: white;
}

.period-icon {
  font-size: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
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
  margin-bottom: 0.75rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-trend.positive {
  color: #48bb78;
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

.chart-card.large {
  grid-column: 1 / -1;
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

.timeline-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

.timeline-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 2rem 0;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #667eea, #764ba2);
}

.timeline-item {
  position: relative;
  padding-bottom: 2rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -2.5rem;
  top: 0;
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  border: 3px solid rgba(26, 32, 44, 1);
}

.timeline-content {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.timeline-content:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.timeline-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.timeline-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .period-selector {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
