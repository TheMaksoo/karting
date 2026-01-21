<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <aside 
      class="sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <!-- Logo & Brand -->
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo-icon">🏎️</div>
          <div class="logo-text">
            <div class="brand-name">ELITE KARTING</div>
            <div class="brand-subtitle">Analytics Platform</div>
          </div>
        </div>
      </div>

      <!-- User Card -->
      <div class="user-card">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
        <div class="user-status">
          <div class="status-dot"></div>
        </div>
      </div>

      <!-- Debug: Auth Status (remove after testing) -->
      <div v-if="!isAuthenticated" class="auth-warning">
        ⚠️ Not authenticated! Please log in.
      </div>

      <!-- Navigation -->
      <nav class="navigation">
        <div class="nav-section">
          <div class="nav-section-title">📊 ANALYTICS</div>
          <router-link 
            v-for="item in analyticsMenu" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'active': $route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">👤 USER</div>
          <router-link 
            v-for="item in userMenu" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'active': $route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>

        <div class="nav-section" v-if="isAdmin">
          <div class="nav-section-title">⚙️ MANAGEMENT</div>
          <router-link 
            v-for="item in adminMenu" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'active': $route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Logout Button -->
      <button class="logout-btn" @click="handleLogout">
        <span class="nav-icon">🚪</span>
        <span class="nav-label">Logout</span>
      </button>
      
      <!-- Version -->
      <div class="version-display">
        {{ currentVersion }}
      </div>
      
      <!-- Data Points Counter -->
      <div class="data-points-display">
        {{ dataPointsCount }}
      </div>
    </aside>

    <!-- Mobile Menu Toggle -->
    <button 
      class="mobile-menu-toggle"
      @click="sidebarOpen = !sidebarOpen"
      :class="{ 'active': sidebarOpen }"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="page-title-section">
          <h1>{{ pageTitle }}</h1>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="top-bar-actions">
          <button class="icon-btn" title="Notifications">
            <span class="notification-badge">3</span>
            <i class="fa-solid fa-bell"></i>
          </button>
          <button class="icon-btn" title="Settings" @click="navigateToSettings">
            <i class="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <div class="page-content">
        <slot />
      </div>
    </main>

    <!-- Mobile Overlay -->
    <div 
      class="mobile-overlay"
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiService from '@/services/api'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)
const totalDataPoints = ref(0)

