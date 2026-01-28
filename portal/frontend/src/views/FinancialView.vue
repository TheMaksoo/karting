<template>
  <div class="financial-view">
    <div class="page-header">
      <h1>💰 Financial Analysis</h1>
      <p class="subtitle">Track costs and analyze your karting investment</p>
    </div>

    <!-- Financial Summary -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">💳</div>
        <div class="summary-content">
          <div class="summary-value">€{{ totalSpent.toLocaleString() }}</div>
          <div class="summary-label">Total Spent</div>
        </div>
        <div class="summary-trend">
          <span>📈</span> This Year
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">💶</div>
        <div class="summary-content">
          <div class="summary-value">€{{ avgPerSession.toFixed(2) }}</div>
          <div class="summary-label">Avg Per Session</div>
        </div>
        <div class="summary-trend">
          <span>📊</span> {{ totalSessions }} sessions
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">⏱️</div>
        <div class="summary-content">
          <div class="summary-value">€{{ costPerLap.toFixed(2) }}</div>
          <div class="summary-label">Cost Per Lap</div>
        </div>
        <div class="summary-trend">
          <span>🏁</span> {{ totalLaps }} laps
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">🎯</div>
        <div class="summary-content">
          <div class="summary-value">€{{ monthlyAvg.toFixed(2) }}</div>
          <div class="summary-label">Monthly Average</div>
        </div>
        <div class="summary-trend">
          <span>📅</span> Last 12 months
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card large">
        <h3>📈 Spending Over Time</h3>
        <canvas ref="spendingChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>🎯 Cost Breakdown</h3>
        <canvas ref="breakdownChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>📊 Monthly Spending</h3>
        <canvas ref="monthlyChart"></canvas>
      </div>

      <div class="chart-card full-width">
        <h3>💎 Value Analysis</h3>
        <canvas ref="valueChart"></canvas>
      </div>
    </div>

    <!-- Expense Table -->
    <div class="expenses-card">
      <div class="expenses-header">
        <h3>📝 Expense History</h3>
        <button class="btn-add" @click="showAddExpense = true">
          <span>➕</span> Add Expense
        </button>
      </div>
      
      <div class="table-wrapper">
        <table class="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Track</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in expenses" :key="expense.id">
              <td>{{ formatDate(expense.date) }}</td>
              <td>{{ expense.track }}</td>
              <td><span :class="['category-badge', expense.category]">{{ expense.category }}</span></td>
              <td>{{ expense.description }}</td>
              <td class="amount-cell">€{{ expense.amount.toFixed(2) }}</td>
              <td>
                <button class="btn-icon-small" title="Edit">✏️</button>
                <button class="btn-icon-small danger" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Budget Goals -->
    <div class="goals-card">
      <h3>🎯 Budget Goals</h3>
      <div class="goals-grid">
        <div class="goal-item">
          <div class="goal-header">
            <span class="goal-title">Monthly Budget</span>
            <span class="goal-amount">€{{ monthlyBudget }}</span>
          </div>
          <div class="goal-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :class="{ 'over-budget': monthlySpent > monthlyBudget }"
                :style="{ width: Math.min((monthlySpent / monthlyBudget) * 100, 100) + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              €{{ monthlySpent.toFixed(2) }} / €{{ monthlyBudget }}
              ({{ ((monthlySpent / monthlyBudget) * 100).toFixed(0) }}%)
            </div>
          </div>
        </div>

        <div class="goal-item">
          <div class="goal-header">
            <span class="goal-title">Yearly Budget</span>
            <span class="goal-amount">€{{ yearlyBudget }}</span>
          </div>
          <div class="goal-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: Math.min((yearlySpent / yearlyBudget) * 100, 100) + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              €{{ yearlySpent.toFixed(2) }} / €{{ yearlyBudget }}
              ({{ ((yearlySpent / yearlyBudget) * 100).toFixed(0) }}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useChartConfig } from '@/composables/useChartConfig'
