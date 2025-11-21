/**
 * Chart Utilities Module
 * Shared utilities for chart creation, stats panels, and formatting
 */

// ============================================================================
// STATS PANEL UTILITIES
// ============================================================================

/**
 * Create a stats panel helper for external tooltips
 */
class StatsPanelHelper {
    constructor(panelId) {
        this.panel = document.getElementById(panelId);
        this.content = this.panel?.querySelector('.stats-panel-content');
        this.isPinned = false;
        this.pinnedContent = null;
        
        // Add pin icon to header
        this.addPinButton();
    }

    /**
     * Add pin/unpin button to panel header
     */
    addPinButton() {
        if (!this.panel) return;
        
        const header = this.panel.querySelector('.stats-panel-header');
        if (!header || header.querySelector('.pin-button')) return; // Already added
        
        const pinButton = document.createElement('button');
        pinButton.className = 'pin-button';
        pinButton.innerHTML = '<i class="fas fa-thumbtack"></i>';
        pinButton.title = 'Click to pin/unpin details';
        pinButton.style.cssText = `
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            font-size: 16px;
            margin-left: auto;
            padding: 0 8px;
            transition: all 0.2s;
            position: relative;
            z-index: 1000;
            pointer-events: auto;
        `;
        
        pinButton.addEventListener('click', () => this.togglePin());
        pinButton.addEventListener('mouseenter', () => {
            pinButton.style.color = 'white';
            pinButton.style.transform = 'scale(1.2)';
        });
        pinButton.addEventListener('mouseleave', () => {
            pinButton.style.color = this.isPinned ? '#FFD700' : 'rgba(255, 255, 255, 0.7)';
            pinButton.style.transform = 'scale(1)';
        });
        
        header.appendChild(pinButton);
    }

    /**
     * Toggle pin state
     */
    togglePin() {
        this.isPinned = !this.isPinned;
        const pinButton = this.panel?.querySelector('.pin-button');
        
        if (pinButton) {
            if (this.isPinned) {
                pinButton.style.color = '#FFD700';
                pinButton.querySelector('i').style.transform = 'rotate(45deg)';
                this.pinnedContent = this.content?.innerHTML;
                
                // Add visual indicator
                this.panel.style.borderColor = '#FFD700';
                this.panel.style.boxShadow = '0 8px 32px rgba(255, 215, 0, 0.3)';
            } else {
                pinButton.style.color = 'rgba(255, 255, 255, 0.7)';
                pinButton.querySelector('i').style.transform = 'rotate(0deg)';
                this.pinnedContent = null;
                
                // Remove visual indicator
                this.panel.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                this.panel.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
                
                // Reset to empty state
                this.showEmptyState();
            }
        }
    }

