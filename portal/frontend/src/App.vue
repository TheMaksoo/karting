<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useStyleVariables } from '@/composables/useStyleVariables'

// Load dynamic styles from database
useStyleVariables()
</script>

<template>
  <RouterView />
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