import { useKartingAPI, type LapData } from '@/composables/useKartingAPI'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { getErrorMessage } from '@/types'

// Register Chart.js components
Chart.register(...registerables)

const { getColor } = useChartConfig()
const { getAllLaps, getDriverStats, loading, error } = useKartingAPI()
const { handleError } = useErrorHandler()

interface Expense {
  id: number
  date: string
  track: string
  category: string
  description: string
  amount: number
}

const showAddExpense = ref(false)
const totalSpent = ref(0)
const avgPerSession = ref(0)
const costPerLap = ref(0)
const monthlyAvg = ref(0)
const totalSessions = ref(0)
const totalLaps = ref(0)

const monthlyBudget = ref(500) // Default budget
const monthlySpent = ref(0)
const yearlyBudget = ref(4000) // Default yearly budget
const yearlySpent = ref(0)

const expenses = ref<Expense[]>([])

// Chart refs
const spendingChart = ref<HTMLCanvasElement>()
const breakdownChart = ref<HTMLCanvasElement>()
const monthlyChart = ref<HTMLCanvasElement>()
const valueChart = ref<HTMLCanvasElement>()

// Chart instances
let spendingChartInstance: Chart | null = null
let breakdownChartInstance: Chart | null = null
let monthlyChartInstance: Chart | null = null
let valueChartInstance: Chart | null = null

