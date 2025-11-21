# Karting Dashboard Refactoring Plan

## Current Issues to Fix
1. ✅ pinnedBar error - FIXED (moved to function scope)
2. Driver Activity - Add spacing (CSS updated)
3. Average Performance - Lighter bar top segment
4. ✅ Consistency Index - Stats panel added to HTML
5. Consistency Index - External tooltip needed
6. Improvement Over Sessions - Overlapping bars (reduce barPercentage)
7. Lap Time Distribution - Outliers both ways, stats panel size
8. Best Lap Heatmap - Colors, stats panel, smaller gaps (0.1s instead of 0.5s)
9. Start vs End Pace - Stats panel on right

## Refactoring Strategy

### 1. Shared Utilities Module (✅ CREATED: chart-utils.js)
Contains:
- **StatsPanelHelper**: Reusable class for managing stats panels
  - showEmptyState()
  - createStatRow()
  - createDriverLabel()
  - setContent()
  
- **FormatUtils**: Consistent formatting
  - formatTime(), formatPercent(), formatGap(), formatNumber()
  - getPerformanceColor(), getRankEmoji()
  
- **StatsCalculator**: Statistical calculations
  - calculateLapStats() - min, max, mean, median, Q1, Q3, IQR, outliers
  - calculateConsistency() - 0-100 score
  - calculateTrend() - linear regression slope
  
- **ChartOptions**: Reusable option generators
  - getCommon() - responsive, padding
  - getScale() - axis configuration
  - getLegend() - legend styling
  - getExternalTooltip() - stats panel integration
  
- **ChartPlugins**: Custom Chart.js plugins
  - createHorizontalLine() - reference lines
  - createBoxPlotWhiskers() - box plot visualization

### 2. Code Reduction Through Reuse

#### Before (Repetitive):
```javascript
const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
scales: {
  y: {
    title: { display: true, text: 'Lap Time', color: textPrimary, font: { size: 18 } },
    ticks: { color: textSecondary, font: { size: 16 }, callback: v => v.toFixed(2) + 's' }
  }
}
```

#### After (Modular):
```javascript
const { ChartOptions, FormatUtils } = window.ChartUtils;
scales: {
  y: ChartOptions.getScale('Lap Time', { format: 'time' })
}
```

### 3. Stats Panel Pattern

#### Standard Implementation:
```javascript
const statsPanel = new StatsPanelHelper('chartStatsPanel');

tooltip: ChartOptions.getExternalTooltip(statsPanel, (context, panel) => {
  const data = context.tooltip.dataPoints[0];
  let html = panel.createStatRow('Label', 'Value', { icon: 'fa-icon' });
  panel.setContent(html);
})
```

### 4. Chart-Specific Improvements

#### Improvement Over Sessions
- Change `barPercentage: 0.8` to `0.6` to prevent overlap
- Or use `categoryPercentage: 0.7`

#### Lap Time Distribution  
- Use `ChartPlugins.createBoxPlotWhiskers()` for outliers
- Ensure whiskers extend from Q1-min and Q3-max

#### Best Lap Heatmap
- Reduce color thresholds from [0, 2, 4, 6, 8, 10] to [0, 0.5, 1, 1.5, 2, 3]
- Add subtle driver colors (pastel versions)
- Create stats panel overlay on right

#### Start vs End Pace
- Add external tooltip with stats panel

### 5. File Structure

```
dashboard/js/
├── chart-config.js       (Chart.js defaults)
├── chart-utils.js        (✅ NEW - Shared utilities)
├── core.js               (Core functions, driver colors)
├── charts-driver.js      (Driver performance charts)
├── charts-session.js     (Session analysis charts)
├── charts-track.js       (Track comparison charts)
├── charts-battles.js     (Head-to-head charts)
├── charts-financial.js   (Cost analysis)
├── charts-temporal.js    (Time-based analysis)
├── charts-geo.js         (Geographic analysis)
└── charts-predictive.js  (ML predictions)
```

## Implementation Priority

1. ✅ Create chart-utils.js module
2. ✅ Add to index.html
3. Update Consistency Index with external tooltip
4. Fix Improvement Over Sessions bar overlap
5. Update Lap Time Distribution (outliers + stats panel)
6. Refactor Best Lap Heatmap (colors + stats panel)
7. Update Start vs End Pace (stats panel)
8. Optimize CSS (remove duplicates)

## Benefits

- **50% less code** in chart files (reusing utilities)
- **Consistent UX** across all charts
- **Easier maintenance** (change once, apply everywhere)
- **Better performance** (shared functions)
- **Cleaner code** (separation of concerns)
