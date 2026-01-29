<template>
  <div class="geographic-view">
    <header class="page-header">
      <h1>🗺️ Geographic Analysis</h1>
      <p>Track locations and regional performance insights</p>
    </header>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Region:</label>
        <select v-model="selectedRegion" @change="filterTracks">
          <option value="">All Regions</option>
          <option v-for="region in regions" :key="region" :value="region">
            {{ region }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Country:</label>
        <select v-model="selectedCountry" @change="filterTracks">
          <option value="">All Countries</option>
          <option v-for="country in countries" :key="country" :value="country">
            {{ country }}
          </option>
        </select>
      </div>
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-label">Tracks Shown</span>
          <span class="stat-value">{{ filteredTracks.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Sessions</span>
          <span class="stat-value">{{ totalSessions }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Laps</span>
          <span class="stat-value">{{ totalLaps }}</span>
        </div>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading track locations...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadTrackData" class="retry-btn">Retry</button>
    </div>

    <!-- Map Container -->
    <div v-else class="map-section">
      <div class="map-container">
        <TrackMap :driver-id="resolvedDriverId || loggedInDriverId" />
      </div>
    </div>

    <!-- Track List -->
    <div v-if="filteredTracks.length > 0" class="track-list">
      <h3>📍 Track Details</h3>
      <div class="track-grid">
        <div
          v-for="track in filteredTracks"
          :key="track.track_id"
          class="track-card"
        >
          <div class="track-info">
            <h4>{{ track.track_name }}</h4>
            <p class="track-location">
              <span v-if="track.city">{{ track.city }}, </span>{{ track.country }}
              <span v-if="track.region"> • {{ track.region }}</span>
            </p>
          </div>
          <div class="track-stats">
            <div class="stat">
              <span class="label">Sessions:</span>
              <span class="value">{{ track.total_sessions }}</span>
            </div>
            <div class="stat">
              <span class="label">Laps:</span>
              <span class="value">{{ track.total_laps }}</span>
            </div>
            <div class="stat" v-if="track.track_record">
              <span class="label">Record:</span>
              <span class="value">{{ formatTime(track.track_record) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>🗺️ No tracks found in the selected region</p>
      <p class="hint">Try selecting a different region or country filter</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useKartingAPI } from '@/composables/useKartingAPI'
import { useAuthStore } from '@/stores/auth'
import TrackMap from '@/components/TrackMap.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler()

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const authStore = useAuthStore()
const loggedInDriverId = computed(() => authStore.user?.driver_id)
const resolvedDriverId = ref<number | null>(null) // Store the actual driver ID after resolution

const { getTrackStats, getDriverStats, loading, error } = useKartingAPI()
import type { TrackStat } from '@/composables/useKartingAPI'

// State
const trackStats = ref<TrackStat[]>([])
const selectedRegion = ref('')
const selectedCountry = ref('')

// Computed
const regions = computed(() => {
  const uniqueRegions = [...new Set(trackStats.value.map(t => t.region).filter((r): r is string => r !== null))]
  return uniqueRegions.sort()
})

const countries = computed(() => {
  const uniqueCountries = [...new Set(trackStats.value.map(t => t.country).filter((c): c is string => c !== null))]
  return uniqueCountries.sort()
})

const filteredTracks = computed(() => {
  let tracks = trackStats.value

  if (selectedRegion.value) {
    tracks = tracks.filter(t => t.region === selectedRegion.value)
  }

  if (selectedCountry.value) {
    tracks = tracks.filter(t => t.country === selectedCountry.value)
  }

  return tracks.filter(t => t.latitude && t.longitude)
})

const totalSessions = computed(() => {
  return filteredTracks.value.reduce((sum, track) => sum + track.total_sessions, 0)
})

const totalLaps = computed(() => {
  return filteredTracks.value.reduce((sum, track) => sum + track.total_laps, 0)
})

async function loadTrackData() {
  try {
    // Ensure auth store has loaded the user
    if (!authStore.user) {
      await authStore.fetchCurrentUser()
    }

    let driverId = loggedInDriverId.value
    
    // If no driver_id, try to find driver by name
    if (!driverId) {
      
      if (authStore.user?.name) {
        try {
          // Fetch all drivers and find by name
          const driversData = await getDriverStats()
          if (driversData) {
            const matchingDriver = driversData.find((d) => 
              d.driver_name.toLowerCase() === authStore.user?.name.toLowerCase()
            )
            
            if (matchingDriver) {
              driverId = matchingDriver.driver_id
              resolvedDriverId.value = driverId // Store resolved ID
            } else {
              handleError(new Error(`No driver profile found for "${authStore.user.name}"`), 'Driver lookup failed')
              error.value = `No driver profile found for "${authStore.user.name}". Please contact an administrator.`
              loading.value = false
              return
            }
          }
        } catch (err: unknown) {
          handleError(err, 'Error finding driver by name')
        }
      }
      
      // Still no driver ID
      if (!driverId) {
        handleError(new Error('Driver ID not found'), 'Auth user lookup')
        error.value = 'Driver ID not found. Please contact an administrator to link your account to a driver profile.'
        loading.value = false
        return
      }
    }

    resolvedDriverId.value = driverId // Store resolved ID

    const data = await getTrackStats()
    trackStats.value = data || []

    await nextTick()
    // Map is now handled by TrackMap component
  } catch (err: unknown) {
    handleError(err, 'Error loading track data')
    error.value = 'Failed to load track data'
  } finally {
    loading.value = false
  }
}

function filterTracks() {
  // Filtering is now handled by the TrackMap component
}

function formatTime(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

onMounted(async () => {
  await loadTrackData()
})

onUnmounted(() => {
  // Map cleanup is now handled by TrackMap component
})
</script>

<style scoped>
.geographic-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #F0F6FC;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #8B949E;
  font-size: 16px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #8B949E;
  font-weight: 500;
}

.filter-group select {
  padding: 8px 16px;
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 6px;
  color: #F0F6FC;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-group select:hover {
  border-color: #FF6B35;
}

.filter-group select:focus {
  outline: none;
  border-color: #FF6B35;
}

.stats-summary {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 8px 16px;
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8B949E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #FF6B35;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #8B949E;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #30363D;
  border-top: 3px solid #FF6B35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #F87171;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #FF8555;
}

.map-section {
  margin-bottom: 32px;
}

.map-container {
  height: 500px;
  border: 1px solid #30363D;
  border-radius: 12px;
  overflow: hidden;
}

.track-list {
  margin-top: 32px;
}

.track-list h3 {
  margin: 0 0 20px 0;
  color: #F0F6FC;
  font-size: 20px;
  font-weight: 600;
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.track-card {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.track-card:hover {
  transform: translateY(-2px);
  border-color: #FF6B35;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
}

.track-info h4 {
  margin: 0 0 8px 0;
  color: #F0F6FC;
  font-size: 16px;
  font-weight: 600;
}

.track-location {
  margin: 0 0 12px 0;
  color: #8B949E;
  font-size: 14px;
}

.track-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat .label {
  font-size: 11px;
  color: #8B949E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.stat .value {
  font-size: 14px;
  font-weight: 600;
  color: #FF6B35;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8B949E;
}

.empty-state p {
  margin: 8px 0;
  font-size: 18px;
}

.empty-state .hint {
  color: #8B949E;
  font-size: 14px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: center;
  }

  .stats-summary {
    flex-direction: column;
    gap: 12px;
  }

  .track-grid {
    grid-template-columns: 1fr;
  }

  .track-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
