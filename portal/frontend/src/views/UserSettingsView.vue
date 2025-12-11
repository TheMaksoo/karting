<template>
  <div class="user-settings-view">
    <div class="settings-header">
      <h1>⚙️ User Settings</h1>
      <p class="subtitle">Manage your display name and track-specific nicknames</p>
    </div>

    <div class="settings-content">
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

const authStore = useAuthStore()

// State
const displayName = ref('')
const tracks = ref<any[]>([])
const trackNicknames = ref<Record<number, string>>({})
const existingNicknames = ref<Record<number, number>>({}) // track_id -> nickname_id mapping
const loading = ref(false)
const saving = ref(false)

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
    tracks.value = await apiService.tracks.getAll()
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
      authStore.user.display_name = displayName.value
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
  } catch (error) {
    alert('Failed to delete track nickname')
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadSettings(),
    loadTracks(),
  ])
})
</script>
