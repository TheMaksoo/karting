<template>
  <div class="track-management">
    <!-- Header with Actions -->
    <div class="page-header">
      <div class="header-left">
        <h1>Track Management</h1>
        <p class="subtitle">Manage karting tracks and their configurations</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <span class="icon">➕</span>
        Add New Track
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="filters-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search tracks by name, city, or country..."
          class="search-input"
        >
      </div>
      <div class="filter-buttons">
        <button 
          :class="['filter-btn', { 'active': filterEmlSupported === null }]"
          @click="filterEmlSupported = null"
        >
          All Tracks
        </button>
        <button 
          :class="['filter-btn', { 'active': filterEmlSupported === true }]"
          @click="filterEmlSupported = true"
        >
          EML Supported
        </button>
        <button 
          :class="['filter-btn', { 'active': filterEmlSupported === false }]"
          @click="filterEmlSupported = false"
        >
          No EML
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tracks...</p>
    </div>

    <!-- Tracks Grid -->
    <div v-else-if="filteredTracks.length > 0" class="tracks-grid">
      <div 
        v-for="track in filteredTracks" 
        :key="track.id"
        class="track-card"
      >
        <!-- EML Badge -->
        <div class="track-badge" v-if="track.emlSupported">
          <span class="badge-icon">📧</span>
          EML Supported
        </div>

        <!-- Track Header -->
        <div class="track-header">
          <div class="track-flag">{{ getFlagEmoji(track.country) }}</div>
          <div class="track-info">
            <h3 class="track-name">{{ track.name }}</h3>
            <p class="track-location">{{ track.city }}, {{ track.country }}</p>
          </div>
        </div>

        <!-- Track Stats -->
        <div class="track-stats">
          <div class="stat-item">
            <span class="stat-icon">📏</span>
            <div class="stat-content">
              <span class="stat-value">{{ track.distance_km }}km</span>
              <span class="stat-label">Length</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🔄</span>
            <div class="stat-content">
              <span class="stat-value">{{ track.corners }}</span>
              <span class="stat-label">Corners</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏠</span>
            <div class="stat-content">
              <span class="stat-value">{{ track.indoor ? 'Indoor' : 'Outdoor' }}</span>
              <span class="stat-label">Type</span>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="track-contact" v-if="track.website">
          <a :href="track.website" target="_blank" class="contact-link">
            🌐 Visit Website
          </a>
        </div>

        <!-- Actions -->
        <div class="track-actions">
          <button class="btn-icon" @click="editTrack(track)" title="Edit">
            ✏️
          </button>
          <button class="btn-icon danger" @click="confirmDelete(track)" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">🏁</div>
      <h3>No tracks found</h3>
      <p>{{ searchQuery ? 'Try adjusting your search filters' : 'Get started by adding your first track' }}</p>
      <button v-if="!searchQuery" class="btn-primary" @click="showAddModal = true">
        Add First Track
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ showEditModal ? 'Edit Track' : 'Add New Track' }}</h2>
            <button class="modal-close" @click="closeModals">✕</button>
          </div>

          <form @submit.prevent="saveTrack" class="modal-form">
            <!-- Basic Info -->
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              
              <div class="form-row">
                <div class="form-group full">
                  <label>Track Name *</label>
                  <input 
                    v-model="formData.name" 
                    type="text" 
                    required
                    placeholder="e.g., De Voltage Karting"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>City *</label>
                  <input 
                    v-model="formData.city" 
                    type="text" 
                    required
                    placeholder="e.g., Tilburg"
                  >
                </div>
                <div class="form-group">
                  <label>Country *</label>
                  <input 
                    v-model="formData.country" 
                    type="text" 
                    required
                    placeholder="e.g., Netherlands"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="formData.indoor">
                    <span>Indoor Track</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="formData.emlSupported">
                    <span>Supports EML Upload</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Track Specifications -->
            <div class="form-section">
              <h3 class="section-title">Track Specifications</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Distance (km)</label>
                  <input 
                    v-model.number="formData.distance_km" 
                    type="number" 
                    step="0.01"
                    placeholder="0.85"
                  >
                </div>
                <div class="form-group">
                  <label>Number of Corners</label>
                  <input 
                    v-model.number="formData.corners" 
                    type="number"
                    placeholder="14"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Track Width (m)</label>
                  <input 
                    v-model.number="formData.width_m" 
                    type="number"
                    step="0.1"
                    placeholder="8.0"
                  >
                </div>
                <div class="form-group">
                  <label>Elevation Change (m)</label>
                  <input 
                    v-model.number="formData.elevation_m" 
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                  >
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="form-section">
              <h3 class="section-title">Contact Information</h3>
              
              <div class="form-row">
                <div class="form-group full">
                  <label>Website</label>
                  <input 
                    v-model="formData.website" 
                    type="url"
                    placeholder="https://example.com"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input 
                    v-model="formData.phone" 
                    type="tel"
                    placeholder="+31 13 123 4567"
                  >
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input 
                    v-model="formData.email" 
                    type="email"
                    placeholder="info@track.com"
                  >
                </div>
              </div>
            </div>

            <!-- Coordinates -->
            <div class="form-section">
              <h3 class="section-title">Geographic Coordinates</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Latitude</label>
                  <input 
                    v-model.number="formData.latitude" 
                    type="number"
                    step="0.000001"
                    placeholder="51.5555"
                  >
                </div>
                <div class="form-group">
                  <label>Longitude</label>
                  <input 
                    v-model.number="formData.longitude" 
                    type="number"
                    step="0.000001"
                    placeholder="5.0913"
                  >
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModals">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : (showEditModal ? 'Update Track' : 'Create Track') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h2>Delete Track</h2>
            <button class="modal-close" @click="showDeleteModal = false">✕</button>
          </div>

          <div class="modal-body">
            <div class="alert-danger">
              <span class="alert-icon">⚠️</span>
              <div>
                <p class="alert-title">Are you sure?</p>
                <p class="alert-message">
                  This will permanently delete <strong>{{ trackToDelete?.name }}</strong> and all associated data.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-secondary" @click="showDeleteModal = false">
              Cancel
            </button>
            <button class="btn-danger" @click="deleteTrack" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete Track' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/api'

