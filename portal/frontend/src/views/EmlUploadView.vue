<template>
  <div class="eml-upload-view">
    <h1>EML Session Upload</h1>

    <!-- Step 1: File Upload -->
    <div v-if="step === 'upload'" class="upload-section">
      <div class="dropzone" @drop.prevent="handleDrop" @dragover.prevent @dragenter="isDragging = true"
        @dragleave="isDragging = false" :class="{ dragging: isDragging }">
        <input ref="fileInput" type="file" accept=".eml,.txt" @change="handleFileSelect" hidden />
        <div class="dropzone-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>Drag & drop EML file here or <button @click="$refs.fileInput.click()" type="button">Browse</button></p>
          <small>Track and driver will be auto-detected from the email</small>
          <small>Supported formats: .eml, .txt</small>
        </div>
      </div>

      <div v-if="uploadError" class="error-message">
        {{ uploadError }}
      </div>
    </div>

    <!-- Step 2: Preview & Edit Parsed Data -->
    <div v-if="step === 'preview'" class="preview-section">
      <div class="preview-header">
        <h2>Parsed Session Data</h2>
        <div class="preview-stats">
          <span class="track-detected">📍 {{ parsedData?.track_name || sessionData.track_name }}</span>
          <span>{{ parsedData?.laps_count || 0 }} laps</span>
          <span>{{ parsedData?.drivers_detected || 0 }} drivers</span>
        </div>
      </div>

      <!-- Duplicate Warning -->
      <div v-if="duplicate" class="duplicate-warning">
        <h3>⚠️ Duplicate Session Detected</h3>
        <p>A similar session already exists:</p>
        <ul>
          <li>Session ID: {{ duplicate.session_id }}</li>
          <li>Date: {{ new Date(duplicate.session_date).toLocaleString() }}</li>
          <li>Laps: {{ duplicate.laps_count }}</li>
          <li>Drivers: {{ duplicate.drivers.join(', ') }}</li>
        </ul>
        <div class="duplicate-actions">
          <button @click="proceedAnyway = true" class="btn-warning">Import Anyway</button>
          <button @click="cancelUpload" class="btn-secondary">Cancel</button>
        </div>
      </div>

      <!-- Session Metadata -->
      <div class="session-metadata">
        <h3>Session Information</h3>
        <div class="metadata-grid">
          <div class="field">
            <label>Track:</label>
            <input v-model="sessionData.track_name" type="text" readonly />
          </div>
          <div class="field">
            <label>Session Number:</label>
            <input v-model="sessionData.session_number" type="text" />
          </div>
          <div class="field">
            <label>Session Date:</label>
            <input v-model="sessionData.session_date" type="datetime-local" />
          </div>
          <div class="field">
            <label>Session Type:</label>
            <select v-model="sessionData.session_type">
              <option value="race">Race</option>
              <option value="practice">Practice</option>
              <option value="qualifying">Qualifying</option>
              <option value="heat">Heat</option>
            </select>
          </div>
          <div class="field">
            <label>Heat Price (€):</label>
            <input v-model.number="sessionData.heat_price" type="number" step="0.01" />
          </div>
        </div>
      </div>

      <!-- Laps Table (Editable) -->
      <div class="laps-table-section">
        <h3>Laps Data <small>({{ lapsData.length }} laps - click to edit)</small></h3>
        
        <div class="table-actions">
          <button @click="addNewLap" class="btn-add">+ Add Lap</button>
          <button @click="sortLapsByDriver" class="btn-secondary">Sort by Driver</button>
          <button @click="sortLapsByPosition" class="btn-secondary">Sort by Position</button>
        </div>

        <div class="table-wrapper">
          <table class="laps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver Name</th>
                <th>Lap #</th>
                <th>Lap Time (s)</th>
                <th>Position</th>
                <th>Kart #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lap, index) in lapsData" :key="index" :class="{ editing: editingIndex === index }">
                <td>{{ index + 1 }}</td>
                <td>
                  <input v-if="editingIndex === index" v-model="lap.driver_name" type="text" />
                  <span v-else>{{ lap.driver_name }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model.number="lap.lap_number" type="number" min="1" />
                  <span v-else>{{ lap.lap_number }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model.number="lap.lap_time" type="number" step="0.001" />
                  <span v-else>{{ lap.lap_time.toFixed(3) }}s</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model.number="lap.position" type="number" min="1" />
                  <span v-else>{{ lap.position || '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model="lap.kart_number" type="text" />
                  <span v-else>{{ lap.kart_number || '-' }}</span>
                </td>
                <td class="actions">
                  <button v-if="editingIndex === index" @click="saveEdit(index)" class="btn-icon btn-success">✓</button>
                  <button v-if="editingIndex === index" @click="cancelEdit" class="btn-icon btn-secondary">✗</button>
                  <button v-else @click="startEdit(index)" class="btn-icon btn-edit">✎</button>
                  <button @click="deleteLap(index)" class="btn-icon btn-danger">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="cancelUpload" class="btn-secondary">Cancel</button>
        <button @click="saveSession" class="btn-primary" :disabled="saving || (duplicate && !proceedAnyway)">
          <span v-if="saving">Saving...</span>
          <span v-else>Save Session</span>
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import apiService from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const step = ref<'upload' | 'preview'>('upload')
const selectedTrackId = ref<number | ''>('')
const isDragging = ref(false)
const uploadError = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const saving = ref(false)
const duplicate = ref<any>(null)
const proceedAnyway = ref(false)
const parsedData = ref<any>(null)
const editingIndex = ref<number | null>(null)
const editBackup = ref<any>(null)

const sessionData = reactive({
  track_name: '',
  session_number: '',
  session_date: '',
  session_type: 'race',
  heat_price: 0,
})

const lapsData = ref<any[]>([])

// Methods - No need to load tracks anymore, auto-detected
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    uploadFile(event.dataTransfer.files[0])
  }
}

const uploadFile = async (file: File) => {
  if (!file.name.endsWith('.eml') && !file.name.endsWith('.txt')) {
    uploadError.value = 'Only .eml and .txt files are supported'
    return
  }

  uploadError.value = ''
  loading.value = true
  loadingMessage.value = 'Auto-detecting track and parsing EML file...'

  try {
    const response = await apiService.upload.parseEml(file)
    
    if (response.success) {
      parsedData.value = response.data
      duplicate.value = response.duplicate
      
      // Populate session data with auto-detected track
      sessionData.track_name = response.track.name
      selectedTrackId.value = response.track.id
      sessionData.session_number = response.data.session_number || ''
      sessionData.session_date = response.data.session_date ? 
        new Date(response.data.session_date).toISOString().slice(0, 16) : 
        new Date().toISOString().slice(0, 16)
      sessionData.session_type = 'race'
      sessionData.heat_price = 0
      
      // Populate laps data
      lapsData.value = response.data.laps || []
      
      step.value = 'preview'
    } else {
      uploadError.value = response.message || 'Failed to parse EML file'
    }
  } catch (error: any) {
    uploadError.value = error.response?.data?.message || 'Failed to upload file'
    console.error('Upload error:', error)
  } finally {
    loading.value = false
  }
}

const addNewLap = () => {
  lapsData.value.push({
    driver_name: '',
    lap_number: lapsData.value.length + 1,
    lap_time: 0,
    position: null,
    kart_number: null,
  })
  startEdit(lapsData.value.length - 1)
}

const startEdit = (index: number) => {
  editingIndex.value = index
  editBackup.value = { ...lapsData.value[index] }
}

const saveEdit = (index: number) => {
  editingIndex.value = null
  editBackup.value = null
}

const cancelEdit = () => {
  if (editingIndex.value !== null && editBackup.value) {
    lapsData.value[editingIndex.value] = editBackup.value
  }
  editingIndex.value = null
  editBackup.value = null
}

const deleteLap = (index: number) => {
  if (confirm('Delete this lap?')) {
    lapsData.value.splice(index, 1)
  }
}

const sortLapsByDriver = () => {
  lapsData.value.sort((a, b) => a.driver_name.localeCompare(b.driver_name))
}

const sortLapsByPosition = () => {
  lapsData.value.sort((a, b) => (a.position || 999) - (b.position || 999))
}

const saveSession = async () => {
  if (lapsData.value.length === 0) {
    alert('No laps to save')
    return
  }

  saving.value = true
  loading.value = true
  loadingMessage.value = 'Saving session...'

  try {
    const payload = {
      track_id: selectedTrackId.value as number,
      session_date: sessionData.session_date,
      heat_price: sessionData.heat_price,
      session_type: sessionData.session_type,
      session_number: sessionData.session_number,
      laps: lapsData.value,
    }

    const response = await apiService.upload.saveParsedSession(payload)

    if (response.success) {
      alert(`Session saved successfully! ${lapsData.value.length} laps imported.`)
      router.push('/admin/data')
    } else {
      alert('Failed to save session: ' + (response.message || 'Unknown error'))
    }
  } catch (error: any) {
    alert('Failed to save session: ' + (error.response?.data?.message || error.message))
    console.error('Save error:', error)
  } finally {
    saving.value = false
    loading.value = false
  }
}

const cancelUpload = () => {
  if (confirm('Cancel upload? All data will be lost.')) {
    step.value = 'upload'
    parsedData.value = null
    duplicate.value = null
    proceedAnyway.value = false
    lapsData.value = []
    uploadError.value = ''
  }
}
</script>

<style scoped lang="scss">
.eml-upload-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    margin-bottom: 2rem;
    color: var(--primary-color);
  }
}

