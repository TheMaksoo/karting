<template>
  <a
    href="#main-content"
    class="skip-link"
    @click.prevent="skipToContent"
    role="link"
    aria-label="Skip to main content"
  >
    Skip to content
  </a>
</template>

<script setup lang="ts">
/**
 * SkipLink Component - Accessibility skip navigation link.
 *
 * This component provides a keyboard-accessible link that allows users
 * to skip navigation and jump directly to the main content.
 *
 * @component
 * @example
 * ```vue
 * <template>
 *   <SkipLink />
 *   <nav>...</nav>
 *   <main id="main-content">...</main>
 * </template>
 * ```
 */

/**
 * Skip to the main content and focus on it.
 */
function skipToContent(): void {
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    mainContent.focus()
    mainContent.scrollIntoView()
  }
}
</script>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 0.5rem 0;
  transition: top 0.2s ease-in-out;
}

.skip-link:focus {
  top: 0;
  outline: 3px solid var(--color-focus, #60a5fa);
  outline-offset: 2px;
}

/* Dark mode support */
:root.dark .skip-link {
  background-color: var(--color-primary-dark, #2563eb);
}
</style>
