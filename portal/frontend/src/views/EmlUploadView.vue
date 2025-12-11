<template>
  <div class="eml-upload-view">
    <h1>EML Session Upload</h1>

    <!-- Step 1: File Upload -->
    <div v-if="step === 'upload'" class="upload-section">
      <div class="dropzone" @drop.prevent="handleDrop" @dragover.prevent @dragenter="isDragging = true"
        @dragleave="isDragging = false" :class="{ dragging: isDragging }">
        <input ref="fileInput" type="file" accept=".eml,.txt" @change="handleFileSelect" multiple hidden />
        <div class="dropzone-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>Drag & drop EML files or folders here</p>
          <div class="upload-buttons">
            <button @click="() => { if (fileInput) fileInput.click() }" type="button" class="btn-secondary">
              <span class="icon">📄</span> Upload File
            </button>
            <button @click="selectFolder" type="button" class="btn-primary">
              <span class="icon">📁</span> Upload Folder
            </button>
          </div>
          <small>Single file or batch folder upload supported</small>
          <small>Track and drivers auto-detected from each email</small>
        </div>
      </div>

      <div v-if="uploadError" class="error-message">
        {{ uploadError }}
      </div>
    </div>

    <!-- Batch Upload Progress -->
    <div v-if="step === 'batch-progress' || (loading && batchProgress.total > 0)" class="batch-progress-section">
      <h2>Processing Files</h2>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }"></div>
      </div>
      <p class="progress-text">{{ batchProgress.current }} of {{ batchProgress.total }} files processed</p>
      <p class="current-file">📄 {{ batchProgress.currentFile }}</p>
      <div class="batch-stats">
        <span class="success">✅ {{ batchResults.success }} successful</span>
        <span class="failed">❌ {{ batchResults.failed }} failed</span>
      </div>
      
      <!-- Per-file progress log -->
      <div v-if="batchProgress.fileLog.length > 0" class="file-progress-log">
        <h3>Processing Log:</h3>
        <div class="log-container">
          <div v-for="(log, idx) in batchProgress.fileLog" :key="idx" 
               class="log-entry" 
               :class="{ success: log.status === 'success', failed: log.status === 'failed', processing: log.status === 'processing' }">
            <span class="log-icon">{{ log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : '⏳' }}</span>
            <span class="log-filename">{{ log.filename }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Complete Summary -->
    <div v-if="step === 'batch-complete'" class="batch-complete-section">
      <h2>Batch Upload Complete</h2>
      <div class="summary-stats">
        <div class="stat-card success">
          <div class="stat-number">{{ batchResults.success }}</div>
          <div class="stat-label">Sessions Imported</div>
        </div>
        <div class="stat-card failed">
          <div class="stat-number">{{ batchResults.failed }}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat-card total">
          <div class="stat-number">{{ batchResults.success + batchResults.failed }}</div>
          <div class="stat-label">Total Files</div>
        </div>
      </div>

      <div v-if="batchResults.errors.length > 0" class="error-list">
        <h3>Errors:</h3>
        <ul>
          <li v-for="(error, idx) in batchResults.errors" :key="idx">{{ error }}</li>
        </ul>
      </div>

      <div class="button-group">
        <button @click="resetForm" class="btn-secondary">Upload More</button>
        <button @click="$router.push('/sessions')" class="btn-primary">View Sessions</button>
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
      <div v-if="duplicate?.exists" class="duplicate-warning">
        <h3>⚠️ Duplicate Lap Times Detected</h3>
        <p>A session with similar lap times already exists:</p>
        <ul>
          <li><strong>Original File:</strong> {{ duplicate.original_file || 'Unknown' }}</li>
          <li><strong>Uploaded:</strong> {{ duplicate.upload_date ? new Date(duplicate.upload_date).toLocaleString() : 'Earlier' }}</li>
          <li><strong>Session Date:</strong> {{ new Date(duplicate.session_date).toLocaleString() }}</li>
          <li><strong>Laps:</strong> {{ duplicate.laps_count }}</li>
          <li><strong>Drivers:</strong> {{ duplicate.drivers?.join(', ') }}</li>
        </ul>
        <div class="duplicate-actions">
          <button @click="replaceSession = true; saveSession()" class="btn-danger">
            <span class="icon">🔄</span> Replace Existing Session
          </button>
          <button @click="cancelUpload" class="btn-secondary">
            <span class="icon">✖</span> Cancel Upload
          </button>
        </div>
        <p class="duplicate-note">⚠️ Replacing will permanently delete the old session and all its lap data.</p>
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
              <tr v-for="(lap, index) in lapsData" :key="index" 
                  :class="{ 
                    editing: editingIndex === index,
                    'missing-data': hasMissingData(lap),
                    'warning-row': lap.warning
                  }">
                <td>{{ index + 1 }}</td>
                <td :class="{ 'missing-field': !lap.driver_name }">
                  <input v-if="editingIndex === index" v-model="lap.driver_name" type="text" placeholder="Driver name required" />
                  <span v-else>{{ lap.driver_name || '⚠️ Missing' }}</span>
                </td>
                <td :class="{ 'missing-field': !lap.lap_number }">
                  <input v-if="editingIndex === index" v-model.number="lap.lap_number" type="number" min="1" placeholder="Lap #" />
                  <span v-else>{{ lap.lap_number || '⚠️ Missing' }}</span>
                </td>
                <td :class="{ 'missing-field': !lap.lap_time || lap.lap_time === 0 }">
                  <input v-if="editingIndex === index" v-model.number="lap.lap_time" type="number" step="0.001" placeholder="Time in seconds" />
                  <span v-else>{{ lap.lap_time ? lap.lap_time.toFixed(3) + 's' : '⚠️ Missing' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model.number="lap.position" type="number" min="1" placeholder="Position" />
                  <span v-else>{{ lap.position || '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === index" v-model="lap.kart_number" type="text" placeholder="Kart #" />
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

// Refs
const fileInput = ref<HTMLInputElement | null>(null)

// State
const step = ref<'upload' | 'preview' | 'batch-progress' | 'batch-complete'>('upload')
const selectedTrackId = ref<number | ''>('')
const isDragging = ref(false)
const uploadError = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const saving = ref(false)
const duplicate = ref<any>(null)
const proceedAnyway = ref(false)
const replaceSession = ref(false)
const parsedData = ref<any>(null)
const editingIndex = ref<number | null>(null)
const editBackup = ref<any>(null)

const sessionData = reactive({
  track_name: '',
  session_number: '',
  session_date: '',
  session_type: 'race',
  heat_price: 0,
  file_name: '',
  file_hash: '',
})

const lapsData = ref<any[]>([])
const batchFiles = ref<File[]>([])
const batchProgress = ref({ 
  current: 0, 
  total: 0, 
  currentFile: '',
  fileLog: [] as Array<{ filename: string, status: 'processing' | 'success' | 'failed', message: string }>
})
const batchResults = ref<{ success: number, failed: number, errors: string[] }>({ success: 0, failed: 0, errors: [] })

// Methods
const selectFolder = () => {
  const input = fileInput.value as HTMLInputElement
  input.webkitdirectory = true
  input.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files).filter(f => f.name.endsWith('.eml') || f.name.endsWith('.txt'))
    
    if (files.length === 0) {
      uploadError.value = 'No EML files found in the selected folder'
      return
    }
    
    if (files.length === 1 && files[0]) {
      uploadFile(files[0])
    } else {
      // Batch upload multiple files
      await uploadBatch(files)
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const files = Array.from(event.dataTransfer.files).filter(f => f.name.endsWith('.eml') || f.name.endsWith('.txt'))
    
    if (files.length === 0) {
      uploadError.value = 'No EML files found'
      return
    }
    
    if (files.length === 1 && files[0]) {
      uploadFile(files[0])
    } else {
      await uploadBatch(files)
    }
  }
}

const uploadBatch = async (files: File[]) => {
  step.value = 'batch-progress'
  loading.value = true
  batchFiles.value = files
  batchProgress.value = { current: 0, total: files.length, currentFile: '', fileLog: [] }
  batchResults.value = { success: 0, failed: 0, errors: [] }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    
    batchProgress.value.current = i + 1
    batchProgress.value.currentFile = file.name
    
    // Add processing log entry
    batchProgress.value.fileLog.push({ filename: file.name, status: 'processing', message: 'Processing...' })
    const logIndex = batchProgress.value.fileLog.length - 1
    
    try {
      const response = await apiService.upload.parseEml(file)
      
      // Handle duplicate file (already uploaded before)
      if (response.duplicate_file) {
        const errorMsg = response.message || 'Duplicate file'
        batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
        batchResults.value.failed++
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
        continue
      }
      
      // Handle parsing errors or missing data
      if (!response.success) {
        let errorMsg = 'Parse failed'
        if (response.require_manual_input) {
          errorMsg = `Requires manual input - ${response.errors?.join(', ')}`
          batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
          batchResults.value.failed++
        } else {
          errorMsg = response.errors?.join(', ') || 'Parse failed'
          batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
          batchResults.value.failed++
        }
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
        continue
      }
      
      // Handle duplicate session (show modal for single file, skip for batch)
      if (response.duplicate?.exists) {
        const errorMsg = `Duplicate - Session already exists from '${response.duplicate.original_file || 'unknown file'}' uploaded ${response.duplicate.upload_date || 'earlier'}`
        batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
        batchResults.value.failed++
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
        continue
      }
      
      // Auto-import successful parse
      const saveResponse = await apiService.upload.saveParsedSession({
        track_id: response.track.id,
        session_date: response.data.session_date || new Date().toISOString(),
        session_type: 'race',
        heat_price: 0,
        session_number: response.data.session_number || '',
        file_name: response.file_name,
        file_hash: response.data.file_hash,
        laps: response.data.laps || []
      })
      
      if (saveResponse.success) {
        batchResults.value.success++
        batchProgress.value.fileLog[logIndex] = { 
          filename: file.name, 
          status: 'success', 
          message: `Imported ${response.data.laps?.length || 0} laps`
        }
      } else {
        const errorMsg = `Save failed - ${saveResponse.message || 'Unknown error'}`
        batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
        batchResults.value.failed++
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
      }
      
      // Show warnings if any (but keep status as success)
      if (response.warnings && response.warnings.length > 0) {
        batchResults.value.errors.push(`${file.name}: ⚠️ ${response.warnings.join(', ')}`)
      }
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors?.join(', ') || 
                      error.response?.data?.message || 
                      'Upload failed'
      batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
      batchResults.value.failed++
      batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
    }
  }
  
  loading.value = false
  step.value = 'batch-complete'
}

const uploadFile = async (file: File) => {
  if (!file.name.endsWith('.eml') && !file.name.endsWith('.txt')) {
    uploadError.value = 'Only .eml and .txt files are supported'
    return
  }

  uploadError.value = ''

  try {
    const response = await apiService.upload.parseEml(file)
    
    // Handle duplicate file
    if (response.duplicate_file) {
      uploadError.value = response.message
      duplicate.value = response.existing_upload
      return
    }
    
    // Handle parsing errors
    if (!response.success) {
      if (response.require_manual_input) {
        // Show partial data and allow manual editing
        uploadError.value = `⚠️ Warnings: ${response.errors?.join(', ')}`
        if (response.partial_data) {
          parsedData.value = response.partial_data
          sessionData.track_name = response.track?.name || ''
          selectedTrackId.value = response.track?.id || ''
          sessionData.session_number = response.partial_data.session_number || ''
          sessionData.session_date = response.partial_data.session_date ? 
            new Date(response.partial_data.session_date).toISOString().slice(0, 16) : 
            new Date().toISOString().slice(0, 16)
          sessionData.session_type = 'race'
          sessionData.heat_price = 0
          lapsData.value = response.partial_data.laps || []
          step.value = 'preview'
        }
      } else {
        uploadError.value = response.errors?.join(', ') || 'Parse failed'
      }
      return
    }
    
    // Show warnings if any
    if (response.warnings && response.warnings.length > 0) {
      uploadError.value = `⚠️ ${response.warnings.join(', ')}`
    }
    
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
    
    // Store file metadata for upload tracking
    sessionData.file_name = response.file_name
    sessionData.file_hash = response.data.file_hash
    
    // Populate laps data
    lapsData.value = response.data.laps || []
    
    step.value = 'preview'
  } catch (error: any) {
    const errors = error.response?.data?.errors
    const errorDetails = error.response?.data?.error_details
    
    if (errors) {
      uploadError.value = errors.join(', ')
    } else {
      uploadError.value = error.response?.data?.message || 'Failed to upload file'
    }
    
    if (errorDetails) {
      console.error('Upload error details:', errorDetails)
    }
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

  try {
    const payload = {
      track_id: selectedTrackId.value as number,
      session_date: sessionData.session_date,
      heat_price: sessionData.heat_price,
      session_type: sessionData.session_type,
      session_number: sessionData.session_number,
      file_name: sessionData.file_name,
      file_hash: sessionData.file_hash,
      replace_duplicate: replaceSession.value,
      laps: lapsData.value,
    }

    const response = await apiService.upload.saveParsedSession(payload)

    if (response.success) {
      const action = replaceSession.value ? 'replaced' : 'saved'
      alert(`Session ${action} successfully! ${response.laps_imported} laps imported, ${response.drivers_processed.length} drivers processed.`)
      router.push('/admin/data')
    } else {
      alert('Failed to save session: ' + (response.message || 'Unknown error'))
    }
  } catch (error: any) {
    alert('Failed to save session: ' + (error.response?.data?.message || error.message))
    console.error('Save error:', error)
  } finally {
    saving.value = false
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

const resetForm = () => {
  step.value = 'upload'
  parsedData.value = null
  duplicate.value = null
  proceedAnyway.value = false
  lapsData.value = []
  uploadError.value = ''
  batchFiles.value = []
  batchProgress.value = { current: 0, total: 0, currentFile: '', fileLog: [] }
  batchResults.value = { success: 0, failed: 0, errors: [] }
}

// Helper to check if a lap has missing critical data
const hasMissingData = (lap: any): boolean => {
  return !lap.driver_name || !lap.lap_time || lap.lap_time === 0
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
        display: block;
        margin-top: 0.5rem;
      }

      .upload-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 1.5rem 0 1rem 0;

        button {
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          border: 2px solid var(--border-color);
          background: var(--card-bg);
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;

          &.btn-primary {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);

            &:hover {
              background: var(--primary-hover);
              border-color: var(--primary-hover);
            }
          }

          &.btn-secondary {
            &:hover {
              border-color: var(--primary-color);
              color: var(--primary-color);
            }
          }

          .icon {
            margin-right: 0.5rem;
          }
        }
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

          &.missing-data {
            background: rgba(255, 193, 7, 0.08);
            border-left: 3px solid #ffc107;
          }

          &.warning-row {
            background: rgba(255, 152, 0, 0.05);
          }

          &:hover {
            background: var(--bg-secondary);
          }

          td {
            padding: 0.75rem;

            &.missing-field {
              background: rgba(239, 68, 68, 0.1);
              color: #ef4444;
              font-weight: 600;
              position: relative;

              &::before {
                content: '⚠️';
                margin-right: 0.25rem;
              }
            }

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

// Batch upload sections
.batch-progress-section {
  padding: 2rem;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  text-align: center;

  h2 {
    margin-bottom: 1.5rem;
    color: var(--primary-color);
  }

  .progress-bar {
    width: 100%;
    height: 30px;
    background: var(--border-color);
    border-radius: 15px;
    overflow: hidden;
    margin: 1rem 0;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    font-size: 1rem;
    color: var(--text-color);
    margin: 0.5rem 0;
  }

  .current-file {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .batch-stats {
    display: flex;
    gap: 2rem;
    justify-content: center;
    margin-top: 1.5rem;

    span {
      font-size: 1.1rem;
      font-weight: 600;

      &.success {
        color: #22c55e;
      }

      &.failed {
        color: #ef4444;
      }
    }
  }

  .file-progress-log {
    margin-top: 2rem;
    text-align: left;

    h3 {
      color: var(--text-color);
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .log-container {
      max-height: 400px;
      overflow-y: auto;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 1rem;
    }

    .log-entry {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: var(--card-bg);
      border-radius: 6px;
      border-left: 3px solid transparent;
      transition: all 0.2s ease;

      &.processing {
        border-left-color: #3b82f6;
        
        .log-icon {
          animation: pulse 1.5s ease-in-out infinite;
        }
      }

      &.success {
        border-left-color: #22c55e;
      }

      &.failed {
        border-left-color: #ef4444;
      }

      .log-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .log-filename {
        font-weight: 600;
        color: var(--text-color);
        flex-shrink: 0;
        min-width: 200px;
      }

      .log-message {
        color: var(--text-secondary);
        font-size: 0.9rem;
        flex-grow: 1;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.batch-complete-section {
  padding: 2rem;
  background: var(--card-bg);
  border-radius: var(--border-radius);

  h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--primary-color);
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;

    .stat-card {
      padding: 1.5rem;
      border-radius: var(--border-radius);
      text-align: center;
      background: var(--bg-secondary);

      .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &.success {
        border-left: 4px solid #22c55e;

        .stat-number {
          color: #22c55e;
        }
      }

      &.failed {
        border-left: 4px solid #ef4444;

        .stat-number {
          color: #ef4444;
        }
      }

      &.total {
        border-left: 4px solid var(--primary-color);

        .stat-number {
          color: var(--primary-color);
        }
      }
    }
  }

  .error-list {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;

    h3 {
      color: #ef4444;
      margin-bottom: 1rem;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--text-secondary);

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;

    button {
      padding: 0.75rem 2rem;
      border-radius: var(--border-radius);
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;

      &.btn-primary {
        background: var(--primary-color);
        color: white;

        &:hover {
          background: var(--primary-hover);
        }
      }

      &.btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 2px solid var(--border-color);

        &:hover {
          border-color: var(--primary-color);
        }
      }
    }
  }
}
</style>

