import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService, { type Track, type TrackStats } from '@/services/api'

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as ApiError
    return apiErr.response?.data?.message || fallback
  }
  return fallback
}

export const useTrackStore = defineStore('track', () => {
  const tracks = ref<Track[]>([])
  const currentTrack = ref<Track | null>(null)
  const trackStats = ref<TrackStats[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTracks() {
    loading.value = true
    error.value = null
    try {
      tracks.value = await apiService.getTracks()
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch tracks')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTrack(id: number) {
    loading.value = true
    error.value = null
    try {
      currentTrack.value = await apiService.getTrack(id)
      return currentTrack.value
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch track')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTrackStats() {
    loading.value = true
    error.value = null
    try {
      trackStats.value = await apiService.getTrackStats()
      return trackStats.value
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch track stats')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTrack(data: Partial<Track>) {
    loading.value = true
    error.value = null
    try {
      const newTrack = await apiService.createTrack(data)
      tracks.value.push(newTrack)
      return newTrack
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create track')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTrack(id: number, data: Partial<Track>) {
    loading.value = true
    error.value = null
    try {
      const updatedTrack = await apiService.updateTrack(id, data)
      const index = tracks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tracks.value[index] = updatedTrack
      }
      if (currentTrack.value?.id === id) {
        currentTrack.value = updatedTrack
      }
      return updatedTrack
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update track')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTrack(id: number) {
    loading.value = true
    error.value = null
    try {
      await apiService.deleteTrack(id)
      tracks.value = tracks.value.filter(t => t.id !== id)
      if (currentTrack.value?.id === id) {
        currentTrack.value = null
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete track')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tracks,
    currentTrack,
    trackStats,
    loading,
    error,
    fetchTracks,
    fetchTrack,
    fetchTrackStats,
    createTrack,
    updateTrack,
    deleteTrack,
  }
})