.upload-section {
  .dropzone {
    border: 3px dashed var(--border-color);
    border-radius: var(--border-radius);
    padding: 3rem;
    text-align: center;
    background: var(--card-bg);
    transition: all 0.3s ease;
    cursor: pointer;

    &.dragging {
      border-color: var(--primary-color);
      background: rgba(var(--primary-color-rgb), 0.1);
    }

    &:hover {
      border-color: var(--primary-color);
    }

    .dropzone-content {
      svg {
        color: var(--primary-color);
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;

        button {
          color: var(--primary-color);
          text-decoration: underline;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          padding: 0;

          &:hover {
            color: var(--primary-hover);
          }
        }
      }

      small {
        color: var(--text-secondary);
      }
    }
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--error-bg);
    color: var(--error-color);
    border-radius: var(--border-radius);
    border-left: 4px solid var(--error-color);
  }
}

.preview-section {
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--border-color);

    h2 {
      color: var(--primary-color);
    }

    .preview-stats {
      display: flex;
      gap: 2rem;

      span {
        padding: 0.5rem 1rem;
        background: var(--card-bg);
        border-radius: var(--border-radius);
        font-weight: 600;

        &.track-detected {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      }
    }
  }

  .duplicate-warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;

    h3 {
      color: #856404;
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 0.5rem;
    }

    ul {
      margin: 1rem 0;
      padding-left: 2rem;

      li {
        margin: 0.5rem 0;
      }
    }

    .duplicate-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
  }

  .session-metadata {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin-bottom: 2rem;

    h3 {
      margin-bottom: 1rem;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;

      .field {
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        input,
        select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 1rem;
          background: var(--bg-color);
          color: var(--text-color);

          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }

          &:read-only {
            background: var(--bg-secondary);
            cursor: not-allowed;
          }
        }
      }
    }
  }

  .laps-table-section {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin-bottom: 2rem;

    h3 {
      margin-bottom: 1rem;

      small {
        color: var(--text-secondary);
        font-weight: normal;
      }
    }

    .table-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .laps-table {
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

          &.editing {
            background: rgba(var(--primary-color-rgb), 0.05);
          }

          &:hover {
            background: var(--bg-secondary);
          }

          td {
            padding: 0.75rem;

            input {
              width: 100%;
              padding: 0.5rem;
              border: 2px solid var(--border-color);
              border-radius: 4px;
              background: var(--bg-color);
              color: var(--text-color);

              &:focus {
                outline: none;
                border-color: var(--primary-color);
              }
            }

            &.actions {
              display: flex;
              gap: 0.5rem;
            }
          }
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
}

.btn-primary,
.btn-secondary,
.btn-warning,
.btn-add,
.btn-icon {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;

  &:hover:not(:disabled) {
    background: var(--primary-hover);
  }
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-color);

  &:hover {
    background: var(--border-color);
  }
}

.btn-warning {
  background: #ffc107;
  color: #000;

  &:hover {
    background: #ffb300;
  }
}

.btn-add {
  background: var(--success-color);
  color: white;

  &:hover {
    opacity: 0.9;
  }
}

.btn-icon {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;

  &.btn-success {
    background: var(--success-color);
    color: white;
  }

  &.btn-danger {
    background: var(--error-color);
    color: white;
  }

  &.btn-edit {
    background: var(--primary-color);
    color: white;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 1rem;
    color: white;
    font-size: 1.1rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
