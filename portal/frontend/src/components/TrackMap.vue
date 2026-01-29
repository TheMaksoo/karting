<template>
  <div class="track-map-container">
    <div ref="mapContainer" class="map"></div>
    <div v-if="loading" class="map-loading">
      <div class="spinner"></div>
      <p>Loading map...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useKartingAPI, type TrackStat } from '@/composables/useKartingAPI'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler()

defineProps<{
  driverId?: number
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const loading = ref(true)
let map: L.Map | null = null

const { getTrackStats } = useKartingAPI()
const tracks = ref<TrackStat[]>([])

// Load real track data from API (filtered by driver if provided)
const loadTracks = async () => {
  try {
    const data = await getTrackStats()
    if (data && Array.isArray(data)) {
      tracks.value = data.filter(track => 
        track.latitude && track.longitude && 
        track.latitude !== 0 && track.longitude !== 0
      )
    }
  } catch (error: unknown) {
    handleError(error, 'Error loading tracks')
    tracks.value = []
  }
}
const formatLapTime = (seconds: number | null): string => {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`
}

const initializeMap = () => {
  if (!mapContainer.value || tracks.value.length === 0) return

  // Calculate center point from all tracks
  // Filter only Netherlands tracks for center calculation
  const nlTracks = tracks.value.filter(t => 
    t.country?.toLowerCase() === 'netherlands' || 
    t.country?.toLowerCase() === 'nederland' ||
    (t.latitude && t.latitude > 50.7 && t.latitude < 53.6 && t.longitude && t.longitude > 3.3 && t.longitude < 7.2)
  )
  
  // Calculate center: prefer Netherlands tracks, otherwise use all tracks
  const tracksForCenter = nlTracks.length > 0 ? nlTracks : tracks.value
  const avgLat = tracksForCenter.reduce((sum, t) => sum + (t.latitude || 0), 0) / tracksForCenter.length
  const avgLng = tracksForCenter.reduce((sum, t) => sum + (t.longitude || 0), 0) / tracksForCenter.length

  // Create map centered on Netherlands tracks, defaulting to central Netherlands (Utrecht area)
  map = L.map(mapContainer.value, {
    center: [avgLat || 52.09, avgLng || 5.12],
    zoom: nlTracks.length > 0 ? 8 : (tracks.value.length === 1 ? 12 : 6),
    zoomControl: true,
  })

  // Add dark theme tile layer (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)

  // Custom marker icon (simple dot, no animation)
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pin"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

  // Add markers for each track with REAL DATA
  tracks.value.forEach((track) => {
    if (!track.latitude || !track.longitude) return

    const marker = L.marker([track.latitude, track.longitude], { icon: customIcon }).addTo(map!)

    const trackInfo = []
    if (track.distance) trackInfo.push(`${track.distance}m`)
    if (track.corners) trackInfo.push(`${track.corners} corners`)
    if (track.indoor !== null) trackInfo.push(track.indoor ? 'Indoor' : 'Outdoor')

    // Create popup content with ENHANCED DATA matching reference image
    const popupContent = `
      <div class="track-popup">
        <div class="popup-header">
          <div class="popup-icon">🏁</div>
          <h3 class="popup-title">${track.track_name}</h3>
        </div>
        ${track.city ? `<div class="popup-location">📍 ${track.city}${track.country ? ', ' + track.country : ''}</div>` : ''}
        
        <div class="popup-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Sessions</div>
            <div class="stat-value">${track.total_sessions || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">🏆 Wins</div>
            <div class="stat-value">TBD</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Laps</div>
            <div class="stat-value">${track.total_laps || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">� Best Lap</div>
            <div class="stat-value highlight">${track.track_record ? formatLapTime(track.track_record) : 'N/A'}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">📊 Avg Lap</div>
            <div class="stat-value">${track.avg_lap_time ? formatLapTime(track.avg_lap_time) : 'N/A'}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">⚡ Avg Speed</div>
            <div class="stat-value">${track.avg_speed_kmh ? track.avg_speed_kmh.toFixed(1) + ' km/h' : 'N/A'}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">💰 Avg Cost</div>
            <div class="stat-value">TBD</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">🗺️ Distance</div>
            <div class="stat-value">${track.total_distance_km ? track.total_distance_km.toFixed(1) + ' km' : 'N/A'}</div>
          </div>
        </div>

        ${trackInfo.length > 0 ? `
        <div class="popup-footer">
          ${trackInfo.join(' · ')}
        </div>` : ''}
      </div>
    `

    marker.bindPopup(popupContent, {
      className: 'custom-popup',
      maxWidth: 280,
      minWidth: 240,
    })
  })

  loading.value = false
}

onMounted(async () => {
  await loadTracks()
  setTimeout(() => {
    initializeMap()
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.track-map-container {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.map {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-primary);
  gap: 1rem;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Leaflet overrides for dark theme */
:deep(.leaflet-control-zoom-in),
:deep(.leaflet-control-zoom-out) {
  background-color: var(--card-bg) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}

:deep(.leaflet-control-zoom-in:hover),
:deep(.leaflet-control-zoom-out:hover) {
  background-color: var(--card-bg-hover) !important;
  color: var(--primary-color) !important;
}

:deep(.leaflet-control-attribution) {
  background-color: rgba(13, 17, 23, 0.8) !important;
  color: var(--text-secondary) !important;
  font-size: 0.7rem !important;
}

:deep(.leaflet-control-attribution a) {
  color: var(--primary-color) !important;
}

/* Custom marker styling - simple dot, no animation */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-pin) {
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

:deep(.marker-pin:hover) {
  transform: scale(1.3);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.6);
}

/* Custom popup styling */
:deep(.custom-popup .leaflet-popup-content-wrapper) {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 0;
}

:deep(.custom-popup .leaflet-popup-tip) {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

:deep(.track-popup) {
  padding: 1rem;
  min-width: 240px;
}

:deep(.popup-header) {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.65rem;
}

:deep(.popup-icon) {
  font-size: 1.5rem;
  line-height: 1;
}

:deep(.popup-title) {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--primary-color);
  margin: 0;
  font-weight: 700;
  line-height: 1.2;
  flex: 1;
}

:deep(.popup-location) {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.85rem;
}

:deep(.popup-stats-grid) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem 0.85rem;
  margin-top: 0.85rem;
}

:deep(.stat-item) {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.65rem;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 88, 12, 0.04));
  border-radius: var(--radius-sm);
  border: 1px solid rgba(249, 115, 22, 0.15);
}

:deep(.stat-item .stat-label) {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
}

:deep(.stat-item .stat-value) {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1.1;
}

:deep(.stat-item .stat-value.highlight) {
  color: var(--primary-color);
  font-size: 0.9rem;
}

:deep(.popup-footer) {
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: center;
}

:deep(.leaflet-popup-close-button) {
  color: var(--text-primary) !important;
  font-size: 1.5rem !important;
  padding: 0.25rem 0.5rem !important;
}

:deep(.leaflet-popup-close-button:hover) {
  color: var(--primary-color) !important;
}

@media (max-width: 768px) {
  .track-map-container {
    height: 400px;
  }
  
  :deep(.track-popup) {
    padding: 0.75rem;
    min-width: 200px;
  }
  
  :deep(.popup-header) {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  :deep(.popup-icon) {
    font-size: 1.2rem;
  }
  
  :deep(.popup-title) {
    font-size: 0.95rem;
  }
  
  :deep(.popup-location) {
    font-size: 0.68rem;
    margin-bottom: 0.65rem;
  }
  
  :deep(.popup-stats-grid) {
    gap: 0.5rem 0.65rem;
    margin-top: 0.65rem;
  }
  
  :deep(.stat-item) {
    padding: 0.4rem 0.5rem;
    gap: 0.2rem;
  }
  
  :deep(.stat-item .stat-label) {
    font-size: 0.6rem;
  }
  
  :deep(.stat-item .stat-value) {
    font-size: 0.75rem;
  }
  
  :deep(.stat-item .stat-value.highlight) {
    font-size: 0.8rem;
  }
  
  :deep(.popup-footer) {
    margin-top: 0.65rem;
    padding-top: 0.6rem;
    font-size: 0.65rem;
  }
}
</style>
