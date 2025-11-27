import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService, { type Driver, type DriverStats } from '@/services/api'

export const useDriverStore = defineStore('driver', () => {
  const drivers = ref<Driver[]>([])
  const currentDriver = ref<Driver | null>(null)
  const driverStats = ref<DriverStats[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDrivers() {
    loading.value = true
    error.value = null
    try {
      drivers.value = await apiService.getDrivers()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch drivers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDriver(id: number) {
    loading.value = true
    error.value = null
    try {
      currentDriver.value = await apiService.getDriver(id)
      return currentDriver.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch driver'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDriverStats() {
    loading.value = true
    error.value = null
    try {
      driverStats.value = await apiService.getDriverStats()
      return driverStats.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch driver stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createDriver(data: Partial<Driver>) {
    loading.value = true
    error.value = null
    try {
      const newDriver = await apiService.createDriver(data)
      drivers.value.push(newDriver)
      return newDriver
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create driver'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDriver(id: number, data: Partial<Driver>) {
    loading.value = true
    error.value = null
    try {
      const updatedDriver = await apiService.updateDriver(id, data)
      const index = drivers.value.findIndex(d => d.id === id)
      if (index !== -1) {
        drivers.value[index] = updatedDriver
      }
      if (currentDriver.value?.id === id) {
        currentDriver.value = updatedDriver
      }
      return updatedDriver
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update driver'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDriver(id: number) {
    loading.value = true
    error.value = null
    try {
      await apiService.deleteDriver(id)
      drivers.value = drivers.value.filter(d => d.id !== id)
      if (currentDriver.value?.id === id) {
        currentDriver.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete driver'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    drivers,
    currentDriver,
    driverStats,
    loading,
    error,
    fetchDrivers,
    fetchDriver,
    fetchDriverStats,
    createDriver,
    updateDriver,
    deleteDriver,
  }
})
