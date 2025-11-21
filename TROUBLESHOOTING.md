# Dashboard Troubleshooting Guide

## Current Status

**Server:** Running on http://localhost:8000
**Last Updated:** November 20, 2025

## What Should Be Working

### ✅ Data Files
- `dashboard/Karten.csv` - 618 rows (includes Spanish track data)
  - Fastkart Elche: 30 laps (rows 571-600)
  - Racing Center Gilesias: 18 laps (rows 601-618)
- `tracks.json` - 7 tracks with complete metadata including Spanish tracks

### ✅ Chart Fixes Applied
1. **Driver Performance Charts** - Uses % gap from track record
2. **Session Analysis Charts** - Groups by track
3. **Track Comparison Charts** - Shows improvement %, speed (km/h)
4. **Head-to-Head Charts** - Relative scoring on common sessions
5. **Financial Charts** - Uses consistency scores
6. **Temporal Charts** - Shows improvement % not absolute times

### ✅ Spanish Track Data
- **Fastkart Elche** (TRK-001):
  - Location: Elche, Alicante, Spain
  - Coordinates: 38.2699, -0.6983
  - Distance: 1160m
  
- **Racing Center Gilesias** (TRK-007):
  - Location: Guardamar del Segura, Alicante, Spain
  - Coordinates: 38.1143, -0.6580
  - Distance: 500m

### ✅ Geographic Map
- Map center: [46.0, 2.5] zoom 5 (shows all of Europe)
- Should display all 7 tracks including Spain

## Potential Issues

### 1. Charts Not Rendering
**Symptoms:** Blank chart areas, no visualizations
**Possible Causes:**
- JavaScript errors in browser console
- CHART_COLORS not loaded before chart modules
- Missing chart canvas elements in HTML

**How to Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors in red
4. Check Network tab for failed script loads

**Fixes Applied:**
- Added fallback colors to charts-session.js
- CHART_COLORS defined globally in core.js

### 2. Spanish Tracks Not Showing on Map
**Symptoms:** Only Dutch/Belgian tracks visible
**Possible Causes:**
- Track name mismatch between CSV and coordinates
- Map not fully loaded
- Zoom level too high (map too zoomed in)

**How to Check:**
1. Open Geographic Analytics section
2. Check if map shows Europe (not just Netherlands)
3. Look for markers in Spain (south of map)
4. Check browser console for map errors

**Track Names Must Match Exactly:**
- CSV: `Fastkart Elche` 
- Code: `'Fastkart Elche'` ✅
- CSV: `Racing Center Gilesias`
- Code: `'Racing Center Gilesias'` ✅

### 3. Specific Chart Issues

**Session Summary Chart:**
- Should show separate lines per track
- Uses fallback colors if CHART_COLORS undefined
- Check if `sessionSummaryMetric` dropdown exists

**Fuel Efficiency Chart:**
- Requires TrackDistance column in CSV
- CSV has TrackDistance ✅
- Uses track-specific calculations

**Track Performance Chart:**
- Shows 3 metrics: improvement %, speed (km/h), consistency
- Check if `trackPerformanceMetric` dropdown exists

## Debugging Steps

### Step 1: Check Console Errors
```javascript
// Open browser console and run:
console.log('Filtered Data:', window.filteredData.length);
console.log('Charts:', Object.keys(window.charts));
console.log('CHART_COLORS:', window.CHART_COLORS);
```

### Step 2: Verify Data Loading
```javascript
// Check if Spanish tracks are in data:
const spanishTracks = window.filteredData.filter(row => 
  row.Track === 'Fastkart Elche' || row.Track === 'Racing Center Gilesias'
);
console.log('Spanish track laps:', spanishTracks.length); // Should be 48
```

### Step 3: Check Chart Initialization
```javascript
// See which chart modules loaded:
console.log('Driver Charts:', typeof initializeDriverPerformanceCharts);
console.log('Session Charts:', typeof initializeLapSessionCharts);
console.log('Track Charts:', typeof initializeTrackInsightsCharts);
console.log('Geo Charts:', typeof initializeGeographicalCharts);
```

### Step 4: Force Chart Refresh
```javascript
// Manually reinitialize charts:
if (window.initializeAllCharts) {
  window.initializeAllCharts();
}
```

## Quick Fixes

### Fix 1: Refresh Browser
1. Hard refresh: Ctrl+F5 (clears cache)
2. Check if charts appear

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Restart Server
```powershell
# Stop server (Ctrl+C in terminal)
# Restart:
cd c:\Users\TheMaksoo\Downloads\karting\dashboard
python -m http.server 8000
```

### Fix 4: Check File Sync
```powershell
# Ensure CSV is synced to dashboard folder:
cd c:\Users\TheMaksoo\Downloads\karting
Copy-Item "Karten.csv" "dashboard\Karten.csv" -Force
```

## Expected Behavior

### Geographic Map
- Should show a map of Europe
- 7 markers total:
  - 4 in Netherlands (Goodwill, De Voltage, Circuit Park Berghem, Lot66)
  - 1 in Belgium (Experience Factory Antwerp)
  - 2 in Spain (Fastkart Elche, Racing Center Gilesias)
- Click markers to see track stats

### Driver Performance Charts
- "Performance Gap to Track Record" - shows % values (0-10%)
- "Average Performance by Driver" - grouped or % from best
- Colors: Green (<1%), Blue (<3%), Orange (<5%), Red (>5%)

### Session Summary
- Multiple colored lines (one per track)
- X-axis: Session dates
- Y-axis: Average lap time (seconds) - labeled "By Track"

### Track Characteristics
- Bar chart with 3 metric options
- Shows comparable data (%, km/h, or consistency)
- NOT showing raw lap times

## Files Modified
1. `dashboard/js/charts-driver.js`
2. `dashboard/js/charts-session.js`
3. `dashboard/js/charts-track.js`
4. `dashboard/js/charts-battles.js`
5. `dashboard/js/charts-financial.js`
6. `dashboard/js/charts-temporal.js`
7. `dashboard/index.html`

## Next Steps If Issues Persist
1. Check browser console for specific JavaScript errors
2. Verify all `.js` files loaded successfully (Network tab)
3. Test with different browser (Chrome vs Firefox vs Edge)
4. Check if Leaflet library loaded for maps
5. Verify Chart.js library loaded for charts
