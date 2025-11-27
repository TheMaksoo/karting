<template>
  <div class="admin-data-view">
    <header class="page-header">
      <h1>📊 Database Overview</h1>
      <p>All sessions, laps, and drivers from the database - No fake data</p>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
        <span class="count" v-if="tab.count !== undefined">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Sessions Tab -->
    <div v-if="activeTab === 'sessions'" class="tab-content">
      <div v-if="sessionsLoading" class="loading">Loading sessions...</div>
      <div v-else-if="sessionsError" class="error">{{ sessionsError }}</div>
      <div v-else-if="!sessions.length" class="empty-state">
        <p>📭 No sessions found in database</p>
        <p class="hint">Upload some .eml files or add manual entries to see data here</p>
      </div>
      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Track</th>
              <th>Driver</th>
              <th>Total Laps</th>
              <th>Best Lap</th>
              <th>Avg Lap</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td class="mono">{{ session.id }}</td>
              <td>{{ formatDate(session.date) }}</td>
              <td>{{ session.track_name || 'N/A' }}</td>
              <td class="driver-name">{{ session.driver_name || 'Unknown' }}</td>
              <td class="number">{{ session.total_laps || 0 }}</td>
              <td class="mono highlight">{{ formatTime(session.best_lap_time) }}</td>
              <td class="mono">{{ formatTime(session.average_lap_time) }}</td>
              <td class="cost">€{{ (session.cost || 0).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Laps Tab -->
    <div v-if="activeTab === 'laps'" class="tab-content">
      <div class="filter-controls">
        <select v-model="selectedDriver" @change="loadLapData" class="filter-select">
          <option value="">All Drivers</option>
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
        <select v-model="selectedTrack" @change="loadLapData" class="filter-select">
          <option value="">All Tracks</option>
          <option v-for="track in tracks" :key="track.id" :value="track.id">
            {{ track.name }}
          </option>
        </select>
      </div>

      <div v-if="lapsLoading" class="loading">Loading laps...</div>
      <div v-else-if="lapsError" class="error">{{ lapsError }}</div>
      <div v-else-if="!filteredLaps.length" class="empty-state">
        <p>📭 No laps found matching filters</p>
      </div>
      <div v-else class="data-table">
        <div class="table-info">
          Showing {{ filteredLaps.length }} laps
        </div>
        <table>
          <thead>
            <tr>
              <th>Lap #</th>
              <th>Session ID</th>
              <th>Driver</th>
              <th>Track</th>
              <th>Lap Time</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(lap, index) in paginatedLaps" :key="lap.id">
              <td class="mono">{{ lap.lap_number || (index + 1) }}</td>
              <td class="mono">{{ lap.session_id }}</td>
              <td class="driver-name">{{ lap.driver_name || 'Unknown' }}</td>
              <td>{{ lap.track_name || 'N/A' }}</td>
              <td class="mono highlight">{{ formatTime(lap.lap_time) }}</td>
              <td>{{ formatDate(lap.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="pagination" v-if="totalPages > 1">
          <button @click="currentPage--" :disabled="currentPage === 1">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
        </div>
      </div>
    </div>

    <!-- Drivers Tab -->
    <div v-if="activeTab === 'drivers'" class="tab-content">
      <div v-if="driversLoading" class="loading">Loading drivers...</div>
      <div v-else-if="driversError" class="error">{{ driversError }}</div>
      <div v-else-if="!drivers.length" class="empty-state">
        <p>📭 No drivers found in database</p>
      </div>
      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Total Sessions</th>
              <th>Total Laps</th>
              <th>Best Lap</th>
              <th>Best Track</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="driver in drivers" :key="driver.id">
              <td class="mono">{{ driver.id }}</td>
              <td class="driver-name">{{ driver.name }}</td>
              <td class="number">{{ driver.sessions_count || 0 }}</td>
              <td class="number">{{ driver.laps_count || 0 }}</td>
              <td class="mono highlight">{{ formatTime(driver.best_lap_time) }}</td>
              <td>{{ driver.best_track || 'N/A' }}</td>
              <td>{{ formatDate(driver.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tracks Tab -->
    <div v-if="activeTab === 'tracks'" class="tab-content">
      <div v-if="tracksLoading" class="loading">Loading tracks...</div>
      <div v-else-if="tracksError" class="error">{{ tracksError }}</div>
      <div v-else-if="!tracks.length" class="empty-state">
        <p>📭 No tracks found in database</p>
      </div>
      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Country</th>
              <th>Track Record</th>
              <th>Sessions</th>
              <th>Total Laps</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="track in tracks" :key="track.id">
              <td class="mono">{{ track.id }}</td>
              <td class="track-name">{{ track.name }}</td>
              <td>{{ track.city || 'N/A' }}</td>
              <td>{{ track.country || 'N/A' }}</td>
              <td class="mono highlight">{{ formatTime(track.track_record) }}</td>
              <td class="number">{{ track.sessions_count || 0 }}</td>
              <td class="number">{{ track.laps_count || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api'

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Accept': 'application/json'
})

// Sessions state
const sessions = ref<any[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')

const activeTab = ref('sessions')
const tabs = computed(() => [
  { id: 'sessions', label: 'Sessions', icon: '🏁', count: sessions.value.length },
  { id: 'laps', label: 'Laps', icon: '⏱️', count: filteredLaps.value.length },
  { id: 'drivers', label: 'Drivers', icon: '👥', count: drivers.value.length },
  { id: 'tracks', label: 'Tracks', icon: '🏎️', count: tracks.value.length },
])

// Laps state
const filteredLaps = ref<any[]>([])
const selectedDriver = ref('')
const selectedTrack = ref('')
const lapsLoading = ref(false)
const lapsError = ref('')
const currentPage = ref(1)
const itemsPerPage = 50

// Drivers state
const drivers = ref<any[]>([])
const driversLoading = ref(false)
const driversError = ref('')

// Tracks state
const tracks = ref<any[]>([])
const tracksLoading = ref(false)
const tracksError = ref('')

const paginatedLaps = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredLaps.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredLaps.value.length / itemsPerPage))

async function fetchSessions() {
  sessionsLoading.value = true
  sessionsError.value = ''
  
  try {
    const response = await axios.get(`${API_BASE_URL}/sessions`, {
      headers: getAuthHeaders()
    })
    
    sessions.value = response.data.data || response.data || []
  } catch (error: any) {
    sessionsError.value = error.response?.data?.message || 'Failed to load sessions'
    sessions.value = []
  } finally {
    sessionsLoading.value = false
  }
}

onMounted(async () => {
  await fetchSessions()
  await loadDrivers()
  await loadTracks()
  await loadLapData()
})

async function loadLapData() {
  lapsLoading.value = true
  lapsError.value = ''
  
  try {
    const params: any = {}
    if (selectedDriver.value) params.driver_id = selectedDriver.value
    if (selectedTrack.value) params.track_id = selectedTrack.value
    
    const response = await axios.get('http://127.0.0.1:8000/api/laps', { 
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    filteredLaps.value = response.data.data || response.data || []
    currentPage.value = 1
  } catch (error: any) {
    lapsError.value = error.response?.data?.message || 'Failed to load laps'
    filteredLaps.value = []
  } finally {
    lapsLoading.value = false
  }
}

async function loadDrivers() {
  driversLoading.value = true
  driversError.value = ''
  
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/drivers', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    drivers.value = response.data.data || response.data || []
  } catch (error: any) {
    driversError.value = error.response?.data?.message || 'Failed to load drivers'
    drivers.value = []
  } finally {
    driversLoading.value = false
  }
}

async function loadTracks() {
  tracksLoading.value = true
  tracksError.value = ''
  
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/tracks', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    tracks.value = response.data.data || response.data || []
  } catch (error: any) {
    tracksError.value = error.response?.data?.message || 'Failed to load tracks'
    tracks.value = []
  } finally {
    tracksLoading.value = false
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}
</script>

<style scoped>
.admin-data-view {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #30363D;
}

.tab {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #8B949E;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab:hover {
  color: #F0F6FC;
  background: rgba(255, 107, 53, 0.1);
}

.tab.active {
  color: #FF6B35;
  border-bottom-color: #FF6B35;
}

.tab .count {
  color: #8B949E;
  font-size: 12px;
  margin-left: 4px;
}

.tab.active .count {
  color: #FF6B35;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.filter-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 16px;
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 6px;
  color: #F0F6FC;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: #FF6B35;
}

.filter-select:focus {
  outline: none;
  border-color: #FF6B35;
}

.loading, .error, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #8B949E;
  font-size: 16px;
}

.error {
  color: #F87171;
}

.empty-state p {
  margin: 8px 0;
  font-size: 18px;
}

.empty-state .hint {
  color: #8B949E;
  font-size: 14px;
  margin-top: 12px;
}

.data-table {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 8px;
  overflow: hidden;
}

.table-info {
  padding: 12px 16px;
  background: rgba(255, 107, 53, 0.1);
  color: #FF6B35;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #30363D;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #161B22;
}

th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #8B949E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #30363D;
}

tbody tr {
  transition: background 0.2s;
}

tbody tr:hover {
  background: rgba(255, 107, 53, 0.05);
}

tbody tr:not(:last-child) {
  border-bottom: 1px solid #30363D;
}

td {
  padding: 12px 16px;
  color: #F0F6FC;
  font-size: 14px;
}

td.mono {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: #8B949E;
  font-size: 13px;
}

td.highlight {
  color: #FF6B35;
  font-weight: 600;
}

td.number {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  color: #10B981;
}

td.cost {
  color: #FCD34D;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

td.driver-name {
  color: #F0F6FC;
  font-weight: 600;
}

td.track-name {
  color: #4facfe;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #30363D;
}

.pagination button {
  padding: 8px 16px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #FF8555;
  transform: scale(1.05);
}

.pagination button:disabled {
  background: #30363D;
  color: #8B949E;
  cursor: not-allowed;
}

.pagination span {
  color: #8B949E;
  font-size: 14px;
}
</style>