const loadFinancialData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Get session and lap data to calculate costs
    const [laps] = await Promise.all([
      getAllLaps(),
      getDriverStats()
    ])

    if (!laps) {
      throw new Error('Failed to load lap data for financial calculations')
    }

    // Calculate financial metrics from session data
    calculateFinancialMetrics(laps)
    generateExpensesFromSessions(laps)
    calculateBudgets()

    await nextTick()
    createCharts(laps)

  } catch (err: unknown) {
    handleError(err, 'financial data')
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const calculateFinancialMetrics = (laps: LapData[]) => {
  if (laps.length === 0) return

  // Group laps by session
  const sessions = groupBySession(laps)
  const sessionCount = Object.keys(sessions).length

  totalSessions.value = sessionCount
  totalLaps.value = laps.length

  // Calculate costs (estimated based on typical karting costs)
  // €15-25 per session depending on duration and track
  const sessionCosts = Object.values(sessions).map((sessionLaps: LapData[]) => {
    const duration = calculateSessionDuration(sessionLaps)
    const baseCost = 15 // Base cost per session
    const durationMultiplier = Math.max(1, duration / 30) // 30 min base
    return baseCost * durationMultiplier
  })

  const totalCost = sessionCosts.reduce((sum, cost) => sum + cost, 0)
  totalSpent.value = Math.round(totalCost * 100) / 100
  avgPerSession.value = sessionCount > 0 ? Math.round((totalCost / sessionCount) * 100) / 100 : 0
  costPerLap.value = laps.length > 0 ? Math.round((totalCost / laps.length) * 100) / 100 : 0

  // Calculate monthly average
  const monthlyCosts = calculateMonthlyCosts(laps)
  const monthlyValues = Object.values(monthlyCosts)
  monthlyAvg.value = monthlyValues.length > 0
    ? Math.round((monthlyValues.reduce((sum, cost) => sum + cost, 0) / monthlyValues.length) * 100) / 100
    : 0
}

const groupBySession = (laps: LapData[]) => {
  return laps.reduce((groups, lap) => {
    const sessionId = lap.session_id
    if (!groups[sessionId]) {
      groups[sessionId] = []
    }
    groups[sessionId].push(lap)
    return groups
  }, {} as { [key: string]: LapData[] })
}

const calculateSessionDuration = (sessionLaps: LapData[]): number => {
  if (sessionLaps.length === 0) return 30 // Default 30 minutes

  // Estimate duration based on lap count (rough estimate: 10-15 laps per hour)
  const avgLapsPerHour = 12
  return Math.max(30, (sessionLaps.length / avgLapsPerHour) * 60)
}

const calculateMonthlyCosts = (laps: LapData[]) => {
  const monthlyCosts: { [key: string]: number } = {}

  // Group by month
  laps.forEach(lap => {
    const date = new Date(lap.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyCosts[monthKey]) {
      monthlyCosts[monthKey] = 0
    }

    // Add cost for this lap (distributed across the month)
    const sessionCost = 20 // Average session cost
    const sessionLaps = groupBySession([lap])
    const sessionDuration = calculateSessionDuration(sessionLaps[lap.session_id])
    monthlyCosts[monthKey] += sessionCost * (sessionDuration / 60) // Cost per hour
  })

  return monthlyCosts
}

const generateExpensesFromSessions = (laps: LapData[]) => {
  const expensesList: Expense[] = []
  const sessions = groupBySession(laps)

  Object.entries(sessions).forEach(([sessionId, sessionLaps]) => {
    if (sessionLaps.length === 0) return

    const firstLap = sessionLaps[0]
    const sessionDate = new Date(firstLap.created_at)
    const duration = calculateSessionDuration(sessionLaps)
    const cost = 15 + (duration / 60) * 10 // €15 base + €10 per hour

    expensesList.push({
      id: parseInt(sessionId),
      date: sessionDate.toISOString().split('T')[0] || '',
      track: firstLap.track_name || 'Unknown Track',
      category: 'Session',
      description: `Karting session - ${laps.length} laps`,
      amount: Math.round(cost * 100) / 100
    })

    // Add equipment costs occasionally
    if (Math.random() < 0.1) { // 10% chance of equipment expense
      expensesList.push({
        id: parseInt(sessionId) + 10000,
        date: sessionDate.toISOString().split('T')[0] || '',
        track: firstLap.track_name || 'Unknown Track',
        category: 'Equipment',
        description: 'Kart maintenance and tires',
        amount: Math.round((Math.random() * 50 + 20) * 100) / 100
      })
    }
  })

  // Sort by date descending
  expenses.value = expensesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const calculateBudgets = () => {
  const currentDate = new Date()
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const currentYear = currentDate.getFullYear()

  // Calculate current month spending
  const monthlyExpenses = expenses.value.filter(expense => {
    const expenseMonth = expense.date.substring(0, 7)
    return expenseMonth === currentMonth
  })
  monthlySpent.value = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate current year spending
  const yearlyExpenses = expenses.value.filter(expense => {
    const expenseYear = new Date(expense.date).getFullYear()
    return expenseYear === currentYear
  })
  yearlySpent.value = yearlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
}

const createCharts = (laps: LapData[]) => {
  if (laps.length === 0) return

  // Destroy existing charts
  if (spendingChartInstance) spendingChartInstance.destroy()
  if (breakdownChartInstance) breakdownChartInstance.destroy()
  if (monthlyChartInstance) monthlyChartInstance.destroy()
  if (valueChartInstance) valueChartInstance.destroy()

  // Spending Over Time Chart
  if (spendingChart.value) {
    const monthlyCosts = calculateMonthlyCosts(laps)
    const sortedMonths = Object.keys(monthlyCosts).sort()
    const cumulativeSpending: number[] = []
    let runningTotal = 0

    sortedMonths.forEach(month => {
      runningTotal += monthlyCosts[month] || 0
      cumulativeSpending.push(runningTotal)
    })

    spendingChartInstance = new Chart(spendingChart.value, {
      type: 'line',
      data: {
        labels: sortedMonths.map(month => {
          const [year, monthNum] = month.split('-')
          return `${year}-${monthNum}`
        }),
        datasets: [{
          label: 'Cumulative Spending (€)',
          data: cumulativeSpending,
          borderColor: getColor(0),
          backgroundColor: getColor(0) + '20',
          tension: 0.4,
          fill: true
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
            beginAtZero: true,
            ticks: {
              callback: (value) => '€' + Number(value).toFixed(0)
            }
          }
        }
      }
    })
  }

  // Cost Breakdown Chart
  if (breakdownChart.value) {
    const categoryCosts = expenses.value.reduce((costs, expense) => {
      costs[expense.category] = (costs[expense.category] || 0) + expense.amount
      return costs
    }, {} as { [key: string]: number })

    breakdownChartInstance = new Chart(breakdownChart.value, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryCosts),
        datasets: [{
          data: Object.values(categoryCosts),
          backgroundColor: [
            getColor(0),
            getColor(1),
            getColor(2),
            getColor(3)
          ],
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    })
  }

  // Monthly Spending Chart
  if (monthlyChart.value) {
    const monthlyCosts = calculateMonthlyCosts(laps)
    const sortedMonths = Object.keys(monthlyCosts).sort()

    monthlyChartInstance = new Chart(monthlyChart.value, {
      type: 'bar',
      data: {
        labels: sortedMonths.map(month => {
          const [year, monthNum] = month.split('-')
          return `${year}-${monthNum}`
        }),
        datasets: [{
          label: 'Monthly Spending (€)',
          data: sortedMonths.map(month => monthlyCosts[month] || 0),
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
            beginAtZero: true,
            ticks: {
              callback: (value) => '€' + Number(value).toFixed(0)
            }
          }
        }
      }
    })
  }

  // Value Analysis Chart (Cost per improvement)
  if (valueChart.value) {
    // Calculate improvement over time vs cumulative cost
    const sessions = groupBySession(laps)
    const sessionEntries = Object.entries(sessions).sort(([a], [b]) =>
      sessions[a][0].created_at.localeCompare(sessions[b][0].created_at)
    )

    let cumulativeCost = 0
    const dataPoints = sessionEntries.map(([_sessionId, sessionLaps]) => {
      const cost = 15 + (calculateSessionDuration(sessionLaps) / 60) * 10
      cumulativeCost += cost

      const bestTime = Math.min(...sessionLaps.map((lap) => lap.lap_time))
      return {
        x: cumulativeCost,
        y: bestTime
      }
    })

    valueChartInstance = new Chart(valueChart.value, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Cost vs Performance',
          data: dataPoints,
          backgroundColor: getColor(0),
          pointRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Cumulative Cost (€)'
            },
            ticks: {
              callback: (value) => '€' + Number(value).toFixed(0)
            }
          },
          y: {
            title: {
              display: true,
              text: 'Best Lap Time (seconds)'
            },
            reverse: true,
            ticks: {
              callback: (value) => formatTime(Number(value))
            }
          }
        }
      }
    })
  }
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0.000'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Load data on mount
onMounted(async () => {
  await loadFinancialData()
})

