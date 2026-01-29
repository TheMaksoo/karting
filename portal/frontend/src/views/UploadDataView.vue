<template>
  <div class="upload-data">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Upload Session Data</h1>
        <p class="subtitle">Import lap data from EML/CSV files or add manually</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { 'active': activeTab === 'upload' }]"
        @click="activeTab = 'upload'"
      >
        <span class="tab-icon">📤</span>
        File Upload
      </button>
      <button 
        :class="['tab', { 'active': activeTab === 'manual' }]"
        @click="activeTab = 'manual'"
      >
        <span class="tab-icon">✍️</span>
        Manual Entry
      </button>
    </div>

    <!-- File Upload Tab -->
    <div v-if="activeTab === 'upload'" class="tab-content">
      <!-- Step 1: Select Track -->
      <div class="upload-step">
        <div class="step-header">
          <span class="step-number">1</span>
          <h2>Select Track</h2>
        </div>
        <div class="step-content">
          <div class="form-group">
            <label>Choose a track that supports EML uploads</label>
            <select v-model="selectedTrackId" class="select-input" @change="resetUpload">
              <option value="">-- Select Track --</option>
              <option 
                v-for="track in emlSupportedTracks" 
                :key="track.id"
                :value="track.id"
              >
                {{ track.name }} ({{ track.city }}, {{ track.country }})
              </option>
            </select>
          </div>
          <div v-if="emlSupportedTracks.length === 0" class="alert-warning">
            <span class="alert-icon">⚠️</span>
            <div>
              <p class="alert-title">No EML-supported tracks found</p>
              <p class="alert-message">
                Please go to Track Management and enable EML support for at least one track.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Upload File -->
      <div v-if="selectedTrackId" class="upload-step">
        <div class="step-header">
          <span class="step-number">2</span>
          <h2>Upload File</h2>
        </div>
        <div class="step-content">
          <div 
            class="dropzone"
            :class="{ 'dragover': isDragging, 'has-file': uploadedFile }"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
          >
            <input 
              type="file" 
              ref="fileInput"
              @change="handleFileSelect"
              accept=".eml,.txt,.csv"
              style="display: none"
            >
            
            <div v-if="!uploadedFile" class="dropzone-content">
              <div class="dropzone-icon">📧</div>
              <h3>Drag & drop your file here</h3>
              <p>or</p>
              <button class="btn-secondary" @click="fileInput?.click()">
                Browse Files
              </button>
              <p class="file-types">Supported: .eml, .txt, .csv (max 10MB)</p>
            </div>

            <div v-else class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <h4>{{ uploadedFile.name }}</h4>
                <p>{{ formatFileSize(uploadedFile.size) }}</p>
              </div>
              <button class="btn-icon-small danger" @click="removeFile" title="Remove">
                🗑️
              </button>
            </div>
          </div>

          <button 
            v-if="uploadedFile && !previewData"
            class="btn-primary"
            @click="parseFile"
            :disabled="parsing"
          >
            <span v-if="parsing" class="spinner-small"></span>
            {{ parsing ? 'Parsing...' : 'Parse File' }}
          </button>
        </div>
      </div>

      <!-- Step 3: Preview Data -->
      <div v-if="previewData" class="upload-step">
        <div class="step-header">
          <span class="step-number">3</span>
          <h2>Preview & Confirm</h2>
        </div>
        <div class="step-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-icon">🏁</div>
              <div class="summary-content">
                <div class="summary-value">{{ previewData.track.name }}</div>
                <div class="summary-label">Track</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📊</div>
              <div class="summary-content">
                <div class="summary-value">{{ previewData.laps_count }}</div>
                <div class="summary-label">Laps Detected</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">👥</div>
              <div class="summary-content">
                <div class="summary-value">{{ previewData.drivers_detected }}</div>
                <div class="summary-label">Drivers</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📅</div>
              <div class="summary-content">
                <div class="summary-value">{{ sessionDate ? formatDate(sessionDate) : 'N/A' }}</div>
                <div class="summary-label">Session Date</div>
              </div>
            </div>
          </div>

          <!-- Session Details -->
          <div class="form-section">
            <h3>Session Details</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Session Date *</label>
                <input 
                  v-model="sessionDate"
                  type="date"
                  required
                  class="input-field"
                >
              </div>
              <div class="form-group">
                <label>Session Type</label>
                <select v-model="sessionType" class="select-input">
                  <option value="practice">Practice</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="race">Race</option>
                  <option value="heat">Heat</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lap Data Table -->
          <div class="preview-table-container">
            <h3>Lap Data Preview</h3>
            <div class="table-wrapper">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Driver</th>
                    <th>Kart #</th>
                    <th>Best Lap Time</th>
                    <th>Total Laps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(lap, index) in previewData.laps" :key="index">
                    <td>{{ lap.position || '-' }}</td>
                    <td>
                      <input 
                        v-model="lap.driver_name"
                        type="text"
                        class="table-input"
                      >
                    </td>
                    <td>{{ lap.kart_number || '-' }}</td>
                    <td>{{ formatLapTime(lap.best_lap_time) }}</td>
                    <td>{{ lap.total_laps || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="btn-secondary" @click="cancelImport">
              Cancel
            </button>
            <button 
              class="btn-primary"
              @click="importData"
              :disabled="importing"
            >
              <span v-if="importing" class="spinner-small"></span>
              {{ importing ? 'Importing...' : 'Import to Database' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Entry Tab -->
    <div v-if="activeTab === 'manual'" class="tab-content">
      <div class="manual-entry-form">
        <h2>Add Lap Manually</h2>
        <p class="subtitle">Enter individual lap data directly</p>

        <form @submit.prevent="submitManualEntry">
          <!-- Track Selection -->
          <div class="form-section">
            <h3>Track & Driver</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Track *</label>
                <select v-model="manualForm.track_id" required class="select-input">
                  <option value="">-- Select Track --</option>
                  <option 
                    v-for="track in allTracks" 
                    :key="track.id"
                    :value="track.id"
                  >
                    {{ track.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Driver *</label>
                <select v-model="manualForm.driver_id" required class="select-input">
                  <option value="">-- Select Driver --</option>
                  <option 
                    v-for="driver in drivers" 
                    :key="driver.id"
                    :value="driver.id"
                  >
                    {{ driver.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lap Details -->
          <div class="form-section">
            <h3>Lap Details</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Lap Time (seconds) *</label>
                <input 
                  v-model.number="manualForm.lap_time"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="45.678"
                  class="input-field"
                >
                <small>Format: seconds with milliseconds (e.g., 45.678)</small>
              </div>
              <div class="form-group">
                <label>Lap Number</label>
                <input 
                  v-model.number="manualForm.lap_number"
                  type="number"
                  min="1"
                  placeholder="1"
                  class="input-field"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Kart Number</label>
                <input 
                  v-model.number="manualForm.kart_number"
                  type="number"
                  min="1"
                  placeholder="12"
                  class="input-field"
                >
              </div>
              <div class="form-group">
                <label>Session Date *</label>
                <input 
                  v-model="manualForm.session_date"
                  type="date"
                  required
                  class="input-field"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full">
                <label>Session Type</label>
                <select v-model="manualForm.session_type" class="select-input">
                  <option value="practice">Practice</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="race">Race</option>
                  <option value="heat">Heat</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full">
                <label>Notes</label>
                <textarea 
                  v-model="manualForm.notes"
                  rows="3"
                  placeholder="Optional notes about this lap..."
                  class="textarea-field"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="action-buttons">
            <button type="button" class="btn-secondary" @click="resetManualForm">
              Reset
            </button>
            <button 
              type="submit"
              class="btn-primary"
              :disabled="submittingManual"
            >
              <span v-if="submittingManual" class="spinner-small"></span>
              {{ submittingManual ? 'Adding...' : 'Add Lap' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal -->
    <Teleport to="body">
      <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
        <div class="modal-content modal-small" @click.stop>
          <div class="success-icon-large">✅</div>
          <h2>Success!</h2>
          <p class="success-message">{{ successMessage }}</p>
          <div class="success-stats" v-if="importStats">
            <div class="stat">
              <span class="stat-label">Laps Imported:</span>
              <span class="stat-value">{{ importStats.laps_imported }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Drivers:</span>
              <span class="stat-value">{{ importStats.drivers_processed }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Session ID:</span>
              <span class="stat-value">#{{ importStats.session_id }}</span>
            </div>
          </div>
          <div class="action-buttons">
            <button class="btn-secondary" @click="closeSuccessModal">
              Close
            </button>
            <button class="btn-primary" @click="uploadAnother">
              Upload Another
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue'
import apiService from '@/services/api'
import { useErrorHandler, getErrorMessage } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler()

interface Track {
  id: number
  name: string
  city: string
  country: string
  eml_supported?: boolean
}

interface Driver {
  id: number
  name: string
}

interface LapPreview {
  position?: number
  driver_name: string
  kart_number?: number
  best_lap_time?: number
  total_laps?: number
}

interface SessionInfo {
  date?: string
  type?: string
}

interface PreviewData {
  track: Track
  laps_count: number
  drivers_detected: number
  laps: LapPreview[]
  session_info: SessionInfo
  temp_path?: string
}

interface ImportStats {
  laps_imported: number
  drivers_processed: number
  session_id: number
}

// Refs
const fileInput: Ref<HTMLInputElement | null> = ref(null)

// State
const activeTab = ref<'upload' | 'manual'>('upload')
const allTracks = ref<Track[]>([])
const drivers = ref<Driver[]>([])
const selectedTrackId = ref('')
const uploadedFile = ref<File | null>(null)
const isDragging = ref(false)
const parsing = ref(false)
const importing = ref(false)
const submittingManual = ref(false)
const previewData = ref<PreviewData | null>(null)
const sessionDate = ref(new Date().toISOString().split('T')[0])
const sessionType = ref('practice')
const showSuccessModal = ref(false)
const successMessage = ref('')
const importStats = ref<ImportStats | null>(null)

// Manual form
const manualForm = ref({
  track_id: '',
  driver_id: '',
  lap_time: null as number | null,
  lap_number: 1,
  kart_number: null as number | null,
  session_date: new Date().toISOString().split('T')[0],
  session_type: 'practice',
  notes: '',
})

// Computed
const emlSupportedTracks = computed(() => 
  allTracks.value.filter(track => track.eml_supported)
)

// Methods
const loadTracks = async () => {
  try {
    const response = await apiService.tracks.getAll()
    allTracks.value = response
  } catch (error: unknown) {
    handleError(error, 'Failed to load tracks')
  }
}

const loadDrivers = async () => {
  try {
    const response = await apiService.drivers.getAll()
    drivers.value = response
  } catch (error: unknown) {
    handleError(error, 'Failed to load drivers')
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadedFile.value = target.files[0]
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    uploadedFile.value = event.dataTransfer.files[0]
  }
}

const removeFile = () => {
  uploadedFile.value = null
  previewData.value = null
}

const resetUpload = () => {
  uploadedFile.value = null
  previewData.value = null
}

const parseFile = async () => {
  if (!uploadedFile.value || !selectedTrackId.value) return

  parsing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('track_id', selectedTrackId.value)

    const response = await apiService.post('/upload/preview', formData)
    
    if (response.data.success) {
      previewData.value = response.data.data
      // Set session date from parsed data if available
      if (previewData.value?.session_info?.date) {
        sessionDate.value = previewData.value.session_info.date
      }
    } else {
      alert('Failed to parse file: ' + (response.data.message || 'Unknown error'))
    }
  } catch (error: unknown) {
    handleError(error, 'Parse error')
    alert('Failed to parse file: ' + getErrorMessage(error))
  } finally {
    parsing.value = false
  }
}

const importData = async () => {
  if (!previewData.value) return

  importing.value = true
  try {
    const response = await apiService.post('/upload/import', {
      track_id: selectedTrackId.value,
      session_date: sessionDate.value,
      session_type: sessionType.value,
      laps: previewData.value.laps,
      temp_path: previewData.value.temp_path,
    })

    if (response.data.success) {
      successMessage.value = response.data.message
      importStats.value = response.data.data
      showSuccessModal.value = true
      resetUpload()
    } else {
      alert('Import failed: ' + (response.data.message || 'Unknown error'))
    }
  } catch (error: unknown) {
    handleError(error, 'Import error')
    alert('Import failed: ' + getErrorMessage(error))
  } finally {
    importing.value = false
  }
}

const cancelImport = () => {
  previewData.value = null
  uploadedFile.value = null
}

const submitManualEntry = async () => {
  submittingManual.value = true
  try {
    const response = await apiService.post('/upload/manual-entry', manualForm.value)

    if (response.data.success) {
      successMessage.value = response.data.message
      importStats.value = null
      showSuccessModal.value = true
      resetManualForm()
    } else {
      alert('Failed to add lap: ' + (response.data.message || 'Unknown error'))
    }
  } catch (error: unknown) {
    handleError(error, 'Manual entry error')
    alert('Failed to add lap: ' + getErrorMessage(error))
  } finally {
    submittingManual.value = false
  }
}

const resetManualForm = () => {
  manualForm.value = {
    track_id: '',
    driver_id: '',
    lap_time: null,
    lap_number: 1,
    kart_number: null,
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'practice',
    notes: '',
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  successMessage.value = ''
  importStats.value = null
}

const uploadAnother = () => {
  closeSuccessModal()
  activeTab.value = 'upload'
  resetUpload()
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadTracks()
  loadDrivers()
})
</script>

<style scoped>
.upload-data {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 2rem;
}

.header-left h1 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 0;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  padding: 1rem 2rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  color: white;
  border-bottom-color: #667eea;
}

.tab-icon {
  font-size: 1.25rem;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Upload Steps */
.upload-step {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.step-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.step-content {
  padding-left: 3.5rem;
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-group small {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.select-input,
.input-field {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.select-input:focus,
.input-field:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.textarea-field {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.textarea-field:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Dropzone */
.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.dropzone:hover,
.dropzone.dragover {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.05);
}

.dropzone.has-file {
  border-color: rgba(72, 187, 120, 0.5);
  background: rgba(72, 187, 120, 0.05);
}

.dropzone-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.dropzone-content h3 {
  color: white;
  margin: 0 0 0.5rem 0;
}

.dropzone-content p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0;
}

.file-types {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 1rem !important;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.file-icon {
  font-size: 2.5rem;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-details h4 {
  color: white;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.file-details p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 0.875rem;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  font-size: 2rem;
}

.summary-content {
  flex: 1;
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
}

/* Preview Table */
.preview-table-container {
  margin-bottom: 2rem;
}

.preview-table-container h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.preview-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-table td {
  padding: 0.875rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.table-input {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
  width: 100%;
}

.table-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
}

/* Buttons */
.btn-primary {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-icon-small {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon-small.danger:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: rgba(245, 101, 101, 0.4);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Spinner */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alerts */
.alert-warning {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(237, 137, 54, 0.1);
  border: 1px solid rgba(237, 137, 54, 0.3);
  border-radius: 12px;
  margin-top: 1rem;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-title {
  font-weight: 600;
  color: #f6ad55;
  margin: 0 0 0.5rem 0;
}

.alert-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  margin: 0;
}

/* Success Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.modal-content {
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-small {
  max-width: 500px;
}

.success-icon-large {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.modal-content h2 {
  color: white;
  margin: 0 0 1rem 0;
}

.success-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.success-stats {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.success-stats .stat {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.success-stats .stat:last-child {
  border-bottom: none;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.stat-value {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Manual Entry Form */
.manual-entry-form {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

.manual-entry-form h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
  }

  .step-content {
    padding-left: 0;
  }
}
</style>
