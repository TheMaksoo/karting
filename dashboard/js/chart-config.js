// ========== SHARED CHART CONFIGURATION & UTILITIES ==========
// Centralized chart settings for consistency across all visualizations


// ========== CHART LAYOUT CONSTANTS ==========
window.CHART_CONFIG = {
    // Standard chart options for consistent spacing and sizing
    STANDARD_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 30,
                right: 30,
                bottom: 30,
                left: 30
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#F0F6FC',
                    font: {
                        size: 18,
                        family: "'Inter', sans-serif",
                        weight: '500'
                    },
                    padding: 24,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 14,
                    boxHeight: 14
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(26, 31, 38, 0.95)',
                titleColor: '#F0F6FC',
                bodyColor: '#8B949E',
                borderColor: '#30363D',
                borderWidth: 2,
                padding: 18,
                cornerRadius: 8,
                displayColors: true,
                titleFont: {
                    size: 18,
                    weight: 'bold',
                    family: "'Inter', sans-serif"
                },
                bodyFont: {
                    size: 16,
                    family: "'Inter', sans-serif"
                },
                bodySpacing: 10,
                callbacks: {}
            }
        }
    },

    // Axis styling - LARGER TEXT
    AXIS_STYLE: {
        grid: {
            color: 'rgba(139, 148, 158, 0.1)',
            lineWidth: 1
        },
        ticks: {
            color: '#8B949E',
            font: {
                size: 16,
                family: "'Inter', sans-serif",
                weight: '500'
            },
            padding: 14
        },
        title: {
            display: true,
            color: '#F0F6FC',
            font: {
                size: 18,
                weight: 'bold',
                family: "'Inter', sans-serif"
            },
            padding: {
                top: 14,
                bottom: 14
            }
        }
    }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Merge chart options with standard config
 * @param {Object} customOptions - Custom options to merge
 * @param {string} chartSize - 'medium', 'large', or 'extra-large'
 * @returns {Object} Merged configuration
 */
window.mergeChartConfig = function(customOptions = {}, chartSize = 'medium') {
    const sizeConfig = window.CHART_CONFIG[`${chartSize.toUpperCase().replace('-', '_')}_CHART`] || window.CHART_CONFIG.MEDIUM_CHART;
    
    const baseConfig = JSON.parse(JSON.stringify(window.CHART_CONFIG.STANDARD_OPTIONS));
    
    // Update padding from size config
    baseConfig.layout.padding = sizeConfig.padding;
    
    // Deep merge custom options
    return deepMerge(baseConfig, customOptions);
};

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Create axis configuration with consistent styling
 */
window.createAxisConfig = function(axisType, title, customConfig = {}) {
    const baseAxis = JSON.parse(JSON.stringify(window.CHART_CONFIG.AXIS_STYLE));
    baseAxis.title.text = title;
    
    return deepMerge(baseAxis, customConfig);
};

/**
 * Format lap time consistently
 */
window.formatLapTime = function(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return 'N/A';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    
    if (mins > 0) {
        return `${mins}:${secs.padStart(6, '0')}`;
    }
    return `${secs}s`;
};

/**
 * Format percentage consistently
 */
window.formatPercentage = function(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    return `${value.toFixed(decimals)}%`;
};

/**
 * Abbreviate driver names for better display
 */
window.abbreviateDriverName = function(name, maxLength = 15) {
    if (!name || name.length <= maxLength) {
        return name;
    }
    
    const parts = name.split(' ');
    if (parts.length === 1) {
        return name.substring(0, maxLength - 3) + '...';
    }
    
    // First name initial + last name
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
};

/**
 * Create conclusion message based on improvement trend
 */
window.createConclusionMessage = function(trend, metric = 'performance') {
    if (trend > 2) {
        return {
            icon: '🚀',
            text: 'Getting Faster!',
            detail: `Your ${metric} is improving consistently`,
            class: 'improving'
        };
    } else if (trend > 0.5) {
        return {
            icon: '📈',
            text: 'Steady Progress',
            detail: `Small improvements in ${metric}`,
            class: 'improving'
        };
    } else if (trend > -0.5) {
        return {
            icon: '➡️',
            text: 'Holding Steady',
            detail: `${metric} is consistent`,
            class: ''
        };
    } else if (trend > -2) {
        return {
            icon: '📉',
            text: 'Slight Decline',
            detail: `${metric} showing minor decrease`,
            class: 'declining'
        };
    } else {
        return {
            icon: '⚠️',
            text: 'Needs Attention',
            detail: `${metric} declining - review your technique`,
            class: 'declining'
        };
    }
};

/**
 * Add conclusion element to chart container
 */
window.addChartConclusion = function(containerId, conclusion) {
    const container = document.getElementById(containerId)?.parentElement;
    if (!container) return;
    
    // Remove existing conclusion
    const existing = container.querySelector('.chart-conclusion');
    if (existing) existing.remove();
    
    // Create new conclusion
    const conclusionDiv = document.createElement('div');
    conclusionDiv.className = `chart-conclusion ${conclusion.class}`;
    conclusionDiv.innerHTML = `
        <div class="chart-conclusion-icon">${conclusion.icon}</div>
        <div class="chart-conclusion-text">${conclusion.text}</div>
        <div class="chart-conclusion-detail">${conclusion.detail}</div>
    `;
    
    container.appendChild(conclusionDiv);
};

