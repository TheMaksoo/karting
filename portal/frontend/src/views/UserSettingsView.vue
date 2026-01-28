<template>
  <div class="user-settings-view">
    <div class="settings-header">
      <h1>⚙️ User Settings</h1>
      <p class="subtitle">Manage your account settings and preferences</p>
    </div>

    <div class="settings-content">
      <!-- Profile Information Section -->
      <div class="settings-section">
        <div class="section-header">
          <h2>Profile Information</h2>
        </div>
        
        <div class="profile-grid">
          <div class="profile-item">
            <label>Name</label>
            <div class="profile-value">{{ authStore.user?.name }}</div>
          </div>
          
          <div class="profile-item">
            <label>Email</label>
            <div class="profile-value">{{ authStore.user?.email }}</div>
          </div>
          
          <div class="profile-item">
            <label>Role</label>
            <div class="profile-value">
              <span class="role-badge" :class="authStore.user?.role">
                {{ authStore.user?.role }}
              </span>
            </div>
          </div>
          
          <div v-if="myDrivers.length > 0" class="profile-item full-width">
            <label>Connected Drivers ({{ myDrivers.length }})</label>
            <div class="connected-drivers-list">
              <div v-for="driver in myDrivers" :key="driver.id" class="driver-badge">
                <div class="driver-color-dot" :style="{ backgroundColor: driver.color || '#666' }"></div>
                <span>{{ driver.name }}</span>
                <span v-if="driver.nickname" class="nickname">({{ driver.nickname }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="settings-section">
        <div class="section-header">
          <h2>Change Password</h2>
        </div>
        <div class="form-group">
          <label>Current Password</label>
          <input 
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="Enter current password"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input 
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="Enter new password"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input 
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="Confirm new password"
            class="form-input"
          />
        </div>
        <button 
          @click="changePassword" 
          :disabled="saving"
          class="btn-primary"
        >
          {{ saving ? 'Changing...' : 'Change Password' }}
        </button>
      </div>

      <!-- Display Name Section -->
      <div class="settings-section">
        <div class="section-header">
          <h2>Display Name</h2>
        </div>
        <div class="form-group">
          <label>Your Display Name</label>
          <input 
            v-model="displayName"
            type="text"
            placeholder="Enter your display name"
            class="form-input"
          />
          <button 
            @click="saveDisplayName" 
            :disabled="saving"
            class="btn-primary"
          >
            {{ saving ? 'Saving...' : 'Save Display Name' }}
          </button>
        </div>
      </div>

      <!-- Track Nicknames Section -->
      <div class="settings-section">
        <div class="section-header">
          <h2>Track Nicknames</h2>
          <p class="section-hint">Set different nicknames for each track you race at</p>
        </div>

        <div v-if="loading" class="loading-state">Loading tracks...</div>
        <div v-else class="track-nicknames-list">
          <div v-for="track in tracks" :key="track.id" class="track-nickname-item">
            <div class="track-info">
              <div class="track-icon">🏁</div>
              <div class="track-details">
                <div class="track-name">{{ track.name }}</div>
                <div class="track-location">{{ track.city }}, {{ track.country }}</div>
              </div>
            </div>
            <div class="nickname-input-group">
              <input 
                v-model="trackNicknames[track.id]"
                type="text"
                :placeholder="`Nickname at ${track.name}`"
                class="form-input"
              />
              <button 
                @click="saveTrackNickname(track.id)" 
                :disabled="saving"
                class="btn-sm btn-primary"
              >
                Save
              </button>
              <button 
                v-if="existingNicknames[track.id]"
                @click="deleteTrackNickname(track.id)" 
                :disabled="saving"
                class="btn-sm btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiService from '@/services/api'
import type { Driver } from '@/services/api'
import '@/styles/UserSettingsView.scss'

const authStore = useAuthStore()

// State
const displayName = ref('')
const tracks = ref<any[]>([])
const trackNicknames = ref<Record<number, string>>({})
const existingNicknames = ref<Record<number, number>>({}) // track_id -> nickname_id mapping
const loading = ref(false)
const saving = ref(false)

// Driver management state
const loadingDrivers = ref(false)
const myDrivers = ref<Driver[]>([])

// Password change state
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Methods
const loadSettings = async () => {
  loading.value = true
  try {
    const settings = await apiService.userSettings.get()
    displayName.value = settings.display_name || authStore.user?.name || ''
    
    // Map existing track nicknames
    settings.track_nicknames?.forEach((tn: any) => {
      trackNicknames.value[tn.track_id] = tn.nickname
      existingNicknames.value[tn.track_id] = tn.id
    })
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

const loadTracks = async () => {
  try {
    const allTracks = await apiService.tracks.getAll()
    
    // Only show tracks where user has connected drivers with sessions
    if (myDrivers.value.length > 0) {
      const trackStats = await apiService.tracks.stats()
      
      // Filter tracks that have data for any of the user's connected drivers
      const tracksWithData = new Set()
      for (const stat of trackStats) {
        // Check if this track has sessions from any of the user's drivers
        if (stat.total_sessions > 0) {
          tracksWithData.add(stat.track_id)
        }
      }
      
      tracks.value = allTracks.filter(t => tracksWithData.has(t.id))
    } else {
      tracks.value = []
    }
  } catch (error) {
    console.error('Failed to load tracks:', error)
  }
}

const saveDisplayName = async () => {
  saving.value = true
  try {
    await apiService.userSettings.updateDisplayName(displayName.value)
    alert('Display name saved successfully!')
    
    // Update auth store
    if (authStore.user) {
      (authStore.user as any).display_name = displayName.value
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to save display name')
  } finally {
    saving.value = false
  }
}

const saveTrackNickname = async (trackId: number) => {
  const nickname = trackNicknames.value[trackId]
  if (!nickname?.trim()) {
    alert('Please enter a nickname')
    return
  }

  saving.value = true
  try {
    const result = await apiService.userSettings.setTrackNickname(trackId, nickname)
    existingNicknames.value[trackId] = result.track_nickname.id
    alert('Track nickname saved!')
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to save track nickname')
  } finally {
    saving.value = false
  }
}

const deleteTrackNickname = async (trackId: number) => {
  if (!confirm('Delete this track nickname?')) return

  const nicknameId = existingNicknames.value[trackId]
  if (!nicknameId) return

  saving.value = true
  try {
    await apiService.userSettings.deleteTrackNickname(nicknameId)
    delete trackNicknames.value[trackId]
    delete existingNicknames.value[trackId]
    alert('Track nickname deleted!')
  } catch {
    alert('Failed to delete track nickname')
  } finally {
    saving.value = false
  }
}

// Driver management methods
const loadDrivers = async () => {
  loadingDrivers.value = true
  try {
    myDrivers.value = await apiService.getUserDrivers()
  } catch (error) {
    console.error('Failed to load drivers:', error)
  } finally {
    loadingDrivers.value = false
  }
}

// Password change method
const changePassword = async () => {
  // Validation
  if (!passwordForm.value.currentPassword.trim()) {
    alert('Please enter your current password')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    alert('New password must be at least 6 characters long')
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('New passwords do not match')
    return
  }

  saving.value = true
  try {
    await apiService.auth.changePassword({
      current_password: passwordForm.value.currentPassword,
      new_password: passwordForm.value.newPassword,
      new_password_confirmation: passwordForm.value.confirmPassword
    })
    
    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    alert('Password changed successfully!')
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to change password')
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadSettings()
  await loadDrivers()
  await loadTracks() // Load tracks after drivers so we can filter properly
})
</script>

