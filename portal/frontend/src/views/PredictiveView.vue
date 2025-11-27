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
        <div class="chart-placeholder">
          <div class="chart-icon">🔮</div>
          <p>Predicted lap time progression over next 3 months</p>
          <small>Chart.js with trend prediction and confidence intervals</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🎲 Race Outcome Probabilities</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Win/Podium/Top 5 probabilities by track</p>
          <small>Chart.js stacked bar chart ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🌡️ Condition Impact Analysis</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">☁️</div>
          <p>How weather affects your performance</p>
          <small>Chart.js scatter plot ready</small>
        </div>
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
import { ref } from 'vue'

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

const loading = ref(true)
const error = ref('')

const loadPredictions = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // TODO: Implement API endpoints for predictive analytics
    // const predictionsData = await apiService.predictions.getAll()
    // const goalsData = await apiService.predictions.getGoals()
    // const recsData = await apiService.predictions.getRecommendations()
    
    // For now, set empty data
    predictions.value = {
      nextBestLap: 0,
      confidence: 0,
      bestDay: '-',
      bestDayReason: '',
      podiumChance: 0,
      improvementPotential: 0,
    }
    goalPredictions.value = []
    recommendations.value = []
  } catch (err) {
    console.error('Error loading predictions:', err)
    error.value = 'Failed to load predictions'
  } finally {
    loading.value = false
  }
}

// Load data on mount
loadPredictions()

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.prediction-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
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
  font-size: 3rem;
  margin-bottom: 1rem;
}

.prediction-title {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.prediction-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
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
