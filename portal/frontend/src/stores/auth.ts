import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService, { type User } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const mustChangePassword = computed(() => user.value?.must_change_password || false)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await apiService.login(email, password)
      user.value = response.user
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await apiService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      apiService.clearAuth()
      user.value = null
      loading.value = false
      window.location.href = '/karting/login'
    }
  }

  async function fetchCurrentUser() {
    if (!apiService.isAuthenticated()) {
      return
    }
    
    loading.value = true
    try {
      user.value = await apiService.getCurrentUser()
    } catch (err: any) {
      console.error('Failed to fetch user:', err)
      // Don't clear auth here - the interceptor already handles it
      // Just set user to null to show logged out state
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    loading.value = true
    error.value = null
    try {
      await apiService.changePassword(currentPassword, newPassword)
      if (user.value) {
        user.value.must_change_password = false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Password change failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    mustChangePassword,
    login,
    logout,
    fetchCurrentUser,
    changePassword,
  }
})
