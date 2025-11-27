<template>
  <div class="stat-card" :class="colorClass">
    <div class="stat-icon">
      <component :is="iconComponent" />
    </div>
    <div class="stat-content">
      <p class="stat-label">{{ label }}</p>
      <p class="stat-value">{{ formattedValue }}</p>
      <p v-if="trend" class="stat-trend" :class="trendClass">
        <span class="trend-arrow">{{ trendArrow }}</span>
        {{ trend }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  value: number | string
  unit?: string
  icon?: 'users' | 'flag' | 'clock' | 'trophy' | 'trending' | 'dollar' | 'map'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  icon: 'trending',
  color: 'blue',
  trend: '',
  trendDirection: 'neutral',
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString() + (props.unit ? ' ' + props.unit : '')
  }
  return props.value
})

const colorClass = computed(() => `stat-card--${props.color}`)

const trendClass = computed(() => {
  if (props.trendDirection === 'up') return 'trend-up'
  if (props.trendDirection === 'down') return 'trend-down'
  return 'trend-neutral'
})

const trendArrow = computed(() => {
  if (props.trendDirection === 'up') return '↑'
  if (props.trendDirection === 'down') return '↓'
  return '→'
})

const iconComponent = computed(() => {
  const icons = {
    users: 'svg',
    flag: 'svg',
    clock: 'svg',
    trophy: 'svg',
    trending: 'svg',
    dollar: 'svg',
    map: 'svg',
  }
  return icons[props.icon] || 'svg'
})
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--blue .stat-icon { background: #dbeafe; color: #3b82f6; }
.stat-card--green .stat-icon { background: #d1fae5; color: #10b981; }
.stat-card--yellow .stat-icon { background: #fef3c7; color: #f59e0b; }
.stat-card--red .stat-icon { background: #fee2e2; color: #ef4444; }
.stat-card--purple .stat-icon { background: #e9d5ff; color: #a855f7; }
.stat-card--indigo .stat-icon { background: #e0e7ff; color: #6366f1; }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-trend {
  font-size: 13px;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up { color: #10b981; }
.trend-down { color: #ef4444; }
.trend-neutral { color: #6b7280; }

.trend-arrow {
  font-weight: 700;
  font-size: 16px;
}
</style>
