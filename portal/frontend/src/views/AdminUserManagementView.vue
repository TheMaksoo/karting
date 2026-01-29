<template>
  <div class="user-management-view">
    <div class="header">
      <h1>👥 User Management</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        <span>➕</span> Create User
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <div v-else>
      <!-- Unconnected Drivers Alert -->
      <div v-if="unconnectedDrivers.length > 0" class="alert-card warning">
        <div class="alert-header">
          <span class="alert-icon">⚠️</span>
          <h3>{{ unconnectedDrivers.length }} Driver(s) Without User Accounts</h3>
        </div>
        <p class="alert-text">These drivers were created but not connected to any user account:</p>
        <div class="unconnected-list">
          <div v-for="driver in unconnectedDrivers.slice(0, 10)" :key="driver.id" class="unconnected-item">
            <div class="driver-color" :style="{ backgroundColor: driver.color || '#666' }"></div>
            <span class="driver-name">{{ driver.name }}</span>
            <span v-if="driver.nickname" class="driver-nickname">({{ driver.nickname }})</span>
            <span v-if="driver.track_names" class="driver-tracks">📍 {{ driver.track_names }}</span>
            <button @click="quickConnectDriver(driver)" class="btn-xs btn-success">Connect</button>
          </div>
        </div>
        <p v-if="unconnectedDrivers.length > 10" class="alert-more">
          + {{ unconnectedDrivers.length - 10 }} more...
        </p>
      </div>

      <div class="users-list">
        <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-header">
          <div class="user-avatar">
            {{ getUserInitials(user.name) }}
          </div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p class="user-email">{{ user.email }}</p>
            <span class="role-badge" :class="user.role">{{ user.role }}</span>
          </div>
          <div class="user-stats">
            <span class="stat">{{ user.drivers_count }} drivers</span>
          </div>
          <div class="user-actions">
            <button @click="editUser(user)" class="btn-sm btn-primary" title="Edit user">
              ✏️
            </button>
            <button @click="deleteUser(user)" class="btn-sm btn-danger" title="Delete user">
              🗑️
            </button>
          </div>
        </div>

        <div v-if="user.drivers && user.drivers.length > 0" class="user-drivers">
          <h4>Connected Drivers:</h4>
          <div class="drivers-grid">
            <div v-for="driver in user.drivers" :key="driver.id" class="driver-chip">
              <div class="driver-color" :style="{ backgroundColor: driver.color || '#666' }"></div>
              <span class="driver-name">{{ driver.name }}</span>
              <span v-if="driver.nickname" class="driver-nickname">({{ driver.nickname }})</span>
              <span class="driver-laps">{{ driver.laps_count }} laps</span>
              <button @click="disconnectDriver(user.id, driver.id)" class="remove-btn" title="Disconnect">×</button>
            </div>
          </div>
          <button @click="showConnectDriverModal(user)" class="btn-sm btn-success">
            ➕ Connect Driver
          </button>
        </div>
        <div v-else class="no-drivers">
          <p>No drivers connected</p>
          <button @click="showConnectDriverModal(user)" class="btn-sm btn-success">
            ➕ Connect First Driver
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit User' : 'Create User' }}</h2>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="Full name" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.email" type="email" class="form-input" placeholder="email@example.com" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="formData.role" class="form-input">
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div v-if="!showEditModal" class="form-group">
            <label>Password</label>
            <input v-model="formData.password" type="password" class="form-input" placeholder="••••••••" />
          </div>
          <div v-if="showEditModal" class="form-group">
            <label>New Password (leave blank to keep current)</label>
            <input v-model="formData.password" type="password" class="form-input" placeholder="••••••••" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="btn-secondary">Cancel</button>
          <button @click="saveUser" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Connect Driver Modal -->
    <div v-if="showDriverModal" class="modal-overlay" @click.self="showDriverModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Connect Driver to {{ selectedUser?.name }}</h2>
          <button @click="showDriverModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <div class="search-input-wrapper">
              <i class="search-icon">🔍</i>
              <input
                v-model="driverSearchQuery"
                @input="searchAvailableDrivers"
                type="text"
                placeholder="Search drivers..."
                class="form-input search-input"
              />
            </div>
          </div>
          <div v-if="availableDrivers.length > 0" class="drivers-list">
            <div v-for="driver in availableDrivers" :key="driver.id" class="driver-item">
              <div class="driver-color" :style="{ backgroundColor: driver.color || '#666' }"></div>
              <div class="driver-details">
                <span class="driver-name">{{ driver.name }}</span>
                <span v-if="driver.nickname" class="driver-nickname">{{ driver.nickname }}</span>
                <span class="driver-laps">{{ driver.laps_count }} laps</span>
                <span v-if="driver.track_names" class="driver-tracks">📍 {{ driver.track_names }}</span>
              </div>
              <button @click="connectDriver(driver.id)" class="btn-sm btn-success">
                Connect
              </button>
            </div>
          </div>
          <div v-else-if="loadingDrivers" class="loading-state">
            Loading drivers...
          </div>
          <div v-else class="no-results">
            No available drivers found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@/services/api'
import type { Driver } from '@/services/api'
import { useErrorHandler, getErrorMessage } from '@/composables/useErrorHandler'
import { useToast } from '@/composables/useToast'

const { handleError } = useErrorHandler()
const toast = useToast()

interface User {
  id: number
  name: string
  email: string
  role: string
  drivers_count: number
  drivers: Array<{
    id: number
    name: string
    nickname?: string
    color?: string
    laps_count: number
  }>
}

