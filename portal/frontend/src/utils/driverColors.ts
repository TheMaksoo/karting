/**
 * Centralized Driver Color Management
 * Ensures consistent colors across all charts and components
 */

// Default color palette for drivers
const DEFAULT_COLOR_PALETTE = [
  '#FF6384', // Red
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#FF6B9D', // Pink
  '#36D2EB', // Cyan
  '#FFDA6B', // Gold
  '#5BDB95', // Green
]

// Store for driver-specific colors (can be updated from database)
const driverColorMap = new Map<number, string>()

/**
 * Get color for a specific driver
 * Uses database color if available, otherwise assigns from palette
 */
export function getDriverColor(driverId: number, dbColor?: string): string {
  // If database color is provided, use and store it
  if (dbColor) {
    driverColorMap.set(driverId, dbColor)
    return dbColor
  }

  // Check if we already have a color for this driver
  if (driverColorMap.has(driverId)) {
    return driverColorMap.get(driverId)!
  }

  // Assign a color from the palette based on driver ID
  const color = DEFAULT_COLOR_PALETTE[(driverId - 1) % DEFAULT_COLOR_PALETTE.length]
  driverColorMap.set(driverId, color!)
  return color!
}

/**
 * Update driver color from database
 */
export function setDriverColor(driverId: number, color: string): void {
  driverColorMap.set(driverId, color)
}

/**
 * Get colors for multiple drivers
 */
export function getDriverColors(driverIds: number[], dbColors?: Map<number, string>): string[] {
  return driverIds.map(id => {
    const dbColor = dbColors?.get(id)
    return getDriverColor(id, dbColor)
  })
}

/**
 * Clear cached colors (useful when re-loading data)
 */
export function clearDriverColors(): void {
  driverColorMap.clear()
}

/**
 * Get the default color palette
 */
export function getColorPalette(): string[] {
  return [...DEFAULT_COLOR_PALETTE]
}

/**
 * Initialize driver colors from database
 */
export function initializeDriverColors(drivers: Array<{ id: number; color?: string }>): void {
  drivers.forEach(driver => {
    if (driver.color) {
      setDriverColor(driver.id, driver.color)
    }
  })
}
