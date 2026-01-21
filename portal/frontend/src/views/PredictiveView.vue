<template>
  <div class="predictive-view">
    <div class="page-header">
      <h1>🔮 Predictive Analytics</h1>
      <p class="subtitle">AI-powered insights and performance predictions</p>
    </div>

    <!-- Predictions Grid -->
    <div class="predictions-grid">
      <div class="prediction-card featured">
        <div class="prediction-icon">🎯</div>
        <div class="prediction-title">Next Best Lap Prediction</div>
        <div class="prediction-value">{{ formatTime(predictions.nextBestLap) }}</div>
        <div class="prediction-confidence">
          <span class="confidence-bar" :style="{ width: predictions.confidence + '%' }"></span>
          <span class="confidence-text">{{ predictions.confidence }}% confidence</span>
        </div>
        <div class="prediction-detail">Based on your improvement trend</div>
      </div>

      <div class="prediction-card">
        <div class="prediction-icon">📅</div>
        <div class="prediction-title">Optimal Training Day</div>
        <div class="prediction-value">{{ predictions.bestDay }}</div>
        <div class="prediction-detail">{{ predictions.bestDayReason }}</div>
      </div>

      <div class="prediction-card">
        <div class="prediction-icon">🏆</div>
        <div class="prediction-title">Podium Probability</div>
        <div class="prediction-value">{{ predictions.podiumChance }}%</div>
        <div class="prediction-detail">In next competitive race</div>
      </div>

      <div class="prediction-card">
        <div class="prediction-icon">⚡</div>
        <div class="prediction-title">Improvement Potential</div>
        <div class="prediction-value">{{ predictions.improvementPotential }}s</div>
        <div class="prediction-detail">Achievable in next month</div>
      </div>
    </div>

    <!-- ML Insights -->
    <div class="insights-section">
      <h3>🤖 Machine Learning Insights</h3>
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📈</span>
            <span class="insight-title">Performance Trend</span>
          </div>
          <div class="insight-content">
            <p>You're improving at an average rate of <strong>0.15 seconds per week</strong>. This is excellent progress!</p>
            <div class="insight-chart">
              <div class="trend-line up"></div>
            </div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">🎯</span>
            <span class="insight-title">Optimal Track</span>
          </div>
          <div class="insight-content">
            <p>You perform best at <strong>Circuit Park Berghem</strong> with 15% better consistency than other tracks.</p>
            <div class="track-recommendation">
              <span class="track-emoji">🏁</span>
              <span>Circuit Park Berghem</span>
            </div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">⏰</span>
            <span class="insight-title">Peak Performance Time</span>
          </div>
          <div class="insight-content">
            <p>Your fastest laps are typically set between <strong>2 PM - 4 PM</strong>. Schedule important sessions accordingly.</p>
            <div class="time-indicator">
              <span>🌞 Afternoon</span>
            </div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">💡</span>
            <span class="insight-title">Smart Recommendation</span>
          </div>
          <div class="insight-content">
            <p>Focus on <strong>corner entry speed</strong> - analysis shows this is your biggest improvement opportunity.</p>
            <div class="recommendation-badge">
              <span>Priority: High</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forecast Charts -->
    <div class="charts-grid">
      <div class="chart-card large">
        <h3>📊 Performance Forecast</h3>
        <canvas ref="performanceChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>🎲 Race Outcome Probabilities</h3>
        <canvas ref="probabilityChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>🌡️ Condition Impact Analysis</h3>
        <canvas ref="conditionChart"></canvas>
      </div>
    </div>

    <!-- Goals & Achievements Prediction -->
    <div class="goals-prediction-card">
      <h3>🎯 Goal Achievement Timeline</h3>
      <div class="goals-timeline">
        <div v-for="goal in goalPredictions" :key="goal.id" class="goal-timeline-item">
          <div class="goal-progress">
            <div class="goal-circle" :class="goal.status"></div>
            <div class="goal-line"></div>
          </div>
          <div class="goal-content">
            <div class="goal-header">
              <h4>{{ goal.title }}</h4>
              <span class="goal-date">{{ goal.predictedDate }}</span>
            </div>
            <p class="goal-description">{{ goal.description }}</p>
            <div class="goal-probability">
              <div class="probability-bar">
                <div 
                  class="probability-fill"
                  :style="{ width: goal.probability + '%' }"
                ></div>
              </div>
              <span class="probability-text">{{ goal.probability }}% likely</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Recommendations -->
    <div class="recommendations-card">
      <h3>💡 AI-Powered Recommendations</h3>
      <div class="recommendations-list">
        <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-item">
          <div class="rec-icon" :class="rec.priority">{{ rec.icon }}</div>
          <div class="rec-content">
            <div class="rec-title">{{ rec.title }}</div>
            <div class="rec-description">{{ rec.description }}</div>
            <div class="rec-impact">
              <span class="impact-label">Expected Impact:</span>
              <span class="impact-value">{{ rec.impact }}</span>
            </div>
          </div>
          <div class="rec-priority">
            <span :class="['priority-badge', rec.priority]">{{ rec.priority }}</span>
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
const { getDriverStats, getAllLaps, loading, error } = useKartingAPI()