const loading = ref(false)
const saving = ref(false)
const loadingDrivers = ref(false)
const users = ref<User[]>([])
const unconnectedDrivers = ref<Driver[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDriverModal = ref(false)
const selectedUser = ref<User | null>(null)
const allAvailableDrivers = ref<Driver[]>([])
const availableDrivers = ref<Driver[]>([])
const driverSearchQuery = ref('')

const formData = ref({
  id: null as number | null,
  name: '',
  email: '',
  role: 'driver',
  password: '',
})

const getUserInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await apiService.adminUsers.getAll()
  } catch (error: unknown) {
    handleError(error, 'loading users')
  } finally {
    loading.value = false
  }
  
  // Load unconnected drivers
  await loadUnconnectedDrivers()
}

const loadUnconnectedDrivers = async () => {
  try {
    const allDrivers = await apiService.getDrivers()
    
    // Get all connected driver IDs from users
    const connectedDriverIds = new Set<number>()
    users.value.forEach(user => {
      user.drivers?.forEach(driver => {
        connectedDriverIds.add(driver.id)
      })
    })
    
    // Filter to find unconnected drivers
    unconnectedDrivers.value = allDrivers.filter((driver: Driver) => 
      !connectedDriverIds.has(driver.id)
    )
  } catch (error: unknown) {
    handleError(error, 'loading unconnected drivers')
  }
}

const quickConnectDriver = (driver: Driver) => {
  if (users.value.length === 0) {
    toast.error('No users available to connect to')
    return
  }
  
  const firstUser = users.value[0]
  if (!firstUser) return
  
  selectedUser.value = firstUser
  showDriverModal.value = true
  driverSearchQuery.value = driver.name
  loadingDrivers.value = true
  
  showConnectDriverModal(firstUser)
}

const editUser = (user: User) => {
  formData.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password: '',
  }
  showEditModal.value = true
}

const deleteUser = async (user: User) => {
  if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return

  try {
    await apiService.adminUsers.delete(user.id)
    await loadUsers()
    toast.success('User deleted successfully')
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  }
}

const saveUser = async () => {
  saving.value = true
  try {
    if (showEditModal.value && formData.value.id) {
      await apiService.adminUsers.update(formData.value.id, formData.value)
    } else {
      await apiService.adminUsers.create(formData.value)
    }
    await loadUsers()
    closeModals()
    toast.success(showEditModal.value ? 'User updated successfully' : 'User created successfully')
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = { id: null, name: '', email: '', role: 'driver', password: '' }
}

const showConnectDriverModal = async (user: User) => {
  selectedUser.value = user
  showDriverModal.value = true
  driverSearchQuery.value = ''
  loadingDrivers.value = true
  try {
    const drivers = await apiService.adminUsers.availableDrivers(user.id)
    allAvailableDrivers.value = drivers
    availableDrivers.value = drivers
  } catch (error: unknown) {
    handleError(error, 'loading available drivers')
  } finally {
    loadingDrivers.value = false
  }
}

const searchAvailableDrivers = () => {
  const query = driverSearchQuery.value.toLowerCase().trim()
  
  if (!query) {
    availableDrivers.value = allAvailableDrivers.value
    return
  }
  
  availableDrivers.value = allAvailableDrivers.value.filter(driver => {
    const nameMatch = driver.name.toLowerCase().includes(query)
    const nicknameMatch = driver.nickname?.toLowerCase().includes(query)
    return nameMatch || nicknameMatch
  })
}

const connectDriver = async (driverId: number) => {
  if (!selectedUser.value) return

  try {
    await apiService.adminUsers.connectDriver(selectedUser.value.id, driverId)
    await loadUsers()
    showDriverModal.value = false
    toast.success('Driver connected successfully')
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  }
}

const disconnectDriver = async (userId: number, driverId: number) => {
  if (!confirm('Disconnect this driver?')) return

  try {
    await apiService.adminUsers.disconnectDriver(userId, driverId)
    await loadUsers()
    toast.success('Driver disconnected')
  } catch (error: unknown) {
    toast.error(getErrorMessage(error))
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management-view {
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-sm {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-color);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid;
  margin-bottom: 1.5rem;

  &.warning {
    border-color: #f59e0b;
    background: linear-gradient(135deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.1) 100%);
  }
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  .alert-icon {
    font-size: 1.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
  }
}

.alert-text {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.unconnected-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unconnected-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
  }

  .driver-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .driver-name {
    font-weight: 600;
    color: var(--text-color);
  }

  .driver-nickname {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-left: 0.25rem;
  }

  .btn-xs {
    margin-left: auto;
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-success {
      background: #10b981;
      color: white;

      &:hover {
        background: #059669;
      }
    }
  }
}

.alert-more {
  margin: 0.75rem 0 0 0;
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.9rem;
}

.user-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.user-email {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.role-badge.driver {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.user-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.user-drivers {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.user-drivers h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: var(--text-color);
}

.drivers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.driver-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-color);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.driver-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.driver-name {
  font-weight: 500;
  color: var(--text-color);
}

.driver-nickname {
  color: var(--text-secondary);
}

.driver-laps {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0 0.25rem;
  margin-left: 0.25rem;
}

.remove-btn:hover {
  color: #ef4444;
}

.no-drivers {
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--card-bg);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-color);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-box {
  margin-bottom: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  padding-left: 2.75rem;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.driver-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.driver-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.driver-tracks {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}
</style>
