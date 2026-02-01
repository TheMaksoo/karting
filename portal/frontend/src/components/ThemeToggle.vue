<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="toggleDark"
  >
    <span class="theme-toggle-icon" :class="{ dark: isDark }">
      <!-- Sun icon -->
      <svg
        v-if="!isDark"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <!-- Moon icon -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </span>
    <span class="sr-only">{{ ariaLabel }}</span>
  </button>
</template>

<script setup lang="ts">
/**
 * ThemeToggle Component - Dark/light mode toggle button.
 *
 * @component
 * @example
 * ```vue
 * <template>
 *   <ThemeToggle />
 * </template>
 * ```
 */

import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDark } = useDarkMode()

const ariaLabel = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'))
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  color: var(--color-text, #374151);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.theme-toggle:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.theme-toggle:focus {
  outline: 3px solid var(--color-focus, #3b82f6);
  outline-offset: 2px;
}

.theme-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease-in-out;
}

.theme-toggle-icon.dark {
  transform: rotate(180deg);
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Dark mode styles */
:root.dark .theme-toggle {
  border-color: var(--color-border-dark, #374151);
  color: var(--color-text-dark, #e5e7eb);
}

:root.dark .theme-toggle:hover {
  background: var(--color-bg-hover-dark, #374151);
}
</style>
