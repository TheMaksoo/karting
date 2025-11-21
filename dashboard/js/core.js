// ========== ELITE KARTING ANALYTICS PLATFORM - CORE MODULE ==========
// Global state, constants, theme, utilities, and loading functions


// ========== GLOBAL VARIABLES & STATE ==========
window.kartingData = [];
window.filteredData = [];
window.charts = {};
window.currentTheme = 'dark';
window.loadingTimeout = null;
window.loadingFadeTimeout = null;
window.loadingHideTimeout = null;
window.initialLoadComplete = false;

// Analytics State
window.driverStats = {};
window.trackStats = {};
window.sessionStats = {};
window.temporalStats = {};

// Chart Colors - Load from localStorage if customized
const defaultColors = [
    '#ff6b35', '#004e89', '#ffd23f', '#06d6a0', '#f18701', '#e63946',
    '#9c27b0', '#4caf50', '#3f51b5', '#ff9800', '#00bcd4', '#795548',
    '#607d8b', '#8bc34a', '#ffeb3b', '#e91e63', '#2196f3', '#ff5722'
];

// Try to load custom colors from localStorage
const savedColors = localStorage.getItem('CHART_COLORS');
if (savedColors) {
    try {
        window.CHART_COLORS = JSON.parse(savedColors);
    } catch (e) {
        window.CHART_COLORS = defaultColors;
    }
} else {
    window.CHART_COLORS = defaultColors;
}


// Driver to color mapping - ensures consistent colors across all charts
window.driverColorMap = {};
window.driverColorIndex = 0;

// Helper function to get consistent color for a specific driver
window.getDriverColor = function(driverName) {
    // Safety check: ensure CHART_COLORS is loaded
    if (!window.CHART_COLORS || window.CHART_COLORS.length === 0) {
        window.CHART_COLORS = defaultColors;
    }
    
    // If driver already has a color, return it
    if (window.driverColorMap[driverName]) {
        return window.driverColorMap[driverName];
    }
    
    // Assign new color to driver
    const color = window.CHART_COLORS[window.driverColorIndex % window.CHART_COLORS.length];
    window.driverColorMap[driverName] = color;
    window.driverColorIndex++;
    return color;
};

// Helper function to get color by index (for non-driver charts)
window.getColorByIndex = function(index) {
    return window.CHART_COLORS[index % window.CHART_COLORS.length];
};

// Helper function to get driver display name (nickname if set, otherwise real name)
window.getDriverDisplayName = function(driverName) {
    const nicknames = localStorage.getItem('driverNicknames');
    if (nicknames) {
        try {
            const parsed = JSON.parse(nicknames);
            return parsed[driverName] || driverName;
        } catch (e) {
            return driverName;
        }
    }
    return driverName;
};


// Default chart options to prevent scaling issues
window.DEFAULT_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
    elements: {
        point: {
            radius: 3,
            hoverRadius: 5
        },
        line: {
            tension: 0.4
        }
    },
    plugins: {
        legend: {
            labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                usePointStyle: true,
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
            titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
            bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
        }
    },
    scales: {
        x: {
            ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                maxTicksLimit: 10
            },
            grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                lineWidth: 1
            }
        },
        y: {
            ticks: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                maxTicksLimit: 8
            },
            grid: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                lineWidth: 1
            }
        }
    }
};

// ========== THEME MANAGEMENT ==========
function initializeTheme() {
    const savedTheme = localStorage.getItem('kartingTheme') || 'dark';
    window.currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', window.currentTheme);
}

function toggleTheme() {
    window.currentTheme = window.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', window.currentTheme);
    localStorage.setItem('kartingTheme', window.currentTheme);
    
    // Update all charts with new theme
    setTimeout(() => {
        Object.keys(window.charts).forEach(chartId => {
            if (window.charts[chartId]) {
                window.charts[chartId].update();
            }
        });
    }, 100);
}

// ========== LOADING & ERROR HANDLING ==========
function showLoading(show, message = 'Loading...') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.querySelector('.loading-text');
    const loadingProgress = document.querySelector('.loading-progress');
    
    if (loadingScreen) {
        if (show) {
            // If the initial load already completed and overlay was hidden, don't re-show automatically
            if (window.initialLoadComplete) return;
            // If a hide/fadeout is pending, cancel it so the overlay stays visible continuously
            if (window.loadingFadeTimeout) {
                clearTimeout(window.loadingFadeTimeout);
                window.loadingFadeTimeout = null;
            }
            if (window.loadingHideTimeout) {
                clearTimeout(window.loadingHideTimeout);
                window.loadingHideTimeout = null;
            }

            loadingScreen.classList.remove('hidden');
            if (loadingText && message) {
                loadingText.textContent = message;
            }
            // Don't auto-animate the progress here; updateLoadingProgress drives the bar
            if (loadingProgress) {
                // keep current width or reset to 0 when starting
                if (!loadingProgress.style.width || loadingProgress.style.width === '100%') {
                    loadingProgress.style.width = '0%';
                }
            }
        } else {
            // Smooth fade out with controlled timers. Store timers so we can cancel if show() is called again.
            window.loadingFadeTimeout = setTimeout(() => {
                loadingScreen.style.opacity = '0';
                // After fade completes, add the hidden class and reset opacity
                window.loadingHideTimeout = setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    loadingScreen.style.opacity = '1'; // Reset for next time
                    window.loadingFadeTimeout = null;
                    window.loadingHideTimeout = null;
                    // Mark that the initial load finished so accidental re-shows are ignored
                    window.initialLoadComplete = true;
                }, 500);
            }, 800);
        }
    }
}

function updateLoadingProgress(percentage, message) {
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');

    if (loadingProgress) {
        loadingProgress.style.width = `${percentage}%`;
    }

    if (loadingText && message) {
        loadingText.textContent = message;
    }
}

function showErrorState(error) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 50px;">
                <div style="font-size: 48px; color: var(--error-color); margin-bottom: 20px;">⚠️</div>
                <h2 style="color: var(--error-color);">Error Loading Data</h2>
                <p style="color: var(--text-secondary); margin: 20px 0;">${error.message}</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ========== UTILITY FUNCTIONS ==========
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '--';
    return `${seconds.toFixed(3)}s`;
}

function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '€0.00';
    return `€${amount.toFixed(2)}`;
}

function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return num.toLocaleString();
}

function initializeAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
}

// Export functions to window for global access
window.initializeTheme = initializeTheme;
window.toggleTheme = toggleTheme;
window.showLoading = showLoading;
window.updateLoadingProgress = updateLoadingProgress;
window.showErrorState = showErrorState;
window.formatTime = formatTime;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;

window.initializeAOS = initializeAOS;