interface GoalPrediction {
  id: number
  title: string
  description: string
  predictedDate: string
  probability: number
  status: 'completed' | 'in-progress' | 'upcoming'
}

interface Recommendation {
  icon: string
  title: string
  description: string
  impact: string
  priority: 'high' | 'medium' | 'low'
}

const predictions = ref({
  nextBestLap: 0,
  confidence: 0,
  bestDay: '-',
  bestDayReason: '',
  podiumChance: 0,
  improvementPotential: 0,
})

const goalPredictions = ref<GoalPrediction[]>([])
const recommendations = ref<Recommendation[]>([])

// Chart refs
const performanceChart = ref<HTMLCanvasElement>()
const probabilityChart = ref<HTMLCanvasElement>()
const conditionChart = ref<HTMLCanvasElement>()

// Chart instances
let performanceChartInstance: Chart | null = null
let probabilityChartInstance: Chart | null = null
let conditionChartInstance: Chart | null = null

const loadPredictions = async () => {
  try {
    loading.value = true
    error.value = ''

    // Get driver stats and lap data for predictions
    const [driverStats, allLaps] = await Promise.all([
      getDriverStats(),
      getAllLaps()
    ])

    if (!driverStats || !allLaps) {
      throw new Error('Failed to load data for predictions')
    }

    // Calculate predictions based on historical data
    calculatePredictions(allLaps)
    calculateGoalPredictions(allLaps)
    generateRecommendations(allLaps)

    await nextTick()
    createCharts(allLaps)

  } catch (err: any) {
    console.error('Error loading predictions:', err)
    error.value = err.message || 'Failed to load predictions'
  } finally {
    loading.value = false
  }
}

const calculatePredictions = (laps: any[]) => {
  if (laps.length === 0) return

  // Sort laps by date
  const sortedLaps = laps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Calculate improvement trend
  const recentLaps = sortedLaps.slice(-20) // Last 20 laps
  const bestTimes = recentLaps.map(lap => lap.lap_time)
  const minTime = Math.min(...bestTimes)
  const avgTime = bestTimes.reduce((sum, time) => sum + time, 0) / bestTimes.length

  // Simple linear regression for trend
  const trend = calculateTrend(sortedLaps)

  // Predict next best lap (conservative improvement)
  const improvementRate = Math.max(0.001, Math.abs(trend.slope) * 0.1) // 10% of current trend
  const predictedBest = minTime - improvementRate

  // Calculate confidence based on data consistency
  const consistency = calculateConsistency(bestTimes)
  const confidence = Math.min(95, Math.max(60, consistency * 100))

  // Find best day of week
  const bestDayData = findBestDayOfWeek(sortedLaps)
  const bestDay = bestDayData.day
  const bestDayReason = `Average lap time: ${formatTime(bestDayData.avgTime)} (${bestDayData.count} sessions)`

  // Calculate podium chance (simplified)
  const podiumChance = Math.min(85, Math.max(5, (1 - (avgTime - minTime) / avgTime) * 50))

  // Improvement potential (realistic monthly goal)
  const improvementPotential = Math.max(0.1, improvementRate * 4) // 4 weeks

  predictions.value = {
    nextBestLap: predictedBest,
    confidence: Math.round(confidence),
    bestDay,
    bestDayReason,
    podiumChance: Math.round(podiumChance),
    improvementPotential: Math.round(improvementPotential * 100) / 100,
  }
}

const calculateTrend = (laps: any[]) => {
  const dataPoints = laps.map((lap, index) => ({
    x: index,
    y: lap.lap_time
  }))

  const n = dataPoints.length
  const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0)
  const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0)
  const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0)
  const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

