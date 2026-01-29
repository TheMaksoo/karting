import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiService from '@/services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
      redirect: { name: 'home' },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'driver-stats',
          name: 'driver-stats',
          component: () => import('../views/DriverStatsView.vue'),
        },
        {
          path: 'geographic',
          name: 'geographic',
          component: () => import('../views/GeographicView.vue'),
        },
        {
          path: 'session-analysis',
          name: 'session-analysis',
          component: () => import('../views/SessionAnalysisView.vue'),
        },
        {
          path: 'temporal',
          name: 'temporal',
          component: () => import('../views/TemporalView.vue'),
        },
        {
          path: 'track-performance',
          name: 'track-performance',
          component: () => import('../views/TrackPerformanceView.vue'),
        },
        {
          path: 'battles',
          name: 'battles',
          component: () => import('../views/BattlesView.vue'),
        },
        {
          path: 'financial',
          name: 'financial',
          component: () => import('../views/FinancialView.vue'),
        },
        {
          path: 'predictive',
          name: 'predictive',
          component: () => import('../views/PredictiveView.vue'),
        },
        {
          path: 'settings',
          name: 'user-settings',
          component: () => import('../views/UserSettingsView.vue'),
        },
        {
          path: 'admin',
          name: 'admin',
          redirect: { name: 'track-management' },
          meta: { requiresAdmin: true },
          children: [
            {
              path: 'data',
              name: 'admin-data',
              component: () => import('../views/AdminDataView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'tracks',
              name: 'track-management',
              component: () => import('../views/TrackManagementView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'users',
              name: 'user-management',
              component: () => import('../views/AdminUserManagementView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'eml-upload',
              name: 'eml-upload',
              component: () => import('../views/EmlUploadView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'driver-management',
              name: 'driver-management',
              component: () => import('../views/DriverManagementView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'settings',
              name: 'settings',
              component: () => import('../views/AdminView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'styling',
              name: 'styling',
              component: () => import('../views/AdminStylingView.vue'),
              meta: { requiresAdmin: true },
            },
          ],
        },
      ],
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const hasToken = apiService.isAuthenticated()

  // Only fetch user if we have a token but no user data
  if (!authStore.user && hasToken) {
    try {
      await authStore.fetchCurrentUser()
    } catch (error) {
      console.warn('Failed to fetch user in router guard:', error)
      // Token might be expired, clear it
      apiService.clearAuth()
    }
  }

  // Re-check authentication status after potential user fetch
  const isAuthenticated = authStore.isAuthenticated

  // Check if any matched route requires auth (including parent routes)
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  // Redirect authenticated users away from login
  if (requiresGuest && isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Require authentication - redirect to login if not authenticated
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  // Require admin role
  if (requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router

