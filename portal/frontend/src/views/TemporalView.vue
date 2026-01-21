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
        <div class="chart-container">
          <canvas ref="performanceChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>📅 Activity Heatmap</h3>
        <div class="chart-container">
          <div ref="activityHeatmap" class="heatmap-container"></div>
        </div>
      </div>

      <div class="chart-card">
        <h3>🕐 Time of Day Performance</h3>
        <div class="chart-container">
          <canvas ref="timeOfDayChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>📆 Day of Week Analysis</h3>
        <div class="chart-container">
          <canvas ref="dayOfWeekChart"></canvas>
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>🌡️ Seasonal Trends</h3>
        <div class="chart-container">
          <canvas ref="seasonalChart"></canvas>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useChartConfig } from '@/composables/useChartConfig'
import { useKartingAPI } from '@/composables/useKartingAPI'

// Register Chart.js components
Chart.register(...registerables)

const { getColor } = useChartConfig()
const { getAllLaps, loading, error } = useKartingAPI()

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

// Chart refs
const performanceChart = ref<HTMLCanvasElement>()
const activityHeatmap = ref<HTMLDivElement>()
const timeOfDayChart = ref<HTMLCanvasElement>()
const dayOfWeekChart = ref<HTMLCanvasElement>()
const seasonalChart = ref<HTMLCanvasElement>()

// Chart instances
let performanceChartInstance: Chart | null = null
let timeOfDayChartInstance: Chart | null = null
let dayOfWeekChartInstance: Chart | null = null
let seasonalChartInstance: Chart | null = null

const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Get lap data for temporal analysis
    const laps = await getAllLaps()
    if (!laps) {
      throw new Error('Failed to load lap data for temporal analysis')
    }

    // Calculate temporal statistics
    calculateTimeStats(laps)
    generateMilestones(laps)

    await nextTick()
    createCharts(laps)

  } catch (err: any) {
    console.error('Error loading temporal data:', err)
    error.value = err.message || 'Failed to load temporal data'
  } finally {
    loading.value = false
  }
}

const calculateTimeStats = (laps: any[]) => {
  if (laps.length === 0) return

  const now = new Date()
  const periodStart = getPeriodStart(now, selectedPeriod.value)

  // Filter laps for current period
  const periodLaps = laps.filter(lap => new Date(lap.created_at) >= periodStart)
  const periodSessions = new Set(periodLaps.map(lap => lap.session_id)).size

  // Calculate previous period for growth comparison
  const prevPeriodStart = getPeriodStart(new Date(periodStart.getTime() - 1), selectedPeriod.value)
  const prevPeriodEnd = new Date(periodStart.getTime() - 1)
  const prevPeriodLaps = laps.filter(lap => {
    const date = new Date(lap.created_at)
    return date >= prevPeriodStart && date <= prevPeriodEnd
  })
  const prevPeriodSessions = new Set(prevPeriodLaps.map(lap => lap.session_id)).size

  const sessionGrowth = prevPeriodSessions > 0
    ? Math.round(((periodSessions - prevPeriodSessions) / prevPeriodSessions) * 100)
    : 0

  // Calculate improvement trend
  const sortedLaps = laps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const recentLaps = sortedLaps.slice(-50) // Last 50 laps
  const improvement = calculateImprovement(recentLaps)

  // Calculate streak
  const streakDays = calculateStreak(laps)

  // Find best month
  const bestMonthData = findBestMonth(laps)

  timeStats.value = {
    sessionsThisPeriod: periodSessions,
    sessionGrowth,
    avgImprovement: improvement,
    streakDays,
    bestMonth: bestMonthData.month,
    bestMonthSessions: bestMonthData.sessions,
  }
}

const getPeriodStart = (date: Date, period: string): Date => {
  const d = new Date(date)
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - 7)
      break
    case 'month':
      d.setMonth(d.getMonth() - 1)
      break
    case 'quarter':
      d.setMonth(d.getMonth() - 3)
      break
    case 'year':
      d.setFullYear(d.getFullYear() - 1)
      break
  }
  return d
}

const calculateImprovement = (laps: any[]): number => {
  if (laps.length < 10) return 0

  const firstHalf = laps.slice(0, Math.floor(laps.length / 2))
  const secondHalf = laps.slice(Math.floor(laps.length / 2))

  const firstAvg = firstHalf.reduce((sum, lap) => sum + lap.lap_time, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, lap) => sum + lap.lap_time, 0) / secondHalf.length

  return Math.max(0, firstAvg - secondAvg)
}

