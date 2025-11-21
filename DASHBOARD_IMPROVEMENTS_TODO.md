# Dashboard Improvements - Detailed TODO

## ✅ Completed

### 1. Driver Activity Over Time
- ✅ Changed title from "Driver Ranking Over Time" to "Driver Activity Over Time"
- ✅ Added "Laps Driven" option (now default)
- ✅ Added "Tracks Driven" option
- ✅ Kept "Average Position" and "Average Lap Time" options
- ✅ Updated chart to handle new metrics

## 🔄 In Progress / Remaining

### 2. Performance Gap to Track Record
**Current Status:** Already shows average gap per driver across all tracks they've driven
**Improvements Needed:**
- ⏳ Add better spacing/padding around bars
- ⏳ Clarify in title that it's "Average Gap Across All Tracks Driven"
- ⏳ Consider showing track-by-track breakdown in tooltip

### 3. Average Performance by Driver
**Issues:**
- ❌ "Overall" grouping shows % instead of seconds (s)
- ❌ "By Track" needs track record reference line
- ❌ "By Session" doesn't work

**Fixes Needed:**
```javascript
// For "Overall" - change from % to seconds
if (groupBy === 'overall') {
    // Use actual lap time average in seconds, not %
}

// For "By Track" - add track record line
datasets.push({
    label: 'Track Record',
    data: trackRecordData,
    type: 'line',
    borderColor: '#ff0000',
    borderDash: [5, 5],
    pointRadius: 0
});

// For "By Session" - implement proper session grouping
if (groupBy === 'session') {
    // Group by unique sessions properly
}
```

### 4. Consistency Index
**Current:** Only shows overall consistency
**Needed:** Add grouping by track option

**Implementation:**
```javascript
// Add dropdown for grouping
<select id="consistencyGroupSelect">
    <option value="overall">Overall</option>
    <option value="byTrack">By Track</option>
</select>

// Update function to group by track
if (groupBy === 'byTrack') {
    // Calculate consistency per track per driver
}
```

### 5. Improvement Over Sessions
**Issues:**
- ❌ Missing icon in header
- ❌ Shows combined lap times across different tracks (25s vs 50s)

**Fixes:**
```html
<!-- Add icon -->
<h3><i class="fas fa-chart-line-up"></i> Improvement Over Sessions</h3>

<!-- Or use: -->
<h3><i class="fas fa-arrow-trend-up"></i> Improvement Over Sessions</h3>
```

```javascript
// Group by track to avoid mixing lap times
const improvementData = tracks.map(track => {
    // Calculate improvement only within same track
});
```

### 6. Global Spacing & Dark Mode
**Spacing Issues:**
- Chart containers need more padding
- Section headers need more margin
- Better grid gap in charts-grid

**Dark Mode:**
- Currently partial dark mode support
- Need to ensure all components support dark mode
- Keep same color palette (CHART_COLORS)

**CSS Updates Needed:**
```css
/* Better spacing */
.chart-container {
    padding: 24px; /* Increase from 16px */
}

.charts-grid {
    gap: 24px; /* Increase from 16px */
}

.section-header {
    margin-bottom: 24px; /* Increase spacing */
}

/* Dark mode enhancements */
[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
}
```

### 7. Lap Time Distribution
**Current Issue:** Not meaningful/clear
**Possible Improvements:**
- Add explanation text about what the histogram shows
- Group by track to show distribution per track
- Add percentile markers (25th, 50th, 75th)
- Consider changing to box plot instead of histogram

### 8. Best Lap Heatmap
**Current:** Shows colors but no legend
**Needed:**
```javascript
// Add legend/info box
const legendHTML = `
<div class="heatmap-legend">
    <h4>Color Guide:</h4>
    <div><span style="background: #10b981"></span> Excellent (< 1% from record)</div>
    <div><span style="background: #3b82f6"></span> Good (1-3% from record)</div>
    <div><span style="background: #f59e0b"></span> Average (3-5% from record)</div>
    <div><span style="background: #ef4444"></span> Needs Work (> 5% from record)</div>
</div>
`;
```

### 9. Start vs End Pace
**Current:** Basic comparison
**Improvements:**
- Use different chart type (grouped bar chart?)
- Add average reference line
- Show % change between start and end
- Better color coding (green = improved, red = declined)

## Priority Order

1. **HIGH PRIORITY:**
   - Fix "Average Performance by Driver" (Overall should use seconds)
   - Add icon to "Improvement Over Sessions"
   - Group "Improvement Over Sessions" by track

2. **MEDIUM PRIORITY:**
   - Add legend to Best Lap Heatmap
   - Improve Start vs End Pace visualization
   - Add track grouping to Consistency Index

3. **LOW PRIORITY:**
   - Global spacing improvements
   - Dark mode enhancements
   - Lap Time Distribution redesign

## Testing Checklist

After implementing fixes:
- [ ] Test all dropdowns/selects work correctly
- [ ] Verify charts render with filtered data
- [ ] Check responsive behavior on different screen sizes
- [ ] Verify dark mode compatibility
- [ ] Test with different drivers/tracks selected
- [ ] Verify no console errors
- [ ] Check performance with large datasets
