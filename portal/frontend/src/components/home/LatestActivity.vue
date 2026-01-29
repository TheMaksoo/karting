<template>
  <div class="activity-section">
    <div class="section-header">
      <h2>🏆 Latest Activity</h2>
    </div>

    <div v-if="loading" class="loading-state">Loading activity...</div>
    <div v-else-if="activities.length === 0" class="empty-state">
      <p>No recent activity</p>
      <p class="text-muted">Start racing to see your results here!</p>
    </div>
    <div v-else class="activity-list">
      <div v-for="activity in activities" :key="activity.session_id" class="activity-card">
        <div class="activity-header">
          <div class="track-icon">🏁</div>
          <div class="activity-meta">
            <div class="track-name">{{ activity.track_name }}</div>
            <div class="session-date">{{ formatDate(activity.session_date) }}</div>
          </div>
        </div>
        <div class="activity-results">
          <div 
            v-for="result in activity.results.slice(0, 3)" 
            :key="result.driver_id" 
            class="result-item"
            :class="{ 'is-highlight': userDriverIds?.includes(result.driver_id) }"
          >
            <div class="position-badge" :class="`position-${result.position}`">
              {{ result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : `#${result.position}` }}
            </div>
            <div class="driver-name">{{ result.driver_name }}</div>
            <div class="lap-time">{{ formatLapTime(result.best_lap_time) }}</div>
          </div>
          <div v-if="activity.results.length > 3" class="more-results">
            +{{ activity.results.length - 3 }} more drivers
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Activity {
  session_id: number
  track_name: string
  track_id: number
  session_date: string
  session_type: string
  results: Array<{
    driver_name: string
    driver_id: number
    position: number
    best_lap_time: number
  }>
  total_drivers: number
}

defineProps<{
  activities: Activity[]
  loading: boolean
  userDriverIds?: number[]
}>()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatLapTime = (seconds: number) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}
</script>