const calculateStreak = (laps: any[]): number => {
  const dates = [...new Set(laps.map(lap => new Date(lap.created_at).toDateString()))]
    .map(dateStr => new Date(dateStr))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    if (!date) continue
    date.setHours(0, 0, 0, 0)
    const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000))

    if (date.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

const findBestMonth = (laps: any[]) => {
  const monthStats: { [key: string]: number } = {}

  laps.forEach(lap => {
    const date = new Date(lap.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthStats[monthKey]) monthStats[monthKey] = 0
    monthStats[monthKey]++
  })

  let bestMonth = ''
  let maxSessions = 0

  Object.entries(monthStats).forEach(([month, sessions]) => {
    if (sessions > maxSessions) {
      maxSessions = sessions
      bestMonth = month
    }
  })

  return { month: bestMonth, sessions: maxSessions }
}

const generateMilestones = (laps: any[]) => {
  const milestonesList: Array<{
    date: string
    title: string
    description: string
  }> = []

  if (laps.length === 0) return

  const sortedLaps = laps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Personal best milestones
  const personalBests = findPersonalBests(sortedLaps)
  personalBests.forEach(pb => {
    milestonesList.push({
      date: new Date(pb.date).toLocaleDateString(),
      title: `New Personal Best: ${formatTime(pb.time)}`,
      description: `Achieved at ${pb.track} - ${pb.improvement.toFixed(3)}s improvement`
    })
  })

  // Session milestones
  const sessionMilestones = findSessionMilestones(sortedLaps)
  sessionMilestones.forEach(milestone => {
    milestonesList.push({
      date: milestone.date,
      title: milestone.title,
      description: milestone.description
    })
  })

  // Sort by date descending and take top 10
  milestones.value = milestonesList
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

const findPersonalBests = (laps: any[]) => {
  const pbs: Array<{ date: string, time: number, track: string, improvement: number }> = []
  let currentPB = Infinity

  laps.forEach(lap => {
    if (lap.lap_time < currentPB) {
      const improvement = currentPB - lap.lap_time
      if (currentPB !== Infinity) {
        pbs.push({
          date: lap.created_at,
          time: lap.lap_time,
          track: lap.track_name || 'Unknown',
          improvement
        })
      }
      currentPB = lap.lap_time
    }
  })

  return pbs.slice(0, 5) // Top 5 PBs
}

const findSessionMilestones = (laps: any[]) => {
  const milestones: Array<{ date: string, title: string, description: string }> = []
  const sessions = groupBySession(laps)

  Object.entries(sessions).forEach(([sessionId, sessionLaps]) => {
    if (!sessionLaps || !Array.isArray(sessionLaps)) return
    const lapsCount = sessionLaps.length
    const firstLap = sessionLaps[0]

    if (lapsCount >= 20 && firstLap) {
      milestones.push({
        date: new Date(firstLap.created_at).toLocaleDateString(),
        title: `High Volume Session: ${lapsCount} laps`,
        description: `Completed ${lapsCount} laps in one session at ${firstLap.track_name || 'Unknown'}`
      })
    }
  })

  return milestones
}

const groupBySession = (laps: any[]) => {
  return laps.reduce((groups, lap) => {
    const sessionId = lap.session_id
    if (!groups[sessionId]) groups[sessionId] = []
    groups[sessionId].push(lap)
    return groups
  }, {} as { [key: string]: any[] })
}

const createCharts = (laps: any[]) => {
  if (laps.length === 0) return

  // Destroy existing charts
  if (performanceChartInstance) performanceChartInstance.destroy()
  if (timeOfDayChartInstance) timeOfDayChartInstance.destroy()
  if (dayOfWeekChartInstance) dayOfWeekChartInstance.destroy()
  if (seasonalChartInstance) seasonalChartInstance.destroy()

  // Performance Over Time Chart
  if (performanceChart.value) {
    const periodStart = getPeriodStart(new Date(), selectedPeriod.value)
    const periodLaps = laps
      .filter(lap => new Date(lap.created_at) >= periodStart)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const labels = periodLaps.map((_, i) => `Lap ${i + 1}`)
    const times = periodLaps.map(lap => lap.lap_time)

    performanceChartInstance = new Chart(performanceChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Lap Time',
          data: times,
          borderColor: getColor(0),
          backgroundColor: getColor(0) + '20',
          tension: 0.4,
          pointRadius: 3,
        }]
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

  // Time of Day Performance Chart
  if (timeOfDayChart.value) {
    const hourStats = analyzeByHour(laps)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const avgTimes = hours.map(hour => hourStats[hour] || null)

    timeOfDayChartInstance = new Chart(timeOfDayChart.value, {
      type: 'radar',
      data: {
        labels: hours.map(h => `${h}:00`),
        datasets: [{
          label: 'Average Lap Time',
          data: avgTimes,
          borderColor: getColor(0),
          backgroundColor: getColor(0) + '20',
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }

  // Day of Week Analysis Chart
  if (dayOfWeekChart.value) {
    const dayStats = analyzeByDayOfWeek(laps)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    dayOfWeekChartInstance = new Chart(dayOfWeekChart.value, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Average Lap Time',
          data: days.map(day => dayStats[day]?.avg || null),
          backgroundColor: getColor(0),
          borderColor: getColor(0),
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
            beginAtZero: false,
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }

  // Seasonal Trends Chart
  if (seasonalChart.value) {
    const seasonalData = analyzeBySeason(laps)
    const seasons = ['Winter', 'Spring', 'Summer', 'Fall']

    seasonalChartInstance = new Chart(seasonalChart.value, {
      type: 'line',
      data: {
        labels: seasons,
        datasets: [{
          label: 'Average Lap Time',
          data: seasons.map(season => seasonalData[season]?.avg || null),
          borderColor: getColor(0),
          backgroundColor: getColor(0) + '20',
          tension: 0.4,
        }]
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

  // Activity Heatmap (simplified version)
  if (activityHeatmap.value) {
    createActivityHeatmap(laps)
  }
}

const analyzeByHour = (laps: any[]) => {
  const hourStats: { [key: number]: { times: number[], count: number } } = {}

  laps.forEach(lap => {
    const hour = new Date(lap.created_at).getHours()
    if (!hourStats[hour]) hourStats[hour] = { times: [], count: 0 }
    hourStats[hour].times.push(lap.lap_time)
    hourStats[hour].count++
  })

  const result: { [key: number]: number } = {}
  Object.entries(hourStats).forEach(([hour, data]) => {
    if (data.times.length >= 3) {
      result[parseInt(hour)] = data.times.reduce((sum, time) => sum + time, 0) / data.times.length
    }
  })

  return result
}

const analyzeByDayOfWeek = (laps: any[]) => {
  const dayStats: { [key: string]: { times: number[], count: number } } = {}

  laps.forEach(lap => {
    const day = new Date(lap.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    if (!dayStats[day]) dayStats[day] = { times: [], count: 0 }
    dayStats[day].times.push(lap.lap_time)
    dayStats[day].count++
  })

  const result: { [key: string]: { avg: number, count: number } } = {}
  Object.entries(dayStats).forEach(([day, data]) => {
    if (data.times.length >= 3) {
      result[day] = {
        avg: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        count: data.count
      }
    }
  })

  return result
}

const analyzeBySeason = (laps: any[]) => {
  const seasonStats: { [key: string]: { times: number[], count: number } } = {}

  laps.forEach(lap => {
    const month = new Date(lap.created_at).getMonth()
    let season = ''
    if (month >= 11 || month <= 1) season = 'Winter'
    else if (month >= 2 && month <= 4) season = 'Spring'
    else if (month >= 5 && month <= 7) season = 'Summer'
    else season = 'Fall'

    if (!seasonStats[season]) {
      seasonStats[season] = { times: [], count: 0 }
    }
    seasonStats[season]!.times.push(lap.lap_time)
    seasonStats[season]!.count++
  })

  const result: { [key: string]: { avg: number, count: number } } = {}
  Object.entries(seasonStats).forEach(([season, data]) => {
    if (data.times.length >= 5) {
      result[season] = {
        avg: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        count: data.count
      }
    }
  })

  return result
}

const createActivityHeatmap = (laps: any[]) => {
  if (!activityHeatmap.value) return

  // Create a simple calendar heatmap
  const activityData: { [key: string]: number } = {}

  laps.forEach(lap => {
    const date = new Date(lap.created_at).toDateString()
    activityData[date] = (activityData[date] || 0) + 1
  })

  // Create a 7x5 grid for the last 35 days
  const today = new Date()
  let html = '<div class="heatmap-grid">'

  for (let week = 4; week >= 0; week--) {
    html += '<div class="heatmap-week">'
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (week * 7 + (6 - day)))
      const dateStr = date.toDateString()
      const count = activityData[dateStr] || 0
      const intensity = Math.min(count / 5, 1) // Max intensity at 5+ sessions

      html += `<div class="heatmap-day" style="background-color: rgba(102, 126, 234, ${intensity * 0.8})" title="${dateStr}: ${count} sessions"></div>`
    }
    html += '</div>'
  }

  html += '</div>'
  activityHeatmap.value.innerHTML = html
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

onMounted(async () => {
  await loadData()
})

onUnmounted(() => {
  // Clean up chart instances to prevent memory leaks
  if (performanceChartInstance) performanceChartInstance.destroy()
  if (timeOfDayChartInstance) timeOfDayChartInstance.destroy()
  if (dayOfWeekChartInstance) dayOfWeekChartInstance.destroy()
  if (seasonalChartInstance) seasonalChartInstance.destroy()
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  padding-top: 0.5rem;
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
  padding: 1.5rem;
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

.chart-container {
  height: 280px;
  position: relative;
}

.heatmap-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heatmap-week {
  display: flex;
  gap: 2px;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.heatmap-day:hover {
  transform: scale(1.2);
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
  padding: 1.5rem;
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
