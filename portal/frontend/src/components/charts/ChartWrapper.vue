<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </div>
    <div class="chart-content" :class="{ 'loading': loading }">
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading chart data...</p>
      </div>
      <div v-else-if="error" class="error-message">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{{ error }}</p>
      </div>
      <div v-else-if="!hasData" class="no-data">
        <svg class="no-data-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No data available</p>
      </div>
      <slot v-else></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  loading?: boolean
  error?: string | null
  hasData?: boolean
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  loading: false,
  error: null,
  hasData: true,
})
</script>

<style scoped>
.chart-wrapper {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.chart-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.chart-content {
  flex: 1;
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message,
.no-data {
  text-align: center;
  color: #6b7280;
}

.error-icon,
.no-data-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #ef4444;
}

.no-data-icon {
  color: #9ca3af;
}

.error-message p,
.no-data p {
  font-size: 14px;
  margin: 0;
}
</style>
