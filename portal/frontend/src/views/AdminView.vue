<template>
  <div class="admin-view">
    <div class="placeholder-card">
      <div class="placeholder-icon">🚧</div>
      <h1>{{ title }}</h1>
      <p class="subtitle">This feature is coming soon!</p>
      <p class="description">
        This page is currently under development. In the meantime, you can use the other admin features:
      </p>
      <div class="feature-links">
        <router-link to="/admin/tracks" class="feature-link">
          <span class="link-icon">🏁</span>
          <span>Track Management</span>
        </router-link>
        <router-link to="/admin/upload" class="feature-link">
          <span class="link-icon">📤</span>
          <span>Upload Data</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => {
  if (route.name === 'driver-management') return 'Driver Management'
  if (route.name === 'settings') return 'Settings'
  return 'Admin'
})
</script>

<style scoped>
.admin-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.placeholder-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  max-width: 600px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.placeholder-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1rem 0;
}

.subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
}

.description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.feature-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.feature-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.link-icon {
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .placeholder-card {
    padding: 3rem 2rem;
  }

  h1 {
    font-size: 2rem;
  }

  .feature-links {
    flex-direction: column;
  }

  .feature-link {
    width: 100%;
    justify-content: center;
  }
}
</style>
