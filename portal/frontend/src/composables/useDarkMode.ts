/**
 * Dark Mode Composable - Reactive dark/light mode management.
 *
 * @module composables/useDarkMode
 */

import { ref, watch, onMounted } from 'vue'

/**
 * Theme type definition.
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Storage key for persisting theme preference.
 */
const STORAGE_KEY = 'karting-theme'

/**
 * Current theme preference.
 */
const theme = ref<Theme>('system')

/**
 * Whether dark mode is currently active.
 */
const isDark = ref(false)

/**
 * Check if user prefers dark mode via system settings.
 *
 * @returns True if system prefers dark mode
 */
function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Apply the current theme to the document.
 */
function applyTheme(): void {
  const shouldBeDark = theme.value === 'dark' || (theme.value === 'system' && systemPrefersDark())

  isDark.value = shouldBeDark

  if (shouldBeDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', shouldBeDark ? '#1a1a2e' : '#ffffff')
  }
}

/**
 * Initialize theme from storage and system preference.
 */
function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null

  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    theme.value = stored
  } else {
    theme.value = 'system'
  }

  applyTheme()

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') {
      applyTheme()
    }
  })
}

/**
 * Dark mode composable.
 *
 * @returns Theme state and control methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { useDarkMode } from '@/composables/useDarkMode'
 *
 * const { isDark, theme, setTheme, toggleDark } = useDarkMode()
 * </script>
 *
 * <template>
 *   <button @click="toggleDark">
 *     {{ isDark ? '🌙' : '☀️' }}
 *   </button>
 * </template>
 * ```
 */
export function useDarkMode() {
  onMounted(() => {
    initTheme()
  })

  watch(theme, (newTheme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme()
  })

  /**
   * Set the theme preference.
   *
   * @param newTheme - The theme to set
   */
  function setTheme(newTheme: Theme): void {
    theme.value = newTheme
  }

  /**
   * Toggle between dark and light mode.
   * If currently on system, switches to opposite of current state.
   */
  function toggleDark(): void {
    if (isDark.value) {
      theme.value = 'light'
    } else {
      theme.value = 'dark'
    }
  }

  /**
   * Cycle through themes: light -> dark -> system -> light.
   */
  function cycleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    theme.value = themes[nextIndex] as Theme
  }

  return {
    /** Whether dark mode is currently active */
    isDark,
    /** Current theme preference */
    theme,
    /** Set a specific theme */
    setTheme,
    /** Toggle dark mode */
    toggleDark,
    /** Cycle through themes */
    cycleTheme,
  }
}

export default useDarkMode