    /**
     * Show empty state when no data is hovered
     */
    showEmptyState(icon = 'fa-mouse-pointer', message = 'Hover over the chart to see details') {
        if (!this.content || this.isPinned) return; // Don't change if pinned
        this.content.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <i class="fas ${icon}" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p>${message}</p>
                <small style="display: block; margin-top: 12px; opacity: 0.8;">
                    💡 Click the <i class="fas fa-thumbtack" style="font-size: 12px;"></i> pin icon to keep details visible
                </small>
            </div>
        `;
    }

    /**
     * Create a stat row (label + value)
     */
    createStatRow(label, value, options = {}) {
        const { 
            icon = null, 
            color = null, 
            bold = false,
            highlight = false,
            marginBottom = '12px'
        } = options;

        const iconHtml = icon ? `<i class="fas ${icon}" style="${color ? `color: ${color};` : ''}"></i> ` : '';
        const labelStyle = bold ? 'font-weight: 700;' : '';
        const valueStyle = color ? `color: ${color};` : '';
        const highlightClass = highlight ? 'stat-highlight' : '';

        return `
            <div class="${highlightClass}" style="margin-bottom: ${marginBottom};">
                <div class="stat-row">
                    <span class="stat-label" style="${labelStyle}">${iconHtml}${label}</span>
                    <span class="stat-value" style="${valueStyle}">${value}</span>
                </div>
            </div>
        `;
    }

    /**
     * Create a colored driver label
     */
    createDriverLabel(driver, color, rank = null) {
        const rankEmojis = { 0: '🥇', 1: '🥈', 2: '🥉' };
        const rankEmoji = rank !== null && rankEmojis[rank] ? rankEmojis[rank] : '';
        
        return `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${color};"></span>
                <strong>${driver}</strong>
                ${rankEmoji}
            </span>
        `;
    }

    /**
     * Set panel content
     */
    setContent(html) {
        if (!this.content || this.isPinned) return; // Don't update if pinned
        this.content.innerHTML = html;
    }

    /**
     * Update panel header text
     */
    updateHeader(text) {
        const header = this.panel?.querySelector('.stats-panel-header span');
        if (header) header.textContent = text;
    }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

const FormatUtils = {
    /**
     * Format time in seconds to readable string
     */
    formatTime(seconds, decimals = 3) {
        if (seconds === null || seconds === undefined || isNaN(seconds)) return 'N/A';
        return seconds.toFixed(decimals) + 's';
    },

    /**
     * Format percentage
     */
    formatPercent(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return value.toFixed(decimals) + '%';
    },

    /**
     * Format gap/difference from reference
     */
    formatGap(gap, decimals = 3) {
        if (gap === null || gap === undefined || isNaN(gap)) return 'N/A';
        const sign = gap >= 0 ? '+' : '';
        return sign + gap.toFixed(decimals) + 's';
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return 'N/A';
        return num.toLocaleString();
    },

    /**
     * Get performance color based on percentage from best
     */
    getPerformanceColor(percentFromBest) {
        if (percentFromBest < 2) return '#10b981'; // Green: < 2%
        if (percentFromBest < 4) return '#84cc16'; // Light green: 2-4%
        if (percentFromBest < 6) return '#eab308'; // Yellow: 4-6%
        if (percentFromBest < 8) return '#f97316'; // Orange: 6-8%
        return '#ef4444'; // Red: > 8%
    },

    /**
     * Get rank emoji
     */
    getRankEmoji(rank) {
        const emojis = { 0: '🥇', 1: '🥈', 2: '🥉' };
        return emojis[rank] || '';
    }
};

// ============================================================================
// CHART STATISTICS CALCULATORS
// ============================================================================

const StatsCalculator = {
    /**
     * Calculate comprehensive lap time statistics
     */
    calculateLapStats(lapTimes) {
        if (!lapTimes || lapTimes.length === 0) return null;

        const sorted = [...lapTimes].sort((a, b) => a - b);
        const n = sorted.length;
        
        const min = sorted[0];
        const max = sorted[n - 1];
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        
        // Quartiles
        const q1 = sorted[Math.floor(n * 0.25)];
        const median = n % 2 === 0 
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
            : sorted[Math.floor(n / 2)];
        const q3 = sorted[Math.floor(n * 0.75)];
        
        // Statistical measures
        const range = max - min;
        const iqr = q3 - q1;
        
        // Standard deviation
        const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        // Outlier boundaries (1.5 * IQR rule)
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = sorted.filter(t => t < lowerBound || t > upperBound);
        
        return {
            min, max, mean, median, q1, q3,
            range, iqr, stdDev,
            lowerBound, upperBound, outliers,
            count: n,
            best: min,
            worst: max
        };
    },

    /**
     * Calculate consistency score (0-100, 100 = perfect)
     */
    calculateConsistency(lapTimes) {
        if (!lapTimes || lapTimes.length < 2) return 0;
        
        const stats = this.calculateLapStats(lapTimes);
        if (!stats) return 0;
        
        // Coefficient of variation (lower is better)
        const cv = stats.stdDev / stats.mean;
        
        // Convert to 0-100 scale (100 = perfect consistency)
        // CV of 0 = 100, CV of 0.1+ = 0
        const score = Math.max(0, 100 * (1 - cv * 10));
        
        return score;
    },

    /**
     * Calculate improvement trend
     */
    calculateTrend(values) {
        if (!values || values.length < 2) return 0;
        
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        values.forEach((y, x) => {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });
        
        // Linear regression slope
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
};

// ============================================================================
// CHART OPTION GENERATORS
// ============================================================================

const ChartOptions = {
    /**
     * Get common chart options
     */
    getCommon(options = {}) {
        const {
            maintainAspectRatio = false,
            paddingTop = 30,
            paddingRight = 30,
            paddingBottom = 30,
            paddingLeft = 30
        } = options;

        return {
            responsive: true,
            maintainAspectRatio,
            layout: {
                padding: {
                    top: paddingTop,
                    right: paddingRight,
                    bottom: paddingBottom,
                    left: paddingLeft
                }
            }
        };
    },

    /**
     * Get common scale options
     */
    getScale(title, options = {}) {
        const {
            beginAtZero = false,
            reverse = false,
            format = 'default'
        } = options;

        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');

        const formatters = {
            'time': (value) => value.toFixed(2) + 's',
            'percent': (value) => value.toFixed(1) + '%',
            'number': (value) => value.toLocaleString(),
            'default': (value) => value
        };

        return {
            beginAtZero,
            reverse,
            title: {
                display: !!title,
                text: title,
                color: textPrimary,
                font: { size: 18, weight: 'bold' },
                padding: { top: 0, bottom: 15 }
            },
            ticks: {
                color: textSecondary,
                font: { size: 16 },
                padding: 10,
                callback: formatters[format]
            },
            grid: {
                color: borderColor
            }
        };
    },

    /**
     * Get common legend options
     */
    getLegend(options = {}) {
        const { position = 'top', display = true } = options;
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');

        return {
            display,
            position,
            labels: {
                color: textPrimary,
                font: { size: 18, weight: '500' },
                padding: 20,
                usePointStyle: true,
                boxWidth: 12,
                boxHeight: 12
            }
        };
    },

    /**
     * Create external tooltip configuration
     */
    getExternalTooltip(statsPanel, populateFunction) {
        return {
            enabled: false,
            external: function(context) {
                const tooltipModel = context.tooltip;
                
                if (tooltipModel.opacity === 0) {
                    statsPanel.showEmptyState();
                    return;
                }
                
                populateFunction(context, statsPanel);
            }
        };
    }
};

// ============================================================================
// CHART PLUGIN HELPERS
// ============================================================================

const ChartPlugins = {
    /**
     * Create horizontal line plugin
     */
    createHorizontalLine(options = {}) {
        const {
            getValue = null,
            color = '#ef4444',
            lineWidth = 2,
            label = null,
            lineDash = []
        } = options;

        return {
            id: 'horizontalLine',
            afterDatasetsDraw(chart) {
                if (!getValue) return;

                const ctx = chart.ctx;
                const yAxis = chart.scales.y;
                const xAxis = chart.scales.x;
                const value = getValue(chart);
                
                if (value === null || value === undefined) return;

                const y = yAxis.getPixelForValue(value);
                
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.setLineDash(lineDash);
                ctx.beginPath();
                ctx.moveTo(xAxis.left, y);
                ctx.lineTo(xAxis.right, y);
                ctx.stroke();
                
                if (label) {
                    ctx.fillStyle = color;
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(label, xAxis.right - 5, y - 5);
                }
                
                ctx.restore();
            }
        };
    },

    /**
     * Create box plot whiskers plugin
     */
    createBoxPlotWhiskers() {
        return {
            id: 'boxPlotWhiskers',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                
                meta.data.forEach((bar, index) => {
                    const stats = bar.$context.raw;
                    if (!stats || !stats.min || !stats.max) return;

                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;
                    const x = xAxis.getPixelForValue(index);
                    const yMin = yAxis.getPixelForValue(stats.min);
                    const yMax = yAxis.getPixelForValue(stats.max);
                    const yQ1 = yAxis.getPixelForValue(stats.q1);
                    const yQ3 = yAxis.getPixelForValue(stats.q3);
                    const capWidth = bar.width * 0.3;

                    ctx.save();
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;

                    // Upper whisker (Q3 to max)
                    ctx.beginPath();
                    ctx.moveTo(x, yQ3);
                    ctx.lineTo(x, yMax);
                    ctx.stroke();

                    // Upper cap
                    ctx.beginPath();
                    ctx.moveTo(x - capWidth / 2, yMax);
                    ctx.lineTo(x + capWidth / 2, yMax);
                    ctx.stroke();

                    // Lower whisker (Q1 to min)
                    ctx.beginPath();
                    ctx.moveTo(x, yQ1);
                    ctx.lineTo(x, yMin);
                    ctx.stroke();

                    // Lower cap
                    ctx.beginPath();
                    ctx.moveTo(x - capWidth / 2, yMin);
                    ctx.lineTo(x + capWidth / 2, yMin);
                    ctx.stroke();

                    ctx.restore();
                });
            }
        };
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

window.ChartUtils = {
    StatsPanelHelper,
    FormatUtils,
    StatsCalculator,
    ChartOptions,
    ChartPlugins
};
