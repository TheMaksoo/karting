import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStyleVariables, type StyleVariable, type GroupedStyleVariables } from '../useStyleVariables'

// Mock localStorage
const mockLocalStorage: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
  }),
  key: vi.fn(),
  length: 0
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useStyleVariables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties', () => {
      const styleVars = useStyleVariables()
      
      expect(styleVars).toHaveProperty('variables')
      expect(styleVars).toHaveProperty('loading')
      expect(styleVars).toHaveProperty('error')
    })

    it('should have loading state as false initially', () => {
      const styleVars = useStyleVariables()
      expect(styleVars.loading.value).toBe(false)
    })

    it('should have error state as null initially', () => {
      const styleVars = useStyleVariables()
      expect(styleVars.error.value).toBeNull()
    })

    it('should have empty variables initially', () => {
      const styleVars = useStyleVariables()
      expect(styleVars.variables.value).toEqual({})
    })
  })

  describe('fetchVariables', () => {
    it('should have fetchVariables method', () => {
      const styleVars = useStyleVariables()
      expect(typeof styleVars.fetchVariables).toBe('function')
    })

    it('should set loading to true during fetch', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves
      
      const styleVars = useStyleVariables()
      const fetchPromise = styleVars.fetchVariables()
      
      expect(styleVars.loading.value).toBe(true)
    })

    it('should handle successful fetch', async () => {
      const mockVariables: GroupedStyleVariables = {
        colors: [
          {
            id: 1,
            key: 'primary-color',
            value: '#3498db',
            category: 'colors',
            label: 'Primary Color',
            type: 'color'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ variables: mockVariables })
      })

      const styleVars = useStyleVariables()
      await styleVars.fetchVariables()

      expect(styleVars.loading.value).toBe(false)
      expect(styleVars.error.value).toBeNull()
    })

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const styleVars = useStyleVariables()
      await styleVars.fetchVariables()

      expect(styleVars.loading.value).toBe(false)
      expect(styleVars.error.value).not.toBeNull()
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const styleVars = useStyleVariables()
      await styleVars.fetchVariables()

      expect(styleVars.loading.value).toBe(false)
      expect(styleVars.error.value).toBe('Network error')
    })
  })

  describe('updateVariable', () => {
    it('should have updateVariable method', () => {
      const styleVars = useStyleVariables()
      expect(typeof styleVars.updateVariable).toBe('function')
    })

    it('should return true on successful update', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ variables: {} }) })

      const styleVars = useStyleVariables()
      const result = await styleVars.updateVariable(1, '#ff0000')

      expect(result).toBe(true)
    })

    it('should return false on failed update', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const styleVars = useStyleVariables()
      const result = await styleVars.updateVariable(1, '#ff0000')

      expect(result).toBe(false)
    })
  })

  describe('bulkUpdate', () => {
    it('should have bulkUpdate method', () => {
      const styleVars = useStyleVariables()
      expect(typeof styleVars.bulkUpdate).toBe('function')
    })
  })

  describe('reset', () => {
    it('should have reset method', () => {
      const styleVars = useStyleVariables()
      expect(typeof styleVars.reset).toBe('function')
    })
  })
})

describe('StyleVariable interface', () => {
  it('should accept valid style variable object', () => {
    const variable: StyleVariable = {
      id: 1,
      key: 'primary-color',
      value: '#3498db',
      category: 'colors',
      label: 'Primary Color',
      type: 'color'
    }

    expect(variable.id).toBe(1)
    expect(variable.key).toBe('primary-color')
    expect(variable.type).toBe('color')
  })

  it('should accept style variable with description', () => {
    const variable: StyleVariable = {
      id: 2,
      key: 'font-size-base',
      value: '16px',
      category: 'typography',
      label: 'Base Font Size',
      description: 'The base font size for the application',
      type: 'size'
    }

    expect(variable.description).toBe('The base font size for the application')
  })

  it('should accept style variable with metadata', () => {
    const variable: StyleVariable = {
      id: 3,
      key: 'border-radius',
      value: '4',
      category: 'layout',
      label: 'Border Radius',
      type: 'number',
      metadata: {
        min: '0',
        max: '50',
        unit: 'px'
      }
    }

    expect(variable.metadata?.min).toBe('0')
    expect(variable.metadata?.max).toBe('50')
    expect(variable.metadata?.unit).toBe('px')
  })

  it('should handle all type values', () => {
    const colorVar: StyleVariable = {
      id: 1, key: 'test', value: '#fff', category: 'test', label: 'Test', type: 'color'
    }
    const sizeVar: StyleVariable = {
      id: 2, key: 'test', value: '16px', category: 'test', label: 'Test', type: 'size'
    }
    const numberVar: StyleVariable = {
      id: 3, key: 'test', value: '100', category: 'test', label: 'Test', type: 'number'
    }
    const stringVar: StyleVariable = {
      id: 4, key: 'test', value: 'sans-serif', category: 'test', label: 'Test', type: 'string'
    }

    expect(colorVar.type).toBe('color')
    expect(sizeVar.type).toBe('size')
    expect(numberVar.type).toBe('number')
    expect(stringVar.type).toBe('string')
  })
})

describe('GroupedStyleVariables interface', () => {
  it('should accept grouped variables object', () => {
    const grouped: GroupedStyleVariables = {
      colors: [
        { id: 1, key: 'primary', value: '#3498db', category: 'colors', label: 'Primary', type: 'color' }
      ],
      typography: [
        { id: 2, key: 'font-size', value: '16px', category: 'typography', label: 'Font Size', type: 'size' }
      ],
      layout: [
        { id: 3, key: 'spacing', value: '8', category: 'layout', label: 'Spacing', type: 'number' }
      ]
    }

    expect(Object.keys(grouped)).toHaveLength(3)
    expect(grouped.colors).toHaveLength(1)
    expect(grouped.typography).toHaveLength(1)
    expect(grouped.layout).toHaveLength(1)
  })

  it('should allow empty categories', () => {
    const grouped: GroupedStyleVariables = {}
    expect(Object.keys(grouped)).toHaveLength(0)
  })

  it('should allow multiple variables per category', () => {
    const grouped: GroupedStyleVariables = {
      colors: [
        { id: 1, key: 'primary', value: '#3498db', category: 'colors', label: 'Primary', type: 'color' },
        { id: 2, key: 'secondary', value: '#2ecc71', category: 'colors', label: 'Secondary', type: 'color' },
        { id: 3, key: 'accent', value: '#e74c3c', category: 'colors', label: 'Accent', type: 'color' }
      ]
    }

    expect(grouped.colors).toHaveLength(3)
  })
})
