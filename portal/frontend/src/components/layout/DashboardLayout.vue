<template>
  <div class="dashboard-layout">
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <div class="sidebar-header">
        <h1 class="sidebar-title">Karting Dashboard</h1>
        <button @click="toggleSidebar" class="sidebar-toggle sidebar-toggle--mobile">
          ✕
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-details">
            <p class="user-name">{{ authStore.user?.name }}</p>
            <p class="user-role">{{ authStore.user?.role }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="logout-button">
          Logout
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="top-bar">
        <button @click="toggleSidebar" class="sidebar-toggle sidebar-toggle--desktop">
          ☰
        </button>
        <h2 class="page-title">{{ pageTitle }}</h2>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>

    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)

const navItems = computed(() => {
  const items = [
    { to: '/driver-stats', label: 'Driver Stats', icon: '👤' },
    { to: '/geographic', label: 'Geographic', icon: '🗺️' },
    { to: '/session-analysis', label: 'Session Analysis', icon: '📊' },
    { to: '/temporal', label: 'Temporal', icon: '📈' },
    { to: '/track-performance', label: 'Track Performance', icon: '🏁' },
    { to: '/battles', label: 'Battles', icon: '⚔️' },
    { to: '/financial', label: 'Financial', icon: '💰' },
    { to: '/predictive', label: 'Predictive', icon: '🔮' },
  ]

  if (authStore.isAdmin) {
    items.push({ to: '/admin', label: 'Admin', icon: '⚙️' })
  }

  return items
})

const pageTitle = computed(() => {
  const item = navItems.value.find(i => route.path.startsWith(i.to))
  return item?.label || 'Dashboard'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #1f2937;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-toggle--mobile {
  display: none;
}

.sidebar-toggle--desktop {
  display: none;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #d1d5db;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item--active {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-left: 3px solid #3b82f6;
  padding-left: 17px;
}

.nav-icon {
  font-size: 20px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  text-transform: capitalize;
}

.logout-button {
  width: 100%;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fee2e2;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.top-bar {
  background: white;
  padding: 16px 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.content {
  flex: 1;
  padding: 24px;
}

.sidebar-overlay {
  display: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-toggle--mobile {
    display: block;
  }

  .sidebar-toggle--desktop {
    display: block;
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .sidebar {
    z-index: 1000;
  }
}
</style>