interface Track {
  id: number
  name: string
  city: string
  country: string
  indoor: boolean
  distance_km: number | null
  corners: number | null
  width_m: number | null
  elevation_m: number | null
  website: string | null
  phone: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  emlSupported: boolean
}

// State
const tracks = ref<Track[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const filterEmlSupported = ref<boolean | null>(null)

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const trackToDelete = ref<Track | null>(null)

// Form Data
const formData = ref<Partial<Track>>({
  name: '',
  city: '',
  country: '',
  indoor: false,
  emlSupported: false,
  distance_km: null,
  corners: null,
  width_m: null,
  elevation_m: null,
  website: '',
  phone: '',
  email: '',
  latitude: null,
  longitude: null,
})

// Computed
const filteredTracks = computed(() => {
  let result = tracks.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(track => 
      track.name.toLowerCase().includes(query) ||
      track.city.toLowerCase().includes(query) ||
      track.country.toLowerCase().includes(query)
    )
  }

  // Filter by EML support
  if (filterEmlSupported.value !== null) {
    result = result.filter(track => track.emlSupported === filterEmlSupported.value)
  }

  return result
})

// Methods
const loadTracks = async () => {
  loading.value = true
  try {
    const response = await apiService.tracks.getAll()
    tracks.value = response.map((track: any) => ({
      ...track,
      emlSupported: track.eml_supported || false
    }))
  } catch (error) {
    console.error('Failed to load tracks:', error)
  } finally {
    loading.value = false
  }
}

const editTrack = (track: Track) => {
  formData.value = { ...track }
  showEditModal.value = true
}

