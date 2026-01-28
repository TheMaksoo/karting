import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChartConfig } from '../useChartConfig'

// Mock the driverColors utility
vi.mock('@/utils/driverColors', () => ({
  getColorPalette: () => ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
  getDriverColor: (id: number, dbColor?: string) => dbColor || `#${id.toString(16).padStart(6, '0')}`,
  getDriverColors: (ids: number[], dbColors?: Map<number, string>) => 
    ids.map(id => dbColors?.get(id) || `#${id.toString(16).padStart(6, '0')}`)
}))

describe('useChartConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return all expected properties', () => {
      const config = useChartConfig()
      
      expect(config.colorPalette).toBeDefined()
      expect(config.baseOptions).toBeDefined()
      expect(config.lineChartOptions).toBeDefined()
      expect(config.barChartOptions).toBeDefined()
      expect(config.radarChartOptions).toBeDefined()
      expect(config.pieChartOptions).toBeDefined()
      expect(config.scatterChartOptions).toBeDefined()
      expect(config.getColor).toBeDefined()
      expect(config.generateColors).toBeDefined()
      expect(config.getColorsForDrivers).toBeDefined()
      expect(config.getColorForDriver).toBeDefined()
      expect(config.formatLapTime).toBeDefined()
      expect(config.formatNumber).toBeDefined()
    })

    it('should have a valid color palette', () => {
      const { colorPalette } = useChartConfig()
      expect(Array.isArray(colorPalette)).toBe(true)
      expect(colorPalette.length).toBeGreaterThan(0)
    })
  })

  describe('baseOptions', () => {
    it('should have responsive set to true', () => {
      const { baseOptions } = useChartConfig()
      expect(baseOptions.responsive).toBe(true)
    })

    it('should have maintainAspectRatio set to false', () => {
      const { baseOptions } = useChartConfig()
      expect(baseOptions.maintainAspectRatio).toBe(false)
    })

    it('should have legend plugin configured', () => {
      const { baseOptions } = useChartConfig()
      expect(baseOptions.plugins?.legend?.display).toBe(true)
      expect(baseOptions.plugins?.legend?.position).toBe('top')
    })

    it('should have tooltip plugin configured', () => {
      const { baseOptions } = useChartConfig()
      expect(baseOptions.plugins?.tooltip?.enabled).toBe(true)
      expect(baseOptions.plugins?.tooltip?.mode).toBe('index')
    })
  })

  describe('lineChartOptions', () => {
    it('should be a computed ref', () => {
      const { lineChartOptions } = useChartConfig()
      expect(lineChartOptions.value).toBeDefined()
    })

    it('should have scales configured', () => {
      const { lineChartOptions } = useChartConfig()
      expect(lineChartOptions.value.scales?.y).toBeDefined()
      expect(lineChartOptions.value.scales?.x).toBeDefined()
    })

    it('should have y-axis beginAtZero', () => {
      const { lineChartOptions } = useChartConfig()
      const yScale = lineChartOptions.value.scales?.y as { beginAtZero?: boolean } | undefined
      expect(yScale?.beginAtZero).toBe(true)
    })
  })

  describe('barChartOptions', () => {
    it('should be a computed ref', () => {
      const { barChartOptions } = useChartConfig()
      expect(barChartOptions.value).toBeDefined()
    })

    it('should have scales configured', () => {
      const { barChartOptions } = useChartConfig()
      expect(barChartOptions.value.scales?.y).toBeDefined()
      expect(barChartOptions.value.scales?.x).toBeDefined()
    })
  })

  describe('radarChartOptions', () => {
    it('should be a computed ref', () => {
      const { radarChartOptions } = useChartConfig()
      expect(radarChartOptions.value).toBeDefined()
    })

    it('should have radial scale configured', () => {
      const { radarChartOptions } = useChartConfig()
      expect(radarChartOptions.value.scales?.r).toBeDefined()
    })
  })

  describe('pieChartOptions', () => {
    it('should be a computed ref', () => {
      const { pieChartOptions } = useChartConfig()
      expect(pieChartOptions.value).toBeDefined()
    })

    it('should have legend on the right', () => {
      const { pieChartOptions } = useChartConfig()
      expect(pieChartOptions.value.plugins?.legend?.position).toBe('right')
    })
  })

  describe('scatterChartOptions', () => {
    it('should be a computed ref', () => {
      const { scatterChartOptions } = useChartConfig()
      expect(scatterChartOptions.value).toBeDefined()
    })

    it('should have both axes beginAtZero', () => {
      const { scatterChartOptions } = useChartConfig()
      const yScale = scatterChartOptions.value.scales?.y as { beginAtZero?: boolean } | undefined
      const xScale = scatterChartOptions.value.scales?.x as { beginAtZero?: boolean } | undefined
      expect(yScale?.beginAtZero).toBe(true)
      expect(xScale?.beginAtZero).toBe(true)
    })
  })

  describe('getColor', () => {
    it('should return a color from the palette', () => {
      const { getColor, colorPalette } = useChartConfig()
      const color = getColor(0)
      expect(colorPalette).toContain(color)
    })

    it('should wrap around when index exceeds palette length', () => {
      const { getColor, colorPalette } = useChartConfig()
      const color = getColor(colorPalette.length)
      expect(color).toBe(colorPalette[0])
    })

    it('should handle large indices', () => {
      const { getColor } = useChartConfig()
      const color = getColor(1000)
      expect(typeof color).toBe('string')
      expect(color.startsWith('#')).toBe(true)
    })
  })

  describe('generateColors', () => {
    it('should generate the requested number of colors', () => {
      const { generateColors } = useChartConfig()
      const colors = generateColors(5)
      expect(colors.length).toBe(5)
    })

    it('should generate hex colors by default', () => {
      const { generateColors } = useChartConfig()
      const colors = generateColors(3)
      colors.forEach(color => {
        expect(color.startsWith('#')).toBe(true)
      })
    })

    it('should generate rgba colors when alpha < 1', () => {
      const { generateColors } = useChartConfig()
      const colors = generateColors(3, 0.5)
      colors.forEach(color => {
        expect(color.startsWith('rgba(')).toBe(true)
        expect(color).toContain('0.5')
      })
    })

    it('should handle alpha = 0', () => {
      const { generateColors } = useChartConfig()
      const colors = generateColors(2, 0)
      colors.forEach(color => {
        expect(color.startsWith('rgba(')).toBe(true)
      })
    })
  })

  describe('getColorsForDrivers', () => {
    it('should return colors for driver IDs', () => {
      const { getColorsForDrivers } = useChartConfig()
      const colors = getColorsForDrivers([1, 2, 3])
      expect(colors.length).toBe(3)
    })

    it('should use database colors when provided', () => {
      const { getColorsForDrivers } = useChartConfig()
      const dbColors = new Map([[1, '#FF0000'], [2, '#00FF00']])
      const colors = getColorsForDrivers([1, 2], dbColors)
      expect(colors[0]).toBe('#FF0000')
      expect(colors[1]).toBe('#00FF00')
    })
  })

  describe('getColorForDriver', () => {
    it('should return a color for a driver ID', () => {
      const { getColorForDriver } = useChartConfig()
      const color = getColorForDriver(1)
      expect(typeof color).toBe('string')
    })

    it('should use database color when provided', () => {
      const { getColorForDriver } = useChartConfig()
      const color = getColorForDriver(1, '#CUSTOM')
      expect(color).toBe('#CUSTOM')
    })
  })

  describe('formatLapTime', () => {
    it('should format seconds to mm:ss.ms format', () => {
      const { formatLapTime } = useChartConfig()
      const result = formatLapTime(65.123)
      expect(result).toBe('1:05.123')
    })

    it('should handle zero seconds', () => {
      const { formatLapTime } = useChartConfig()
      const result = formatLapTime(0)
      expect(result).toBe('0:00.000')
    })

    it('should handle sub-minute times', () => {
      const { formatLapTime } = useChartConfig()
      const result = formatLapTime(45.5)
      expect(result).toBe('0:45.500')
    })

    it('should handle multi-minute times', () => {
      const { formatLapTime } = useChartConfig()
      const result = formatLapTime(125.456)
      expect(result).toBe('2:05.456')
    })

    it('should pad seconds correctly', () => {
      const { formatLapTime } = useChartConfig()
      const result = formatLapTime(61.5)
      expect(result).toBe('1:01.500')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      const { formatNumber } = useChartConfig()
      const result = formatNumber(1000)
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    it('should handle small numbers', () => {
      const { formatNumber } = useChartConfig()
      const result = formatNumber(42)
      expect(result).toBe('42')
    })

    it('should handle large numbers', () => {
      const { formatNumber } = useChartConfig()
      const result = formatNumber(1234567)
      expect(result.length).toBeGreaterThan(7) // Should have commas
    })

    it('should handle zero', () => {
      const { formatNumber } = useChartConfig()
      const result = formatNumber(0)
      expect(result).toBe('0')
    })
  })
})
