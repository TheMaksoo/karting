import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDarkMode, type Theme } from '../useDarkMode'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia, writable: true })

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()

    // Reset document classList
    document.documentElement.classList.remove('dark')

    // Reset matchMedia mock
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties', () => {
      const darkMode = useDarkMode()

      expect(darkMode).toHaveProperty('isDark')
      expect(darkMode).toHaveProperty('theme')
      expect(darkMode).toHaveProperty('setTheme')
      expect(darkMode).toHaveProperty('toggleDark')
      expect(darkMode).toHaveProperty('cycleTheme')
    })

    it('should have setTheme as a function', () => {
      const { setTheme } = useDarkMode()
      expect(typeof setTheme).toBe('function')
    })

    it('should have toggleDark as a function', () => {
      const { toggleDark } = useDarkMode()
      expect(typeof toggleDark).toBe('function')
    })

    it('should have cycleTheme as a function', () => {
      const { cycleTheme } = useDarkMode()
      expect(typeof cycleTheme).toBe('function')
    })
  })

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const { theme, setTheme } = useDarkMode()

      setTheme('light')
      expect(theme.value).toBe('light')
    })

    it('should set theme to dark', () => {
      const { theme, setTheme } = useDarkMode()

      setTheme('dark')
      expect(theme.value).toBe('dark')
    })

    it('should set theme to system', () => {
      const { theme, setTheme } = useDarkMode()

      setTheme('system')
      expect(theme.value).toBe('system')
    })
  })

  describe('toggleDark', () => {
    it('should toggle from light to dark', () => {
      const { theme, setTheme, toggleDark } = useDarkMode()

      setTheme('light')
      toggleDark()

      expect(theme.value).toBe('dark')
    })

    it('should toggle from dark to light', () => {
      const { theme, setTheme, toggleDark } = useDarkMode()

      setTheme('dark')
      toggleDark()

      expect(theme.value).toBe('light')
    })
  })

  describe('cycleTheme', () => {
    it('should cycle from light to dark', () => {
      const { theme, setTheme, cycleTheme } = useDarkMode()

      setTheme('light')
      cycleTheme()

      expect(theme.value).toBe('dark')
    })

    it('should cycle from dark to system', () => {
      const { theme, setTheme, cycleTheme } = useDarkMode()

      setTheme('dark')
      cycleTheme()

      expect(theme.value).toBe('system')
    })

    it('should cycle from system to light', () => {
      const { theme, setTheme, cycleTheme } = useDarkMode()

      setTheme('system')
      cycleTheme()

      expect(theme.value).toBe('light')
    })

    it('should complete full cycle', () => {
      const { theme, setTheme, cycleTheme } = useDarkMode()

      setTheme('light')

      cycleTheme() // -> dark
      expect(theme.value).toBe('dark')

      cycleTheme() // -> system
      expect(theme.value).toBe('system')

      cycleTheme() // -> light
      expect(theme.value).toBe('light')
    })
  })

  describe('isDark reactive state', () => {
    it('should expose isDark as a ref', () => {
      const { isDark } = useDarkMode()
      expect(isDark).toHaveProperty('value')
    })

    it('should expose theme as a ref', () => {
      const { theme } = useDarkMode()
      expect(theme).toHaveProperty('value')
    })
  })

  describe('theme values', () => {
    it('should accept light theme', () => {
      const { setTheme, theme } = useDarkMode()
      setTheme('light')
      expect(['light', 'dark', 'system']).toContain(theme.value)
    })

    it('should accept dark theme', () => {
      const { setTheme, theme } = useDarkMode()
      setTheme('dark')
      expect(['light', 'dark', 'system']).toContain(theme.value)
    })

    it('should accept system theme', () => {
      const { setTheme, theme } = useDarkMode()
      setTheme('system')
      expect(['light', 'dark', 'system']).toContain(theme.value)
    })
  })
})