const confirmDelete = (track: Track) => {
  trackToDelete.value = track
  showDeleteModal.value = true
}

const saveTrack = async () => {
  saving.value = true
  try {
    // Transform form data to API Track format
    const apiTrackData: any = {
      name: formData.value.name,
      city: formData.value.city,
      country: formData.value.country,
      distance: formData.value.distance_km || undefined,
      corners: formData.value.corners || undefined,
      width: formData.value.width_m || undefined,
      elevation_change: formData.value.elevation_m || undefined,
      contact: {
        phone: formData.value.phone || undefined,
        email: formData.value.email || undefined,
        website: formData.value.website || undefined,
      },
      coordinates: formData.value.latitude && formData.value.longitude ? {
        lat: formData.value.latitude,
        lng: formData.value.longitude,
      } : undefined,
    }

    if (showEditModal.value && formData.value.id) {
      await apiService.tracks.update(formData.value.id, apiTrackData)
    } else {
      await apiService.tracks.create(apiTrackData)
    }
    await loadTracks()
    closeModals()
  } catch (error) {
    console.error('Failed to save track:', error)
    alert('Failed to save track. Please try again.')
  } finally {
    saving.value = false
  }
}

const deleteTrack = async () => {
  if (!trackToDelete.value) return
  
  deleting.value = true
  try {
    await apiService.tracks.delete(trackToDelete.value.id)
    await loadTracks()
    showDeleteModal.value = false
    trackToDelete.value = null
  } catch (error) {
    console.error('Failed to delete track:', error)
    alert('Failed to delete track. Please try again.')
  } finally {
    deleting.value = false
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  formData.value = {
    name: '',
    city: '',
    country: '',
    indoor: false,
    emlSupported: false,
    distance_km: null,
    corners: null,
    width_m: null,
    elevation_m: null,
    website: '',
    phone: '',
    email: '',
    latitude: null,
    longitude: null,
  }
}

const getFlagEmoji = (country: string): string => {
  const flags: Record<string, string> = {
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Spain': '🇪🇸',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'UK': '🇬🇧',
    'USA': '🇺🇸',
  }
  return flags[country] || '🏁'
}

// Lifecycle
onMounted(() => {
  loadTracks()
})
</script>

<style scoped>
.track-management {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.filter-btn.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
}

/* Tracks Grid */
.tracks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.track-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
}

.track-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.track-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.375rem 0.75rem;
  background: rgba(72, 187, 120, 0.2);
  border: 1px solid rgba(72, 187, 120, 0.4);
  border-radius: 8px;
  color: #68d391;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.badge-icon {
  font-size: 0.875rem;
}

.track-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.track-flag {
  font-size: 2.5rem;
}

.track-info {
  flex: 1;
}

.track-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.track-location {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0;
}

.track-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.25rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.stat-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.track-contact {
  margin-bottom: 1rem;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: rgba(66, 153, 225, 0.15);
  border: 1px solid rgba(66, 153, 225, 0.3);
  border-radius: 8px;
  color: #63b3ed;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.contact-link:hover {
  background: rgba(66, 153, 225, 0.25);
  transform: translateX(2px);
}

.track-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-icon {
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-icon.danger:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: rgba(245, 101, 101, 0.4);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
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

.btn-danger {
  padding: 0.875rem 1.5rem;
  background: rgba(245, 101, 101, 0.2);
  border: 1px solid rgba(245, 101, 101, 0.4);
  border-radius: 12px;
  color: #fc8181;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: rgba(245, 101, 101, 0.3);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading & Empty States */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: white;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

/* Modal */
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
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-small {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 2rem;
}

.modal-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="url"],
.form-group input[type="number"] {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.alert-danger {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid rgba(245, 101, 101, 0.3);
  border-radius: 12px;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-title {
  font-weight: 600;
  color: #fc8181;
  margin: 0 0 0.5rem 0;
}

.alert-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .tracks-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
