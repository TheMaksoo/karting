<template>
  <div class="quick-stats-section">
    <h2 class="section-title">📊 Quick Stats</h2>
    <div class="stats-grid">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="stat-card"
        :title="stat.tooltip"
      >
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Stat {
  icon: string
  value: string | number
  label: string
  tooltip?: string
}

defineProps<{
  stats: Stat[]
}>()
</script>
