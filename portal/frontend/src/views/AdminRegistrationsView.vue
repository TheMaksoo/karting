<template>
  <div class="registrations-view">
    <div class="header">
      <h1>📝 Registration Requests</h1>
      <div class="header-actions">
        <div class="tabs">
          <button 
            :class="['tab', { active: activeTab === 'pending' }]" 
            @click="activeTab = 'pending'"
          >
            Pending
            <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
          </button>
          <button 
            :class="['tab', { active: activeTab === 'all' }]" 
            @click="activeTab = 'all'"
          >
            All Registrations
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading registrations...</p>
    </div>

    <div v-else>
      <!-- Pending Registrations -->
      <div v-if="activeTab === 'pending'">
        <div v-if="pendingRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No Pending Registrations</h3>
          <p>All registration requests have been reviewed.</p>
        </div>

        <div v-else class="registrations-list">
          <div v-for="reg in pendingRegistrations" :key="reg.id" class="registration-card pending">
            <div class="registration-header">
              <div class="user-avatar">
                {{ getUserInitials(reg.name) }}
              </div>
              <div class="registration-info">
                <h3>{{ reg.name }}</h3>
                <p v-if="reg.display_name" class="display-name">Display: {{ reg.display_name }}</p>
                <p class="user-email">{{ reg.email }}</p>
                <span class="date">Registered {{ formatDate(reg.created_at) }}</span>
              </div>
            </div>

            <div class="registration-actions">
              <button @click="openApproveModal(reg)" class="btn btn-success">
                ✅ Approve
              </button>
              <button @click="openRejectModal(reg)" class="btn btn-danger">
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- All Registrations -->
      <div v-if="activeTab === 'all'">
        <div v-if="allRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No Registrations Yet</h3>
          <p>No users have registered for an account.</p>
        </div>

        <div v-else class="registrations-list">
          <div 
            v-for="reg in allRegistrations" 
            :key="reg.id" 
            :class="['registration-card', reg.registration_status]"
          >
            <div class="registration-header">
              <div class="user-avatar" :class="reg.registration_status">
                {{ getUserInitials(reg.name) }}
              </div>
              <div class="registration-info">
                <h3>{{ reg.name }}</h3>
                <p v-if="reg.display_name" class="display-name">Display: {{ reg.display_name }}</p>
                <p class="user-email">{{ reg.email }}</p>
                <span class="date">Registered {{ formatDate(reg.created_at) }}</span>
                <span 
                  class="status-badge" 
                  :class="reg.registration_status"
                >
                  {{ getStatusLabel(reg.registration_status) }}
                </span>
                <span v-if="reg.approved_at" class="approved-date">
                  {{ reg.registration_status === 'approved' ? 'Approved' : 'Rejected' }} 
                  {{ formatDate(reg.approved_at) }}
                </span>
              </div>
              <div class="registration-stats">
                <span v-if="reg.registration_status === 'approved'" class="stat">
                  {{ reg.drivers_count || 0 }} drivers
                </span>
              </div>
            </div>

            <div v-if="reg.registration_status === 'pending'" class="registration-actions">
              <button @click="openApproveModal(reg)" class="btn btn-success">
                ✅ Approve
              </button>
              <button @click="openRejectModal(reg)" class="btn btn-danger">
                ❌ Reject
              </button>
            </div>

            <div v-else-if="reg.registration_status === 'rejected'" class="registration-actions">
              <button @click="deleteRegistration(reg)" class="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h2>✅ Approve Registration</h2>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="approval-info">
            <p>Approving account for:</p>
            <div class="user-preview">
              <div class="user-avatar">{{ getUserInitials(selectedRegistration?.name || '') }}</div>
              <div>
                <strong>{{ selectedRegistration?.name }}</strong>
                <span>{{ selectedRegistration?.email }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="approve-role">Role</label>
            <select id="approve-role" v-model="approveFormData.role" class="form-input">
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="form-group">
            <label for="driver-search">Connect to Driver(s) (optional)</label>
            <div class="search-box">
              <div class="search-input-wrapper">
                <i class="search-icon">🔍</i>
                <input
                  id="driver-search"
                  v-model="driverSearchQuery"
                  @input="searchDrivers"
                  type="text"
                  placeholder="Search drivers to connect..."
                  class="form-input search-input"
                />
              </div>
            </div>
            
            <div v-if="selectedDrivers.length > 0" class="selected-drivers">
              <div v-for="driver in selectedDrivers" :key="driver.id" class="selected-driver-chip">
                <div class="driver-color" :style="{ backgroundColor: driver.color || '#666' }"></div>
                <span>{{ driver.name }}</span>
                <button @click="removeDriver(driver.id)" class="remove-btn">×</button>
              </div>
            </div>

            <div v-if="availableDrivers.length > 0 && driverSearchQuery" class="drivers-dropdown">
              <div 
                v-for="driver in availableDrivers" 
                :key="driver.id" 
                class="driver-option"
                @click="addDriver(driver)"
              >
                <div class="driver-color" :style="{ backgroundColor: driver.color || '#666' }"></div>
                <div class="driver-details">
                  <span class="driver-name">{{ driver.name }}</span>
                  <span v-if="driver.nickname" class="driver-nickname">{{ driver.nickname }}</span>
                  <span class="driver-laps">{{ getDriverLapsCount(driver) }} laps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="btn btn-secondary">Cancel</button>
          <button @click="approveRegistration" class="btn btn-success" :disabled="saving">
            {{ saving ? 'Approving...' : 'Approve Account' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h2>❌ Reject Registration</h2>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="rejection-info">
            <p>Are you sure you want to reject the registration for:</p>
            <div class="user-preview">
              <div class="user-avatar rejected">{{ getUserInitials(selectedRegistration?.name || '') }}</div>
              <div>
                <strong>{{ selectedRegistration?.name }}</strong>
                <span>{{ selectedRegistration?.email }}</span>
              </div>
            </div>
          </div>
          <p class="warning-text">
            ⚠️ The user will not be able to log in and will need to register again if you later change your mind.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="btn btn-secondary">Cancel</button>
          <button @click="rejectRegistration" class="btn btn-danger" :disabled="saving">
            {{ saving ? 'Rejecting...' : 'Reject Registration' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/api'
import type { Driver } from '@/services/api'
import { useErrorHandler, getErrorMessage } from '@/composables/useErrorHandler'
import { useToast } from '@/composables/useToast'

const { handleError } = useErrorHandler()
const toast = useToast()

interface Registration {
  id: number
  name: string
  display_name?: string
  email: string
  registration_status: 'pending' | 'approved' | 'rejected'
  approved_at?: string
  approved_by?: number
  created_at: string
  drivers_count?: number
  role?: string
}

const loading = ref(false)
const saving = ref(false)
const activeTab = ref<'pending' | 'all'>('pending')
const allRegistrations = ref<Registration[]>([])
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedRegistration = ref<Registration | null>(null)

// Driver selection
const driverSearchQuery = ref('')
const allDrivers = ref<Driver[]>([])
const availableDrivers = ref<Driver[]>([])
const selectedDrivers = ref<Driver[]>([])

const approveFormData = ref({
  role: 'driver' as 'driver' | 'admin',
  driver_ids: [] as number[]
})

const pendingRegistrations = computed(() => 
  allRegistrations.value.filter(r => r.registration_status === 'pending')
)

const pendingCount = computed(() => pendingRegistrations.value.length)

const getUserInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getDriverLapsCount = (driver: Driver): number => {
  // Driver object from API may have laps_count property
  return (driver as unknown as { laps_count?: number }).laps_count || 0
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '⏳ Pending'
    case 'approved': return '✅ Approved'
    case 'rejected': return '❌ Rejected'
    default: return status
  }
}

const loadRegistrations = async () => {
  loading.value = true
  try {
    const response = await apiService.get('/admin/registrations')
    allRegistrations.value = response.data || response
  } catch (error: unknown) {
    handleError(error, 'loading registrations')
  } finally {
    loading.value = false
  }
}

const loadAllDrivers = async () => {
  try {
    allDrivers.value = await apiService.getDrivers()
  } catch (error: unknown) {
    handleError(error, 'loading drivers')
  }
}

const searchDrivers = () => {
  const query = driverSearchQuery.value.toLowerCase().trim()
  
  if (!query) {
    availableDrivers.value = []
    return
  }
  
  const selectedIds = new Set(selectedDrivers.value.map(d => d.id))
  
  availableDrivers.value = allDrivers.value.filter(driver => {
    if (selectedIds.has(driver.id)) return false
    const nameMatch = driver.name.toLowerCase().includes(query)
    const nicknameMatch = driver.nickname?.toLowerCase().includes(query)
    return nameMatch || nicknameMatch
  }).slice(0, 10) // Limit to 10 results
}

const addDriver = (driver: Driver) => {
  selectedDrivers.value.push(driver)
  driverSearchQuery.value = ''
  availableDrivers.value = []
}

const removeDriver = (driverId: number) => {
  selectedDrivers.value = selectedDrivers.value.filter(d => d.id !== driverId)
}

const openApproveModal = (reg: Registration) => {
  selectedRegistration.value = reg
  approveFormData.value = { role: 'driver', driver_ids: [] }
  selectedDrivers.value = []
  driverSearchQuery.value = ''
  showApproveModal.value = true
}

const openRejectModal = (reg: Registration) => {
  selectedRegistration.value = reg
  showRejectModal.value = true
}

const closeModals = () => {
  showApproveModal.value = false
  showRejectModal.value = false
  selectedRegistration.value = null
  selectedDrivers.value = []
  driverSearchQuery.value = ''
}

const approveRegistration = async () => {
  if (!selectedRegistration.value) return
  
  saving.value = true
  try {
    await apiService.post(`/admin/registrations/${selectedRegistration.value.id}/approve`, {
      role: approveFormData.value.role,
      driver_ids: selectedDrivers.value.map(d => d.id)
    })
    
    toast.success(`${selectedRegistration.value.name}'s account has been approved!`)
    closeModals()
    await loadRegistrations()
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

const rejectRegistration = async () => {
  if (!selectedRegistration.value) return
  
  saving.value = true
  try {
    await apiService.post(`/admin/registrations/${selectedRegistration.value.id}/reject`)
    
    toast.success(`${selectedRegistration.value.name}'s registration has been rejected.`)
    closeModals()
    await loadRegistrations()
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

const deleteRegistration = async (reg: Registration) => {
  if (!confirm(`Permanently delete the registration for "${reg.name}"?`)) return

  try {
    await apiService.delete(`/admin/registrations/${reg.id}`)
    toast.success('Registration deleted')
    await loadRegistrations()
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  }
}

onMounted(() => {
  loadRegistrations()
  loadAllDrivers()
})
</script>

<style scoped>
.registrations-view {
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: var(--card-background);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.tab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab:hover {
  color: var(--text-color);
  background: rgba(88, 166, 255, 0.1);
}

.tab.active {
  background: var(--primary-color);
  color: white;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
}

.tab.active .badge {
  background: white;
  color: var(--primary-color);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--text-color);
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: var(--text-muted);
  margin: 0;
}

.registrations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.registration-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.registration-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.registration-card.pending {
  border-left: 4px solid #f59e0b;
}

.registration-card.approved {
  border-left: 4px solid #10b981;
}

.registration-card.rejected {
  border-left: 4px solid #ef4444;
  opacity: 0.7;
}

.registration-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #58A6FF, #F97316);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-avatar.pending {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.user-avatar.approved {
  background: linear-gradient(135deg, #10b981, #059669);
}

.user-avatar.rejected {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.registration-info {
  flex: 1;
}

.registration-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: var(--text-color);
}

.display-name {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  color: var(--primary-color);
}

.user-email {
  margin: 0 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.date {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.approved {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.approved-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.registration-stats {
  text-align: right;
}

.stat {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.registration-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-color);
}

.btn-secondary:hover {
  background: var(--card-background);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.approval-info, .rejection-info {
  margin-bottom: 1.5rem;
}

.approval-info p, .rejection-info p {
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.user-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(88, 166, 255, 0.1);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.user-preview div:last-child {
  display: flex;
  flex-direction: column;
}

.user-preview strong {
  color: var(--text-color);
  font-size: 1rem;
}

.user-preview span {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.warning-text {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-color);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

.search-box {
  margin-bottom: 0.75rem;
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
}

.search-input {
  padding-left: 2.5rem !important;
}

.selected-drivers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.selected-driver-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(88, 166, 255, 0.2);
  border: 1px solid var(--primary-color);
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-color);
}

.driver-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.25rem;
}

.remove-btn:hover {
  color: #ef4444;
}

.drivers-dropdown {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.driver-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.driver-option:hover {
  background: rgba(88, 166, 255, 0.1);
}

.driver-option:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.driver-name {
  color: var(--text-color);
  font-weight: 500;
}

.driver-nickname {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.driver-laps {
  color: var(--primary-color);
  font-size: 0.75rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .registration-header {
    flex-direction: column;
  }

  .registration-stats {
    text-align: left;
  }

  .registration-actions {
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }

  .modal {
    max-width: 100%;
    margin: 0.5rem;
  }
}
</style>
