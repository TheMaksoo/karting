import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDriverColor,
  setDriverColor,
  getDriverColors,
  clearDriverColors,
  getColorPalette,
  initializeDriverColors,
} from '../driverColors'

describe('driverColors', () => {
  beforeEach(() => {
    clearDriverColors()
  })

  describe('getDriverColor', () => {
    it('should return a color from the palette for a driver', () => {
      const color = getDriverColor(1)
      expect(color).toBe('#FF6384') // First color in palette
    })

    it('should return the same color for the same driver', () => {
      const color1 = getDriverColor(1)
      const color2 = getDriverColor(1)
      expect(color1).toBe(color2)
    })

    it('should return different colors for different drivers', () => {
      const color1 = getDriverColor(1)
      const color2 = getDriverColor(2)
      expect(color1).not.toBe(color2)
    })

    it('should cycle through palette colors', () => {
      const color1 = getDriverColor(1)
      const color11 = getDriverColor(11)
      expect(color1).toBe(color11) // Cycles back after 10 colors
    })

    it('should use database color if provided', () => {
      const dbColor = '#123456'
      const color = getDriverColor(1, dbColor)
      expect(color).toBe(dbColor)
    })

    it('should store database color for future calls', () => {
      const dbColor = '#123456'
      getDriverColor(1, dbColor)
      const color = getDriverColor(1)
      expect(color).toBe(dbColor)
    })
  })

  describe('setDriverColor', () => {
    it('should set a custom color for a driver', () => {
      setDriverColor(1, '#ABCDEF')
      const color = getDriverColor(1)
      expect(color).toBe('#ABCDEF')
    })

    it('should override palette color', () => {
      getDriverColor(1) // Get palette color first
      setDriverColor(1, '#ABCDEF')
      const color = getDriverColor(1)
      expect(color).toBe('#ABCDEF')
    })
  })

  describe('getDriverColors', () => {
    it('should return colors for multiple drivers', () => {
      const colors = getDriverColors([1, 2, 3])
      expect(colors).toHaveLength(3)
      expect(colors[0]).toBe('#FF6384')
      expect(colors[1]).toBe('#36A2EB')
      expect(colors[2]).toBe('#FFCE56')
    })

    it('should use database colors if provided', () => {
      const dbColors = new Map<number, string>([
        [1, '#111111'],
        [3, '#333333'],
      ])
      const colors = getDriverColors([1, 2, 3], dbColors)
      expect(colors[0]).toBe('#111111')
      expect(colors[1]).toBe('#36A2EB') // No db color, uses palette
      expect(colors[2]).toBe('#333333')
    })
  })

  describe('clearDriverColors', () => {
    it('should clear all cached colors', () => {
      setDriverColor(1, '#ABCDEF')
      clearDriverColors()
      const color = getDriverColor(1)
      expect(color).toBe('#FF6384') // Back to palette color
    })
  })

  describe('getColorPalette', () => {
    it('should return the default color palette', () => {
      const palette = getColorPalette()
      expect(palette).toHaveLength(10)
      expect(palette[0]).toBe('#FF6384')
    })

    it('should return a copy of the palette', () => {
      const palette1 = getColorPalette()
      const palette2 = getColorPalette()
      expect(palette1).not.toBe(palette2)
      expect(palette1).toEqual(palette2)
    })
  })

  describe('initializeDriverColors', () => {
    it('should initialize colors from driver array', () => {
      const drivers = [
        { id: 1, color: '#111111' },
        { id: 2, color: '#222222' },
        { id: 3 }, // No color
      ]
      initializeDriverColors(drivers)
      expect(getDriverColor(1)).toBe('#111111')
      expect(getDriverColor(2)).toBe('#222222')
      expect(getDriverColor(3)).toBe('#FFCE56') // Uses palette
    })
  })
})
