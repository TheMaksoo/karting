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
        <div class="chart-placeholder">
          <div class="chart-icon">💸</div>
          <p>Line chart showing cumulative spending over time</p>
          <small>Chart.js line chart with spending trend ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>🎯 Cost Breakdown</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">🥧</div>
          <p>Pie chart showing cost distribution by category</p>
          <small>Chart.js pie chart ready</small>
        </div>
      </div>

      <div class="chart-card">
        <h3>📊 Monthly Spending</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Bar chart showing monthly spending patterns</p>
          <small>Chart.js bar chart ready</small>
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>💎 Value Analysis</h3>
        <div class="chart-placeholder">
          <div class="chart-icon">📉</div>
          <p>Cost per improvement second vs. time spent</p>
          <small>Chart.js scatter plot ready</small>
        </div>
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
import { ref } from 'vue'

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

const monthlyBudget = ref(0)
const monthlySpent = ref(0)
const yearlyBudget = ref(0)
const yearlySpent = ref(0)

const expenses = ref<Expense[]>([])
const loading = ref(true)
const error = ref('')

// Load financial data from API
const loadFinancialData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // TODO: Implement API endpoints for financial data
    // const financialData = await apiService.financial.getSummary()
    // const expenseData = await apiService.financial.getExpenses()
    
    // For now, calculate from session data
    // const sessions = await apiService.sessions.getAll()
    // expenses.value = expenseData
    // totalSpent.value = financialData.totalSpent
    // avgPerSession.value = financialData.avgPerSession
    // etc.
    
    expenses.value = []
    totalSpent.value = 0
    avgPerSession.value = 0
    costPerLap.value = 0
    monthlyAvg.value = 0
    totalSessions.value = 0
    totalLaps.value = 0
    monthlyBudget.value = 0
    monthlySpent.value = 0
    yearlyBudget.value = 0
    yearlySpent.value = 0
  } catch (err) {
    console.error('Error loading financial data:', err)
    error.value = 'Failed to load financial data'
  } finally {
    loading.value = false
  }
}

// Load data on mount
loadFinancialData()

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
}

.summary-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
