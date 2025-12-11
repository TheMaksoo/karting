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
      user.value = null
      loading.value = false
      window.location.href = 'https://solyx.gg/karting'
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
      // If 401, the token is invalid - clear everything
      if (err.response?.status === 401) {
        console.log('Token expired or invalid, clearing session')
        apiService.clearAuth()
        user.value = null
      } else {
        user.value = null
      }
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