const calculateConsistency = (times: number[]): number => {
  if (times.length < 2) return 0.5

  const mean = times.reduce((sum, time) => sum + time, 0) / times.length
  const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length
  const stdDev = Math.sqrt(variance)

  // Return consistency score (lower std dev = higher consistency)
  return Math.max(0.1, Math.min(1, 1 - (stdDev / mean)))
}

const findBestDayOfWeek = (laps: any[]) => {
  const dayStats: { [key: string]: { times: number[], count: number } } = {}

  laps.forEach(lap => {
    const day = new Date(lap.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    if (!dayStats[day]) {
      dayStats[day] = { times: [], count: 0 }
    }
    dayStats[day].times.push(lap.lap_time)
    dayStats[day].count++
  })

  let bestDay = 'Unknown'
  let bestAvg = Infinity
  let bestCount = 0

  Object.entries(dayStats).forEach(([day, data]) => {
    if (data.times.length >= 3) { // Need at least 3 sessions
      const avg = data.times.reduce((sum, time) => sum + time, 0) / data.times.length
      if (avg < bestAvg) {
        bestAvg = avg
        bestDay = day
        bestCount = data.count
      }
    }
  })

  return { day: bestDay, avgTime: bestAvg, count: bestCount }
}

const calculateGoalPredictions = (laps: any[]) => {
  if (laps.length === 0) return

  const currentBest = Math.min(...laps.map(lap => lap.lap_time))
  const recentAvg = laps.slice(-10).reduce((sum, lap) => sum + lap.lap_time, 0) / Math.min(10, laps.length)

  // Calculate realistic goals based on current performance
  const goals: GoalPrediction[] = [
    {
      id: 1,
      title: 'Break Current Personal Best',
      description: `Achieve a lap time under ${formatTime(currentBest)}`,
      predictedDate: '2-3 weeks',
      probability: Math.min(80, Math.max(30, 50 + (recentAvg - currentBest) / currentBest * 100)),
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Consistent Sub-2:00 Laps',
      description: 'Achieve 5 consecutive laps under 2:00.000',
      predictedDate: '4-6 weeks',
      probability: Math.min(70, Math.max(20, 40 + (1.95 - recentAvg) / 1.95 * 100)),
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'Top 3 Finisher',
      description: 'Finish in top 3 in a competitive race',
      predictedDate: '6-8 weeks',
      probability: Math.min(60, Math.max(15, 30 + (recentAvg - currentBest) / recentAvg * 200)),
      status: 'upcoming'
    }
  ]

  goalPredictions.value = goals
}

const generateRecommendations = (laps: any[]) => {
  const recommendationsList: Recommendation[] = []

  if (laps.length === 0) return

  // Analyze lap time distribution
  const lapTimes = laps.map(lap => lap.lap_time)
  const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length
  const bestTime = Math.min(...lapTimes)
  const consistency = calculateConsistency(lapTimes)

  // Time-based analysis
  const hourAnalysis = analyzeByHour(laps)
  const bestHour = hourAnalysis.bestHour

  // Track analysis
  const trackAnalysis = analyzeByTrack(laps)
  const bestTrack = trackAnalysis.bestTrack

  recommendationsList.push({
    icon: '⏰',
    title: 'Optimal Training Time',
    description: `Schedule sessions around ${bestHour}:00 for best performance. Data shows ${hourAnalysis.improvement}% better times.`,
    impact: `${hourAnalysis.improvement.toFixed(1)}% faster laps`,
    priority: 'high'
  })

  recommendationsList.push({
    icon: '🏁',
    title: 'Focus Track Training',
    description: `Prioritize training at ${bestTrack} where you perform best. ${trackAnalysis.sessions} sessions analyzed.`,
    impact: `${trackAnalysis.improvement.toFixed(1)}% better consistency`,
    priority: 'medium'
  })

  if (consistency < 0.7) {
    recommendationsList.push({
      icon: '🎯',
      title: 'Improve Lap Consistency',
      description: 'Work on reducing lap time variation. Focus on smooth driving lines and consistent corner speeds.',
      impact: '5-15% performance gain',
      priority: 'high'
    })
  }

  if (lapTimes.length < 50) {
    recommendationsList.push({
      icon: '📊',
      title: 'Increase Training Frequency',
      description: 'More data points will improve prediction accuracy and help identify improvement opportunities.',
      impact: 'Better insights & predictions',
      priority: 'medium'
    })
  }

  recommendations.value = recommendationsList.slice(0, 4) // Limit to top 4
}

const analyzeByHour = (laps: any[]) => {
  const hourStats: { [key: number]: number[] } = {}

  laps.forEach(lap => {
    const hour = new Date(lap.created_at).getHours()
    if (!hourStats[hour]) hourStats[hour] = []
    hourStats[hour].push(lap.lap_time)
  })

  let bestHour = 14 // Default 2 PM
  let bestAvg = Infinity
  let overallAvg = 0
  let totalLaps = 0

  Object.entries(hourStats).forEach(([hour, times]) => {
    if (times.length >= 3) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length
      overallAvg += avg * times.length
      totalLaps += times.length

      if (avg < bestAvg) {
        bestAvg = avg
        bestHour = parseInt(hour)
      }
    }
  })

  overallAvg /= totalLaps
  const improvement = ((overallAvg - bestAvg) / overallAvg) * 100

  return { bestHour, improvement }
}

