<template>
  <div class="admin-data-view">
    <header class="page-header">
      <h1>📊 Database Overview</h1>
      <p>View and edit all database records - Sessions, Laps, Drivers, Tracks</p>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        {{ tab.icon }} {{ tab.label }}
        <span class="count" v-if="tab.count !== undefined">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Sessions Tab -->
    <SessionsTable
      v-if="activeTab === 'sessions'"
      :items="sessions"
      :loading="sessionsLoading"
      :error="sessionsError"
      :current-page="sessionPage"
      :total-pages="sessionTotalPages"
      :total="sessionTotal"
      :tracks="allTracks"
      @refresh="fetchSessions"
      @page-change="handleSessionPageChange"
      @filter-change="handleSessionFilterChange"
    />

    <!-- Laps Tab -->
    <LapsTable
      v-if="activeTab === 'laps'"
      :items="laps"
      :loading="lapsLoading"
      :error="lapsError"
      :current-page="lapPage"
      :total-pages="lapTotalPages"
      :total="lapTotal"
      :drivers="allDrivers"
      :tracks="allTracks"
      :driver-filter="selectedDriver"
      :track-filter="selectedTrack"
      @refresh="fetchLaps"
      @page-change="handleLapPageChange"
      @filter-change="handleFilterChange"
    />

    <!-- Drivers Tab -->
    <div v-if="activeTab === 'drivers'" class="tab-content">
      <div class="table-header">
        <h3>Drivers ({{ driverTotal }})</h3>
        <router-link to="/admin/driver-management" class="btn-primary">Manage Drivers</router-link>
      </div>
      <div v-if="driversLoading" class="loading">
        <div class="spinner"></div>
        <p>Loading drivers...</p>
      </div>
      <div v-else-if="driversError" class="error">{{ driversError }}</div>
      <div v-else-if="!drivers.length" class="empty-state">
        <p>📭 No drivers found</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Nickname</th>
              <th>Color</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="driver in drivers" :key="driver.id">
              <td class="mono">{{ driver.id }}</td>
              <td>{{ driver.name }}</td>
              <td>{{ driver.email || '-' }}</td>
              <td>{{ driver.nickname || '-' }}</td>
              <td>
                <span v-if="driver.color" class="color-badge" :style="{ backgroundColor: driver.color }">
                  {{ driver.color }}
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ driver.is_active ? '✓' : '✗' }}</td>
              <td>{{ formatDate(driver.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="pagination" v-if="driverTotalPages > 1">
          <button @click="driverPage--; fetchDrivers()" :disabled="driverPage === 1">Previous</button>
          <span>Page {{ driverPage }} of {{ driverTotalPages }}</span>
          <button @click="driverPage++; fetchDrivers()" :disabled="driverPage === driverTotalPages">Next</button>
        </div>
      </div>
    </div>

    <!-- Tracks Tab -->
    <div v-if="activeTab === 'tracks'" class="tab-content">
      <div class="table-header">
        <h3>Tracks ({{ trackTotal }})</h3>
        <router-link to="/admin/tracks" class="btn-primary">Manage Tracks</router-link>
      </div>
      <div v-if="tracksLoading" class="loading">
        <div class="spinner"></div>
        <p>Loading tracks...</p>
      </div>
      <div v-else-if="tracksError" class="error">{{ tracksError }}</div>
      <div v-else-if="!tracks.length" class="empty-state">
        <p>📭 No tracks found</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Track ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Country</th>
              <th>Region</th>
              <th>Distance (m)</th>
              <th>Corners</th>
              <th>Indoor</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="track in tracks" :key="track.id">
              <td class="mono">{{ track.id }}</td>
              <td class="mono">{{ track.track_id }}</td>
              <td>{{ track.name }}</td>
              <td>{{ track.city || '-' }}</td>
              <td>{{ track.country || '-' }}</td>
              <td>{{ track.region || '-' }}</td>
              <td>{{ track.distance || '-' }}</td>
              <td>{{ track.corners || '-' }}</td>
              <td>{{ track.indoor ? '✓' : '✗' }}</td>
              <td>
                <a v-if="track.website" :href="track.website" target="_blank">Link</a>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination" v-if="trackTotalPages > 1">
          <button @click="trackPage--; fetchTracks()" :disabled="trackPage === 1">Previous</button>
          <span>Page {{ trackPage }} of {{ trackTotalPages }}</span>
          <button @click="trackPage++; fetchTracks()" :disabled="trackPage === trackTotalPages">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/api'
import type { Session, Lap, Driver, Track } from '@/services/api'
import { useErrorHandler, getErrorMessage } from '@/composables/useErrorHandler'
import SessionsTable from '@/components/admin/SessionsTable.vue'
import LapsTable from '@/components/admin/LapsTable.vue'

const { handleError } = useErrorHandler()

interface SessionQueryParams {
  page: number
  per_page: number
  driver_id?: string
  track_id?: string
  date_from?: string
  date_to?: string
}

interface LapsQueryParams {
  page: number
  per_page: number
  driver_id?: string
  track_id?: string
}

interface SessionFilters {
  driver_id?: string
  track_id?: string
  date_from?: string
  date_to?: string
}

// State
const activeTab = ref('sessions')
const sessions = ref<Session[]>([])
const laps = ref<Lap[]>([])
const drivers = ref<Driver[]>([])
const tracks = ref<Track[]>([])
const allDrivers = ref<Driver[]>([])
const allTracks = ref<Track[]>([])

// Loading states
const sessionsLoading = ref(false)
const lapsLoading = ref(false)
const driversLoading = ref(false)
const tracksLoading = ref(false)

// Errors
const sessionsError = ref('')
const lapsError = ref('')
const driversError = ref('')
const tracksError = ref('')

// Pagination
const sessionPage = ref(1)
const sessionTotalPages = ref(1)
const sessionTotal = ref(0)

const lapPage = ref(1)
const lapTotalPages = ref(1)
const lapTotal = ref(0)

const driverPage = ref(1)
const driverTotalPages = ref(1)
const driverTotal = ref(0)

const trackPage = ref(1)
const trackTotalPages = ref(1)
const trackTotal = ref(0)

// Filters
const selectedDriver = ref('')
const selectedTrack = ref('')
const sessionFilters = ref<SessionFilters>({})

const tabs = computed(() => [
  { id: 'sessions', label: 'Sessions', icon: '🏁', count: sessionTotal.value },
  { id: 'laps', label: 'Laps', icon: '⏱️', count: lapTotal.value },
  { id: 'drivers', label: 'Drivers', icon: '👤', count: driverTotal.value },
  { id: 'tracks', label: 'Tracks', icon: '🏎️', count: trackTotal.value },
])

// Methods
const fetchSessions = async () => {
  sessionsLoading.value = true
  sessionsError.value = ''
  
  try {
    const params: SessionQueryParams = { 
      page: sessionPage.value, 
      per_page: 25,
      ...sessionFilters.value
    }
    const response = await apiService.getSessions(params)
    sessions.value = response.data
    sessionTotalPages.value = response.last_page
    sessionTotal.value = response.total
  } catch (error: unknown) {
    sessionsError.value = getErrorMessage(error)
  } finally {
    sessionsLoading.value = false
  }
}

const fetchLaps = async () => {
  lapsLoading.value = true
  lapsError.value = ''
  
  try {
    const params: LapsQueryParams = { 
      page: lapPage.value, 
      per_page: 25
    }
    if (selectedDriver.value) params.driver_id = selectedDriver.value
    if (selectedTrack.value) params.track_id = selectedTrack.value
    
    const response = await apiService.getLaps(params)
    laps.value = response.data
    lapTotalPages.value = response.last_page
    lapTotal.value = response.total
  } catch (error: unknown) {
    lapsError.value = getErrorMessage(error)
  } finally {
    lapsLoading.value = false
  }
}

const fetchDrivers = async () => {
  driversLoading.value = true
  driversError.value = ''
  
  try {
    const response = await apiService.getDrivers()
    drivers.value = response
    driverTotal.value = drivers.value.length
  } catch (error: unknown) {
    driversError.value = getErrorMessage(error)
  } finally {
    driversLoading.value = false
  }
}

const fetchTracks = async () => {
  tracksLoading.value = true
  tracksError.value = ''
  
  try {
    const response = await apiService.getTracks()
    tracks.value = response
    trackTotal.value = tracks.value.length
  } catch (error: unknown) {
    tracksError.value = getErrorMessage(error)
  } finally {
    tracksLoading.value = false
  }
}

const loadFilters = async () => {
  try {
    const [driversRes, tracksRes] = await Promise.all([
      apiService.getDrivers(),
      apiService.getTracks()
    ])
    allDrivers.value = driversRes
    allTracks.value = tracksRes
  } catch (error: unknown) {
    handleError(error, 'loading filters')
  }
}

const switchTab = (tabId: string) => {
  activeTab.value = tabId
  
  if (tabId === 'sessions' && sessions.value.length === 0) {
    fetchSessions()
  } else if (tabId === 'laps' && laps.value.length === 0) {
    fetchLaps()
  } else if (tabId === 'drivers' && drivers.value.length === 0) {
    fetchDrivers()
  } else if (tabId === 'tracks' && tracks.value.length === 0) {
    fetchTracks()
  }
}

const handleSessionPageChange = (page: number) => {
  sessionPage.value = page
  fetchSessions()
}

const handleLapPageChange = (page: number) => {
  lapPage.value = page
  fetchLaps()
}

const handleFilterChange = (filters: { driver: string, track: string }) => {
  selectedDriver.value = filters.driver
  selectedTrack.value = filters.track
  lapPage.value = 1
  fetchLaps()
}

const handleSessionFilterChange = (filters: SessionFilters) => {
  sessionFilters.value = filters
  sessionPage.value = 1
  fetchSessions()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

onMounted(async () => {
  // Load counts for all tabs first
  loadFilters()
  
  // Fetch initial counts
  try {
    const [sessionsRes, lapsRes, driversRes, tracksRes] = await Promise.all([
      apiService.getSessions({ page: 1, per_page: 1 }),
      apiService.getLaps({ page: 1, per_page: 1 }),
      apiService.getDrivers(),
      apiService.getTracks()
    ])
    
    sessionTotal.value = sessionsRes.total || 0
    lapTotal.value = lapsRes.total || 0
    driverTotal.value = Array.isArray(driversRes) ? driversRes.length : 0
    trackTotal.value = Array.isArray(tracksRes) ? tracksRes.length : 0
  } catch (error: unknown) {
    handleError(error, 'loading counts')
  }
  
  // Fetch sessions for active tab
  fetchSessions()
})
</script>

<style scoped lang="scss">
.admin-data-view {
  padding: 2rem;

  .page-header {
    margin-bottom: 2rem;

    h1 {
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    p {
      color: var(--text-secondary);
    }
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
    overflow-x: auto;

    .tab {
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 1rem;
      color: var(--text-secondary);
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover {
        color: var(--primary-color);
        background: var(--bg-secondary);
      }

      &.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        font-weight: 600;
      }

      .count {
        margin-left: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }
  }

  .tab-content {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: 1.5rem;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
    }
  }

  .table-wrapper {
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: var(--bg-secondary);

        th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid var(--border-color);
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid var(--border-color);

          &:hover {
            background: var(--bg-secondary);
          }

          td {
            padding: 0.75rem;

            &.mono {
              font-family: 'Courier New', monospace;
            }

            a {
              color: var(--primary-color);
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }
  }

  .color-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: white;
    font-size: 0.8rem;
    font-family: monospace;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--border-radius);
      background: var(--primary-color);
      color: white;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background: var(--primary-hover);
      }
    }
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background: var(--primary-hover);
    }
  }

  .loading, .error, .empty-state {
    padding: 2rem;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: var(--error-color);
    background: var(--error-bg);
    border-radius: var(--border-radius);
  }
}
</style>
