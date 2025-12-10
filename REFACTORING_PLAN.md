# HomeView Refactoring Plan

## Current State
- HomeView.vue: ~4082 lines (MASSIVE!)
- Includes: Template, Logic, and 3400+ lines of CSS
- Already created: `styles/HomeView.css` with base styles
- Already created: `QuickStats.vue` component

## Components to Extract

### 1. DriverActivityChart.vue ✓ IN PROGRESS
**Extract From:** Lines ~56-86 (template), Lines ~591-910 (logic)
**Props:** 
- `activityData: any[]`
- `selectedDrivers: string[]`
- `allDrivers: string[]`
**Emits:**
- `toggle-driver(driver: string)`
- `select-all()`
- `show-only-me()`
**Includes:**
- Driver selection chips
- Chart.js canvas
- Driver toggle logic
- Chart creation/refresh logic

### 2. ConsistencyGauge.vue
**Extract From:** Lines ~88-105 (template)
**Props:**
- `avgConsistency: number`
- `consistencyChange: { value: number; isIncrease: boolean } | null`
**Includes:**
- Gauge canvas
- Consistency score display
- Chart.js gauge logic

### 3. LapTimeHeatmap.vue
**Extract From:** Lines ~286-430 (template)
**Props:**
- `drivers: string[]`
- `tracks: string[]`
- `heatmapData: any[][]`
- `maxGapSeconds: number`
**Emits:**
- `cell-hover(driverIndex, trackIndex)`
- `cell-click(driverIndex, trackIndex)`
**Includes:**
- Heatmap table
- Stats panel
- Cell styling logic
- Hover/click interactions
- Legend

### 4. TrophyCase.vue
**Extract From:** Lines ~107-140 (template)
**Props:**
- `trophies: { emblems: number; gold: number; silver: number; bronze: number; coal: number }`
**Emits:**
- `show-details(type: string)`
**Includes:**
- Trophy cards grid
- Trophy modal (extract separately?)
- Click handlers

### 5. TrophyModal.vue (Optional - can be part of TrophyCase)
**Props:**
- `show: boolean`
- `trophyType: string`
- `title: string`
- `details: any[]`
**Emits:**
- `close()`

## CSS Extraction Status

### ✅ Already Extracted to styles/HomeView.css
- Base dashboard styles
- Loading/Error states
- Header
- Stats grid
- Section titles
- Chart cards
- Responsive breakpoints (base)

### 🔄 Still in HomeView.vue (needs extraction)
- Driver activity controls (~100 lines)
- Consistency gauge (~80 lines)
- Heatmap styles (~800 lines!)
- Trophy case styles (~200 lines)
- Trophy modal styles (~400 lines)
- Component-specific responsive overrides

## Implementation Steps

1. ✅ Create base styles/HomeView.css
2. 🔄 Create DriverActivityChart.vue
3. ⏳ Create ConsistencyGauge.vue
4. ⏳ Create LapTimeHeatmap.vue (BIGGEST!)
5. ⏳ Create TrophyCase.vue
6. ⏳ Update HomeView.vue imports
7. ⏳ Remove extracted code from HomeView.vue
8. ⏳ Create component-specific CSS files:
   - styles/driver-activity.css
   - styles/consistency-gauge.css
   - styles/heatmap.css (HUGE!)
   - styles/trophy.css

## Benefits
- HomeView.vue: 4082 lines → ~500 lines
- Reusable components
- Easier maintenance
- Better testability
- Clearer separation of concerns