onUnmounted(() => {
  // Clean up chart instances to prevent memory leaks
  if (spendingChartInstance) spendingChartInstance.destroy()
  if (breakdownChartInstance) breakdownChartInstance.destroy()
  if (monthlyChartInstance) monthlyChartInstance.destroy()
  if (valueChartInstance) valueChartInstance.destroy()
})
</script>

<style scoped>
.financial-view {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.summary-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

.expenses-card,
.goals-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.expenses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.expenses-header h3,
.goals-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #48bb78, #38a169);
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

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(72, 187, 120, 0.4);
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
}

.expenses-table {
  width: 100%;
  border-collapse: collapse;
}

.expenses-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.expenses-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.expenses-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-badge.Session {
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
}

.category-badge.Equipment {
  background: rgba(237, 137, 54, 0.2);
  border: 1px solid rgba(237, 137, 54, 0.3);
  color: #ed8936;
}

.amount-cell {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #48bb78;
  font-size: 1rem;
}

.btn-icon-small {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 0.5rem;
}

.btn-icon-small:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-icon-small.danger:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: rgba(245, 101, 101, 0.4);
}

.goals-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.goal-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.goal-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.goal-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #48bb78;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-fill.over-budget {
  background: linear-gradient(90deg, #f56565, #e53e3e);
}

.progress-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .expenses-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .btn-add {
    justify-content: center;
  }
}
</style>
