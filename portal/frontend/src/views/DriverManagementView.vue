<template>
  <div class="driver-management">
    <div class="page-header">
      <div class="header-left">
        <h1>👥 Driver Management</h1>
        <p class="subtitle">Manage drivers and their profiles</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <span class="icon">➕</span>
        Add New Driver
      </button>
    </div>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Search drivers..."
        class="search-input"
      >
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading drivers...</p>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="filteredDrivers.length === 0" class="empty-state">
      <p>📭 No drivers found</p>
    </div>

    <div v-else class="drivers-grid">
      <div v-for="driver in filteredDrivers" :key="driver.id" class="driver-card">
        <div class="driver-header">
          <div class="driver-avatar" :style="{ backgroundColor: driver.color || getDefaultColor(driver.id) }">
            {{ getInitials(driver.name) }}
          </div>
          <div class="driver-info">
            <h3>{{ driver.name }}</h3>
            <p class="driver-stats">
              {{ driver.sessions_count || 0 }} sessions • {{ driver.laps_count || 0 }} laps
            </p>
            <div class="driver-color-indicator" v-if="driver.color">
              <span class="color-dot" :style="{ backgroundColor: driver.color }"></span>
              <span class="color-label">{{ driver.color }}</span>
            </div>
          </div>
        </div>

        <div class="driver-details">
          <div class="detail-item">
            <span class="label">Best Lap</span>
            <span class="value highlight">{{ formatTime(driver.best_lap_time) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Best Track</span>
            <span class="value">{{ driver.best_track || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Joined</span>
            <span class="value">{{ formatDate(driver.created_at) }}</span>
          </div>
        </div>

        <div class="driver-actions">
          <button @click="editDriver(driver)" class="btn-edit">
            ✏️ Edit
          </button>
          <button @click="deleteDriver(driver)" class="btn-delete">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Add Driver Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingDriver ? 'Edit Driver' : 'Add New Driver' }}</h2>
          <button class="close-btn" @click="closeAddModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Driver Name *</label>
            <input 
              v-model="driverForm.name" 
              type="text" 
              placeholder="Enter driver name"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="driverForm.email" 
              type="email" 
              placeholder="driver@email.com"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>Nickname</label>
            <input 
              v-model="driverForm.nickname" 
              type="text" 
              placeholder="Optional nickname"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>Driver Color</label>
            <div class="color-picker-group">
              <input 
                v-model="driverForm.color" 
                type="color" 
                class="color-input"
              >
              <input 
                v-model="driverForm.color" 
                type="text" 
                placeholder="#FF6384"
                class="form-input color-text"
              >
              <div class="color-preview" :style="{ backgroundColor: driverForm.color || '#cccccc' }"></div>
            </div>
            <small class="form-hint">Choose a unique color for this driver's chart data</small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAddModal" class="btn-secondary">Cancel</button>
          <button @click="saveDriver" class="btn-primary" :disabled="!driverForm.name">
            {{ editingDriver ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal modal-danger">
        <div class="modal-header">
          <h2>⚠️ Confirm Delete</h2>
          <button class="close-btn" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ driverToDelete?.name }}</strong>?</p>
          <p class="warning-text">This will also delete all their sessions and laps!</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="confirmDelete" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/api'
import { getDriverColor } from '@/utils/driverColors'

const drivers = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const editingDriver = ref<any>(null)
const driverToDelete = ref<any>(null)

const driverForm = ref({
  name: '',
  email: '',
  nickname: '',
  color: ''
})

const filteredDrivers = computed(() => {
  if (!searchQuery.value) return drivers.value
  const query = searchQuery.value.toLowerCase()
  return drivers.value.filter(d => 
    d.name.toLowerCase().includes(query)
  )
})

async function loadDrivers() {
  loading.value = true
  error.value = ''
  try {
    const response = await apiService.getDrivers()
    // apiService.getDrivers() returns Driver[] directly, not { data: Driver[] }
    drivers.value = Array.isArray(response) ? response : []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load drivers'
  } finally {
    loading.value = false
  }
}

function editDriver(driver: any) {
  editingDriver.value = driver
  driverForm.value = { 
    name: driver.name,
    email: driver.email || '',
    nickname: driver.nickname || '',
    color: driver.color || getDefaultColor(driver.id)
  }
  showAddModal.value = true
}

function getDefaultColor(driverId: number): string {
  return getDriverColor(driverId)
}

function deleteDriver(driver: any) {
  driverToDelete.value = driver
  showDeleteModal.value = true
}

async function saveDriver() {
  try {
    if (editingDriver.value) {
      await apiService.updateDriver(editingDriver.value.id, driverForm.value)
    } else {
      await apiService.createDriver(driverForm.value)
    }
    await loadDrivers()
    closeAddModal()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Failed to save driver')
  }
}

async function confirmDelete() {
  try {
    await apiService.deleteDriver(driverToDelete.value.id)
    await loadDrivers()
    showDeleteModal.value = false
    driverToDelete.value = null
  } catch (e: any) {
    alert(e.response?.data?.message || 'Failed to delete driver')
  }
}

function closeAddModal() {
  showAddModal.value = false
  editingDriver.value = null
  driverForm.value = { 
    name: '', 
    email: '',
    nickname: '',
    color: ''
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadDrivers()
})
</script>

<style scoped>
.driver-management {
  padding: var(--spacing-4);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.header-left h1 {
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.search-box {
  position: relative;
  margin-bottom: var(--spacing-6);
}

.search-icon {
  position: absolute;
  left: var(--spacing-4);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-lg);
}

.search-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4) var(--spacing-3) 3rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--text-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 4rem var(--spacing-4);
  color: var(--text-secondary);
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: var(--error-color);
}

.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-5);
}

.driver-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  transition: all var(--transition-normal);
}

.driver-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.driver-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.driver-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: 700;
  color: white;
}

.driver-info h3 {
  margin: 0;
  font-size: var(--text-xl);
  color: var(--text-primary);
}

.driver-stats {
  margin: var(--spacing-1) 0 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.value {
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
}

.value.highlight {
  color: var(--primary-color);
}

.driver-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-edit {
  background: rgba(59, 130, 246, 0.2);
  color: #60A5FA;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.btn-edit:hover {
  background: rgba(59, 130, 246, 0.3);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  color: var(--error-color);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-xl);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-5);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  color: var(--text-primary);
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: var(--spacing-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.color-picker-group {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.color-input {
  width: 60px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--bg-tertiary);
}

.color-text {
  flex: 1;
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-color);
}

.form-hint {
  display: block;
  margin-top: var(--spacing-1);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.driver-color-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-1);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-5);
  border-top: 1px solid var(--border-color);
}

.btn-secondary {
  padding: var(--spacing-3) var(--spacing-5);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-danger {
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  background: #DC2626;
}

.modal-danger .modal-header h2 {
  color: var(--error-color);
}

.warning-text {
  color: var(--warning-color);
  font-weight: 600;
  margin-top: var(--spacing-2);
}
</style>
