<template>
  <div class="eml-upload-view">
    <h1>EML Session Upload</h1>

    <!-- Step 1: File Upload -->
    <div v-if="step === 'upload'" class="upload-section">
      <div class="mode-selector">
        <button @click="entryMode = 'file'" :class="{ active: entryMode === 'file' }" class="mode-btn">
          📧 File Upload
        </button>
        <button @click="entryMode = 'manual'" :class="{ active: entryMode === 'manual' }" class="mode-btn">
          ✏️ Manual Entry
        </button>
      </div>

      <div v-if="entryMode === 'file'" class="dropzone" @drop.prevent="handleDrop" @dragover.prevent @dragenter="isDragging = true"
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
          <div class="force-track" style="margin-top:10px;">
            <label style="display:flex;align-items:center;gap:8px;">
              <input type="checkbox" v-model="forceTrack" />
              <span>Force track for all files</span>
            </label>
            <div v-if="forceTrack" style="margin-top:6px;">
              <select v-model="forcedTrackId">
                <option value="">Select track to force</option>
                <option v-for="track in availableTracks" :key="track.id" :value="track.id">{{ track.name }} - {{ track.city }}</option>
              </select>
            </div>
          </div>
          <small>Single file or batch folder upload supported</small>
          <small>Track and drivers auto-detected from each email</small>
        </div>
      </div>

      <!-- Manual Entry Form -->
      <div v-else class="manual-entry-section">
        <div class="manual-header">
          <div>
            <h2>✏️ Manual Lap Entry</h2>
            <p class="hint">For sessions without email data - enter laps directly</p>
          </div>
        </div>
        
        <div class="manual-form">
          <div class="session-info-card">
            <h3>📍 Session Information</h3>
            <div class="form-grid">
              <div class="field full-width">
                <label>Track <span class="required">*</span></label>
                <select v-model="manualSession.track_id" required>
                  <option value="" disabled>Select Track</option>
                  <option v-for="track in availableTracks" :key="track.id" :value="track.id">
                    {{ track.name }} - {{ track.city }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Session Date <span class="required">*</span></label>
                <input v-model="manualSession.session_date" type="datetime-local" required />
              </div>
              <div class="field">
                <label>Session Type</label>
                <select v-model="manualSession.session_type">
                  <option value="race">Race</option>
                  <option value="practice">Practice</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="heat">Heat</option>
                </select>
              </div>
              <div class="field">
                <label>Heat Price (€)</label>
                <input v-model.number="manualSession.heat_price" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div class="quick-lap-entry">
            <div class="entry-header">
              <h3>⚡ Quick Add Lap</h3>
              <p class="entry-hint">Type driver name, lap time, and hit Add. Lap number auto-increments!</p>
            </div>
            <div class="lap-form">
              <div class="form-section primary-fields">
                <div class="field-group required driver-field">
                  <label>Driver Name</label>
                  <div class="autocomplete-wrapper">
                    <input 
                      v-model="quickLap.driver_name" 
                      @input="searchDrivers"
                      @focus="showDriverSuggestions = true"
                      @blur="hideDriverSuggestions"
                      type="text" 
                      placeholder="Start typing driver name..." 
                      autocomplete="off"
                    />
                    <div v-if="showDriverSuggestions && driverSuggestions.length > 0" class="suggestions-dropdown">
                      <div 
                        v-for="driver in driverSuggestions" 
                        :key="driver.id" 
                        @click="selectDriver(driver)"
                        class="suggestion-item"
                      >
                        {{ driver.name }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="field-group">
                  <label>Lap #</label>
                  <input v-model.number="quickLap.lap_number" type="number" min="1" placeholder="1" />
                </div>
                <div class="field-group required">
                  <label>Lap Time</label>
                  <input v-model="quickLap.lap_time" type="text" placeholder="1:23.456 or 83.456" />
                </div>
                <div class="field-group">
                  <label>Position</label>
                  <input v-model.number="quickLap.position" type="number" min="1" placeholder="P1" />
                </div>
                <div class="field-group">
                  <label>Kart #</label>
                  <input v-model="quickLap.kart_number" type="text" placeholder="12" />
                </div>
              </div>
              
              <div class="form-section secondary-fields">
                <div class="field-group">
                  <label>Sector 1 <span class="optional">(optional)</span></label>
                  <input v-model.number="quickLap.sector1" type="number" step="0.001" placeholder="20.123" />
                </div>
                <div class="field-group">
                  <label>Sector 2 <span class="optional">(optional)</span></label>
                  <input v-model.number="quickLap.sector2" type="number" step="0.001" placeholder="25.456" />
                </div>
                <div class="field-group">
                  <label>Sector 3 <span class="optional">(optional)</span></label>
                  <input v-model.number="quickLap.sector3" type="number" step="0.001" placeholder="22.789" />
                </div>
                <div class="field-group add-button-wrapper">
                  <button @click="addManualLap" class="btn-add-lap">
                    <span class="plus-icon">+</span>
                    <span>Add Lap</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="manualLaps.length > 0" class="manual-laps-preview">
            <h3>📋 Laps to Import ({{ manualLaps.length }})</h3>
            <div class="laps-list">
              <div v-for="(lap, idx) in manualLaps" :key="idx" class="lap-item">
                <span class="lap-index">{{ idx + 1 }}</span>
                <span class="lap-driver">{{ lap.driver_name }}</span>
                <span class="lap-number">L{{ lap.lap_number }}</span>
                <span class="lap-time">{{ formatLapTime(lap.lap_time) }}</span>
                <span class="lap-pos">{{ lap.position ? `P${lap.position}` : '-' }}</span>
                <span class="lap-kart">{{ lap.kart_number ? `#${lap.kart_number}` : '-' }}</span>
                <span class="lap-sectors">
                  {{ lap.sector1 || lap.sector2 || lap.sector3 ? 
                     `S: ${lap.sector1?.toFixed(3) || '-'}/${lap.sector2?.toFixed(3) || '-'}/${lap.sector3?.toFixed(3) || '-'}` : 
                     'No sectors' }}
                </span>
                <button @click="removeManualLap(idx)" class="btn-remove">×</button>
              </div>
            </div>
            <div class="manual-actions">
              <button @click="clearManualLaps" class="btn-secondary">Clear All</button>
              <button @click="saveManualSession" class="btn-primary" :disabled="!manualSession.track_id || !manualSession.session_date">
                Save {{ manualLaps.length }} Laps
              </button>
            </div>
          </div>
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
               :class="{ 
                 success: log.status === 'success',
                 uploaded: log.status === 'uploaded',
                 'uploaded-incomplete': log.status === 'uploaded-incomplete',
                 failed: log.status === 'failed',
                 processing: log.status === 'processing'
               }">
            <span class="log-icon">{{ 
              log.status === 'success' ? '✅' :
              log.status === 'uploaded' ? '🔵' :
              log.status === 'uploaded-incomplete' ? '🟡' :
              log.status === 'failed' ? '❌' : '⏳' 
            }}</span>
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
        <div class="stat-card duplicates">
          <div class="stat-number">{{ batchResults.duplicates?.length || 0 }}</div>
          <div class="stat-label">Duplicates</div>
        </div>
        <div class="stat-card total">
          <div class="stat-number">{{ batchProgress.total }}</div>
          <div class="stat-label">Total Files</div>
        </div>
      </div>

      <!-- Duplicates List (Blue) -->
      <div v-if="batchResults.duplicates && batchResults.duplicates.length > 0" class="duplicates-list">
        <h3>Duplicate Files</h3>
        <p>These files were already uploaded previously:</p>
        <ul>
          <li v-for="(dup, idx) in batchResults.duplicates" :key="idx">{{ dup }}</li>
        </ul>
      </div>

      <!-- Incomplete/Missing Data List (Yellow) -->
      <div v-if="batchResults.incompleteData && batchResults.incompleteData.length > 0" class="incomplete-list">
        <h3>Missing Data</h3>
        <p>These files were uploaded but have incomplete or missing lap data:</p>
        <ul>
          <li v-for="(incomplete, idx) in batchResults.incompleteData" :key="idx">{{ incomplete }}</li>
        </ul>
      </div>

      <!-- Actual Errors List (Red) -->
      <div v-if="batchResults.errors.length > 0" class="error-list">
        <h3>Errors</h3>
        <p>These files failed to process:</p>
        <ul>
          <li v-for="(error, idx) in batchResults.errors" :key="idx">{{ error }}</li>
        </ul>
      </div>

      <!-- Failed Auto-Detection - Manual Track Selection Needed -->
      <div v-if="batchResults.failedAutoDetection && batchResults.failedAutoDetection.length > 0" class="manual-track-selection">
        <h3>⚠️ Manual Track Selection Required</h3>
        <p>These files could not auto-detect the track. Please select the track manually:</p>
        <div v-for="(failedFile, idx) in batchResults.failedAutoDetection" :key="idx" class="failed-file-card">
          <div class="failed-file-header">
            <strong>📄 {{ failedFile.fileName }}</strong>
          </div>
          <div class="failed-file-actions">
            <label>Select Track:</label>
            <select v-model="failedFile.selectedTrackId" class="track-select">
              <option value="" disabled>Choose a track</option>
              <option v-for="track in failedFile.availableTracks" :key="track.id" :value="track.id">
                {{ track.name }} - {{ track.city }}
              </option>
            </select>
            <button 
              @click="retryFileWithTrack(failedFile, failedFile.selectedTrackId)" 
              :disabled="!failedFile.selectedTrackId"
              class="btn-primary btn-small">
              Retry Upload
            </button>
          </div>
        </div>
      </div>

      <!-- Uploaded Laps Review -->
      <div v-if="batchLaps.length > 0" class="laps-table-section">
        <div class="laps-header">
          <h3>Uploaded Laps <small>({{ batchLaps.length }} laps total)</small></h3>
          <div class="pagination-info">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }}-{{ Math.min(currentPage * pageSize, batchLaps.length) }} of {{ batchLaps.length }}
          </div>
        </div>
        
        <div class="table-actions">
          <div class="pagination-controls">
            <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1" class="btn-page">« Prev</button>
            <span class="page-indicator">Page {{ currentPage }} of {{ Math.ceil(batchLaps.length / pageSize) }}</span>
            <button @click="currentPage = Math.min(Math.ceil(batchLaps.length / pageSize), currentPage + 1)" :disabled="currentPage === Math.ceil(batchLaps.length / pageSize)" class="btn-page">Next »</button>
            <select v-model.number="pageSize" @change="currentPage = 1" class="page-size-select">
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
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
                <th>Sector 1</th>
                <th>Sector 2</th>
                <th>Sector 3</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lap, index) in batchLaps.slice((currentPage - 1) * pageSize, currentPage * pageSize)" :key="index">
                <td>{{ ((currentPage - 1) * pageSize) + index + 1 }}</td>
                <td>{{ lap.driver_name || '-' }}</td>
                <td>{{ lap.lap_number || '-' }}</td>
                <td>{{ lap.lap_time ? lap.lap_time.toFixed(3) + 's' : '-' }}</td>
                <td>{{ lap.position || '-' }}</td>
                <td>{{ lap.kart_number || '-' }}</td>
                <td>{{ lap.sector1 ? lap.sector1.toFixed(3) + 's' : '-' }}</td>
                <td>{{ lap.sector2 ? lap.sector2.toFixed(3) + 's' : '-' }}</td>
                <td>{{ lap.sector3 ? lap.sector3.toFixed(3) + 's' : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="button-group">
        <button @click="resetForm" class="btn-secondary">Upload More</button>
        <button @click="$router.push('/sessions')" class="btn-primary">View All Sessions</button>
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
        <div class="laps-header">
          <h3>Laps Data <small>({{ lapsData.length }} laps total)</small></h3>
          <div class="pagination-info">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }}-{{ Math.min(currentPage * pageSize, lapsData.length) }} of {{ lapsData.length }}
          </div>
        </div>
        
        <div class="table-actions">
          <button @click="addNewLap" class="btn-add">+ Add Lap</button>
          <button @click="sortLapsByDriver" class="btn-secondary">Sort by Driver</button>
          <button @click="sortLapsByPosition" class="btn-secondary">Sort by Position</button>
          <div class="pagination-controls">
            <button @click="prevPage" :disabled="currentPage === 1" class="btn-page">« Prev</button>
            <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-page">Next »</button>
            <select v-model.number="pageSize" class="page-size-select">
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
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
                <th>Sector 1</th>
                <th>Sector 2</th>
                <th>Sector 3</th>
                <th>Gap to Best</th>
                <th>Interval</th>
                <th>Gap to Prev</th>
                <th>Avg Speed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lap, index) in paginatedLaps" :key="index" 
                  :class="{ 
                    editing: editingIndex === getGlobalIndex(index),
                    'missing-data': hasMissingData(lap),
                    'warning-row': lap.warning
                  }">
                <td>{{ index + 1 }}</td>
                <td :class="{ 'missing-field': !lap.driver_name }">
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model="lap.driver_name" type="text" placeholder="Driver name required" />
                  <span v-else>{{ lap.driver_name || '⚠️ Missing' }}</span>
                </td>
                <td :class="{ 'missing-field': !lap.lap_number }">
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.lap_number" type="number" min="1" placeholder="Lap #" />
                  <span v-else>{{ lap.lap_number || '⚠️ Missing' }}</span>
                </td>
                <td :class="{ 'missing-field': !lap.lap_time || lap.lap_time === 0 }">
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.lap_time" type="number" step="0.001" placeholder="Time in seconds" />
                  <span v-else>{{ lap.lap_time ? lap.lap_time.toFixed(3) + 's' : '⚠️ Missing' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.position" type="number" min="1" placeholder="Position" />
                  <span v-else>{{ lap.position || '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model="lap.kart_number" type="text" placeholder="Kart #" />
                  <span v-else>{{ lap.kart_number || '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.sector1" type="number" step="0.001" placeholder="S1" />
                  <span v-else>{{ lap.sector1 ? lap.sector1.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.sector2" type="number" step="0.001" placeholder="S2" />
                  <span v-else>{{ lap.sector2 ? lap.sector2.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.sector3" type="number" step="0.001" placeholder="S3" />
                  <span v-else>{{ lap.sector3 ? lap.sector3.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.gap_to_best_lap" type="number" step="0.001" placeholder="Gap" />
                  <span v-else>{{ lap.gap_to_best_lap ? lap.gap_to_best_lap.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.interval" type="number" step="0.001" placeholder="Interval" />
                  <span v-else>{{ lap.interval ? lap.interval.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.gap_to_previous" type="number" step="0.001" placeholder="Gap Prev" />
                  <span v-else>{{ lap.gap_to_previous ? lap.gap_to_previous.toFixed(3) + 's' : '-' }}</span>
                </td>
                <td>
                  <input v-if="editingIndex === getGlobalIndex(index)" v-model.number="lap.avg_speed" type="number" step="0.1" placeholder="Speed" />
                  <span v-else>{{ lap.avg_speed ? lap.avg_speed.toFixed(1) + ' km/h' : '-' }}</span>
                </td>
                <td class="actions">
                  <button v-if="editingIndex === getGlobalIndex(index)" @click="saveEdit(getGlobalIndex(index))" class="btn-icon btn-success">✓</button>
                  <button v-if="editingIndex === getGlobalIndex(index)" @click="cancelEdit" class="btn-icon btn-secondary">✗</button>
                  <button v-else @click="startEdit(getGlobalIndex(index))" class="btn-icon btn-edit">✎</button>
                  <button @click="deleteLap(getGlobalIndex(index))" class="btn-icon btn-danger">🗑</button>
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

    <!-- Loading Overlay (only show when not in batch progress) -->
    <div v-if="loading && step !== 'batch-progress'" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- New Drivers Connection Modal -->
    <div v-if="showNewDriversModal" class="modal-overlay" @click.self="closeNewDriversModal">
      <div class="modal new-drivers-modal">
        <div class="modal-header">
          <h2>🆕 New Drivers Detected</h2>
          <button @click="closeNewDriversModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">The following new drivers were created from the upload. Connect them to user accounts:</p>
          
          <div class="new-drivers-list">
            <div v-for="driver in newDriversCreated" :key="driver.id" class="new-driver-item">
              <div class="driver-info-section">
                <div class="driver-name-badge">
                  <span class="driver-icon">🏎️</span>
                  <strong>{{ driver.name }}</strong>
                </div>
              </div>
              
              <div class="user-selection">
                <select v-model="driverUserConnections[driver.id]" class="user-select">
                  <option value="">Select user...</option>
                  <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                    {{ user.name }} ({{ user.email }})
                  </option>
                </select>
                <button 
                  @click="connectNewDriver(driver.id)" 
                  :disabled="!driverUserConnections[driver.id] || connectingDriver === driver.id"
                  class="btn-sm btn-connect"
                >
                  {{ connectingDriver === driver.id ? 'Connecting...' : 'Connect' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="skipNewDrivers" class="btn-secondary">Skip</button>
          <button @click="closeNewDriversModal" class="btn-primary">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
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
  fileLog: [] as Array<{ filename: string, status: 'processing' | 'success' | 'uploaded' | 'uploaded-incomplete' | 'failed', message: string }>
})
const batchResults = ref<{ success: number, failed: number, errors: string[], duplicates: string[], incompleteData: string[], savedSessionIds: number[], failedAutoDetection: Array<{ file: File, fileName: string, availableTracks: any[], fileContent?: string, selectedTrackId?: number }> }>({ 
  success: 0, 
  failed: 0, 
  errors: [], 
  duplicates: [], 
  incompleteData: [],
  savedSessionIds: [],
  failedAutoDetection: []
})
const batchLaps = ref<any[]>([])

// Manual entry mode
const entryMode = ref<'file' | 'manual'>('file')
const availableTracks = ref<any[]>([])
const forceTrack = ref(false)
const forcedTrackId = ref<number | ''>('')
const manualSession = reactive({
  track_id: '' as number | '',
  session_date: '',
  session_type: 'race',
  heat_price: 0,
})
const quickLap = reactive({
  driver_name: '',
  lap_number: 1,
  lap_time: '',
  position: null as number | null,
  kart_number: '',
  sector1: null as number | null,
  sector2: null as number | null,
  sector3: null as number | null,
})
const manualLaps = ref<any[]>([])

// Driver autocomplete
const allDrivers = ref<any[]>([])
const driverSuggestions = ref<any[]>([])
const showDriverSuggestions = ref(false)

// New drivers connection
const showNewDriversModal = ref(false)
const newDriversCreated = ref<any[]>([])
const availableUsers = ref<any[]>([])
const driverUserConnections = ref<Record<number, number | ''>>({})
const connectingDriver = ref<number | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(50)
const totalPages = computed(() => Math.ceil(lapsData.value.length / pageSize.value))
const paginatedLaps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return lapsData.value.slice(start, end)
})

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
  batchResults.value = { success: 0, failed: 0, errors: [], duplicates: [], incompleteData: [], savedSessionIds: [], failedAutoDetection: [] }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    
    batchProgress.value.current = i + 1
    batchProgress.value.currentFile = file.name
    
    // Add processing log entry
    batchProgress.value.fileLog.push({ filename: file.name, status: 'processing', message: 'Processing...' })
    const logIndex = batchProgress.value.fileLog.length - 1
    
    try {
      const trackIdToSend = forceTrack.value && forcedTrackId.value ? Number(forcedTrackId.value) : undefined
      const response = await apiService.upload.parseEml(file, trackIdToSend)
      
      // Handle duplicate file (already uploaded before)
      if (response.duplicate_file) {
        // Check if the duplicate has missing data
        const hasMissingData = response.existing_upload && 
          (response.existing_upload.status === 'partial' || 
           response.existing_upload.laps_count === 0)
        
        const status = hasMissingData ? 'uploaded-incomplete' : 'uploaded'
        const errorMsg = hasMissingData 
          ? `Already uploaded (${response.existing_upload.upload_date}) - has missing data`
          : response.message || 'Already uploaded'
        
        // Add to duplicates or incomplete data arrays (not errors)
        if (hasMissingData) {
          batchResults.value.incompleteData.push(file.name)
        } else {
          batchResults.value.duplicates.push(file.name)
        }
        
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status, message: errorMsg }
        continue
      }
      
      // Handle parsing errors or missing data
      if (!response.success) {
        let errorMsg = 'Parse failed'
        if (response.errors && response.errors.length > 0) {
          errorMsg = response.errors.join(', ')
        } else if (response.require_manual_input) {
          errorMsg = 'Requires manual input - incomplete data'
        }
        
        // If it's a track auto-detection failure, store it for manual selection
        if (response.require_manual_input && response.available_tracks) {
          batchResults.value.failedAutoDetection.push({
            file: file,
            fileName: file.name,
            availableTracks: response.available_tracks,
            fileContent: response.file_content
          })
          batchProgress.value.fileLog[logIndex] = { 
            filename: file.name, 
            status: 'failed', 
            message: 'Track auto-detection failed - manual selection needed' 
          }
        } else {
          batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
          batchResults.value.failed++
          batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
        }
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
        if (saveResponse.session_id) {
          batchResults.value.savedSessionIds.push(saveResponse.session_id)
        }
        // Store laps for review
        if (response.data.laps) {
          batchLaps.value.push(...response.data.laps)
        }
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
      console.error('Upload error for', file.name, error)
      
      // Check if this is a duplicate file error (409 status)
      if (error.response?.status === 409 && error.response?.data?.duplicate_file) {
        const responseData = error.response.data
        const hasMissingData = responseData.existing_upload && 
          (responseData.existing_upload.status === 'partial' || 
           responseData.existing_upload.laps_count === 0)
        
        const status = hasMissingData ? 'uploaded-incomplete' : 'uploaded'
        const errorMsg = hasMissingData 
          ? `Already uploaded (${responseData.existing_upload.upload_date}) - has missing data`
          : responseData.message || 'Already uploaded'
        
        // Add to duplicates or incomplete data arrays (not errors)
        if (hasMissingData) {
          batchResults.value.incompleteData.push(file.name)
        } else {
          batchResults.value.duplicates.push(file.name)
        }
        
        batchProgress.value.fileLog[logIndex] = { filename: file.name, status, message: errorMsg }
        continue
      }
      
      let errorMsg = 'Upload failed'
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          errorMsg = Array.isArray(error.response.data.errors) 
            ? error.response.data.errors.join(', ')
            : JSON.stringify(error.response.data.errors)
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message
        }
      } else if (error.message) {
        errorMsg = error.message
      }
      
      batchResults.value.errors.push(`${file.name}: ${errorMsg}`)
      batchResults.value.failed++
      batchProgress.value.fileLog[logIndex] = { filename: file.name, status: 'failed', message: errorMsg }
    }
  }
  
  loading.value = false
  step.value = 'batch-complete'
}

const retryFileWithTrack = async (failedFile: any, trackId: number | undefined) => {
  if (!trackId) {
    alert('Please select a track first')
    return
  }
  
  try {
    loading.value = true
    loadingMessage.value = `Retrying ${failedFile.fileName} with selected track...`
    
    const response = await apiService.upload.parseEml(failedFile.file, trackId)
    
    if (response.success && response.data) {
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
        alert(`✅ Successfully imported ${failedFile.fileName} with ${response.data.laps?.length || 0} laps!`)
        
        // Remove from failedAutoDetection list
        batchResults.value.failedAutoDetection = batchResults.value.failedAutoDetection.filter(
          f => f.fileName !== failedFile.fileName
        )
        
        // Update success count
        batchResults.value.success++
        
        // Store laps for review
        if (response.data.laps) {
          batchLaps.value.push(...response.data.laps)
        }
      } else {
        alert(`Failed to save ${failedFile.fileName}: ${saveResponse.message || 'Unknown error'}`)
      }
    } else {
      alert(`Failed to parse ${failedFile.fileName}: ${response.errors?.join(', ') || 'Unknown error'}`)
    }
  } catch (error: any) {
    console.error('Retry error:', error)
    alert(`Error retrying ${failedFile.fileName}: ${error.message || 'Unknown error'}`)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const uploadFile = async (file: File) => {
  if (!file.name.endsWith('.eml') && !file.name.endsWith('.txt')) {
    uploadError.value = 'Only .eml and .txt files are supported'
    return
  }

  uploadError.value = ''

  try {
    const trackIdToSend = forceTrack.value && forcedTrackId.value ? Number(forcedTrackId.value) : undefined
    const response = await apiService.upload.parseEml(file, trackIdToSend)
    
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
      
      // Check if new drivers were created
      if (response.new_drivers_created && response.new_drivers_created.length > 0) {
        newDriversCreated.value = response.new_drivers_created
        driverUserConnections.value = {}
        await loadAvailableUsers()
        showNewDriversModal.value = true
      } else {
        alert(`Session ${action} successfully! ${response.laps_imported} laps imported, ${response.drivers_processed.length} drivers processed.`)
        router.push('/admin/data')
      }
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
  batchResults.value = { success: 0, failed: 0, errors: [], duplicates: [], incompleteData: [], savedSessionIds: [], failedAutoDetection: [] }
  batchLaps.value = []
}

const viewUploadedLaps = () => {
  // Redirect to sessions view where user can see and edit the uploaded sessions
  router.push({
    path: '/sessions',
    query: { recent: 'true', ids: batchResults.value.savedSessionIds.join(',') }
  })
}

// Helper to check if a lap has missing critical data
const hasMissingData = (lap: any): boolean => {
  return !lap.driver_name || !lap.lap_time || lap.lap_time === 0
}

// Pagination methods
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const getGlobalIndex = (pageIndex: number): number => {
  return (currentPage.value - 1) * pageSize.value + pageIndex
}

// Manual entry methods
const addManualLap = () => {
  if (!quickLap.driver_name || !quickLap.lap_time) {
    alert('Driver name and lap time are required')
    return
  }
  
  // Parse lap time
  let lapTimeSeconds = 0
  const timeStr = quickLap.lap_time.trim()
  
  // MM:SS.mmm format
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    const min = parts[0]
    const sec = parts[1]
    if (min && sec) {
      lapTimeSeconds = parseInt(min) * 60 + parseFloat(sec)
    }
  } else {
    // SS.mmm format
    lapTimeSeconds = parseFloat(timeStr)
  }
  
  if (isNaN(lapTimeSeconds) || lapTimeSeconds <= 0) {
    alert('Invalid lap time format. Use MM:SS.mmm or SS.mmm')
    return
  }
  
  manualLaps.value.push({
    driver_name: quickLap.driver_name,
    lap_number: quickLap.lap_number || 1,
    lap_time: lapTimeSeconds,
    position: quickLap.position,
    kart_number: quickLap.kart_number,
    sector1: quickLap.sector1,
    sector2: quickLap.sector2,
    sector3: quickLap.sector3,
  })
  
  // Auto-increment lap number for next entry (keep driver name)
  quickLap.lap_number++
  quickLap.lap_time = ''
  quickLap.position = null
  quickLap.kart_number = ''
  quickLap.sector1 = null
  quickLap.sector2 = null
  quickLap.sector3 = null
}

const removeManualLap = (index: number) => {
  manualLaps.value.splice(index, 1)
}

const clearManualLaps = () => {
  if (confirm('Clear all laps?')) {
    manualLaps.value = []
  }
}

const formatLapTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60)
  const sec = (seconds % 60).toFixed(3)
  return min > 0 ? `${min}:${sec.padStart(6, '0')}` : `${sec}s`
}

const saveManualSession = async () => {
  if (!manualSession.track_id || !manualSession.session_date) {
    alert('Track and session date are required')
    return
  }
  
  if (manualLaps.value.length === 0) {
    alert('Add at least one lap')
    return
  }
  
  saving.value = true
  
  try {
    const response = await apiService.upload.saveParsedSession({
      track_id: manualSession.track_id,
      session_date: manualSession.session_date,
      session_type: manualSession.session_type,
      heat_price: manualSession.heat_price,
      session_number: '',
      file_name: 'Manual Entry',
      file_hash: `manual_${Date.now()}`,
      laps: manualLaps.value
    })
    
    if (response.success) {
      alert(`✅ Session saved! ${manualLaps.value.length} laps imported.`)
      // Reset form
      manualSession.track_id = ''
      manualSession.session_date = ''
      manualSession.session_type = 'race'
      manualSession.heat_price = 0
      manualLaps.value = []
      quickLap.driver_name = ''
      quickLap.lap_number = 1
      router.push('/sessions')
    } else {
      alert('Failed to save session: ' + (response.message || 'Unknown error'))
    }
  } catch (error: any) {
    console.error('Save error:', error)
    alert('Error saving session: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

// Load available tracks and drivers on mount
onMounted(async () => {
  try {
    availableTracks.value = await apiService.getTracks()
    // Load all drivers for autocomplete
    allDrivers.value = await apiService.getDrivers()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

// Driver autocomplete with fuzzy search
const searchDrivers = () => {
  const query = quickLap.driver_name.toLowerCase().trim()
  
  if (!query || query.length < 2) {
    driverSuggestions.value = []
    return
  }
  
  // Fuzzy search: match if query chars appear in order in driver name
  driverSuggestions.value = allDrivers.value
    .filter(driver => {
      const name = driver.name.toLowerCase()
      let queryIndex = 0
      
      for (let i = 0; i < name.length && queryIndex < query.length; i++) {
        if (name[i] === query[queryIndex]) {
          queryIndex++
        }
      }
      
      return queryIndex === query.length
    })
    .slice(0, 8) // Limit to 8 suggestions
}

const selectDriver = (driver: any) => {
  quickLap.driver_name = driver.name
  showDriverSuggestions.value = false
}

const hideDriverSuggestions = () => {
  setTimeout(() => {
    showDriverSuggestions.value = false
  }, 200)
}

// New drivers connection modal functions
const loadAvailableUsers = async () => {
  try {
    const users = await apiService.adminUsers.getAll()
    availableUsers.value = users
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const connectNewDriver = async (driverId: number) => {
  const userId = driverUserConnections.value[driverId]
  if (!userId) return

  connectingDriver.value = driverId
  try {
    await apiService.adminUsers.connectDriver(userId, driverId)
    alert('Driver connected successfully!')
    // Remove from list
    newDriversCreated.value = newDriversCreated.value.filter(d => d.id !== driverId)
    delete driverUserConnections.value[driverId]
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to connect driver')
  } finally {
    connectingDriver.value = null
  }
}

const closeNewDriversModal = () => {
  showNewDriversModal.value = false
  router.push('/admin/data')
}

const skipNewDrivers = () => {
  if (confirm('Skip connecting these drivers? You can connect them later from User Management.')) {
    closeNewDriversModal()
  }
}

</script>

<style scoped lang="scss" src="@/styles/EmlUploadView.scss"></style>
