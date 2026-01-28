import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService, { type User } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notifications = useNotifications()

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const mustChangePassword = computed(() => user.value?.must_change_password || false)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await apiService.login(email, password)
      user.value = response.user
      notifications.success(`Welcome back, ${response.user.name}!`)
      return response
    } catch (err: unknown) {
      notifications.apiError(err, 'Login failed')
      const errObj = err as { response?: { data?: { message?: string } } }
      error.value = errObj.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await apiService.logout()
      notifications.info('You have been logged out')
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
    } catch (err: unknown) {
      console.error('Failed to fetch user:', err)
      const errObj = err as { response?: { status?: number } }
      // If we get 401, clear auth and let user re-login
      if (errObj.response?.status === 401) {
        apiService.clearAuth()
        notifications.warning('Session expired. Please log in again.')
      }
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    loading.value = true
    error.value = null
    try {
      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword,
      })
      if (user.value) {
        user.value.must_change_password = false
      }
      notifications.success('Password changed successfully!')
    } catch (err: unknown) {
      notifications.apiError(err, 'Password change failed')
      const errObj = err as { response?: { data?: { message?: string } } }
      error.value = errObj.response?.data?.message || 'Password change failed'
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
