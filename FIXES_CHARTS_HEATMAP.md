# HomeView Fixes - Charts & Heatmap (Nov 23, 2025)

## Issues Fixed

### 1. **Charts Not Rendering** ✅
**Problem:** All 5 charts showing empty/blank  
**Cause:** Canvas refs not ready when chart creation functions were called  
**Fix:** 
- Added `nextTick` import from Vue
- Wrapped chart creation in `await nextTick()` + `setTimeout(100ms)`
- Ensures DOM elements are mounted before Chart.js tries to render

**Code:**
```typescript
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// Later in loadRealData:
if (driversData && driversData.length > 0) {
  await nextTick()
  setTimeout(() => {
    createActivityChart(driversData)
    createGapChart(driversData, tracksData || [])
    createPerformanceChart(driversData)
    createConsistencyChart(driversData)
    createPaceChart(driversData)
  }, 100)
}
```

### 2. **Heatmap Showing All "N/A"** ✅
**Problem:** All heatmap cells showing "N/A" despite data in database  
**Cause:** 
- Lap data comes from paginated API response with nested `kartingSession.track` structure
- Code was looking for flat `lap.track_id` which doesn't exist
- Wasn't handling paginated response (Laravel returns `{data: [...]}`)

**Fix:**
```typescript
// Extract laps array from paginated response
const lapsArray = Array.isArray(lapsData) ? lapsData : ((lapsData as any).data || [])

// Find laps with nested track access
const driverLaps = lapsArray.filter(
  (lap: any) => {
    const lapDriverId = lap.driver_id || lap.driver?.id
    const lapTrackId = lap.track_id || lap.karting_session?.track?.id || lap.kartingSession?.track?.id
    return lapDriverId === driver.driver_id && lapTrackId === track.track_id
  }
)
```

### 3. **Consistency Score Showing 0.0** ✅
**Problem:** Consistency score showing 0.0 for all drivers  
**Cause:** Backend doesn't calculate `consistency_score` field  
**Fix:** Added calculation function based on avg vs median lap time variance

```typescript
const calculateConsistencyScore = (avgTime: number | null, medianTime: number | null): number => {
  if (!avgTime || !medianTime || avgTime === 0) return 0
  const variation = Math.abs(avgTime - medianTime) / avgTime
  return Math.max(0, Math.min(100, 100 - (variation * 200)))
}
```

Used in both:
- Stats card display (average across all drivers)
- Consistency chart (per-driver calculation)

### 4. **Heatmap Color Grading** ✅
**Already Correct!** The heatmap color scheme is working as expected:
- **Green** (#10B981) - Performance ≥98% (within 2% of track record)
- **Light Green** (#34D399) - Performance 95-98%
- **Yellow** (#FCD34D, #FBBF24) - Performance 90-95%
- **Red** (#F87171) - Performance <90%
- **Gray** (#30363D) - No data

Performance formula:
```typescript
performance = 100 - ((yourBestLap - trackRecord) / trackRecord * 100)
```

## Results After Fix

### Stats Now Working:
- ✅ **617** Total Laps
- ✅ **46.54s** Avg Lap Time
- ✅ **24.61s** Best Lap
- ✅ **Calculated** Consistency Score (from driver data)
- ✅ **26** Sessions
- ✅ **7** Tracks Visited
- ✅ **6** Total Drivers
- ✅ **6,170** Data Points

### Charts Now Rendering:
1. ✅ **Driver Activity Over Time** - Line chart with lap distribution
2. ✅ **Average Gap to Track Record** - Bar chart showing gaps
3. ✅ **Average Performance by Driver** - Stacked bars with golden PB gap
4. ✅ **Consistency Index** - Color-coded bars (green/yellow/red)
5. ✅ **Average vs Best Lap Times** - Comparison chart

### Heatmap Now Populating:
- ✅ Shows best lap times for each driver at each track
- ✅ Color-coded: Green (fast) → Yellow (medium) → Red (slow)
- ✅ Displays gap to track record
- ✅ Proper performance score calculation

## Technical Notes

**Files Modified:**
- `portal/frontend/src/views/HomeView.vue`

**Changes:**
1. Added `nextTick` import
2. Added `calculateConsistencyScore()` helper function
3. Fixed heatmap data filtering to handle paginated + nested structure
4. Updated consistency chart to use calculated scores
5. Wrapped chart creation in async delay to ensure DOM ready

**Performance:**
- 100ms delay is negligible (< 0.1 second)
- Ensures charts render on first load
- No visual flicker for users

## What's Still Placeholder (Needs Backend):
- Heats Won (0)
- Win Rate (0%)
- Total Distance (0 km) - needs track lengths
- Total Corners (0) - needs track data
- All financial metrics (€0.00) - needs cost tracking
- CO₂ Emissions (0 kg) - needs calculation

Everything else is now pulling REAL DATA from your database! 🎉