// Generate version timestamp in YYYYMMDDHHMMSS format
const currentVersion = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}`
})

// Format data points count
const dataPointsCount = computed(() => {
  const points = totalDataPoints.value
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(2)}M data points`
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K data points`
  }
  return `${points} data points`
})

// Fetch total database metrics
onMounted(async () => {
  try {
    const response = await apiService.getDatabaseMetrics()
    totalDataPoints.value = response.total_data_points || 0
  } catch (error) {
    console.error('Failed to fetch database metrics:', error)
  }
})

const analyticsMenu = [
  { path: '/home', label: 'Home', icon: '🏠' },
  { path: '/driver-stats', label: 'Driver Stats', icon: '👤' },
  { path: '/geographic', label: 'Geographic', icon: '🗺️' },
  { path: '/session-analysis', label: 'Sessions', icon: '📊' },
  { path: '/temporal', label: 'Temporal', icon: '📈' },
  { path: '/track-performance', label: 'Tracks', icon: '🏁' },
  { path: '/battles', label: 'Battles', icon: '⚔️' },
  { path: '/financial', label: 'Financial', icon: '💰' },
  { path: '/predictive', label: 'Predictive', icon: '🔮' },
]

const userMenu = [
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

const adminMenu = [
  { path: '/admin/data', label: 'Database Overview', icon: '📊' },
  { path: '/admin/tracks', label: 'Track Management', icon: '🏁' },
  { path: '/admin/users', label: 'User Management', icon: '👥' },
  { path: '/admin/driver-management', label: 'Driver Management', icon: '🏎️' },
  { path: '/admin/eml-upload', label: 'EML Upload', icon: '📧' },
  { path: '/admin/styling', label: 'Styling', icon: '🎨' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const isAdmin = computed(() => authStore.isAdmin)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const userName = computed(() => authStore.user?.name || 'User')

const userRole = computed(() => {
  if (authStore.isAdmin) return 'Administrator'
  if (authStore.user?.role === 'driver') return 'Driver'
  return 'User'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const pageTitle = computed(() => {
  const allItems = [...analyticsMenu, ...userMenu, ...adminMenu]
  const item = allItems.find(i => route.path.startsWith(i.path))
  return item?.label || 'Dashboard'
})

const pageSubtitle = computed(() => {
  const subtitles: Record<string, string> = {
    '/home': 'Elite karting analytics dashboard - Overview of all stats and performance',
    '/driver-stats': 'Performance analytics and driver comparisons',
    '/geographic': 'Track locations and regional analysis',
    '/session-analysis': 'Session history and lap data',
    '/temporal': 'Time-based trends and patterns',
    '/track-performance': 'Track-specific statistics',
    '/settings': 'Manage your profile and driver connections',
    '/battles': 'Head-to-head driver comparisons',
    '/financial': 'Cost analysis and spending trends',
    '/predictive': 'Performance predictions and insights',
    '/admin/data': 'View all database records - Sessions, laps, drivers, tracks',
    '/admin/tracks': 'Manage track database',
    '/admin/driver-management': 'Manage driver profiles',
    '/admin/eml-upload': 'Upload and parse EML session files with duplicate detection',
    '/admin/styling': 'Customize dashboard appearance and styling',
    '/admin/settings': 'System configuration',
  }
  return subtitles[route.path] || 'Welcome to your karting portal'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const navigateToSettings = () => {
  router.push({ name: 'user-settings' })
}
</script>

<style scoped>
/* === DASHBOARD CONTAINER === */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  position: relative;
}

/* === SIDEBAR === */
.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2.5rem;
  line-height: 1;
  filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 900;
  font-family: var(--font-display);
  color: var(--primary-color);
  letter-spacing: 0.5px;
  text-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
}

.brand-subtitle {
  font-size: 0.625rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}

/* === USER CARD === */
.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin: 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

.user-card:hover {
  background: var(--card-bg-hover);
  border-color: var(--border-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-status {
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--success-color);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--success-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

/* === AUTH WARNING === */
.auth-warning {
  margin: 0 1rem 1rem 1rem;
  padding: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: var(--radius-md);
  color: #ffc107;
  font-size: 0.75rem;
  text-align: center;
  font-weight: 600;
}

/* === NAVIGATION === */
.navigation {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.navigation::-webkit-scrollbar {
  width: 4px;
}

.navigation::-webkit-scrollbar-track {
  background: transparent;
}

.navigation::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.navigation::-webkit-scrollbar-thumb:hover {
  background: var(--border-light);
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 0 0.75rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-normal);
  position: relative;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--card-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.05));
  color: var(--primary-color);
  font-weight: 600;
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.2);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px var(--primary-color);
}

.nav-icon {
  font-size: 1.125rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-highlight {
  display: none;
}

/* === LOGOUT BUTTON === */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: calc(100% - 2rem);
  margin: 1rem;
  padding: 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.logout-btn:hover {
  background: rgba(248, 81, 73, 0.1);
  border-color: var(--error-color);
  color: var(--error-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.version-display {
  text-align: center;
  padding: 0.5rem 1rem;
  margin: 0 1rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-family: 'Courier New', monospace;
  opacity: 0.5;
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
}

.data-points-display {
  text-align: center;
  padding: 0.5rem 1rem;
  margin: 0 1rem 1rem;
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 600;
  opacity: 0.7;
}

/* === MOBILE MENU TOGGLE === */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 1.25rem;
  left: 1.25rem;
  z-index: 1100;
  width: 44px;
  height: 44px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
}

.mobile-menu-toggle:hover {
  background: var(--card-bg-hover);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
}

.hamburger-line {
  width: 18px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition-normal);
}

.mobile-menu-toggle.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-toggle.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* === MAIN CONTENT === */
.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* === TOP BAR === */
.top-bar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.page-title-section h1 {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  margin-bottom: 0.125rem;
  font-family: var(--font-display);
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

.top-bar-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.icon-btn:hover {
  background: var(--card-bg-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--error-color);
  color: white;
  border-radius: 9px;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-secondary);
  box-shadow: 0 0 10px var(--error-color);
}

/* === PAGE CONTENT === */
.page-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
}

/* === MOBILE OVERLAY === */
.mobile-overlay {
  display: none;
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
  }

  .page-content {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .top-bar {
    padding: 1rem 1.5rem;
  }

  .page-title-section h1 {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .top-bar-actions {
    gap: 0.5rem;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>