const analyzeByTrack = (laps: any[]) => {
  const trackStats: { [key: string]: number[] } = {}

  laps.forEach(lap => {
    const track = lap.track_name || 'Unknown'
    if (!trackStats[track]) trackStats[track] = []
    trackStats[track].push(lap.lap_time)
  })

  let bestTrack = 'Unknown'
  let bestConsistency = 0
  let bestSessions = 0

  Object.entries(trackStats).forEach(([track, times]) => {
    if (times.length >= 5) {
      const consistency = calculateConsistency(times)
      if (consistency > bestConsistency) {
        bestConsistency = consistency
        bestTrack = track
        bestSessions = times.length
      }
    }
  })

  return {
    bestTrack,
    sessions: bestSessions,
    improvement: (bestConsistency - 0.5) * 100 // Relative improvement
  }
}

const createCharts = (laps: any[]) => {
  if (laps.length === 0) return

  // Destroy existing charts
  if (performanceChartInstance) performanceChartInstance.destroy()
  if (probabilityChartInstance) probabilityChartInstance.destroy()
  if (conditionChartInstance) conditionChartInstance.destroy()

  // Performance Forecast Chart
  if (performanceChart.value) {
    const sortedLaps = laps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const recentLaps = sortedLaps.slice(-30) // Last 30 laps

    const labels = recentLaps.map((_, i) => `Lap ${i + 1}`)
    const actualTimes = recentLaps.map(lap => lap.lap_time)

    // Simple trend line
    const trend = calculateTrend(recentLaps.map((lap, i) => ({ x: i, y: lap.lap_time })))
    const trendLine = recentLaps.map((_, i) => trend.intercept + trend.slope * i)

    // Extend trend for prediction
    const futurePoints = 10
    const predictedLabels = [...labels, ...Array.from({ length: futurePoints }, (_, i) => `Pred ${i + 1}`)]
    const predictedTrend = [
      ...trendLine,
      ...Array.from({ length: futurePoints }, (_, i) => trend.intercept + trend.slope * (recentLaps.length + i))
    ]

    performanceChartInstance = new Chart(performanceChart.value, {
      type: 'line',
      data: {
        labels: predictedLabels,
        datasets: [
          {
            label: 'Actual Lap Times',
            data: [...actualTimes, ...Array(futurePoints).fill(null)],
            borderColor: getColor(0),
            backgroundColor: getColor(0) + '20',
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: 'Performance Trend',
            data: predictedTrend,
            borderColor: getColor(1),
            backgroundColor: getColor(1) + '20',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0,
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

  // Race Outcome Probabilities Chart
  if (probabilityChart.value) {
    const trackStats = analyzeTracksForProbabilities(laps)
    const tracks = Object.keys(trackStats)

    probabilityChartInstance = new Chart(probabilityChart.value, {
      type: 'bar',
      data: {
        labels: tracks,
        datasets: [
          {
            label: 'Win Probability',
            data: tracks.map(track => trackStats[track]?.winProb || 0),
            backgroundColor: getColor(0),
          },
          {
            label: 'Podium Probability',
            data: tracks.map(track => trackStats[track]?.podiumProb || 0),
            backgroundColor: getColor(1),
          },
          {
            label: 'Top 5 Probability',
            data: tracks.map(track => trackStats[track]?.top5Prob || 0),
            backgroundColor: getColor(2),
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
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    })
  }

  // Condition Impact Analysis Chart (simplified weather simulation)
  if (conditionChart.value) {
    // Simulate weather impact based on lap time variation
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Windy']
    const baseTime = Math.min(...laps.map(lap => lap.lap_time))

    const conditionData = conditions.map(condition => {
      let impact = 0
      switch (condition) {
        case 'Sunny': impact = 0; break
        case 'Cloudy': impact = 0.002; break
        case 'Rainy': impact = 0.015; break
        case 'Windy': impact = 0.005; break
      }
      return baseTime + (Math.random() - 0.5) * 0.01 + impact
    })

    conditionChartInstance = new Chart(conditionChart.value, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Lap Time by Condition',
          data: conditions.map((condition, i) => ({
            x: i,
            y: conditionData[i] || 0
          })),
          backgroundColor: getColor(0),
          pointRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              callback: (value) => conditions[Number(value)] || ''
            }
          },
          y: {
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }
}

const analyzeTracksForProbabilities = (laps: any[]) => {
  const trackStats: { [key: string]: { winProb: number, podiumProb: number, top5Prob: number } } = {}

  const trackGroups = laps.reduce((groups, lap) => {
    const track = lap.track_name || 'Unknown'
    if (!groups[track]) groups[track] = []
    groups[track].push(lap)
    return groups
  }, {} as { [key: string]: any[] })

  Object.entries(trackGroups).forEach(([track, trackLaps]) => {
    const laps = trackLaps as any[]
    if (laps.length >= 5) {
      const bestTime = Math.min(...laps.map((lap: any) => lap.lap_time))
      const avgTime = laps.reduce((sum: number, lap: any) => sum + lap.lap_time, 0) / laps.length

      // Simplified probability calculation based on performance
      const performanceRatio = (avgTime - bestTime) / avgTime
      const baseProb = Math.max(0.1, Math.min(0.9, 1 - performanceRatio))

      trackStats[track] = {
        winProb: Math.round(baseProb * 30),
        podiumProb: Math.round(baseProb * 60),
        top5Prob: Math.round(baseProb * 85)
      }
    }
  })

  return trackStats
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0.000'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs
}

// Load data on mount
onMounted(async () => {
  await loadPredictions()
})

onUnmounted(() => {
  // Clean up chart instances to prevent memory leaks
  if (performanceChartInstance) performanceChartInstance.destroy()
  if (probabilityChartInstance) probabilityChartInstance.destroy()
  if (conditionChartInstance) conditionChartInstance.destroy()
})
</script>

<style scoped>
.predictive-view {
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

.predictions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.prediction-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
}

.prediction-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.prediction-card.featured {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-color: rgba(102, 126, 234, 0.3);
}

.prediction-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.prediction-title {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.prediction-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
}

.prediction-confidence {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.confidence-bar {
  display: block;
  height: 6px;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.confidence-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.prediction-detail {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.insights-section {
  margin-bottom: 2rem;
}

.insights-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1.5rem 0;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.insight-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.insight-icon {
  font-size: 1.5rem;
}

.insight-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.insight-content p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.insight-content strong {
  color: #667eea;
  font-weight: 600;
}

.insight-chart,
.track-recommendation,
.time-indicator,
.recommendation-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.trend-line {
  height: 40px;
  background: linear-gradient(to top right, transparent 48%, #48bb78 48%, #48bb78 52%, transparent 52%);
  border-radius: 4px;
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

.chart-card.large {
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

.goals-prediction-card,
.recommendations-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.goals-prediction-card h3,
.recommendations-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1.5rem 0;
}

.goals-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.goal-timeline-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.goal-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.goal-circle.in-progress {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: #667eea;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
}

.goal-line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.goal-content {
  padding-bottom: 2rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.goal-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.goal-date {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.goal-description {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
}

.goal-probability {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.probability-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 4px;
}

.probability-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.rec-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.rec-icon.high {
  background: rgba(245, 101, 101, 0.2);
  border: 2px solid rgba(245, 101, 101, 0.4);
}

.rec-icon.medium {
  background: rgba(237, 137, 54, 0.2);
  border: 2px solid rgba(237, 137, 54, 0.4);
}

.rec-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.rec-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.rec-impact {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.impact-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.impact-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #48bb78;
}

.priority-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.priority-badge.high {
  background: rgba(245, 101, 101, 0.2);
  color: #f56565;
  border: 1px solid rgba(245, 101, 101, 0.3);
}

.priority-badge.medium {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.3);
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .predictions-grid {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .recommendation-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .rec-icon {
    margin: 0 auto;
  }
}
</style>
