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
              path: 'upload',
              name: 'upload-data',
              component: () => import('../views/UploadDataView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'driver-management',
              name: 'driver-management',
              component: () => import('../views/AdminView.vue'),
              meta: { requiresAdmin: true },
            },
            {
              path: 'settings',
              name: 'settings',
              component: () => import('../views/AdminView.vue'),
              meta: { requiresAdmin: true },
            },
          ],
        },
      ],
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check if user is authenticated
  if (!authStore.user && apiService.isAuthenticated()) {
    await authStore.fetchCurrentUser()
    
    // If fetch failed and token was cleared, redirect to login
    if (!authStore.user && to.meta.requiresAuth) {
      return next({ name: 'login' })
    }
  }

  // Redirect authenticated users away from login
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Require authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // Require admin role
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router

