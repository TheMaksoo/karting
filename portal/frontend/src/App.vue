<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useStyleVariables } from '@/composables/useStyleVariables'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

// Load dynamic styles from database
useStyleVariables()

function handleGlobalError(error: Error, info: { message: string; component?: string }) {
  // Could send to error tracking service (Sentry, etc.)
  console.error('[App] Global error:', error.message, 'in', info.component)
}
</script>

<template>
  <ErrorBoundary
    fallback-message="The application encountered an error. Please try refreshing the page."
    :show-details="true"
    :on-error="handleGlobalError"
  >
    <RouterView />
  </ErrorBoundary>
</template>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/home-sections.scss';

/* Global full-screen dark mode styling */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}
</style>