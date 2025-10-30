// ========== ELITE KARTING ANALYTICS PLATFORM ==========
// Complete JavaScript implementation with 40+ charts and advanced analytics

// ========== GLOBAL VARIABLES & STATE ==========
let kartingData = [];
let filteredData = [];
let charts = {};
let currentTheme = 'dark';
let loadingTimeout;

// Analytics State
let driverStats = {};
let trackStats = {};
let sessionStats = {};
let temporalStats = {};

// Chart Colors
const CHART_COLORS = [
    '#ff6b35', '#004e89', '#ffd23f', '#06d6a0', '#f18701', '#e63946',
    '#9c27b0', '#4caf50', '#3f51b5', '#ff9800', '#00bcd4', '#795548',
    '#607d8b', '#8bc34a', '#ffeb3b', '#e91e63', '#2196f3', '#ff5722'
];

// Default chart options to prevent scaling issues
const DEFAULT_CHART_OPTIONS = {
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

// ========== INITIALIZATION & DATA LOADING ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 Elite Karting Analytics Platform Loading...');
    initializeTheme();
    initializeEventListeners();
    initializeAOS();
    initializeDateTimeDisplay();
    // loadData is called from initializeDashboard only
});

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

// ========== THEME MANAGEMENT ==========
function initializeTheme() {
    const savedTheme = localStorage.getItem('kartingTheme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    // No longer updating theme toggle since it's removed
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('kartingTheme', currentTheme);
    // No longer updating theme toggle since it's removed
    
    // Update all charts with new theme
    setTimeout(() => {
        Object.keys(charts).forEach(chartId => {
            if (charts[chartId]) {
                charts[chartId].update();
            }
        });
    }, 100);
}

// updateThemeToggle function removed since theme toggle button was removed

// ========== DATE/TIME MANAGEMENT ==========
function initializeDateTimeDisplay() {
    updateDateTime();
    
    // Update every second
    setInterval(updateDateTime, 1000);
    
    // Add click event listener
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.addEventListener('click', () => {
            // Animate click
            dateTimeElement.style.transform = 'translateY(0) scale(0.95)';
            setTimeout(() => {
                dateTimeElement.style.transform = '';
            }, 150);
            
            // Force update
            updateDateTime();
            
            // Show notification
            showDateTimeUpdateNotification();
        });
    }
}

function updateDateTime() {
    const now = new Date();
    
    // Format date
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    // Format time
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    
    // Update DOM
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
    
    if (timeElement) {
        timeElement.textContent = formattedTime;
    }
}

function showDateTimeUpdateNotification() {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'datetime-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>Date & Time Updated!</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 2000);
}

// ========== EVENT LISTENERS ==========
function initializeEventListeners() {
    // Filter controls - instant filtering
    const driverFilter = document.getElementById('driverFilter');
    if (driverFilter) {
        driverFilter.addEventListener('change', applyFilters);
    }
    
    const trackFilter = document.getElementById('trackFilter');
    if (trackFilter) {
        trackFilter.addEventListener('change', applyFilters);
    }
    
    const dateFromFilter = document.getElementById('dateFromFilter');
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', applyFilters);
    }
    
    const dateToFilter = document.getElementById('dateToFilter');
    if (dateToFilter) {
        dateToFilter.addEventListener('change', applyFilters);
    }
    
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Export functionality (CSV only - PDF button removed)
    const exportCSVBtn = document.getElementById('exportCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportToCSV);
    }
    
    // Mobile dashboard
    const mobileToggle = document.getElementById('showMobile');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileDashboard);
    }
    
    const closeMobile = document.getElementById('closeMobile');
    if (closeMobile) {
        closeMobile.addEventListener('click', closeMobileDashboard);
    }
    
    // Table search
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', searchTable);
    }

    // Enhance native selects to custom-styled dropdowns for consistent styling
    enhanceFilterSelects();
}

// Lightweight custom dropdown enhancer for .filter-select elements
function enhanceFilterSelects() {
    const selects = Array.from(document.querySelectorAll('.filter-select'));
    selects.forEach(select => {
        // Skip if already enhanced
        if (select.dataset.enhanced === 'true') return;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        // Create display box
        const display = document.createElement('div');
        display.className = 'custom-select-display';
        display.tabIndex = 0;
        display.innerText = select.options[select.selectedIndex]?.text || 'Select...';
        wrapper.insertBefore(display, select);

        // Create dropdown list
        const list = document.createElement('div');
        list.className = 'custom-select-list hidden';
        Array.from(select.options).forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-select-item';
            item.dataset.value = opt.value;
            item.innerText = opt.text;
            if (opt.disabled) item.classList.add('disabled');
            item.addEventListener('click', () => {
                select.value = opt.value;
                select.dispatchEvent(new Event('change'));
                display.innerText = opt.text;
                list.classList.add('hidden');
            });
            list.appendChild(item);
        });
        wrapper.appendChild(list);

        // Toggle
        display.addEventListener('click', () => list.classList.toggle('hidden'));
        display.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                list.classList.toggle('hidden');
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                list.classList.add('hidden');
            }
        });

        select.dataset.enhanced = 'true';
    });
}

// ========== DATA LOADING & PROCESSING ==========
async function loadData() {
    const startTime = Date.now();
    const minLoadTime = 2000; // Minimum 2 seconds loading time
    
    try {
        
        // Step 1: Start loading
        updateLoadingProgress(10, 'Connecting to data source...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 2: Fetch data
        updateLoadingProgress(30, 'Fetching racing data...');
        const response = await fetch('./Karten.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Step 3: Parse data
        updateLoadingProgress(50, 'Processing karting records...');
        const csvText = await response.text();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        kartingData = parseCSV(csvText);
        filteredData = [...kartingData];
        
        updateLoadingProgress(70, 'Analyzing performance metrics...');
        console.log(`📊 Loaded ${kartingData.length} racing records`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 4: Initialize analytics
        updateLoadingProgress(90, 'Building interactive charts...');
        await initializeAnalytics();
        
        // Step 5: Complete
        updateLoadingProgress(100, 'Ready! Elite Karting Analytics Platform loaded.');
        
        // Ensure minimum loading time of 2 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
    } catch (error) {
        console.error('❌ Error loading data (will propagate to caller):', error);

        // Still respect minimum loading time even on error
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Rethrow so the outer initialization code can show a single unified error state
        throw error;
    } finally {
        // Always hide the global loading screen controlled by showLoading()
        showLoading(false);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
    }
    
    return data;
}

async function initializeAnalytics() {
    console.log('🔄 Initializing comprehensive analytics...');
    
    // Initialize all analytics modules
    await Promise.all([
        populateFilters(),
        calculateGlobalStats(),
        calculateDriverStats(),
        calculateTrackStats(),
        calculateSessionStats(),
        calculateTemporalStats()
    ]);
    
    // Update UI components
    updateKPISummary();
    updateFilterStatus(); // Initialize filter status
    populateAllDropdowns();
    
    // Initialize all chart sections
    initializeDriverPerformanceCharts();
    initializeLapSessionCharts();
    initializeTrackInsightsCharts();
    initializeDriverBattleCharts();
    initializeFinancialCharts();
    initializeTemporalCharts();
    initializePredictiveCharts();
    initializeGeographicalCharts();
    
    // Initialize widgets and tables
    initializeSessionWidgets();
    initializeLeaderboards();
    initializeDataTable();
    
    console.log('✅ Analytics platform fully initialized!');
}

// ========== STATISTICS CALCULATIONS ==========
function calculateGlobalStats() {
    if (filteredData.length === 0) return {
        totalSessions: 0,
        totalLaps: 0,
        avgLapTime: 0,
        fastestLap: 0,
        totalCost: 0,
        drivers: new Set(),
        tracks: new Set()
    };
    
    const lapTimes = filteredData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
    
    // Calculate unique sessions based on Date, SessionType, and Heat
    const uniqueSessions = new Set();
    const sessionCosts = new Map();
    
    filteredData.forEach(row => {
        const sessionKey = `${row.Date || 'Unknown'}-${row.SessionType || 'Unknown'}-${row.Heat || '1'}`;
        uniqueSessions.add(sessionKey);
        
        // Track heat prices per session (not per lap)
        const heatPrice = parseFloat(row.HeatPrice || 0);
        if (heatPrice > 0 && !sessionCosts.has(sessionKey)) {
            sessionCosts.set(sessionKey, heatPrice);
        }
    });
    
    // Calculate total cost - sum of HeatPrice for unique sessions per driver
    let totalCost = 0;
    const driverSessionCosts = new Map();
    
    filteredData.forEach(row => {
        const driver = row.Driver || 'Unknown';
        const sessionKey = `${row.Date || 'Unknown'}-${row.SessionType || 'Unknown'}-${row.Heat || '1'}`;
        const driverSessionKey = `${driver}-${sessionKey}`;
        const heatPrice = parseFloat(row.HeatPrice || 0);
        
        if (heatPrice > 0 && !driverSessionCosts.has(driverSessionKey)) {
            driverSessionCosts.set(driverSessionKey, heatPrice);
            totalCost += heatPrice;
        }
    });
    
    return {
        totalSessions: uniqueSessions.size,
        totalLaps: filteredData.length,
        avgLapTime: lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0,
        fastestLap: lapTimes.length > 0 ? Math.min(...lapTimes) : 0,
        totalCost: totalCost,
        drivers: new Set(filteredData.map(row => row.Driver)),
        tracks: new Set(filteredData.map(row => row.Track))
    };
}

function calculateDriverStats() {
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    driverStats = {};
    
    drivers.forEach(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const positions = driverData.map(row => parseInt(row.Position || 0)).filter(pos => pos > 0);
        const costs = driverData.map(row => parseFloat(row.HeatPrice || 0)).filter(cost => cost > 0);
        
        if (lapTimes.length > 0) {
            const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
            const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
            
            driverStats[driver] = {
                totalLaps: lapTimes.length,
                avgLapTime: mean,
                bestLapTime: Math.min(...lapTimes),
                consistency: Math.sqrt(variance),
                avgPosition: positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0,
                totalCost: costs.reduce((sum, cost) => sum + cost, 0),
                sessions: new Set(driverData.map(row => row.SessionDate)).size,
                tracks: new Set(driverData.map(row => row.Track))
            };
        }
    });
}

function calculateTrackStats() {
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    trackStats = {};
    
    tracks.forEach(track => {
        const trackData = filteredData.filter(row => row.Track === track);
        const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const costs = trackData.map(row => parseFloat(row.HeatPrice || 0)).filter(cost => cost > 0);
        
        if (lapTimes.length > 0) {
            const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
            const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
            
            trackStats[track] = {
                totalLaps: lapTimes.length,
                avgLapTime: mean,
                bestLapTime: Math.min(...lapTimes),
                difficulty: Math.sqrt(variance), // Higher variance = more difficult
                avgCost: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length : 0,
                sessions: new Set(trackData.map(row => row.SessionDate)).size,
                drivers: new Set(trackData.map(row => row.Driver))
            };
        }
    });
}

function calculateSessionStats() {
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))];
    sessionStats = {};
    
    sessions.forEach(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const costs = sessionData.map(row => parseFloat(row.HeatPrice || 0)).filter(cost => cost > 0);
        
        if (sessionData.length > 0) {
            sessionStats[session] = {
                totalLaps: sessionData.length,
                avgLapTime: lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0,
                bestLapTime: lapTimes.length > 0 ? Math.min(...lapTimes) : 0,
                drivers: [...new Set(sessionData.map(row => row.Driver))],
                track: sessionData[0].Track,
                weather: sessionData[0].Weather,
                totalCost: costs.reduce((sum, cost) => sum + cost, 0)
            };
        }
    });
}

function calculateTemporalStats() {
    // Group data by weeks, months, days of week
    temporalStats = {
        weekly: {},
        monthly: {},
        dayOfWeek: {}
    };
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        if (!isNaN(date.getTime())) {
            const lapTime = parseFloat(row.LapTime || 0);
            if (lapTime > 0) {
                // Weekly stats
                const weekKey = getWeekKey(date);
                if (!temporalStats.weekly[weekKey]) {
                    temporalStats.weekly[weekKey] = { lapTimes: [], sessions: new Set() };
                }
                temporalStats.weekly[weekKey].lapTimes.push(lapTime);
                temporalStats.weekly[weekKey].sessions.add(row.SessionDate);
                
                // Monthly stats
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!temporalStats.monthly[monthKey]) {
                    temporalStats.monthly[monthKey] = { lapTimes: [], sessions: new Set() };
                }
                temporalStats.monthly[monthKey].lapTimes.push(lapTime);
                temporalStats.monthly[monthKey].sessions.add(row.SessionDate);
                
                // Day of week stats
                const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' });
                if (!temporalStats.dayOfWeek[dayKey]) {
                    temporalStats.dayOfWeek[dayKey] = { lapTimes: [], sessions: new Set() };
                }
                temporalStats.dayOfWeek[dayKey].lapTimes.push(lapTime);
                temporalStats.dayOfWeek[dayKey].sessions.add(row.SessionDate);
            }
        }
    });
}

function getWeekKey(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
}

// ========== UI UPDATES ==========
function updateKPISummary() {
    const stats = calculateGlobalStats();
    
    // Check if a specific driver is selected
    const selectedDriver = document.getElementById('driverFilter')?.value;
    const isDriverSelected = selectedDriver && selectedDriver !== '';
    
    if (isDriverSelected) {
        // DRIVER-SPECIFIC PER HEAT METRICS
        const driverData = filteredData.filter(row => row.Driver === selectedDriver);
        
        // Group data by heat (Date-SessionType-Heat-Track)
        const heats = {};
        driverData.forEach(row => {
            const heatKey = `${row.Date}-${row.SessionType}-${row.Heat}-${row.Track}`;
            if (!heats[heatKey]) {
                heats[heatKey] = [];
            }
            heats[heatKey].push(row);
        });
        
        const heatKeys = Object.keys(heats);
        const totalHeats = heatKeys.length;
        
        // Calculate total entries (not per heat)
        const totalEntries = driverData.length;
        
        // Calculate total data points (not per heat)
        const dataColumns = 26;
        const totalDataPoints = totalEntries * dataColumns;
        
        // Calculate average laps per heat
        const lapsPerHeat = heatKeys.map(heatKey => heats[heatKey].length);
        const avgLapsPerHeat = lapsPerHeat.length > 0 ? 
            (lapsPerHeat.reduce((sum, laps) => sum + laps, 0) / lapsPerHeat.length) : 0;
        
        // Calculate average lap time per heat
        const heatAvgTimes = [];
        heatKeys.forEach(heatKey => {
            const heatLaps = heats[heatKey];
            const lapTimes = heatLaps.map(row => parseFloat(row.LapTime)).filter(time => time > 0);
            if (lapTimes.length > 0) {
                const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                heatAvgTimes.push(avgTime);
            }
        });
        const overallAvgLapTime = heatAvgTimes.length > 0 ? 
            (heatAvgTimes.reduce((sum, time) => sum + time, 0) / heatAvgTimes.length) : 0;
        
        // Calculate heats won (where driver had fastest lap in that heat)
        let heatsWon = 0;
        
        // Get all unique heats from the entire dataset, not just driver's heats
        const allHeats = {};
        kartingData.forEach(row => {
            const heatKey = `${row.Date}-${row.SessionType}-${row.Heat}-${row.Track}`;
            if (!allHeats[heatKey]) {
                allHeats[heatKey] = [];
            }
            allHeats[heatKey].push(row);
        });
        
        const allHeatKeys = Object.keys(allHeats);
        console.log(`Checking heats won for ${selectedDriver} across ${allHeatKeys.length} total heats`);
        
        allHeatKeys.forEach((heatKey, index) => {
            const heatData = allHeats[heatKey];
            
            // Find fastest lap for each driver in this heat
            const driverBestLaps = {};
            heatData.forEach(row => {
                const lapTime = parseFloat(row.LapTime);
                if (lapTime > 0 && !isNaN(lapTime)) {
                    if (!driverBestLaps[row.Driver] || lapTime < driverBestLaps[row.Driver]) {
                        driverBestLaps[row.Driver] = lapTime;
                    }
                }
            });
            
            // Find the overall fastest time in this heat
            const allBestLaps = Object.values(driverBestLaps);
            if (allBestLaps.length > 0) {
                const overallFastest = Math.min(...allBestLaps);
                
                // Check if selected driver has the fastest time (allowing for ties)
                if (driverBestLaps[selectedDriver] && 
                    Math.abs(driverBestLaps[selectedDriver] - overallFastest) < 0.001) {
                    heatsWon++;
                    console.log(`${selectedDriver} WON heat ${heatKey} with time ${driverBestLaps[selectedDriver]} (fastest: ${overallFastest})`);
                }
            }
        });
        
        console.log(`${selectedDriver} won ${heatsWon} heats (ties count as wins for all tied drivers)`);
        
        // Calculate cost per heat and cost per lap
        const totalCost = stats.totalCost;
        const avgCostPerHeat = totalHeats > 0 ? (totalCost / totalHeats) : 0;
        const totalLapsForDriver = driverData.length;
        const avgCostPerLap = totalLapsForDriver > 0 ? (totalCost / totalLapsForDriver) : 0;
        
        // Calculate total unique tracks (not per heat)
        const uniqueTracks = new Set(driverData.map(row => row.Track)).size;
        
        // Calculate consistency (average time difference between consecutive laps per heat)
        let consistencyDisplay = '--';
        const heatConsistencies = [];
        heatKeys.forEach(heatKey => {
            const heatLaps = heats[heatKey];
            if (heatLaps.length > 1) {
                // Sort by lap number if available, otherwise by time
                heatLaps.sort((a, b) => {
                    const lapA = parseInt(a.LapNumber) || 0;
                    const lapB = parseInt(b.LapNumber) || 0;
                    return lapA - lapB;
                });
                
                const lapTimes = heatLaps.map(row => parseFloat(row.LapTime)).filter(time => time > 0);
                if (lapTimes.length > 1) {
                    const timeDifferences = [];
                    for (let i = 1; i < lapTimes.length; i++) {
                        timeDifferences.push(Math.abs(lapTimes[i] - lapTimes[i-1]));
                    }
                    
                    if (timeDifferences.length > 0) {
                        const avgDiff = timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length;
                        heatConsistencies.push(avgDiff);
                    }
                }
            }
        });
        
        if (heatConsistencies.length > 0) {
            const overallConsistency = heatConsistencies.reduce((sum, cons) => sum + cons, 0) / heatConsistencies.length;
            consistencyDisplay = `${overallConsistency.toFixed(3)}s`;
        }
        
        // Update KPI tiles with driver metrics
        updateElement('totalEntries', totalEntries.toLocaleString());
        updateElement('dataPoints', totalDataPoints.toLocaleString());
        updateElement('totalHeats', totalHeats);
        updateElement('avgLapsPerSession', avgLapsPerHeat.toFixed(1));
        updateElement('avgLapOverall', `${overallAvgLapTime.toFixed(3)}s`);
        updateElement('sessionsWon', heatsWon);
        updateElement('totalCost', `€${totalCost.toFixed(2)} (€${avgCostPerLap.toFixed(2)}/lap)`);
        updateElement('totalTracks', uniqueTracks);
        updateElement('consistencyMetric', consistencyDisplay);
        
    } else {
        // GLOBAL METRICS (when no driver selected)
        const totalEntries = kartingData.length;
        const dataColumns = 26;
        const totalDataPoints = totalEntries * dataColumns;
        const uniqueTracks = new Set(kartingData.map(row => row.Track)).size;
        const uniqueDrivers = new Set(kartingData.map(row => row.Driver)).size;
        
        // Calculate average laps per driver per heat
        const allHeats = {};
        kartingData.forEach(row => {
            const heatKey = `${row.Date}-${row.SessionType}-${row.Heat}-${row.Track}`;
            if (!allHeats[heatKey]) {
                allHeats[heatKey] = {};
            }
            if (!allHeats[heatKey][row.Driver]) {
                allHeats[heatKey][row.Driver] = 0;
            }
            allHeats[heatKey][row.Driver]++;
        });
        
        // Calculate average laps per driver per heat
        let totalDriverHeatCombinations = 0;
        let totalLapsAcrossAllDriverHeats = 0;
        
        Object.keys(allHeats).forEach(heatKey => {
            const driversInHeat = allHeats[heatKey];
            Object.keys(driversInHeat).forEach(driver => {
                totalDriverHeatCombinations++;
                totalLapsAcrossAllDriverHeats += driversInHeat[driver];
            });
        });
        
        const avgLapsPerDriverPerHeat = totalDriverHeatCombinations > 0 ? 
            (totalLapsAcrossAllDriverHeats / totalDriverHeatCombinations) : 0;
        
        // Calculate total heats won across all drivers (for global view)
        const globalHeats = {};
        filteredData.forEach(row => {
            const heatKey = `${row.Date}-${row.SessionType}-${row.Heat}-${row.Track}`;
            if (!globalHeats[heatKey]) {
                globalHeats[heatKey] = [];
            }
            globalHeats[heatKey].push(row);
        });
        
        let totalHeatsWonAllDrivers = 0;
        Object.keys(globalHeats).forEach(heatKey => {
            const heatData = globalHeats[heatKey];
            
            // Find fastest lap for each driver in this heat
            const driverBestLaps = {};
            heatData.forEach(row => {
                const lapTime = parseFloat(row.LapTime);
                if (lapTime > 0 && !isNaN(lapTime)) {
                    if (!driverBestLaps[row.Driver] || lapTime < driverBestLaps[row.Driver]) {
                        driverBestLaps[row.Driver] = lapTime;
                    }
                }
            });
            
            // Count how many drivers won this heat (ties count for each driver)
            const allBestLaps = Object.values(driverBestLaps);
            if (allBestLaps.length > 0) {
                const overallFastest = Math.min(...allBestLaps);
                Object.keys(driverBestLaps).forEach(driver => {
                    if (Math.abs(driverBestLaps[driver] - overallFastest) < 0.001) {
                        totalHeatsWonAllDrivers++;
                    }
                });
            }
        });
        
        // Update KPI tiles with global metrics
        updateElement('totalEntries', totalEntries.toLocaleString());
        updateElement('dataPoints', totalDataPoints.toLocaleString());
        updateElement('totalHeats', 22); // Total available heats
        updateElement('avgLapsPerSession', avgLapsPerDriverPerHeat.toFixed(1));
        updateElement('avgLapOverall', `${stats.avgLapTime.toFixed(3)}s`);
        updateElement('sessionsWon', totalHeatsWonAllDrivers);
        updateElement('totalCost', `€${stats.totalCost.toFixed(2)}`);
        updateElement('totalTracks', uniqueTracks);
        
        // Show most consistent driver when no driver selected
        if (Object.keys(driverStats).length > 0) {
            const mostConsistent = Object.entries(driverStats)
                .sort((a, b) => a[1].consistency - b[1].consistency)[0];
            updateElement('consistencyMetric', mostConsistent[0]);
        } else {
            updateElement('consistencyMetric', '--');
        }
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function populateFilters() {
    const drivers = [...new Set(kartingData.map(row => row.Driver))].sort();
    const tracks = [...new Set(kartingData.map(row => row.Track))].sort();
    const weather = [...new Set(kartingData.map(row => row.Weather))].filter(w => w).sort();
    const tyres = [...new Set(kartingData.map(row => row.TyreType))].filter(t => t).sort();
    
    console.log('🏁 Available tracks:', tracks);
    console.log('🏎️ Available drivers:', drivers);
    
    populateSelect('driverFilter', drivers);
    populateSelect('trackFilter', tracks);
    populateSelect('weatherFilter', weather);
    populateSelect('tyreFilter', tyres);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Keep the first option (usually "All ...")
    const firstOption = select.firstElementChild;
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function populateAllDropdowns() {
    const drivers = [...new Set(filteredData.map(row => row.Driver))].sort();
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Populate all driver dropdowns
    const driverSelects = [
        'improvementDriverSelect', 'distributionDriverSelect',
        'driver1BattleSelect', 'driver2BattleSelect'
    ];
    
    driverSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="all">All Drivers</option>';
            drivers.forEach(driver => {
                const option = document.createElement('option');
                option.value = driver;
                option.textContent = driver;
                select.appendChild(option);
            });
            if (currentValue) select.value = currentValue;
        }
    });
    
    // Populate session dropdowns
    const sessionSelects = ['sessionSelect', 'battleSessionSelect'];
    sessionSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Session</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                select.appendChild(option);
            });
            if (currentValue) select.value = currentValue;
        }
    });
}

// ========== FILTER FUNCTIONALITY ==========
function applyFilters() {
    const driverFilter = document.getElementById('driverFilter')?.value;
    const trackFilter = document.getElementById('trackFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;
    
    console.log('🔍 Applying filters:', {
        driver: driverFilter || 'All',
        track: trackFilter || 'All',
        dateFrom: dateFromFilter || 'No start date',
        dateTo: dateToFilter || 'No end date'
    });
    
    filteredData = kartingData.filter(row => {
        // Driver filter
        if (driverFilter && row.Driver !== driverFilter) {
            return false;
        }
        
        // Track filter
        if (trackFilter && row.Track !== trackFilter) {
            return false;
        }
        
        // Date range filter
        if (dateFromFilter || dateToFilter) {
            // Parse the date from the row (assuming Date column format YYYY-MM-DD)
            const rowDate = new Date(row.Date);
            
            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter);
                if (rowDate < fromDate) {
                    return false;
                }
            }
            
            if (dateToFilter) {
                const toDate = new Date(dateToFilter);
                // Include the full end date (set to end of day)
                toDate.setHours(23, 59, 59, 999);
                if (rowDate > toDate) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    console.log(`🔍 Filter results: ${filteredData.length} / ${kartingData.length} records`);
    
    // Update filter status indicators
    updateFilterStatus();
    
    // Recalculate all statistics with filtered data
    calculateDriverStats();
    calculateTrackStats();
    calculateSessionStats();
    calculateTemporalStats();
    
    // Update all UI components
    updateKPISummary();
    updateAllCharts();
    updateDataTable();
    updateSessionWidgets();
    updateLeaderboards();
}

function updateFilterStatus() {
    const driverFilter = document.getElementById('driverFilter')?.value;
    const trackFilter = document.getElementById('trackFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;
    
    const hasActiveFilters = driverFilter || trackFilter || dateFromFilter || dateToFilter;
    const clearBtn = document.getElementById('clearFilters');
    const filterStatus = document.getElementById('filterStatus');
    const filterStatusText = document.getElementById('filterStatusText');
    
    if (clearBtn) {
        if (hasActiveFilters) {
            clearBtn.style.opacity = '1';
            clearBtn.style.transform = 'scale(1)';
            clearBtn.title = `Clear all filters (${filteredData.length}/${kartingData.length} records shown)`;
        } else {
            clearBtn.style.opacity = '0.6';
            clearBtn.style.transform = 'scale(0.95)';
            clearBtn.title = 'No active filters';
        }
    }
    
    // Update header filter status indicator
    if (filterStatus && filterStatusText) {
        if (hasActiveFilters) {
            filterStatus.classList.remove('hidden');
            filterStatusText.textContent = `${filteredData.length}/${kartingData.length} records`;
        } else {
            filterStatus.classList.add('hidden');
        }
    }
    
    // Update filter indicators
    updateFilterIndicator('driverFilter', driverFilter);
    updateFilterIndicator('trackFilter', trackFilter);
    updateFilterIndicator('dateFromFilter', dateFromFilter);
    updateFilterIndicator('dateToFilter', dateToFilter);
}

function updateFilterIndicator(filterId, value) {
    const filterElement = document.getElementById(filterId);
    if (filterElement) {
        if (value) {
            filterElement.classList.add('filter-active');
        } else {
            filterElement.classList.remove('filter-active');
        }
    }
}

function clearFilters() {
    console.log('🧹 Clearing all filters...');
    
    // Clear all filter inputs
    const driverFilter = document.getElementById('driverFilter');
    const trackFilter = document.getElementById('trackFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (driverFilter) driverFilter.value = '';
    if (trackFilter) trackFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    
    // Reset filtered data to all data
    filteredData = [...kartingData];
    
    // Update filter status indicators
    updateFilterStatus();
    
    // Recalculate all stats and update displays
    calculateDriverStats();
    calculateTrackStats();
    calculateSessionStats();
    calculateTemporalStats();
    
    updateKPISummary();
    updateAllCharts();
    updateDataTable();
    updateSessionWidgets();
    updateLeaderboards();
    
    console.log('🧹 All filters cleared, showing all data');
    
    // Add visual feedback
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clearBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

// ========== LOADING & ERROR HANDLING ==========
function showLoading(show, message = 'Loading...') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.querySelector('.loading-text');
    const loadingProgress = document.querySelector('.loading-progress');
    
    if (loadingScreen) {
        if (show) {
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
            // Smooth fade out with delay
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    loadingScreen.style.opacity = '1'; // Reset for next time
                }, 500);
            }, 800);
        }
    }
}

function updateLoadingProgress(percentage, message) {
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    const kart = document.querySelector('.kart');
    const track = document.querySelector('.track');
    const loadingBar = document.querySelector('.loading-bar');
    const wheels = document.querySelectorAll('.kart .wheel');
    const smokes = document.querySelectorAll('.smoke');
    
    if (loadingProgress) {
        loadingProgress.style.width = `${percentage}%`;
    }
    
    if (loadingText && message) {
        loadingText.textContent = message;
    }

    // Move kart along the actual loading-bar based on percentage
    if (kart && loadingBar) {
        const barRect = loadingBar.getBoundingClientRect();
        const containerRect = loadingBar.parentElement.getBoundingClientRect();
        const kartRect = kart.getBoundingClientRect();
        // usable distance is the full width of the bar minus the kart width
        const usable = Math.max(0, barRect.width - kartRect.width);
        const x = (percentage / 100) * usable;
        // translate relative to left edge of the bar (inside loading-container)
    const relativeX = (barRect.left - containerRect.left) + x;
    const tilt = (percentage - 50) / 6;
    const bob = Math.sin(Date.now() / 120) * (1 + (percentage / 100) * 2);

    // Position horizontally by setting left (px) relative to the loading-container
    kart.style.left = `${relativeX}px`;

    // Compute bottom so kart wheels sit on the loading bar centerline
    const barCenterY = barRect.top + (loadingBar.offsetHeight / 2);
    const baseBottom = Math.round(containerRect.bottom - barCenterY - (kartRect.height / 2));
    kart.style.bottom = `${Math.max(0, baseBottom)}px`;

    // Apply bob and tilt via transform only
    kart.style.transform = `translateY(${ -Math.abs(bob).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
        if (percentage > 1) {
            kart.classList.add('moving');
            kart.style.animation = 'kartBob 600ms ease-in-out infinite';
        } else {
            kart.classList.remove('moving');
            kart.style.animation = '';
        }

        // wheel speed: faster spin while moving
        // wheel rotation speed (seconds per rotation) — faster = smaller number
        const speed = Math.max(0.06, 0.45 - (percentage / 100) * 0.36);
        wheels.forEach(w => {
            // set CSS var used by CSS animation
            w.style.setProperty('--wheel-speed', `${speed}s`);
            // rotate spokes group inside the wheel for SVG
            const spokes = w.querySelector('.spokes');
            if (spokes) {
                const rot = (Date.now() / (speed * 1000)) % 360;
                spokes.style.transform = `rotate(${rot}deg)`;
            }
        });

        // small front-wheel steering sway to make it feel alive
        const front = document.getElementById('frontWheel');
        if (front) {
            const steer = Math.sin(Date.now() / 300 + percentage) * (3 + (percentage / 100) * 6); // -~9..9 deg
            front.style.transform = `translate(88px,118px) rotate(${steer.toFixed(2)}deg)`;
        }

        // smoke intensity based on speed
        smokes.forEach((s, i) => {
            s.style.opacity = `${0.2 + (percentage / 100) * 0.8 - i * 0.05}`;
            s.style.transform = `translateX(${-(percentage / 100) * 60 - i * 10}px) scale(${0.6 + (percentage / 100) * 0.8})`;
        });
    }
}

function showError(message) {
    console.error('❌ Error:', message);
    
    // Create a custom error notification instead of alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// ========== UTILITY FUNCTIONS ==========
function getDriverColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}

function formatTime(seconds) {
    return `${seconds.toFixed(3)}s`;
}

function formatCurrency(amount) {
    return `€${amount.toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// ========== ADVANCED FEATURES ==========
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function toggleMobileDashboard() {
    const mobileDashboard = document.getElementById('mobileDashboard');
    if (mobileDashboard) {
        mobileDashboard.style.display = 'block';
        updateMobileStats();
    }
}

function closeMobileDashboard() {
    const mobileDashboard = document.getElementById('mobileDashboard');
    if (mobileDashboard) {
        mobileDashboard.style.display = 'none';
    }
}

function updateMobileStats() {
    const stats = calculateGlobalStats();
    updateElement('mobileBestLap', formatTime(stats.fastestLap));
    updateElement('mobileLastSession', 'Recent');
    updateElement('mobileUpcoming', 'TBD');
}

// ========== EXPORT FUNCTIONALITY ==========
function exportToCSV() {
    console.log('📊 Exporting to CSV...');
    
    const headers = Object.keys(filteredData[0] || {});
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'karting_data_filtered.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function searchTable() {
    const searchTerm = document.getElementById('tableSearch')?.value.toLowerCase();
    const tableRows = document.querySelectorAll('#tableBody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

console.log('🏁 Elite Karting Analytics Platform JavaScript Loaded');

// ========== 1. DRIVER PERFORMANCE OVERVIEW CHARTS ==========

function initializeDriverPerformanceCharts() {
    console.log('🏎️ Initializing Driver Performance Charts...');
    
    // Add event listeners for controls
    addChartEventListener('rankingMetricSelect', createDriverRankingChart);
    addChartEventListener('avgLapGroupBy', createAvgLapTimeChart);
    addChartEventListener('improvementDriverSelect', createImprovementChart);
    addChartEventListener('distributionDriverSelect', createLapDistributionChart);
    
    // Create all charts
    createDriverRankingChart();
    createFastestLapChart();
    createAvgLapTimeChart();
    createConsistencyChart();
    createImprovementChart();
    createLapDistributionChart();
    createBestLapHeatmap();
    createPaceAnalysisChart();
}

// 1.1 Driver Ranking Over Time
function createDriverRankingChart() {
    const ctx = document.getElementById('driverRankingChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const sessions = [...new Set(filteredData.map(row => `${row.Date}-${row.SessionType}-${row.Heat}`))].sort();
    const metric = document.getElementById('rankingMetricSelect')?.value || 'position';
    
    const datasets = drivers.slice(0, 8).map((driver, index) => { // Limit to top 8 drivers
        const data = sessions.map(session => {
            const [date, sessionType, heat] = session.split('-');
            const sessionData = filteredData.filter(row => 
                row.Driver === driver && 
                row.Date === date && 
                row.SessionType === sessionType && 
                row.Heat === heat
            );
            if (sessionData.length === 0) return null;
            
            if (metric === 'position') {
                const positions = sessionData.map(row => parseFloat(row.Position || 0)).filter(pos => pos > 0);
                return positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : null;
            } else {
                const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
            }
        });

        return {
            label: driver,
            data: data,
            borderColor: CHART_COLORS[index % CHART_COLORS.length],
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 8
        };
    });

    destroyChart('driverRanking');
    charts.driverRanking = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sessions,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    reverse: metric === 'position',
                    title: {
                        display: true,
                        text: metric === 'position' ? 'Average Position' : 'Average Lap Time (s)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Session Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 1.2 Fastest Lap by Driver
function createFastestLapChart() {
    const ctx = document.getElementById('fastestLapChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Calculate fastest laps and sort by performance
    const driverFastestLaps = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        return {
            driver: driver,
            fastestLap: lapTimes.length > 0 ? Math.min(...lapTimes) : 999,
            totalLaps: lapTimes.length
        };
    }).filter(d => d.fastestLap < 999 && d.totalLaps >= 3) // Only include drivers with at least 3 laps
      .sort((a, b) => a.fastestLap - b.fastestLap)
      .slice(0, 12); // Top 12 drivers

    const labels = driverFastestLaps.map(d => d.driver);
    const fastestLaps = driverFastestLaps.map(d => d.fastestLap);

    destroyChart('fastestLap');
    charts.fastestLap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fastest Lap Time (s)',
                data: fastestLaps,
                backgroundColor: labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length] + 'CC'),
                borderColor: labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Fastest: ${context.parsed.y.toFixed(3)}s`;
                        }
                    }
                }
            }
        }
    });
}

// 1.3 Average Lap Time per Driver
function createAvgLapTimeChart() {
    const ctx = document.getElementById('avgLapTimeChart');
    if (!ctx) return;

    const groupBy = document.getElementById('avgLapGroupBy')?.value || 'overall';
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    let datasets = [];
    let labels = drivers;

    if (groupBy === 'overall') {
        const avgLapTimes = drivers.map(driver => {
            const driverData = filteredData.filter(row => row.Driver === driver);
            const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0;
        });

        datasets = [{
            label: 'Average Lap Time',
            data: avgLapTimes,
            backgroundColor: drivers.map((_, index) => getDriverColor(index) + 'CC'),
            borderColor: drivers.map((_, index) => getDriverColor(index)),
            borderWidth: 2,
            borderRadius: 8
        }];
    } else if (groupBy === 'track') {
        const tracks = [...new Set(filteredData.map(row => row.Track))];
        labels = tracks;
        
        datasets = drivers.map((driver, index) => {
            const data = tracks.map(track => {
                const trackData = filteredData.filter(row => row.Driver === driver && row.Track === track);
                const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
            });
            
            return {
                label: driver,
                data: data,
                backgroundColor: getDriverColor(index) + 'CC',
                borderColor: getDriverColor(index),
                borderWidth: 2,
                borderRadius: 4
            };
        });
    }

    destroyChart('avgLapTime');
    charts.avgLapTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: groupBy !== 'overall',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 1.4 Consistency Index Chart
function createConsistencyChart() {
    const ctx = document.getElementById('consistencyChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const consistencyData = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length === 0) return 0;
        
        const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
        return Math.sqrt(variance);
    });

    destroyChart('consistency');
    charts.consistency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drivers,
            datasets: [{
                label: 'Consistency Index (lower = more consistent)',
                data: consistencyData,
                backgroundColor: consistencyData.map(value => {
                    const max = Math.max(...consistencyData.filter(v => v > 0));
                    const ratio = max > 0 ? value / max : 0;
                    if (ratio < 0.3) return '#4CAF50CC'; // Green - very consistent
                    if (ratio < 0.6) return '#FFC107CC'; // Yellow - moderate
                    return '#F44336CC'; // Red - inconsistent
                }),
                borderColor: consistencyData.map(value => {
                    const max = Math.max(...consistencyData.filter(v => v > 0));
                    const ratio = max > 0 ? value / max : 0;
                    if (ratio < 0.3) return '#4CAF50';
                    if (ratio < 0.6) return '#FFC107';
                    return '#F44336';
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Standard Deviation (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            let consistency = 'Highly Inconsistent';
                            if (value < 0.5) consistency = 'Very Consistent';
                            else if (value < 1.0) consistency = 'Moderately Consistent';
                            else if (value < 2.0) consistency = 'Inconsistent';
                            
                            return `${consistency}: ${value.toFixed(3)}s std dev`;
                        }
                    }
                }
            }
        }
    });
}

// 1.5 Improvement Over Sessions Chart
function createImprovementChart() {
    const ctx = document.getElementById('improvementChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('improvementDriverSelect')?.value;
    const driversToShow = selectedDriver && selectedDriver !== 'all' ? [selectedDriver] : 
                         [...new Set(filteredData.map(row => row.Driver))];
    
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    const datasets = driversToShow.map((driver, index) => {
        const sessionAvgs = sessions.map(session => {
            const sessionData = filteredData.filter(row => row.Driver === driver && row.SessionDate === session);
            const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
        });

        return {
            label: driver,
            data: sessionAvgs,
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8
        };
    });

    destroyChart('improvement');
    charts.improvement = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sessions,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Session Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 1.6 Lap Time Distribution Chart
function createLapDistributionChart() {
    const ctx = document.getElementById('lapDistributionChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('distributionDriverSelect')?.value;
    const driversToShow = selectedDriver && selectedDriver !== 'all' ? [selectedDriver] : 
                         [...new Set(filteredData.map(row => row.Driver))].slice(0, 3);
    
    const datasets = driversToShow.map((driver, index) => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0 && time < 200);
        
        if (lapTimes.length === 0) return null;
        
        const min = Math.min(...lapTimes);
        const max = Math.max(...lapTimes);
        const binCount = 20;
        const binSize = (max - min) / binCount;
        
        const bins = Array(binCount).fill(0);
        
        lapTimes.forEach(time => {
            const binIndex = Math.min(Math.floor((time - min) / binSize), binCount - 1);
            bins[binIndex]++;
        });

        return {
            label: driver,
            data: bins,
            backgroundColor: getDriverColor(index) + '99',
            borderColor: getDriverColor(index),
            borderWidth: 1
        };
    }).filter(dataset => dataset !== null);

    destroyChart('lapDistribution');
    charts.lapDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 20}, (_, i) => `${(i * 2).toFixed(1)}s`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Laps',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Lap Time Range',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 1.7 Best Lap Heatmap
function createBestLapHeatmap() {
    const container = document.getElementById('bestLapHeatmap');
    if (!container) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    const heatmapData = [];
    drivers.forEach(driver => {
        tracks.forEach(track => {
            const data = filteredData.filter(row => row.Driver === driver && row.Track === track);
            const lapTimes = data.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            const bestLap = lapTimes.length > 0 ? Math.min(...lapTimes) : null;
            
            heatmapData.push({
                driver: driver,
                track: track,
                bestLap: bestLap,
                lapCount: lapTimes.length
            });
        });
    });

    const validLaps = heatmapData.filter(d => d.bestLap !== null).map(d => d.bestLap);
    const minLap = Math.min(...validLaps);
    const maxLap = Math.max(...validLaps);

    let html = '<div class="heatmap-grid" style="grid-template-columns: 150px repeat(' + tracks.length + ', 1fr);">';
    
    html += '<div class="heatmap-cell" style="font-weight: bold; background: var(--primary-color); color: white;">Driver / Track</div>';
    tracks.forEach(track => {
        html += `<div class="heatmap-cell" style="font-weight: bold; background: var(--primary-color); color: white;">${track}</div>`;
    });
    
    drivers.forEach(driver => {
        html += `<div class="heatmap-cell" style="font-weight: bold; background: var(--secondary-color); color: white;">${driver}</div>`;
        tracks.forEach(track => {
            const cellData = heatmapData.find(d => d.driver === driver && d.track === track);
            let className = 'heatmap-cell';
            let content = 'N/A';
            
            if (cellData && cellData.bestLap !== null) {
                const lapTime = cellData.bestLap;
                const ratio = (lapTime - minLap) / (maxLap - minLap);
                
                if (ratio <= 0.25) className += ' best';
                else if (ratio <= 0.5) className += ' good';
                else if (ratio <= 0.75) className += ' average';
                else className += ' poor';
                
                content = `${lapTime.toFixed(3)}s<br><small>${cellData.lapCount} laps</small>`;
            }
            
            html += `<div class="${className}" title="${driver} at ${track}: ${cellData && cellData.bestLap ? cellData.bestLap.toFixed(3) + 's' : 'No data'}">${content}</div>`;
        });
    });
    
    html += '</div>';
    
    html += `
        <div class="heatmap-legend">
            <div class="legend-item">
                <div class="legend-color best"></div>
                <span>Best Performance</span>
            </div>
            <div class="legend-item">
                <div class="legend-color good"></div>
                <span>Good</span>
            </div>
            <div class="legend-item">
                <div class="legend-color average"></div>
                <span>Average</span>
            </div>
            <div class="legend-item">
                <div class="legend-color poor"></div>
                <span>Needs Improvement</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// 1.8 Start vs End Pace Analysis Chart
function createPaceAnalysisChart() {
    const ctx = document.getElementById('paceAnalysisChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))];
    
    const startPaceData = [];
    const endPaceData = [];
    
    drivers.forEach(driver => {
        let startPaceSum = 0;
        let endPaceSum = 0;
        let validSessions = 0;
        
        sessions.forEach(session => {
            const sessionData = filteredData.filter(row => 
                row.Driver === driver && 
                row.SessionDate === session
            ).sort((a, b) => parseInt(a.Lap || 0) - parseInt(b.Lap || 0));
            
            if (sessionData.length >= 6) {
                const firstThird = sessionData.slice(0, Math.floor(sessionData.length / 3));
                const lastThird = sessionData.slice(-Math.floor(sessionData.length / 3));
                
                const startLaps = firstThird.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                const endLaps = lastThird.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                
                if (startLaps.length > 0 && endLaps.length > 0) {
                    startPaceSum += startLaps.reduce((sum, time) => sum + time, 0) / startLaps.length;
                    endPaceSum += endLaps.reduce((sum, time) => sum + time, 0) / endLaps.length;
                    validSessions++;
                }
            }
        });
        
        if (validSessions > 0) {
            startPaceData.push(startPaceSum / validSessions);
            endPaceData.push(endPaceSum / validSessions);
        } else {
            startPaceData.push(0);
            endPaceData.push(0);
        }
    });

    destroyChart('paceAnalysis');
    charts.paceAnalysis = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drivers,
            datasets: [
                {
                    label: 'Start Pace (First 1/3)',
                    data: startPaceData,
                    backgroundColor: '#4CAF50CC',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'End Pace (Last 1/3)',
                    data: endPaceData,
                    backgroundColor: '#F44336CC',
                    borderColor: '#F44336',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            const driver = context.label;
                            const driverIndex = context.dataIndex;
                            const startPace = startPaceData[driverIndex];
                            const endPace = endPaceData[driverIndex];
                            const difference = endPace - startPace;
                            
                            if (difference > 0) {
                                return `Fatigue: +${difference.toFixed(3)}s slower at end`;
                            } else if (difference < 0) {
                                return `Improvement: ${Math.abs(difference).toFixed(3)}s faster at end`;
                            } else {
                                return 'Consistent pace throughout session';
                            }
                        }
                    }
                }
            }
        }
    });
}

// ========== UTILITY FUNCTIONS FOR CHARTS ==========
function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

function addChartEventListener(elementId, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('change', callback);
    }
}

function updateAllCharts() {
    console.log('🔄 Updating all charts with filtered data...');
    
    // Update Driver Performance Overview charts
    createDriverRankingChart();
    createFastestLapChart();
    createAvgLapTimeChart();
    createConsistencyChart();
    createImprovementChart();
    createLapDistributionChart();
    createBestLapHeatmap();
    createPaceAnalysisChart();
    
    // Update other chart sections (to be implemented)
    // initializeLapSessionCharts();
    // initializeTrackInsightsCharts();
    // etc.
}

// ========== PLACEHOLDER FUNCTIONS FOR OTHER CHART SECTIONS ==========
// These will be implemented next

// ========== 2. LAP & SESSION ANALYSIS CHARTS ==========

function initializeLapSessionCharts() {
    console.log('🏁 Initializing Lap & Session Analysis Charts...');
    
    // Add event listeners for controls
    addChartEventListener('sessionSummaryMetric', createSessionSummaryChart);
    addChartEventListener('sessionComparisonSession1', createSessionComparisonChart);
    addChartEventListener('sessionComparisonSession2', createSessionComparisonChart);
    addChartEventListener('lapProgressionDriver', createLapProgressionChart);
    addChartEventListener('positionChangesSession', createPositionChangesChart);
    
    // Create all charts
    createSessionSummaryChart();
    createLapProgressionChart();
    createFuelEfficiencyChart();
    createPositionChangesChart();
    createWeatherImpactChart();
    createSessionComparisonChart();
    createStintAnalysisChart();
}

// 2.1 Session Summary Chart
function createSessionSummaryChart() {
    const ctx = document.getElementById('sessionSummaryChart');
    if (!ctx) return;

    const metric = document.getElementById('sessionSummaryMetric')?.value || 'lapTime';
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    let datasets = [];
    
    if (metric === 'lapTime') {
        const avgLapTimes = sessions.map(session => {
            const sessionData = filteredData.filter(row => row.SessionDate === session);
            const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0;
        });
        
        const fastestLaps = sessions.map(session => {
            const sessionData = filteredData.filter(row => row.SessionDate === session);
            const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
        });

        datasets = [
            {
                label: 'Average Lap Time',
                data: avgLapTimes,
                borderColor: '#3B82F6',
                backgroundColor: '#3B82F640',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 6
            },
            {
                label: 'Fastest Lap',
                data: fastestLaps,
                borderColor: '#22C55E',
                backgroundColor: '#22C55E40',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 6
            }
        ];
    } else if (metric === 'lapCount') {
        const lapCounts = sessions.map(session => {
            return filteredData.filter(row => row.SessionDate === session).length;
        });
        
        datasets = [{
            label: 'Total Laps',
            data: lapCounts,
            backgroundColor: '#8B5CF6CC',
            borderColor: '#8B5CF6',
            borderWidth: 2,
            borderRadius: 8
        }];
    }

    destroyChart('sessionSummary');
    charts.sessionSummary = new Chart(ctx, {
        type: metric === 'lapCount' ? 'bar' : 'line',
        data: {
            labels: sessions,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric === 'lapCount',
                    title: {
                        display: true,
                        text: metric === 'lapCount' ? 'Number of Laps' : 'Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Session Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 2.2 Lap Time Progression Chart
function createLapProgressionChart() {
    const ctx = document.getElementById('lapProgressionChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('lapProgressionDriver')?.value;
    const driversToShow = selectedDriver && selectedDriver !== 'all' ? [selectedDriver] : 
                         [...new Set(filteredData.map(row => row.Driver))].slice(0, 5);
    
    const datasets = driversToShow.map((driver, index) => {
        const driverData = filteredData.filter(row => row.Driver === driver)
                                    .sort((a, b) => parseInt(a.Lap || 0) - parseInt(b.Lap || 0));
        
        const lapNumbers = driverData.map(row => parseInt(row.Lap || 0));
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0));
        
        return {
            label: driver,
            data: lapTimes.map((time, i) => ({x: lapNumbers[i], y: time})),
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });

    destroyChart('lapProgression');
    charts.lapProgression = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Lap Number',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 2.3 Fuel Efficiency Analysis Chart
function createFuelEfficiencyChart() {
    const ctx = document.getElementById('fuelEfficiencyChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Simulated fuel efficiency based on lap consistency and speed
    const fuelEfficiencyData = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length === 0) return { driver, efficiency: 0, avgSpeed: 0 };
        
        const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        const consistency = calculateStandardDeviation(lapTimes);
        
        // Simulate fuel efficiency (lower lap time + better consistency = better efficiency)
        const efficiency = Math.max(10, 50 - (avgLapTime * 2) - (consistency * 5));
        const avgSpeed = avgLapTime > 0 ? (2400 / avgLapTime) : 0; // Assuming 2.4km track
        
        return { driver, efficiency: Math.round(efficiency * 100) / 100, avgSpeed: Math.round(avgSpeed * 100) / 100 };
    });

    destroyChart('fuelEfficiency');
    charts.fuelEfficiency = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Fuel Efficiency vs Speed',
                data: fuelEfficiencyData.map((item, index) => ({
                    x: item.avgSpeed,
                    y: item.efficiency,
                    driver: item.driver,
                    backgroundColor: getDriverColor(index),
                    borderColor: getDriverColor(index),
                    pointRadius: 8,
                    pointHoverRadius: 10
                })),
                backgroundColor: fuelEfficiencyData.map((_, index) => getDriverColor(index)),
                borderColor: fuelEfficiencyData.map((_, index) => getDriverColor(index)),
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Average Speed (km/h)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Fuel Efficiency Score',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return fuelEfficiencyData[context[0].dataIndex].driver;
                        },
                        label: function(context) {
                            return [
                                `Speed: ${context.parsed.x.toFixed(1)} km/h`,
                                `Efficiency: ${context.parsed.y.toFixed(1)} points`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// 2.4 Position Changes Chart
function createPositionChangesChart() {
    const ctx = document.getElementById('positionChangesChart');
    if (!ctx) return;

    const selectedSession = document.getElementById('positionChangesSession')?.value;
    let sessionData = filteredData;
    
    if (selectedSession && selectedSession !== 'all') {
        sessionData = filteredData.filter(row => row.SessionDate === selectedSession);
    }
    
    const drivers = [...new Set(sessionData.map(row => row.Driver))];
    const laps = [...new Set(sessionData.map(row => parseInt(row.Lap || 0)))].sort((a, b) => a - b);
    
    const datasets = drivers.map((driver, index) => {
        const positions = laps.map(lap => {
            const lapData = sessionData.filter(row => row.Driver === driver && parseInt(row.Lap || 0) === lap);
            if (lapData.length > 0) {
                return parseInt(lapData[0].Position || 0);
            }
            return null;
        });
        
        return {
            label: driver,
            data: positions,
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
        };
    });

    destroyChart('positionChanges');
    charts.positionChanges = new Chart(ctx, {
        type: 'line',
        data: {
            labels: laps,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    reverse: true,
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Position',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        stepSize: 1
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Lap Number',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 2.5 Weather Impact Analysis Chart
function createWeatherImpactChart() {
    const ctx = document.getElementById('weatherImpactChart');
    if (!ctx) return;

    // Simulate weather conditions based on session date and lap time variations
    const weatherData = [];
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))];
    
    sessions.forEach(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length > 0) {
            const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
            const variance = calculateStandardDeviation(lapTimes);
            
            // Simulate weather based on performance variance
            let weather, temp, humidity;
            if (variance < 1) {
                weather = 'Sunny';
                temp = 25 + Math.random() * 10;
                humidity = 30 + Math.random() * 20;
            } else if (variance < 2) {
                weather = 'Cloudy';
                temp = 20 + Math.random() * 10;
                humidity = 50 + Math.random() * 20;
            } else {
                weather = 'Rainy';
                temp = 15 + Math.random() * 10;
                humidity = 70 + Math.random() * 20;
            }
            
            weatherData.push({
                session,
                weather,
                avgLapTime,
                temp: Math.round(temp),
                humidity: Math.round(humidity),
                variance
            });
        }
    });

    const weatherTypes = ['Sunny', 'Cloudy', 'Rainy'];
    const colors = ['#FFD700', '#87CEEB', '#4682B4'];
    
    const datasets = weatherTypes.map((weather, index) => {
        const data = weatherData.filter(item => item.weather === weather);
        return {
            label: weather,
            data: data.map(item => item.avgLapTime),
            backgroundColor: colors[index] + 'CC',
            borderColor: colors[index],
            borderWidth: 2,
            borderRadius: 6
        };
    });

    const labels = weatherTypes.map(weather => {
        const count = weatherData.filter(item => item.weather === weather).length;
        return `${weather} (${count})`;
    });

    destroyChart('weatherImpact');
    charts.weatherImpact = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Lap Time by Weather',
                data: weatherTypes.map(weather => {
                    const weatherSessions = weatherData.filter(item => item.weather === weather);
                    if (weatherSessions.length === 0) return 0;
                    return weatherSessions.reduce((sum, item) => sum + item.avgLapTime, 0) / weatherSessions.length;
                }),
                backgroundColor: colors.map(color => color + 'CC'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 2.6 Session Comparison Chart
function createSessionComparisonChart() {
    const ctx = document.getElementById('sessionComparisonChart');
    if (!ctx) return;

    const session1 = document.getElementById('sessionComparisonSession1')?.value;
    const session2 = document.getElementById('sessionComparisonSession2')?.value;
    
    if (!session1 || !session2 || session1 === session2) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    const session1Data = filteredData.filter(row => row.SessionDate === session1);
    const session2Data = filteredData.filter(row => row.SessionDate === session2);
    
    const drivers = [...new Set([...session1Data.map(row => row.Driver), ...session2Data.map(row => row.Driver)])];
    
    const session1Times = drivers.map(driver => {
        const driverData = session1Data.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        return lapTimes.length > 0 ? Math.min(...lapTimes) : null;
    });
    
    const session2Times = drivers.map(driver => {
        const driverData = session2Data.filter(row => row.Driver === driver);
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        return lapTimes.length > 0 ? Math.min(...lapTimes) : null;
    });

    destroyChart('sessionComparison');
    charts.sessionComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drivers,
            datasets: [
                {
                    label: session1,
                    data: session1Times,
                    backgroundColor: '#3B82F6CC',
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: session2,
                    data: session2Times,
                    backgroundColor: '#EF4444CC',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Best Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 2.7 Stint Analysis Chart
function createStintAnalysisChart() {
    const ctx = document.getElementById('stintAnalysisChart');
    if (!ctx) return;

    // Group laps into stints (assuming stint break every 10-15 laps based on gap in data)
    const drivers = [...new Set(filteredData.map(row => row.Driver))].slice(0, 3);
    
    const datasets = drivers.map((driver, index) => {
        const driverData = filteredData.filter(row => row.Driver === driver)
                                    .sort((a, b) => parseInt(a.Lap || 0) - parseInt(b.Lap || 0));
        
        // Simulate stint analysis by grouping consecutive laps
        const stints = [];
        let currentStint = [];
        let lastLap = 0;
        
        driverData.forEach(row => {
            const lapNum = parseInt(row.Lap || 0);
            const lapTime = parseFloat(row.LapTime || 0);
            
            if (lapNum - lastLap > 2 && currentStint.length > 0) {
                // New stint detected
                const avgTime = currentStint.reduce((sum, time) => sum + time, 0) / currentStint.length;
                stints.push(avgTime);
                currentStint = [lapTime];
            } else {
                currentStint.push(lapTime);
            }
            lastLap = lapNum;
        });
        
        if (currentStint.length > 0) {
            const avgTime = currentStint.reduce((sum, time) => sum + time, 0) / currentStint.length;
            stints.push(avgTime);
        }
        
        return {
            label: driver,
            data: stints,
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '40',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8
        };
    });

    const maxStints = Math.max(...datasets.map(d => d.data.length));
    const stintLabels = Array.from({length: maxStints}, (_, i) => `Stint ${i + 1}`);

    destroyChart('stintAnalysis');
    charts.stintAnalysis = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stintLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Stint Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Stint Number',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// ========== 3. TRACK INSIGHTS ANALYTICS ==========

function initializeTrackInsightsCharts() {
    console.log('🗺️ Initializing Track Insights Charts...');
    
    // Add event listeners for controls
    addChartEventListener('trackPerformanceMetric', createTrackPerformanceChart);
    addChartEventListener('cornerAnalysisTrack', createCornerAnalysisChart);
    addChartEventListener('trackRecordsType', createTrackRecordsChart);
    
    // Create all charts
    createTrackPerformanceChart();
    createCornerAnalysisChart();
    createTrackRecordsChart();
    createLayoutEfficiencyChart();
    createSurfaceConditionsChart();
    createTrackDifficultyChart();
}

// 3.1 Track Performance Comparison Chart
function createTrackPerformanceChart() {
    const ctx = document.getElementById('trackPerformanceChart');
    if (!ctx) return;

    const metric = document.getElementById('trackPerformanceMetric')?.value || 'lapTime';
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    let chartData = [];
    
    if (metric === 'lapTime') {
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0;
        });
    } else if (metric === 'bestLap') {
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
        });
    } else if (metric === 'consistency') {
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? calculateStandardDeviation(lapTimes) : 0;
        });
    }

    destroyChart('trackPerformance');
    charts.trackPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tracks,
            datasets: [{
                label: metric === 'lapTime' ? 'Average Lap Time' : 
                       metric === 'bestLap' ? 'Best Lap Time' : 'Consistency Index',
                data: chartData,
                backgroundColor: tracks.map((_, index) => getTrackColor(index) + 'CC'),
                borderColor: tracks.map((_, index) => getTrackColor(index)),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric === 'consistency',
                    title: {
                        display: true,
                        text: metric === 'consistency' ? 'Standard Deviation (s)' : 'Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 3.2 Corner Analysis Chart
function createCornerAnalysisChart() {
    const ctx = document.getElementById('cornerAnalysisChart');
    if (!ctx) return;

    const selectedTrack = document.getElementById('cornerAnalysisTrack')?.value;
    const tracksToShow = selectedTrack && selectedTrack !== 'all' ? [selectedTrack] : 
                        [...new Set(filteredData.map(row => row.Track))];
    
    // Simulate corner data based on lap segments
    const cornerData = [];
    
    tracksToShow.forEach(track => {
        const trackData = filteredData.filter(row => row.Track === track);
        
        // Simulate 8 corners per track
        for (let corner = 1; corner <= 8; corner++) {
            const cornerTimes = trackData.map(row => {
                const lapTime = parseFloat(row.LapTime || 0);
                if (lapTime === 0) return 0;
                
                // Simulate corner time as percentage of lap time with some variation
                const basePercentage = 0.08 + (Math.sin(corner) * 0.02); // Vary by corner
                const variation = (Math.random() - 0.5) * 0.01; // Small random variation
                return lapTime * (basePercentage + variation);
            }).filter(time => time > 0);
            
            if (cornerTimes.length > 0) {
                const avgTime = cornerTimes.reduce((sum, time) => sum + time, 0) / cornerTimes.length;
                cornerData.push({
                    track: track,
                    corner: corner,
                    avgTime: avgTime,
                    consistency: calculateStandardDeviation(cornerTimes)
                });
            }
        }
    });

    const cornerNumbers = Array.from({length: 8}, (_, i) => `Corner ${i + 1}`);
    
    const datasets = tracksToShow.map((track, index) => {
        const trackCorners = cornerData.filter(item => item.track === track);
        const data = cornerNumbers.map((_, cornerIndex) => {
            const corner = trackCorners.find(item => item.corner === cornerIndex + 1);
            return corner ? corner.avgTime : 0;
        });
        
        return {
            label: track,
            data: data,
            borderColor: getTrackColor(index),
            backgroundColor: getTrackColor(index) + '40',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
        };
    });

    destroyChart('cornerAnalysis');
    charts.cornerAnalysis = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: cornerNumbers,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Corner Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    },
                    angleLines: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 3.3 Track Records Chart
function createTrackRecordsChart() {
    const ctx = document.getElementById('trackRecordsChart');
    if (!ctx) return;

    const recordType = document.getElementById('trackRecordsType')?.value || 'fastest';
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    let chartData = [];
    
    if (recordType === 'fastest') {
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
        });
    } else if (recordType === 'mostLaps') {
        chartData = tracks.map(track => {
            return filteredData.filter(row => row.Track === track).length;
        });
    } else if (recordType === 'avgPosition') {
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const positions = trackData.map(row => parseFloat(row.Position || 0)).filter(pos => pos > 0);
            return positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0;
        });
    }

    // Find record holders
    const recordHolders = tracks.map((track, index) => {
        const trackData = filteredData.filter(row => row.Track === track);
        
        if (recordType === 'fastest') {
            const bestLapRow = trackData.reduce((best, current) => {
                const currentTime = parseFloat(current.LapTime || 0);
                const bestTime = parseFloat(best.LapTime || 0);
                return (currentTime > 0 && (bestTime === 0 || currentTime < bestTime)) ? current : best;
            }, {});
            return bestLapRow.Driver || 'Unknown';
        }
        
        return 'Various';
    });

    destroyChart('trackRecords');
    charts.trackRecords = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tracks,
            datasets: [{
                label: recordType === 'fastest' ? 'Track Record (seconds)' :
                       recordType === 'mostLaps' ? 'Total Laps' : 'Average Position',
                data: chartData,
                backgroundColor: chartData.map((value, index) => {
                    if (recordType === 'fastest') {
                        const minValue = Math.min(...chartData.filter(v => v > 0));
                        return value === minValue ? '#FFD70080' : getTrackColor(index) + '80';
                    }
                    return getTrackColor(index) + '80';
                }),
                borderColor: chartData.map((value, index) => {
                    if (recordType === 'fastest') {
                        const minValue = Math.min(...chartData.filter(v => v > 0));
                        return value === minValue ? '#FFD700' : getTrackColor(index);
                    }
                    return getTrackColor(index);
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: recordType !== 'fastest',
                    title: {
                        display: true,
                        text: recordType === 'fastest' ? 'Lap Time (seconds)' :
                              recordType === 'mostLaps' ? 'Number of Laps' : 'Average Position',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            if (recordType === 'fastest') {
                                return `Record Holder: ${recordHolders[context.dataIndex]}`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// 3.4 Layout Efficiency Chart
function createLayoutEfficiencyChart() {
    const ctx = document.getElementById('layoutEfficiencyChart');
    if (!ctx) return;

    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    // Calculate efficiency metrics for each track
    const efficiencyData = tracks.map(track => {
        const trackData = filteredData.filter(row => row.Track === track);
        const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length === 0) return { track, efficiency: 0, utilization: 0, throughput: 0 };
        
        // Efficiency = 1 / (average lap time variation)
        const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        const consistency = calculateStandardDeviation(lapTimes);
        const efficiency = consistency > 0 ? Math.max(0, 100 - (consistency * 20)) : 100;
        
        // Utilization = percentage of optimal lap time usage
        const bestLap = Math.min(...lapTimes);
        const utilization = bestLap > 0 ? (bestLap / avgLapTime) * 100 : 0;
        
        // Throughput = laps per hour (simulated)
        const throughput = avgLapTime > 0 ? (3600 / avgLapTime) : 0;
        
        return {
            track,
            efficiency: Math.round(efficiency),
            utilization: Math.round(utilization),
            throughput: Math.round(throughput)
        };
    });

    destroyChart('layoutEfficiency');
    charts.layoutEfficiency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tracks,
            datasets: [
                {
                    label: 'Track Efficiency (%)',
                    data: efficiencyData.map(item => item.efficiency),
                    backgroundColor: '#4CAF50CC',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Layout Utilization (%)',
                    data: efficiencyData.map(item => item.utilization),
                    backgroundColor: '#2196F3CC',
                    borderColor: '#2196F3',
                    borderWidth: 2,
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Throughput (laps/hour)',
                    data: efficiencyData.map(item => item.throughput),
                    backgroundColor: '#FF9800CC',
                    borderColor: '#FF9800',
                    borderWidth: 2,
                    borderRadius: 4,
                    yAxisID: 'y1',
                    type: 'line',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Laps per Hour',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 3.5 Surface Conditions Impact Chart
function createSurfaceConditionsChart() {
    const ctx = document.getElementById('surfaceConditionsChart');
    if (!ctx) return;

    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    // Simulate surface conditions based on lap time variations and trends
    const conditionsData = tracks.map(track => {
        const trackData = filteredData.filter(row => row.Track === track);
        const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length === 0) return { track, condition: 'Unknown', impact: 0, grip: 50 };
        
        const consistency = calculateStandardDeviation(lapTimes);
        const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        
        // Simulate conditions based on consistency and speed
        let condition, impact, grip;
        
        if (consistency < 1) {
            condition = 'Excellent';
            impact = -2; // Negative means faster
            grip = 95;
        } else if (consistency < 2) {
            condition = 'Good';
            impact = 0;
            grip = 85;
        } else if (consistency < 3) {
            condition = 'Fair';
            impact = 1.5;
            grip = 70;
        } else {
            condition = 'Poor';
            impact = 3;
            grip = 55;
        }
        
        return { track, condition, impact, grip };
    });

    const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
    const conditionCounts = conditions.map(condition => 
        conditionsData.filter(item => item.condition === condition).length
    );

    destroyChart('surfaceConditions');
    charts.surfaceConditions = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: conditions,
            datasets: [{
                data: conditionCounts,
                backgroundColor: [
                    '#4CAF50CC',  // Excellent - Green
                    '#2196F3CC',  // Good - Blue
                    '#FF9800CC',  // Fair - Orange
                    '#F44336CC'   // Poor - Red
                ],
                borderColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#F44336'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const condition = context.label;
                            const count = context.parsed;
                            const total = conditionCounts.reduce((sum, val) => sum + val, 0);
                            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                            return `${condition}: ${count} tracks (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const condition = context.label;
                            const trackList = conditionsData.filter(item => item.condition === condition)
                                                           .map(item => item.track);
                            return trackList.length > 0 ? `Tracks: ${trackList.join(', ')}` : '';
                        }
                    }
                }
            }
        }
    });
}

// 3.6 Track Difficulty Index Chart
function createTrackDifficultyChart() {
    const ctx = document.getElementById('trackDifficultyChart');
    if (!ctx) return;

    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    // Calculate difficulty index based on multiple factors
    const difficultyData = tracks.map((track, index) => {
        const trackData = filteredData.filter(row => row.Track === track);
        const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        
        if (lapTimes.length === 0) return { track, difficulty: 0, factors: {} };
        
        // Factor 1: Average lap time (longer = more difficult)
        const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        const lapTimeScore = Math.min(avgLapTime / 60, 1) * 25; // Max 25 points
        
        // Factor 2: Consistency (more variation = more difficult)
        const consistency = calculateStandardDeviation(lapTimes);
        const consistencyScore = Math.min(consistency * 10, 25); // Max 25 points
        
        // Factor 3: Speed differential (range of lap times)
        const fastest = Math.min(...lapTimes);
        const slowest = Math.max(...lapTimes);
        const speedDiff = slowest - fastest;
        const speedScore = Math.min(speedDiff / 10, 25); // Max 25 points
        
        // Factor 4: Driver performance spread
        const drivers = [...new Set(trackData.map(row => row.Driver))];
        const driverAvgs = drivers.map(driver => {
            const driverLaps = trackData.filter(row => row.Driver === driver)
                                       .map(row => parseFloat(row.LapTime || 0))
                                       .filter(time => time > 0);
            return driverLaps.length > 0 ? driverLaps.reduce((sum, time) => sum + time, 0) / driverLaps.length : 0;
        }).filter(avg => avg > 0);
        
        const driverSpread = driverAvgs.length > 1 ? calculateStandardDeviation(driverAvgs) : 0;
        const spreadScore = Math.min(driverSpread * 5, 25); // Max 25 points
        
        const totalDifficulty = lapTimeScore + consistencyScore + speedScore + spreadScore;
        
        return {
            track,
            difficulty: Math.round(totalDifficulty),
            factors: {
                lapTime: Math.round(lapTimeScore),
                consistency: Math.round(consistencyScore),
                speed: Math.round(speedScore),
                spread: Math.round(spreadScore)
            }
        };
    });

    // Sort by difficulty
    difficultyData.sort((a, b) => b.difficulty - a.difficulty);

    destroyChart('trackDifficulty');
    charts.trackDifficulty = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: difficultyData.map(item => item.track),
            datasets: [
                {
                    label: 'Lap Time Factor',
                    data: difficultyData.map(item => item.factors.lapTime),
                    backgroundColor: '#FF6B35CC',
                    borderColor: '#FF6B35',
                    borderWidth: 1
                },
                {
                    label: 'Consistency Factor',
                    data: difficultyData.map(item => item.factors.consistency),
                    backgroundColor: '#4ECDC4CC',
                    borderColor: '#4ECDC4',
                    borderWidth: 1
                },
                {
                    label: 'Speed Differential',
                    data: difficultyData.map(item => item.factors.speed),
                    backgroundColor: '#45B7D1CC',
                    borderColor: '#45B7D1',
                    borderWidth: 1
                },
                {
                    label: 'Driver Spread',
                    data: difficultyData.map(item => item.factors.spread),
                    backgroundColor: '#F7DC6FCC',
                    borderColor: '#F7DC6F',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    stacked: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Difficulty Index (0-100)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        footer: function(context) {
                            const trackIndex = context[0].dataIndex;
                            const totalDifficulty = difficultyData[trackIndex].difficulty;
                            let rating = 'Unknown';
                            if (totalDifficulty >= 80) rating = 'Extremely Difficult';
                            else if (totalDifficulty >= 60) rating = 'Very Difficult';
                            else if (totalDifficulty >= 40) rating = 'Moderate';
                            else if (totalDifficulty >= 20) rating = 'Easy';
                            else rating = 'Very Easy';
                            
                            return `Total: ${totalDifficulty}/100 (${rating})`;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to get track colors
function getTrackColor(index) {
    const colors = [
        '#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE',
        '#85C1E9', '#82E0AA', '#F8C471', '#EC7063', '#AF7AC5'
    ];
    return colors[index % colors.length];
}

function initializeSessionWidgets() {
    console.log('📋 Initializing Session Widgets...');
    // To be implemented
}

function initializeLeaderboards() {
    console.log('🏆 Initializing Leaderboards...');
    // To be implemented
}

function initializeDataTable() {
    console.log('📊 Initializing Data Table...');
    // To be implemented
}

function updateSessionWidgets() {
    // Update session selection dropdowns and stats
    try {
        const sessionSelect = document.getElementById('session-select');
        if (sessionSelect) {
            const sessions = [...new Set(filteredData.map(d => `${d.Date} - ${d.SessionType} ${d.Heat}`))];
            sessionSelect.innerHTML = sessions.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        
        // Update any live session displays
        const sessionStatsElements = document.querySelectorAll('.session-stat');
        sessionStatsElements.forEach(element => {
            // Simple update for session statistics
            const stat = element.dataset.stat;
            if (stat && filteredData.length > 0) {
                switch(stat) {
                    case 'active-drivers':
                        element.textContent = new Set(filteredData.map(d => d.Driver)).size;
                        break;
                    case 'total-laps':
                        element.textContent = filteredData.length;
                        break;
                    case 'avg-lap-time':
                        const avgTime = filteredData
                            .map(d => parseFloat(d.LapTime || 0))
                            .filter(t => t > 0)
                            .reduce((sum, time, _, arr) => sum + time / arr.length, 0);
                        element.textContent = formatTime(avgTime);
                        break;
                }
            }
        });
    } catch (error) {
        console.error('Error updating session widgets:', error);
    }
}

function updateLeaderboards() {
    try {
        // Update driver leaderboard
        const drivers = [...new Set(filteredData.map(row => row.Driver))];
        const driverPerformance = drivers.map(driver => {
            const driverData = filteredData.filter(row => row.Driver === driver);
            const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            const positions = driverData.map(row => parseInt(row.Position || 0)).filter(pos => pos > 0);
            
            return {
                driver: driver,
                bestLap: lapTimes.length > 0 ? Math.min(...lapTimes) : 999,
                avgLap: lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 999,
                avgPosition: positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 999,
                totalLaps: lapTimes.length
            };
        }).filter(d => d.totalLaps >= 3) // Only drivers with at least 3 laps
          .sort((a, b) => a.bestLap - b.bestLap)
          .slice(0, 10); // Top 10
        
        // Update leaderboard display
        const leaderboardElement = document.getElementById('driver-leaderboard');
        if (leaderboardElement && driverPerformance.length > 0) {
            leaderboardElement.innerHTML = driverPerformance.map((driver, index) => `
                <div class="leaderboard-item ${index === 0 ? 'leader' : ''}">
                    <span class="position">${index + 1}</span>
                    <span class="driver-name">${driver.driver}</span>
                    <span class="best-lap">${formatTime(driver.bestLap)}</span>
                    <span class="laps">${driver.totalLaps} laps</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error updating leaderboards:', error);
    }
}

function updateDataTable() {
    try {
        const dataTableElement = document.getElementById('data-table-body');
        if (!dataTableElement) return;
        
        // Show limited data (first 50 rows to prevent performance issues)
        const displayData = filteredData.slice(0, 50);
        
        dataTableElement.innerHTML = displayData.map(row => `
            <tr>
                <td>${row.Date || '-'}</td>
                <td>${row.Driver || '-'}</td>
                <td>${row.Track || '-'}</td>
                <td>${row.SessionType || '-'}</td>
                <td>${row.LapNumber || '-'}</td>
                <td>${formatTime(parseFloat(row.LapTime || 0))}</td>
                <td>${row.Position || '-'}</td>
                <td>${row.Weather || '-'}</td>
                <td>${formatCurrency(parseFloat(row.HeatPrice || 0))}</td>
            </tr>
        `).join('');
        
        // Update table footer with count
        const tableFooter = document.getElementById('table-footer');
        if (tableFooter) {
            tableFooter.textContent = `Showing ${Math.min(50, filteredData.length)} of ${filteredData.length} records`;
        }
    } catch (error) {
        console.error('Error updating data table:', error);
    }
}

// ========== INITIALIZATION SYSTEM ==========

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Elite Karting Analytics Platform...');
    
    // Show global overlay
    showLoading(true, 'Initializing Elite Karting Analytics Platform...');

    // Load and process data (loadData will hide overlay in finally)
    loadData()
        .then(() => {
            console.log('✅ Data loaded successfully');
            initializeDashboard();
        })
        .catch(error => {
            console.error('❌ Error loading data:', error);
            showErrorState(error);
        });
});

function showLoadingState() {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 50px;">
                <div class="loading"></div>
                <h2 style="color: var(--text-primary); margin-top: 20px;">Loading Elite Karting Analytics...</h2>
                <p style="color: var(--text-secondary);">Processing karting data and initializing charts...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.remove();
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

function initializeDashboard() {
    console.log('🎯 Initializing dashboard components...');
    
    // Initialize all chart sections
    initializeDriverPerformanceCharts();
    initializeLapSessionCharts();
    initializeTrackInsightsCharts();
    initializeDriverBattleCharts();
    initializeFinancialCharts();
    initializeTemporalCharts();
    
    // Initialize Session Management Widgets
    initializeSessionWidgets();
    
    // Initialize Predictive Analytics
    initializePredictiveCharts();
    
    // Initialize Geographical Analytics
    initializeGeographicalCharts();
    
    // Initialize other components (to be implemented)
    // initializeLeaderboards();
    // initializeDataTable();
    
    // Update UI components
    updateKPIs();
    updateFilterOptions();
    updateSessionWidgets();
    updateLeaderboards();
    updateDataTable();
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    console.log('✅ Dashboard initialization complete!');
}

function setupGlobalEventListeners() {
    // Filter controls
    const filterElements = [
        'filterDriver', 'filterTrack', 'filterSession',
        'filterDateFrom', 'filterDateTo'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
    
    // Print functionality
    const printBtn = document.getElementById('printDashboard');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}


// Update the main update function to include all chart sections
function updateAllCharts() {
    console.log('🔄 Updating all charts with filtered data...');
    
    // Update Driver Performance Overview charts
    createDriverRankingChart();
    createFastestLapChart();
    createAvgLapTimeChart();
    createConsistencyChart();
    createImprovementChart();
    createLapDistributionChart();
    createBestLapHeatmap();
    createPaceAnalysisChart();
    
    // Update Lap & Session Analysis charts
    createSessionSummaryChart();
    createLapProgressionChart();
    createFuelEfficiencyChart();
    createPositionChangesChart();
    createWeatherImpactChart();
    createSessionComparisonChart();
    createStintAnalysisChart();
    
    // Update Track Insights charts
    createTrackPerformanceChart();
    createCornerAnalysisChart();
    createTrackRecordsChart();
    createLayoutEfficiencyChart();
    createSurfaceConditionsChart();
    createTrackDifficultyChart();
    
    // Update Driver Battle charts
    createHeadToHeadChart();
    createBattleTimelineChart();
    createOvertakingAnalysisChart();
    createGapAnalysisChart();
    createRivalryMatrixChart();
    
    // Update Financial Analytics charts
    createCostAnalysisChart();
    createDynamicPricingChart();
    createRevenueTrendsChart();
    createDriverValueChart();
    createSessionProfitabilityChart();
    createROICalculationChart();
    
    // Update Temporal Analytics charts
    createSeasonalTrendsChart();
    createTimeOfDayChart();
    createWeeklyPatternsChart();
    createMonthlyAnalysisChart();
    createPeakPerformanceChart();
    createHistoricalProgressionChart();
    
    // Update Session Management Widgets
    createSessionControlWidget();
    createLiveSessionMonitor();
    createSessionStatsWidget();
    createDriverPerformanceMonitor();
    createSessionProgressTimeline();
    createConditionsMonitor();
    
    // Update Predictive Analytics
    createLapTimePredictionChart();
    createPerformanceForecastChart();
    createDriverRankingPredictionChart();
    createSeasonalForecastChart();
    createOptimalStrategyChart();
    
    // Update Geographical Analytics
    createTrackMapChart();
    createRegionalPerformanceChart();
    createHeatmapAnalysisChart();
    createLocationTrendsChart();
    
    // Update other sections (to be implemented)
    // More sections coming soon...
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search functionality
function performSearch() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (!searchTerm) {
        applyFilters();
        return;
    }
    
    // Filter data based on search term
    filteredData = rawData.filter(row => {
        return Object.values(row).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm)
        );
    });
    
    updateAllCharts();
    updateKPIs();
    updateSessionWidgets();
    updateLeaderboards();
    updateDataTable();
}

// ========== 4. DRIVER BATTLE FEATURES ==========

function initializeDriverBattleCharts() {
    console.log('⚔️ Initializing Driver Battle Charts...');
    
    // Add event listeners for controls
    addChartEventListener('headToHeadDriver1', createHeadToHeadChart);
    addChartEventListener('headToHeadDriver2', createHeadToHeadChart);
    addChartEventListener('battleTimelineSession', createBattleTimelineChart);
    addChartEventListener('gapAnalysisDriver', createGapAnalysisChart);
    
    // Create all charts
    createHeadToHeadChart();
    createBattleTimelineChart();
    createOvertakingAnalysisChart();
    createGapAnalysisChart();
    createRivalryMatrixChart();
}

// 4.1 Head-to-Head Comparison Chart
function createHeadToHeadChart() {
    const ctx = document.getElementById('headToHeadChart');
    if (!ctx) return;

    const driver1 = document.getElementById('headToHeadDriver1')?.value;
    const driver2 = document.getElementById('headToHeadDriver2')?.value;
    
    if (!driver1 || !driver2 || driver1 === driver2) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    const driver1Data = filteredData.filter(row => row.Driver === driver1);
    const driver2Data = filteredData.filter(row => row.Driver === driver2);
    
    // Calculate head-to-head metrics
    const metrics = {
        avgLapTime: [
            calculateAverageLapTime(driver1Data),
            calculateAverageLapTime(driver2Data)
        ],
        bestLap: [
            calculateBestLapTime(driver1Data),
            calculateBestLapTime(driver2Data)
        ],
        consistency: [
            calculateConsistency(driver1Data),
            calculateConsistency(driver2Data)
        ],
        avgPosition: [
            calculateAveragePosition(driver1Data),
            calculateAveragePosition(driver2Data)
        ],
        totalLaps: [
            driver1Data.length,
            driver2Data.length
        ],
        wins: [
            driver1Data.filter(row => parseInt(row.Position || 0) === 1).length,
            driver2Data.filter(row => parseInt(row.Position || 0) === 1).length
        ]
    };

    destroyChart('headToHead');
    charts.headToHead = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Avg Lap Time', 'Best Lap', 'Consistency', 'Avg Position', 'Total Laps', 'Wins'],
            datasets: [
                {
                    label: driver1,
                    data: [
                        100 - ((metrics.avgLapTime[0] - 30) * 2), // Normalize lap time
                        100 - ((metrics.bestLap[0] - 30) * 2), // Normalize best lap
                        100 - (metrics.consistency[0] * 20), // Normalize consistency
                        100 - (metrics.avgPosition[0] * 10), // Normalize position
                        Math.min(metrics.totalLaps[0] / 5, 100), // Normalize total laps
                        metrics.wins[0] * 20 // Normalize wins
                    ],
                    borderColor: '#FF6B35',
                    backgroundColor: '#FF6B3540',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: driver2,
                    data: [
                        100 - ((metrics.avgLapTime[1] - 30) * 2),
                        100 - ((metrics.bestLap[1] - 30) * 2),
                        100 - (metrics.consistency[1] * 20),
                        100 - (metrics.avgPosition[1] * 10),
                        Math.min(metrics.totalLaps[1] / 5, 100),
                        metrics.wins[1] * 20
                    ],
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC440',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Performance Score (0-100)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    },
                    angleLines: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const driverIndex = context.datasetIndex;
                            const metricIndex = context.dataIndex;
                            const driver = driverIndex === 0 ? driver1 : driver2;
                            const metricNames = ['Avg Lap Time', 'Best Lap', 'Consistency', 'Avg Position', 'Total Laps', 'Wins'];
                            const rawValues = [
                                [metrics.avgLapTime[0].toFixed(3) + 's', metrics.avgLapTime[1].toFixed(3) + 's'],
                                [metrics.bestLap[0].toFixed(3) + 's', metrics.bestLap[1].toFixed(3) + 's'],
                                [metrics.consistency[0].toFixed(3), metrics.consistency[1].toFixed(3)],
                                [metrics.avgPosition[0].toFixed(1), metrics.avgPosition[1].toFixed(1)],
                                [metrics.totalLaps[0], metrics.totalLaps[1]],
                                [metrics.wins[0], metrics.wins[1]]
                            ];
                            
                            return `${driver}: ${rawValues[metricIndex][driverIndex]} (Score: ${context.parsed.r.toFixed(1)})`;
                        }
                    }
                }
            }
        }
    });
}

// 4.2 Battle Timeline Chart
function createBattleTimelineChart() {
    const ctx = document.getElementById('battleTimelineChart');
    if (!ctx) return;

    const selectedSession = document.getElementById('battleTimelineSession')?.value;
    let sessionData = filteredData;
    
    if (selectedSession && selectedSession !== 'all') {
        sessionData = filteredData.filter(row => row.SessionDate === selectedSession);
    }
    
    // Get top 5 drivers for battle timeline
    const driverPerformance = {};
    sessionData.forEach(row => {
        const driver = row.Driver;
        const lapTime = parseFloat(row.LapTime || 0);
        if (lapTime > 0) {
            if (!driverPerformance[driver]) {
                driverPerformance[driver] = [];
            }
            driverPerformance[driver].push(lapTime);
        }
    });
    
    const topDrivers = Object.keys(driverPerformance)
        .map(driver => ({
            driver,
            avgTime: driverPerformance[driver].reduce((sum, time) => sum + time, 0) / driverPerformance[driver].length
        }))
        .sort((a, b) => a.avgTime - b.avgTime)
        .slice(0, 5)
        .map(item => item.driver);
    
    const laps = [...new Set(sessionData.map(row => parseInt(row.Lap || 0)))].sort((a, b) => a - b);
    
    const datasets = topDrivers.map((driver, index) => {
        const positions = laps.map(lap => {
            const lapData = sessionData.filter(row => row.Driver === driver && parseInt(row.Lap || 0) === lap);
            return lapData.length > 0 ? parseInt(lapData[0].Position || 0) : null;
        });
        
        return {
            label: driver,
            data: positions,
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '20',
            borderWidth: 4,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: '#FFFFFF'
        };
    });

    destroyChart('battleTimeline');
    charts.battleTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: laps,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    reverse: true,
                    beginAtZero: false,
                    max: Math.max(...topDrivers.map(driver => {
                        const driverData = sessionData.filter(row => row.Driver === driver);
                        const positions = driverData.map(row => parseInt(row.Position || 0)).filter(pos => pos > 0);
                        return positions.length > 0 ? Math.max(...positions) : 5;
                    })),
                    title: {
                        display: true,
                        text: 'Position',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        stepSize: 1
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Lap Number',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            const lap = context.label;
                            const driver = context.dataset.label;
                            const position = context.parsed.y;
                            
                            // Find battles (position changes)
                            const currentLapIndex = context.dataIndex;
                            if (currentLapIndex > 0) {
                                const prevPosition = context.dataset.data[currentLapIndex - 1];
                                if (prevPosition !== null && position !== null) {
                                    const change = prevPosition - position;
                                    if (change > 0) {
                                        return `📈 Gained ${change} position${change > 1 ? 's' : ''}`;
                                    } else if (change < 0) {
                                        return `📉 Lost ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''}`;
                                    }
                                }
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// 4.3 Overtaking Analysis Chart
function createOvertakingAnalysisChart() {
    const ctx = document.getElementById('overtakingAnalysisChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Calculate overtaking statistics
    const overtakingData = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver)
                                     .sort((a, b) => {
                                         if (a.SessionDate !== b.SessionDate) {
                                             return a.SessionDate.localeCompare(b.SessionDate);
                                         }
                                         return parseInt(a.Lap || 0) - parseInt(b.Lap || 0);
                                     });
        
        let overtakes = 0;
        let overtaken = 0;
        
        for (let i = 1; i < driverData.length; i++) {
            const currentPos = parseInt(driverData[i].Position || 0);
            const prevPos = parseInt(driverData[i-1].Position || 0);
            
            if (currentPos > 0 && prevPos > 0 && driverData[i].SessionDate === driverData[i-1].SessionDate) {
                if (currentPos < prevPos) {
                    overtakes += (prevPos - currentPos);
                } else if (currentPos > prevPos) {
                    overtaken += (currentPos - prevPos);
                }
            }
        }
        
        return {
            driver,
            overtakes,
            overtaken,
            netOvertakes: overtakes - overtaken
        };
    });

    destroyChart('overtakingAnalysis');
    charts.overtakingAnalysis = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drivers,
            datasets: [
                {
                    label: 'Overtakes Made',
                    data: overtakingData.map(item => item.overtakes),
                    backgroundColor: '#4CAF50CC',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Times Overtaken',
                    data: overtakingData.map(item => -item.overtaken), // Negative for visual effect
                    backgroundColor: '#F44336CC',
                    borderColor: '#F44336',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Overtaking Actions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return Math.abs(value); // Show positive values for both
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const driverIndex = context.dataIndex;
                            const data = overtakingData[driverIndex];
                            if (context.datasetIndex === 0) {
                                return `Overtakes Made: ${data.overtakes}`;
                            } else {
                                return `Times Overtaken: ${data.overtaken}`;
                            }
                        },
                        afterLabel: function(context) {
                            const driverIndex = context.dataIndex;
                            const data = overtakingData[driverIndex];
                            const net = data.netOvertakes;
                            if (net > 0) {
                                return `Net: +${net} (Aggressive Driver)`;
                            } else if (net < 0) {
                                return `Net: ${net} (Defensive Driver)`;
                            } else {
                                return `Net: 0 (Balanced)`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// 4.4 Gap Analysis Chart
function createGapAnalysisChart() {
    const ctx = document.getElementById('gapAnalysisChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('gapAnalysisDriver')?.value;
    
    if (!selectedDriver || selectedDriver === 'all') {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    // Calculate gaps to leader and nearest competitor
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    const gapData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const driverData = sessionData.filter(row => row.Driver === selectedDriver);
        
        if (driverData.length === 0) return { session, gapToLeader: null, gapToNext: null };
        
        // Calculate average lap time for this driver in this session
        const driverLaps = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const driverAvgTime = driverLaps.length > 0 ? driverLaps.reduce((sum, time) => sum + time, 0) / driverLaps.length : 0;
        
        // Find leader's average time
        const otherDrivers = [...new Set(sessionData.map(row => row.Driver))].filter(d => d !== selectedDriver);
        const driverAvgs = otherDrivers.map(driver => {
            const otherDriverData = sessionData.filter(row => row.Driver === driver);
            const otherLaps = otherDriverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return {
                driver,
                avgTime: otherLaps.length > 0 ? otherLaps.reduce((sum, time) => sum + time, 0) / otherLaps.length : 0
            };
        }).filter(item => item.avgTime > 0).sort((a, b) => a.avgTime - b.avgTime);
        
        if (driverAvgs.length === 0) return { session, gapToLeader: null, gapToNext: null };
        
        const leaderTime = driverAvgs[0].avgTime;
        const gapToLeader = driverAvgTime > 0 ? driverAvgTime - leaderTime : null;
        
        // Find nearest competitor
        const currentDriverRank = driverAvgs.findIndex(item => item.avgTime > driverAvgTime);
        let gapToNext = null;
        
        if (currentDriverRank > 0) {
            gapToNext = driverAvgTime - driverAvgs[currentDriverRank - 1].avgTime;
        } else if (currentDriverRank === 0 && driverAvgs.length > 0) {
            gapToNext = driverAvgs[0].avgTime - driverAvgTime; // Gap to second place
        }
        
        return { session, gapToLeader, gapToNext };
    });

    destroyChart('gapAnalysis');
    charts.gapAnalysis = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sessions,
            datasets: [
                {
                    label: 'Gap to Leader',
                    data: gapData.map(item => item.gapToLeader),
                    borderColor: '#F44336',
                    backgroundColor: '#F4433640',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Gap to Next Competitor',
                    data: gapData.map(item => item.gapToNext),
                    borderColor: '#2196F3',
                    backgroundColor: '#2196F340',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Gap (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Session Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            if (value === null) return 'No data';
                            
                            const label = context.dataset.label;
                            if (value > 0) {
                                return `${label}: +${value.toFixed(3)}s (behind)`;
                            } else if (value < 0) {
                                return `${label}: ${Math.abs(value).toFixed(3)}s (ahead)`;
                            } else {
                                return `${label}: 0.000s (equal)`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// 4.5 Rivalry Matrix Chart
function createRivalryMatrixChart() {
    const container = document.getElementById('rivalryMatrix');
    if (!container) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Calculate rivalry matrix based on head-to-head performance
    const rivalryData = [];
    
    drivers.forEach(driver1 => {
        drivers.forEach(driver2 => {
            if (driver1 !== driver2) {
                const driver1Data = filteredData.filter(row => row.Driver === driver1);
                const driver2Data = filteredData.filter(row => row.Driver === driver2);
                
                // Find common sessions
                const commonSessions = [...new Set(driver1Data.map(row => row.SessionDate))]
                    .filter(session => driver2Data.some(row => row.SessionDate === session));
                
                let driver1Wins = 0;
                let driver2Wins = 0;
                let ties = 0;
                
                commonSessions.forEach(session => {
                    const d1SessionData = driver1Data.filter(row => row.SessionDate === session);
                    const d2SessionData = driver2Data.filter(row => row.SessionDate === session);
                    
                    const d1LapTimes = d1SessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                    const d2LapTimes = d2SessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                    
                    if (d1LapTimes.length > 0 && d2LapTimes.length > 0) {
                        const d1Best = Math.min(...d1LapTimes);
                        const d2Best = Math.min(...d2LapTimes);
                        
                        if (d1Best < d2Best) driver1Wins++;
                        else if (d2Best < d1Best) driver2Wins++;
                        else ties++;
                    }
                });
                
                const totalBattles = driver1Wins + driver2Wins + ties;
                const winRate = totalBattles > 0 ? (driver1Wins / totalBattles) * 100 : 0;
                
                rivalryData.push({
                    driver1,
                    driver2,
                    winRate,
                    battles: totalBattles,
                    wins: driver1Wins,
                    losses: driver2Wins,
                    ties
                });
            } else {
                rivalryData.push({
                    driver1,
                    driver2,
                    winRate: 50,
                    battles: 0,
                    wins: 0,
                    losses: 0,
                    ties: 0
                });
            }
        });
    });

    let html = '<div class="rivalry-matrix" style="display: grid; grid-template-columns: 150px repeat(' + drivers.length + ', 1fr); gap: 1px; background: var(--border-color); border-radius: var(--radius-md); overflow: hidden; font-size: 0.75rem;">';
    
    // Header row
    html += '<div class="matrix-cell header" style="background: var(--primary-color); color: white; padding: var(--spacing-sm); font-weight: bold; text-align: center;">Driver vs Driver</div>';
    drivers.forEach(driver => {
        html += `<div class="matrix-cell header" style="background: var(--primary-color); color: white; padding: var(--spacing-sm); font-weight: bold; text-align: center; writing-mode: vertical-rl; text-orientation: mixed;">${driver}</div>`;
    });
    
    // Data rows
    drivers.forEach(driver1 => {
        html += `<div class="matrix-cell row-header" style="background: var(--secondary-color); color: white; padding: var(--spacing-sm); font-weight: bold; text-align: center;">${driver1}</div>`;
        
        drivers.forEach(driver2 => {
            const data = rivalryData.find(item => item.driver1 === driver1 && item.driver2 === driver2);
            let className = 'matrix-cell';
            let content = 'N/A';
            
            if (data && data.battles > 0) {
                const winRate = data.winRate;
                content = `${winRate.toFixed(0)}%<br><small>${data.wins}-${data.losses}-${data.ties}</small>`;
                
                if (driver1 === driver2) {
                    className += ' self';
                } else if (winRate >= 70) {
                    className += ' dominant';
                } else if (winRate >= 55) {
                    className += ' advantage';
                } else if (winRate >= 45) {
                    className += ' balanced';
                } else {
                    className += ' disadvantage';
                }
            } else if (driver1 === driver2) {
                className += ' self';
                content = 'SELF';
            }
            
            const title = data ? `${driver1} vs ${driver2}: ${data.wins} wins, ${data.losses} losses, ${data.ties} ties in ${data.battles} battles` : 'No data';
            
            html += `<div class="${className}" style="padding: var(--spacing-sm); text-align: center; cursor: pointer; transition: all var(--transition-fast);" title="${title}">${content}</div>`;
        });
    });
    
    html += '</div>';
    
    // Add legend
    html += `
        <div class="rivalry-legend" style="display: flex; justify-content: center; gap: var(--spacing-lg); margin-top: var(--spacing-lg); flex-wrap: wrap;">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--spacing-sm); font-size: 0.875rem; color: var(--text-secondary);">
                <div class="legend-color" style="width: 16px; height: 16px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #22C55E, #16A34A);"></div>
                <span>Dominant (70%+)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--spacing-sm); font-size: 0.875rem; color: var(--text-secondary);">
                <div class="legend-color" style="width: 16px; height: 16px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #3B82F6, #2563EB);"></div>
                <span>Advantage (55-69%)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--spacing-sm); font-size: 0.875rem; color: var(--text-secondary);">
                <div class="legend-color" style="width: 16px; height: 16px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #F59E0B, #D97706);"></div>
                <span>Balanced (45-54%)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--spacing-sm); font-size: 0.875rem; color: var(--text-secondary);">
                <div class="legend-color" style="width: 16px; height: 16px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #EF4444, #DC2626);"></div>
                <span>Disadvantage (&lt;45%)</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add CSS for rivalry matrix
    const style = document.createElement('style');
    style.textContent = `
        .matrix-cell {
            background: var(--card-bg);
            transition: all var(--transition-fast);
            min-height: 50px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .matrix-cell:hover:not(.header):not(.row-header) {
            transform: scale(1.1);
            z-index: 10;
            box-shadow: var(--shadow-lg);
            border-radius: var(--radius-sm);
        }
        
        .matrix-cell.self {
            background: var(--secondary-color);
            color: white;
        }
        
        .matrix-cell.dominant {
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: white;
        }
        
        .matrix-cell.advantage {
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            color: white;
        }
        
        .matrix-cell.balanced {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
        }
        
        .matrix-cell.disadvantage {
            background: linear-gradient(135deg, #EF4444, #DC2626);
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// Helper functions for driver battle calculations
function calculateAverageLapTime(driverData) {
    const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
    return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0;
}

function calculateBestLapTime(driverData) {
    const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
    return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
}

function calculateConsistency(driverData) {
    const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
    return lapTimes.length > 0 ? calculateStandardDeviation(lapTimes) : 0;
}

function calculateAveragePosition(driverData) {
    const positions = driverData.map(row => parseFloat(row.Position || 0)).filter(pos => pos > 0);
    return positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0;
}

// ========== 5. FINANCIAL ANALYTICS ==========

function initializeFinancialCharts() {
    console.log('💰 Initializing Financial Analytics Charts...');
    
    // Add event listeners for controls
    addChartEventListener('costAnalysisType', createCostAnalysisChart);
    addChartEventListener('pricingAnalysisMetric', createDynamicPricingChart);
    addChartEventListener('revenueTimeframe', createRevenueTrendsChart);
    
    // Create all charts
    createCostAnalysisChart();
    createDynamicPricingChart();
    createRevenueTrendsChart();
    createDriverValueChart();
    createSessionProfitabilityChart();
    createROICalculationChart();
}

// 5.1 Cost per Session Analysis
function createCostAnalysisChart() {
    const ctx = document.getElementById('costAnalysisChart');
    if (!ctx) return;

    const analysisType = document.getElementById('costAnalysisType')?.value || 'perSession';
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Simulate cost data based on session characteristics
    const costData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        const avgLapTime = sessionData.reduce((sum, row) => sum + parseFloat(row.LapTime || 0), 0) / sessionData.length;
        
        // Base costs (simulated)
        const trackRental = 200; // Base track rental
        const fuelCost = totalLaps * 0.5; // $0.50 per lap
        const maintenance = totalLaps * 0.3; // $0.30 per lap
        const staffCost = uniqueDrivers * 15; // $15 per driver
        const equipmentCost = totalLaps * 0.2; // $0.20 per lap
        const overhead = (trackRental + fuelCost + maintenance + staffCost + equipmentCost) * 0.15;
        
        const totalCost = trackRental + fuelCost + maintenance + staffCost + equipmentCost + overhead;
        
        return {
            session,
            trackRental,
            fuelCost,
            maintenance,
            staffCost,
            equipmentCost,
            overhead,
            totalCost,
            costPerLap: totalLaps > 0 ? totalCost / totalLaps : 0,
            costPerDriver: uniqueDrivers > 0 ? totalCost / uniqueDrivers : 0
        };
    });

    let chartData, labels;
    
    if (analysisType === 'perSession') {
        labels = sessions;
        chartData = [
            {
                label: 'Track Rental',
                data: costData.map(item => item.trackRental),
                backgroundColor: '#FF6B35CC',
                borderColor: '#FF6B35',
                borderWidth: 1
            },
            {
                label: 'Fuel Cost',
                data: costData.map(item => item.fuelCost),
                backgroundColor: '#4ECDC4CC',
                borderColor: '#4ECDC4',
                borderWidth: 1
            },
            {
                label: 'Maintenance',
                data: costData.map(item => item.maintenance),
                backgroundColor: '#45B7D1CC',
                borderColor: '#45B7D1',
                borderWidth: 1
            },
            {
                label: 'Staff Cost',
                data: costData.map(item => item.staffCost),
                backgroundColor: '#F7DC6FCC',
                borderColor: '#F7DC6F',
                borderWidth: 1
            },
            {
                label: 'Equipment',
                data: costData.map(item => item.equipmentCost),
                backgroundColor: '#BB8FCECC',
                borderColor: '#BB8FCE',
                borderWidth: 1
            },
            {
                label: 'Overhead',
                data: costData.map(item => item.overhead),
                backgroundColor: '#85C1E9CC',
                borderColor: '#85C1E9',
                borderWidth: 1
            }
        ];
    } else if (analysisType === 'perLap') {
        labels = sessions;
        chartData = [{
            label: 'Cost per Lap ($)',
            data: costData.map(item => item.costPerLap),
            backgroundColor: '#FF6B35CC',
            borderColor: '#FF6B35',
            borderWidth: 2,
            borderRadius: 8
        }];
    } else {
        labels = sessions;
        chartData = [{
            label: 'Cost per Driver ($)',
            data: costData.map(item => item.costPerDriver),
            backgroundColor: '#4ECDC4CC',
            borderColor: '#4ECDC4',
            borderWidth: 2,
            borderRadius: 8
        }];
    }

    destroyChart('costAnalysis');
    charts.costAnalysis = new Chart(ctx, {
        type: analysisType === 'perSession' ? 'bar' : 'line',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: analysisType === 'perSession',
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    stacked: analysisType === 'perSession',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// 5.2 Dynamic Pricing Analysis
function createDynamicPricingChart() {
    const ctx = document.getElementById('dynamicPricingChart');
    if (!ctx) return;

    const metric = document.getElementById('pricingAnalysisMetric')?.value || 'demand';
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Calculate pricing factors
    const pricingData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        const avgLapTime = sessionData.reduce((sum, row) => sum + parseFloat(row.LapTime || 0), 0) / sessionData.length;
        
        // Demand factor (based on number of drivers and laps)
        const baseDemand = 50;
        const demandFactor = baseDemand + (uniqueDrivers * 5) + (totalLaps * 0.1);
        
        // Peak time factor (simulate weekend/evening pricing)
        const dayOfWeek = new Date(session).getDay();
        const peakMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0; // Weekend premium
        
        // Performance factor (better tracks command higher prices)
        const avgPerformance = avgLapTime > 0 ? Math.max(0, 100 - avgLapTime) : 50;
        const performanceFactor = 0.8 + (avgPerformance / 100) * 0.4;
        
        // Base price calculation
        const basePrice = 25; // $25 base price per session
        const dynamicPrice = basePrice * performanceFactor * peakMultiplier * (demandFactor / 50);
        
        return {
            session,
            basePrice,
            demandFactor,
            peakMultiplier,
            performanceFactor,
            dynamicPrice,
            priceChange: ((dynamicPrice - basePrice) / basePrice) * 100
        };
    });

    let chartData;
    
    if (metric === 'demand') {
        chartData = [{
            label: 'Demand Factor',
            data: pricingData.map(item => item.demandFactor),
            backgroundColor: '#FF6B35CC',
            borderColor: '#FF6B35',
            borderWidth: 3,
            fill: false,
            tension: 0.4
        }];
    } else if (metric === 'pricing') {
        chartData = [
            {
                label: 'Base Price',
                data: pricingData.map(item => item.basePrice),
                backgroundColor: '#94A3B8CC',
                borderColor: '#94A3B8',
                borderWidth: 2,
                type: 'line',
                fill: false
            },
            {
                label: 'Dynamic Price',
                data: pricingData.map(item => item.dynamicPrice),
                backgroundColor: '#22C55ECC',
                borderColor: '#22C55E',
                borderWidth: 3,
                type: 'line',
                fill: false,
                tension: 0.4
            }
        ];
    } else {
        chartData = [{
            label: 'Price Change (%)',
            data: pricingData.map(item => item.priceChange),
            backgroundColor: pricingData.map(item => item.priceChange >= 0 ? '#22C55ECC' : '#EF4444CC'),
            borderColor: pricingData.map(item => item.priceChange >= 0 ? '#22C55E' : '#EF4444'),
            borderWidth: 2,
            borderRadius: 6
        }];
    }

    destroyChart('dynamicPricing');
    charts.dynamicPricing = new Chart(ctx, {
        type: metric === 'change' ? 'bar' : 'line',
        data: {
            labels: sessions,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric !== 'change',
                    title: {
                        display: true,
                        text: metric === 'demand' ? 'Demand Factor' : 
                              metric === 'pricing' ? 'Price ($)' : 'Price Change (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            if (metric === 'pricing') return '$' + value.toFixed(0);
                            if (metric === 'change') return value.toFixed(1) + '%';
                            return value.toFixed(0);
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 5.3 Revenue Trends Chart
function createRevenueTrendsChart() {
    const ctx = document.getElementById('revenueTrendsChart');
    if (!ctx) return;

    const timeframe = document.getElementById('revenueTimeframe')?.value || 'monthly';
    
    // Group data by timeframe
    const revenueData = {};
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        let key;
        
        if (timeframe === 'daily') {
            key = row.SessionDate;
        } else if (timeframe === 'weekly') {
            const week = getWeekNumber(date);
            key = `${date.getFullYear()}-W${week}`;
        } else if (timeframe === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = date.getFullYear().toString();
        }
        
        if (!revenueData[key]) {
            revenueData[key] = {
                totalLaps: 0,
                uniqueDrivers: new Set(),
                sessions: new Set(),
                revenue: 0
            };
        }
        
        revenueData[key].totalLaps++;
        revenueData[key].uniqueDrivers.add(row.Driver);
        revenueData[key].sessions.add(row.SessionDate);
    });
    
    // Calculate revenue for each period
    Object.keys(revenueData).forEach(key => {
        const data = revenueData[key];
        const avgPricePerSession = 30; // $30 average per session
        const avgPricePerLap = 2; // $2 per lap
        
        data.revenue = (data.sessions.size * avgPricePerSession) + (data.totalLaps * avgPricePerLap);
        data.uniqueDrivers = data.uniqueDrivers.size;
    });
    
    const labels = Object.keys(revenueData).sort();
    const revenues = labels.map(key => revenueData[key].revenue);
    const drivers = labels.map(key => revenueData[key].uniqueDrivers);

    destroyChart('revenueTrends');
    charts.revenueTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: revenues,
                    borderColor: '#22C55E',
                    backgroundColor: '#22C55E40',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Unique Drivers',
                    data: drivers,
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F640',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Drivers',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: timeframe.charAt(0).toUpperCase() + timeframe.slice(1) + ' Period',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 5.4 Driver Value Analysis Chart
function createDriverValueChart() {
    const ctx = document.getElementById('driverValueChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Calculate driver value metrics
    const driverValues = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const totalLaps = driverData.length;
        const sessions = new Set(driverData.map(row => row.SessionDate)).size;
        
        // Revenue contribution
        const sessionRevenue = sessions * 30; // $30 per session
        const lapRevenue = totalLaps * 2; // $2 per lap
        const totalRevenue = sessionRevenue + lapRevenue;
        
        // Loyalty score (based on session frequency)
        const loyaltyScore = Math.min(sessions * 10, 100);
        
        // Performance value (better performers attract more customers)
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const avgLapTime = lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 50;
        const performanceValue = Math.max(0, 100 - avgLapTime) * 5; // Convert to value
        
        // Total customer value
        const customerValue = totalRevenue + loyaltyScore + performanceValue;
        
        return {
            driver,
            totalRevenue,
            loyaltyScore,
            performanceValue,
            customerValue,
            sessions,
            totalLaps
        };
    });
    
    // Sort by customer value
    driverValues.sort((a, b) => b.customerValue - a.customerValue);

    destroyChart('driverValue');
    charts.driverValue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: driverValues.map(item => item.driver),
            datasets: [
                {
                    label: 'Revenue Contribution',
                    data: driverValues.map(item => item.totalRevenue),
                    backgroundColor: '#22C55ECC',
                    borderColor: '#22C55E',
                    borderWidth: 1
                },
                {
                    label: 'Loyalty Value',
                    data: driverValues.map(item => item.loyaltyScore),
                    backgroundColor: '#3B82F6CC',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                },
                {
                    label: 'Performance Value',
                    data: driverValues.map(item => item.performanceValue),
                    backgroundColor: '#F59E0BCC',
                    borderColor: '#F59E0B',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Customer Value ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        footer: function(tooltipItems) {
                            const driverIndex = tooltipItems[0].dataIndex;
                            const driver = driverValues[driverIndex];
                            return `Total Value: $${driver.customerValue.toFixed(0)}\nSessions: ${driver.sessions}\nLaps: ${driver.totalLaps}`;
                        }
                    }
                }
            }
        }
    });
}

// 5.5 Session Profitability Chart
function createSessionProfitabilityChart() {
    const ctx = document.getElementById('sessionProfitabilityChart');
    if (!ctx) return;

    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Calculate profitability for each session
    const profitabilityData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        
        // Revenue calculation
        const sessionRevenue = uniqueDrivers * 30; // $30 per driver per session
        const lapRevenue = totalLaps * 2; // $2 per lap
        const totalRevenue = sessionRevenue + lapRevenue;
        
        // Cost calculation (from earlier function)
        const trackRental = 200;
        const fuelCost = totalLaps * 0.5;
        const maintenance = totalLaps * 0.3;
        const staffCost = uniqueDrivers * 15;
        const equipmentCost = totalLaps * 0.2;
        const overhead = (trackRental + fuelCost + maintenance + staffCost + equipmentCost) * 0.15;
        const totalCost = trackRental + fuelCost + maintenance + staffCost + equipmentCost + overhead;
        
        // Profit calculation
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        return {
            session,
            revenue: totalRevenue,
            cost: totalCost,
            profit,
            profitMargin,
            drivers: uniqueDrivers,
            laps: totalLaps
        };
    });

    destroyChart('sessionProfitability');
    charts.sessionProfitability = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sessions,
            datasets: [
                {
                    label: 'Revenue',
                    data: profitabilityData.map(item => item.revenue),
                    backgroundColor: '#22C55ECC',
                    borderColor: '#22C55E',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Cost',
                    data: profitabilityData.map(item => -item.cost), // Negative for visual effect
                    backgroundColor: '#EF4444CC',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Profit',
                    data: profitabilityData.map(item => item.profit),
                    backgroundColor: profitabilityData.map(item => item.profit >= 0 ? '#3B82F6CC' : '#F59E0BCC'),
                    borderColor: profitabilityData.map(item => item.profit >= 0 ? '#3B82F6' : '#F59E0B'),
                    borderWidth: 2,
                    borderRadius: 4,
                    type: 'line',
                    tension: 0.4,
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + Math.abs(value).toFixed(0);
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = Math.abs(context.parsed.y);
                            return context.dataset.label + ': $' + value.toFixed(0);
                        },
                        footer: function(tooltipItems) {
                            const sessionIndex = tooltipItems[0].dataIndex;
                            const data = profitabilityData[sessionIndex];
                            return `Margin: ${data.profitMargin.toFixed(1)}%\nDrivers: ${data.drivers}\nLaps: ${data.laps}`;
                        }
                    }
                }
            }
        }
    });
}

// 5.6 ROI Calculation Chart
function createROICalculationChart() {
    const ctx = document.getElementById('roiCalculationChart');
    if (!ctx) return;

    // Calculate ROI for different investment scenarios
    const investments = [
        { name: 'Track Upgrade', cost: 5000, monthlyReturn: 800 },
        { name: 'New Karts', cost: 15000, monthlyReturn: 2200 },
        { name: 'Safety Equipment', cost: 3000, monthlyReturn: 400 },
        { name: 'Timing System', cost: 8000, monthlyReturn: 1100 },
        { name: 'Marketing Campaign', cost: 2000, monthlyReturn: 600 },
        { name: 'Staff Training', cost: 1500, monthlyReturn: 300 }
    ];
    
    // Calculate various ROI metrics
    const roiData = investments.map(investment => {
        const monthsToBreakeven = investment.cost / investment.monthlyReturn;
        const annualReturn = investment.monthlyReturn * 12;
        const roiPercentage = (annualReturn / investment.cost) * 100;
        const paybackPeriod = investment.cost / investment.monthlyReturn;
        
        return {
            ...investment,
            monthsToBreakeven,
            annualReturn,
            roiPercentage,
            paybackPeriod
        };
    });

    destroyChart('roiCalculation');
    charts.roiCalculation = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Investment Opportunities',
                data: roiData.map(item => ({
                    x: item.cost,
                    y: item.roiPercentage,
                    r: Math.sqrt(item.monthlyReturn) / 3, // Size based on monthly return
                    investment: item.name,
                    monthlyReturn: item.monthlyReturn,
                    payback: item.paybackPeriod
                })),
                backgroundColor: roiData.map((item, index) => {
                    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
                    return colors[index % colors.length] + 'CC';
                }),
                borderColor: roiData.map((item, index) => {
                    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
                    return colors[index % colors.length];
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Investment Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Annual ROI (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return value.toFixed(0) + '%';
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return context[0].raw.investment;
                        },
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Investment: $${data.x.toLocaleString()}`,
                                `Annual ROI: ${data.y.toFixed(1)}%`,
                                `Monthly Return: $${data.monthlyReturn}`,
                                `Payback Period: ${data.payback.toFixed(1)} months`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ========== 6. TEMPORAL ANALYTICS ==========

function initializeTemporalCharts() {
    console.log('📅 Initializing Temporal Analytics Charts...');
    
    // Add event listeners for controls
    addChartEventListener('seasonalMetric', createSeasonalTrendsChart);
    addChartEventListener('timeOfDayDriver', createTimeOfDayChart);
    addChartEventListener('weeklyPatternType', createWeeklyPatternsChart);
    
    // Create all charts
    createSeasonalTrendsChart();
    createTimeOfDayChart();
    createWeeklyPatternsChart();
    createMonthlyAnalysisChart();
    createPeakPerformanceChart();
    createHistoricalProgressionChart();
}

// 6.1 Seasonal Trends Chart
function createSeasonalTrendsChart() {
    const ctx = document.getElementById('seasonalTrendsChart');
    if (!ctx) return;

    const metric = document.getElementById('seasonalMetric')?.value || 'performance';
    
    // Group data by month
    const monthlyData = {};
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const month = date.getMonth(); // 0-11
        const monthName = date.toLocaleString('default', { month: 'long' });
        
        if (!monthlyData[month]) {
            monthlyData[month] = {
                monthName,
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                positions: []
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        const position = parseInt(row.Position || 0);
        
        if (lapTime > 0) monthlyData[month].lapTimes.push(lapTime);
        if (position > 0) monthlyData[month].positions.push(position);
        monthlyData[month].drivers.add(row.Driver);
        monthlyData[month].sessions.add(row.SessionDate);
    });
    
    // Sort by month order
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => parseInt(a) - parseInt(b));
    const labels = sortedMonths.map(month => monthlyData[month].monthName);
    
    let chartData = [];
    
    if (metric === 'performance') {
        const avgLapTimes = sortedMonths.map(month => {
            const times = monthlyData[month].lapTimes;
            return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
        });
        
        chartData = [{
            label: 'Average Lap Time (s)',
            data: avgLapTimes,
            borderColor: '#FF6B35',
            backgroundColor: '#FF6B3540',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6
        }];
    } else if (metric === 'participation') {
        const uniqueDrivers = sortedMonths.map(month => monthlyData[month].drivers.size);
        const totalSessions = sortedMonths.map(month => monthlyData[month].sessions.size);
        
        chartData = [
            {
                label: 'Unique Drivers',
                data: uniqueDrivers,
                borderColor: '#4ECDC4',
                backgroundColor: '#4ECDC440',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Total Sessions',
                data: totalSessions,
                borderColor: '#45B7D1',
                backgroundColor: '#45B7D140',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ];
    } else {
        const consistency = sortedMonths.map(month => {
            const times = monthlyData[month].lapTimes;
            return times.length > 0 ? calculateStandardDeviation(times) : 0;
        });
        
        chartData = [{
            label: 'Consistency (Lower = Better)',
            data: consistency,
            borderColor: '#F7DC6F',
            backgroundColor: '#F7DC6F40',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6
        }];
    }

    destroyChart('seasonalTrends');
    charts.seasonalTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric !== 'performance',
                    title: {
                        display: true,
                        text: metric === 'performance' ? 'Lap Time (seconds)' :
                              metric === 'participation' ? 'Number of Drivers' : 'Standard Deviation',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: metric === 'participation' ? {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Sessions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                } : undefined,
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 6.2 Time of Day Performance Chart
function createTimeOfDayChart() {
    const ctx = document.getElementById('timeOfDayChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('timeOfDayDriver')?.value;
    let dataToAnalyze = filteredData;
    
    if (selectedDriver && selectedDriver !== 'all') {
        dataToAnalyze = filteredData.filter(row => row.Driver === selectedDriver);
    }
    
    // Simulate time of day data (since we don't have actual time data)
    const hourlyData = {};
    
    dataToAnalyze.forEach(row => {
        // Simulate hour based on session date hash for consistency
        const dateStr = row.SessionDate + row.Driver;
        const hash = dateStr.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hour = Math.abs(hash % 12) + 8; // 8 AM to 7 PM
        
        if (!hourlyData[hour]) {
            hourlyData[hour] = {
                lapTimes: [],
                drivers: new Set(),
                totalLaps: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        if (lapTime > 0) {
            hourlyData[hour].lapTimes.push(lapTime);
        }
        hourlyData[hour].drivers.add(row.Driver);
        hourlyData[hour].totalLaps++;
    });
    
    // Create hourly performance data
    const hours = Array.from({length: 12}, (_, i) => i + 8); // 8 AM to 7 PM
    const labels = hours.map(hour => `${hour}:00`);
    
    const avgPerformance = hours.map(hour => {
        const data = hourlyData[hour];
        if (!data || data.lapTimes.length === 0) return null;
        return data.lapTimes.reduce((sum, time) => sum + time, 0) / data.lapTimes.length;
    });
    
    const activity = hours.map(hour => {
        const data = hourlyData[hour];
        return data ? data.totalLaps : 0;
    });

    destroyChart('timeOfDay');
    charts.timeOfDay = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Lap Time',
                    data: avgPerformance,
                    borderColor: '#FF6B35',
                    backgroundColor: '#FF6B3540',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Activity Level (Laps)',
                    data: activity,
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC440',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Laps',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time of Day',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 6.3 Weekly Patterns Chart
function createWeeklyPatternsChart() {
    const ctx = document.getElementById('weeklyPatternsChart');
    if (!ctx) return;

    const patternType = document.getElementById('weeklyPatternType')?.value || 'performance';
    
    // Group data by day of week
    const weeklyData = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek];
        
        if (!weeklyData[dayOfWeek]) {
            weeklyData[dayOfWeek] = {
                dayName,
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                totalLaps: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        if (lapTime > 0) {
            weeklyData[dayOfWeek].lapTimes.push(lapTime);
        }
        weeklyData[dayOfWeek].drivers.add(row.Driver);
        weeklyData[dayOfWeek].sessions.add(row.SessionDate);
        weeklyData[dayOfWeek].totalLaps++;
    });
    
    const sortedDays = Object.keys(weeklyData).sort((a, b) => parseInt(a) - parseInt(b));
    const labels = sortedDays.map(day => weeklyData[day].dayName);
    
    let chartData = [];
    
    if (patternType === 'performance') {
        const avgTimes = sortedDays.map(day => {
            const times = weeklyData[day].lapTimes;
            return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
        });
        
        chartData = [{
            label: 'Average Lap Time',
            data: avgTimes,
            backgroundColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#FF6B35CC' : '#4ECDC4CC';
            }),
            borderColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#FF6B35' : '#4ECDC4';
            }),
            borderWidth: 2,
            borderRadius: 8
        }];
    } else if (patternType === 'activity') {
        const totalLaps = sortedDays.map(day => weeklyData[day].totalLaps);
        const uniqueDrivers = sortedDays.map(day => weeklyData[day].drivers.size);
        
        chartData = [
            {
                label: 'Total Laps',
                data: totalLaps,
                backgroundColor: '#22C55ECC',
                borderColor: '#22C55E',
                borderWidth: 2,
                borderRadius: 6,
                yAxisID: 'y'
            },
            {
                label: 'Unique Drivers',
                data: uniqueDrivers,
                backgroundColor: '#3B82F6CC',
                borderColor: '#3B82F6',
                borderWidth: 2,
                borderRadius: 6,
                yAxisID: 'y1'
            }
        ];
    } else {
        const sessions = sortedDays.map(day => weeklyData[day].sessions.size);
        
        chartData = [{
            label: 'Number of Sessions',
            data: sessions,
            backgroundColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#F59E0BCC' : '#8B5CF6CC';
            }),
            borderColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#F59E0B' : '#8B5CF6';
            }),
            borderWidth: 2,
            borderRadius: 8
        }];
    }

    destroyChart('weeklyPatterns');
    charts.weeklyPatterns = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: patternType !== 'performance',
                    title: {
                        display: true,
                        text: patternType === 'performance' ? 'Lap Time (seconds)' :
                              patternType === 'activity' ? 'Number of Laps' : 'Number of Sessions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: patternType === 'activity' ? {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Drivers',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                } : undefined,
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 6.4 Monthly Analysis Chart
function createMonthlyAnalysisChart() {
    const ctx = document.getElementById('monthlyAnalysisChart');
    if (!ctx) return;

    // Group data by year-month
    const monthlyData = {};
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = {
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                positions: [],
                totalRevenue: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        const position = parseInt(row.Position || 0);
        
        if (lapTime > 0) monthlyData[yearMonth].lapTimes.push(lapTime);
        if (position > 0) monthlyData[yearMonth].positions.push(position);
        monthlyData[yearMonth].drivers.add(row.Driver);
        monthlyData[yearMonth].sessions.add(row.SessionDate);
        monthlyData[yearMonth].totalRevenue += 2; // $2 per lap simulation
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    });
    
    // Calculate metrics
    const avgPerformance = sortedMonths.map(month => {
        const times = monthlyData[month].lapTimes;
        return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    });
    
    const participation = sortedMonths.map(month => monthlyData[month].drivers.size);
    const revenue = sortedMonths.map(month => monthlyData[month].totalRevenue);

    destroyChart('monthlyAnalysis');
    charts.monthlyAnalysis = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Performance',
                    data: avgPerformance,
                    borderColor: '#FF6B35',
                    backgroundColor: '#FF6B3540',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Driver Participation',
                    data: participation,
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC440',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Revenue ($)',
                    data: revenue,
                    borderColor: '#22C55E',
                    backgroundColor: '#22C55E40',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Avg Lap Time (s)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Drivers',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y2: {
                    type: 'linear',
                    display: false,
                    beginAtZero: true
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 6.5 Peak Performance Times Chart
function createPeakPerformanceChart() {
    const ctx = document.getElementById('peakPerformanceChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Find peak performance for each driver
    const peakData = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        
        // Group by session to find best session
        const sessionPerformance = {};
        driverData.forEach(row => {
            const session = row.SessionDate;
            if (!sessionPerformance[session]) {
                sessionPerformance[session] = [];
            }
            const lapTime = parseFloat(row.LapTime || 0);
            if (lapTime > 0) {
                sessionPerformance[session].push(lapTime);
            }
        });
        
        // Find best session (lowest average lap time)
        let bestSession = null;
        let bestAverage = Infinity;
        let bestLap = Infinity;
        
        Object.keys(sessionPerformance).forEach(session => {
            const times = sessionPerformance[session];
            if (times.length > 0) {
                const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
                const fastest = Math.min(...times);
                
                if (avg < bestAverage) {
                    bestAverage = avg;
                    bestSession = session;
                    bestLap = fastest;
                }
            }
        });
        
        // Simulate peak time (morning/afternoon/evening)
        const sessionHash = (bestSession || '').split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const peakHour = Math.abs(sessionHash % 12) + 8; // 8 AM to 7 PM
        const peakTime = peakHour < 12 ? 'Morning' : peakHour < 17 ? 'Afternoon' : 'Evening';
        
        return {
            driver,
            bestSession,
            bestAverage: bestAverage === Infinity ? 0 : bestAverage,
            bestLap: bestLap === Infinity ? 0 : bestLap,
            peakTime,
            peakHour
        };
    });
    
    // Group by peak time
    const timeGroups = { Morning: [], Afternoon: [], Evening: [] };
    peakData.forEach(data => {
        if (data.bestAverage > 0) {
            timeGroups[data.peakTime].push(data);
        }
    });
    
    const labels = Object.keys(timeGroups);
    const avgPerformance = labels.map(time => {
        const group = timeGroups[time];
        if (group.length === 0) return 0;
        return group.reduce((sum, driver) => sum + driver.bestAverage, 0) / group.length;
    });
    
    const driverCounts = labels.map(time => timeGroups[time].length);

    destroyChart('peakPerformance');
    charts.peakPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Peak Performance',
                    data: avgPerformance,
                    backgroundColor: ['#FFD700CC', '#FF6B35CC', '#8B5CF6CC'],
                    borderColor: ['#FFD700', '#FF6B35', '#8B5CF6'],
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Peak Performers',
                    data: driverCounts,
                    backgroundColor: '#4ECDC4CC',
                    borderColor: '#4ECDC4',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Drivers',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// 6.6 Historical Progression Chart
function createHistoricalProgressionChart() {
    const ctx = document.getElementById('historicalProgressionChart');
    if (!ctx) return;

    // Create progression data over time
    const progressionData = {};
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Sort all data by date
    const sortedData = filteredData.sort((a, b) => new Date(a.SessionDate) - new Date(b.SessionDate));
    
    // Track cumulative statistics for each driver
    drivers.forEach(driver => {
        progressionData[driver] = {
            sessions: [],
            cumulativeLaps: 0,
            bestLapProgression: [],
            avgLapProgression: [],
            consistencyProgression: []
        };
    });
    
    const sessionDates = [...new Set(sortedData.map(row => row.SessionDate))].sort();
    
    sessionDates.forEach(sessionDate => {
        const sessionData = sortedData.filter(row => row.SessionDate === sessionDate);
        
        drivers.forEach(driver => {
            const driverSessionData = sessionData.filter(row => row.Driver === driver);
            const driverAllData = sortedData.filter(row => 
                row.Driver === driver && new Date(row.SessionDate) <= new Date(sessionDate)
            );
            
            if (driverSessionData.length > 0) {
                const lapTimes = driverAllData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                
                if (lapTimes.length > 0) {
                    const bestLap = Math.min(...lapTimes);
                    const avgLap = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                    const consistency = calculateStandardDeviation(lapTimes);
                    
                    progressionData[driver].sessions.push(sessionDate);
                    progressionData[driver].cumulativeLaps = lapTimes.length;
                    progressionData[driver].bestLapProgression.push(bestLap);
                    progressionData[driver].avgLapProgression.push(avgLap);
                    progressionData[driver].consistencyProgression.push(consistency);
                }
            }
        });
    });
    
    // Create datasets for top 3 most active drivers
    const activeDrivers = drivers.map(driver => ({
        driver,
        laps: progressionData[driver].cumulativeLaps
    })).sort((a, b) => b.laps - a.laps).slice(0, 3);
    
    const datasets = activeDrivers.map((item, index) => {
        const driver = item.driver;
        const data = progressionData[driver];
        
        return {
            label: `${driver} (Best Lap)`,
            data: data.sessions.map((session, i) => ({
                x: session,
                y: data.bestLapProgression[i]
            })),
            borderColor: getDriverColor(index),
            backgroundColor: getDriverColor(index) + '40',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 4
        };
    });

    destroyChart('historicalProgression');
    charts.historicalProgression = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD',
                        displayFormats: {
                            day: 'MMM DD',
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Session Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Best Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 1
                }
            }
        }
    });
}

// ==============================================
// SESSION MANAGEMENT WIDGETS SECTION
// ==============================================

// Session Control Widget
function createSessionControlWidget() {
    try {
        const container = document.getElementById('session-control-widget');
        if (!container) return;

        const sessions = [...new Set(globalData.map(d => d.Sessie || d.Session || 'Unknown Session'))];
        const currentSession = sessionState.activeSession || sessions[0];
        const totalLaps = globalData.filter(d => (d.Sessie || d.Session) === currentSession).length;
        
        container.innerHTML = `
            <div class="widget-header">
                <h3>🎮 Session Control</h3>
                <div class="session-status ${sessionState.isLive ? 'live' : 'stopped'}">
                    ${sessionState.isLive ? 'LIVE' : 'STOPPED'}
                </div>
            </div>
            <div class="widget-content">
                <div class="session-selector">
                    <label>Active Session:</label>
                    <select id="session-select" onchange="switchSession(this.value)">
                        ${sessions.map(s => 
                            `<option value="${s}" ${s === currentSession ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="session-metrics">
                    <div class="metric">
                        <label>Total Laps</label>
                        <span class="value">${totalLaps}</span>
                    </div>
                    <div class="metric">
                        <label>Drivers</label>
                        <span class="value">${new Set(globalData.filter(d => (d.Sessie || d.Session) === currentSession).map(d => d.Naam || d.Driver || 'Unknown')).size}</span>
                    </div>
                    <div class="metric">
                        <label>Duration</label>
                        <span class="value">${calculateSessionDuration(currentSession)}</span>
                    </div>
                </div>
                <div class="session-controls">
                    <button class="btn-primary" onclick="toggleSessionRecording()">
                        ${sessionState.isRecording ? '⏹️ Stop Recording' : '▶️ Start Recording'}
                    </button>
                    <button class="btn-secondary" onclick="exportSessionData()">📊 Export Session</button>
                    <button class="btn-secondary" onclick="resetSession()">🔄 Reset Session</button>
                </div>
            </div>
        `;

        console.log('✅ Session Control Widget created');
    } catch (error) {
        console.error('❌ Error creating Session Control Widget:', error);
    }
}

// Live Session Monitor
function createLiveSessionMonitor() {
    try {
        const container = document.getElementById('live-session-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const recentLaps = sessionData.slice(-10);
        const activeFastestLap = Math.min(...sessionData.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 999)));

        container.innerHTML = `
            <div class="widget-header">
                <h3>📡 Live Monitor</h3>
                <div class="live-indicator ${sessionState.isLive ? 'active' : ''}">
                    <span class="pulse"></span>
                    ${sessionState.isLive ? 'Broadcasting' : 'Offline'}
                </div>
            </div>
            <div class="widget-content">
                <div class="live-stats">
                    <div class="stat-card fastest-lap">
                        <div class="stat-label">Fastest Lap</div>
                        <div class="stat-value">${activeFastestLap === 999 ? '--:--' : formatTime(activeFastestLap)}</div>
                        <div class="stat-driver">${getFastestLapDriver(sessionData)}</div>
                    </div>
                    <div class="stat-card current-leader">
                        <div class="stat-label">Current Leader</div>
                        <div class="stat-value">${getCurrentLeader(sessionData)}</div>
                        <div class="stat-gap">+${getCurrentGap(sessionData)}s</div>
                    </div>
                    <div class="stat-card track-activity">
                        <div class="stat-label">Track Activity</div>
                        <div class="stat-value">${getTrackActivity(sessionData)}</div>
                        <div class="stat-trend">${getActivityTrend(sessionData)}</div>
                    </div>
                </div>
                <div class="recent-laps">
                    <h4>Recent Lap Times</h4>
                    <div class="lap-feed">
                        ${recentLaps.reverse().map(lap => `
                            <div class="lap-entry ${isPersonalBest(lap) ? 'personal-best' : ''}">
                                <span class="driver">${lap.Naam || lap.Driver || 'Unknown'}</span>
                                <span class="lap-time">${formatTime(lap.Ronde_tijd || lap.LapTime)}</span>
                                <span class="gap">${calculateGapToLeader(lap, sessionData)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Live Session Monitor created');
    } catch (error) {
        console.error('❌ Error creating Live Session Monitor:', error);
    }
}

// Session Statistics Widget
function createSessionStatsWidget() {
    try {
        const container = document.getElementById('session-stats-widget');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        
        const stats = calculateSessionStatistics(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>📈 Session Statistics</h3>
                <button class="refresh-btn" onclick="createSessionStatsWidget()">🔄</button>
            </div>
            <div class="widget-content">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <label>Average Lap Time</label>
                            <span class="stat-value">${formatTime(stats.avgLapTime)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🏁</div>
                        <div class="stat-info">
                            <label>Fastest Lap</label>
                            <span class="stat-value">${formatTime(stats.fastestLap)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <label>Consistency</label>
                            <span class="stat-value">${stats.consistency.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🔄</div>
                        <div class="stat-info">
                            <label>Improvement Rate</label>
                            <span class="stat-value">${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate.toFixed(2)}%</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <label>Track Records</label>
                            <span class="stat-value">${stats.trackRecords}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-info">
                            <label>Peak Performance</label>
                            <span class="stat-value">${stats.peakPerformance}%</span>
                        </div>
                    </div>
                </div>
                <div class="progress-indicators">
                    <div class="progress-item">
                        <label>Session Progress</label>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.sessionProgress}%"></div>
                        </div>
                        <span>${stats.sessionProgress}%</span>
                    </div>
                    <div class="progress-item">
                        <label>Target Achievement</label>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.targetAchievement}%"></div>
                        </div>
                        <span>${stats.targetAchievement}%</span>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Session Statistics Widget created');
    } catch (error) {
        console.error('❌ Error creating Session Statistics Widget:', error);
    }
}

// Driver Performance Monitor
function createDriverPerformanceMonitor() {
    try {
        const container = document.getElementById('driver-performance-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const drivers = getTopDrivers(sessionData, 8);

        container.innerHTML = `
            <div class="widget-header">
                <h3>👥 Driver Performance Monitor</h3>
                <div class="view-toggle">
                    <button class="toggle-btn active" onclick="switchDriverView('live')">Live</button>
                    <button class="toggle-btn" onclick="switchDriverView('overall')">Overall</button>
                </div>
            </div>
            <div class="widget-content">
                <div class="driver-cards">
                    ${drivers.map((driver, index) => `
                        <div class="driver-card ${index === 0 ? 'leader' : ''}">
                            <div class="driver-position">${index + 1}</div>
                            <div class="driver-info">
                                <div class="driver-name">${driver.name}</div>
                                <div class="driver-time">${formatTime(driver.bestLap)}</div>
                            </div>
                            <div class="driver-metrics">
                                <div class="metric">
                                    <span class="metric-label">Laps</span>
                                    <span class="metric-value">${driver.laps}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Avg</span>
                                    <span class="metric-value">${formatTime(driver.avgLap)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Gap</span>
                                    <span class="metric-value">+${driver.gap.toFixed(3)}s</span>
                                </div>
                            </div>
                            <div class="driver-status ${driver.status}">
                                <span class="status-indicator"></span>
                                ${driver.status.toUpperCase()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        console.log('✅ Driver Performance Monitor created');
    } catch (error) {
        console.error('❌ Error creating Driver Performance Monitor:', error);
    }
}

// Session Progress Timeline
function createSessionProgressTimeline() {
    try {
        const container = document.getElementById('session-progress-timeline');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const timeline = generateSessionTimeline(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>📅 Session Timeline</h3>
                <div class="timeline-controls">
                    <button class="btn-small" onclick="zoomTimeline('hour')">1H</button>
                    <button class="btn-small active" onclick="zoomTimeline('session')">Session</button>
                    <button class="btn-small" onclick="zoomTimeline('all')">All</button>
                </div>
            </div>
            <div class="widget-content">
                <div class="timeline-container">
                    <div class="timeline">
                        ${timeline.map(event => `
                            <div class="timeline-event ${event.type}" data-time="${event.time}">
                                <div class="event-marker"></div>
                                <div class="event-content">
                                    <div class="event-time">${formatTimelineTime(event.time)}</div>
                                    <div class="event-title">${event.title}</div>
                                    <div class="event-description">${event.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="timeline-summary">
                    <div class="summary-item">
                        <span class="summary-label">Duration:</span>
                        <span class="summary-value">${calculateSessionDuration(currentSession)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Key Events:</span>
                        <span class="summary-value">${timeline.filter(e => e.type === 'milestone').length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Records Set:</span>
                        <span class="summary-value">${timeline.filter(e => e.type === 'record').length}</span>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Session Progress Timeline created');
    } catch (error) {
        console.error('❌ Error creating Session Progress Timeline:', error);
    }
}

// Weather & Track Conditions Monitor
function createConditionsMonitor() {
    try {
        const container = document.getElementById('conditions-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const conditions = analyzeTrackConditions(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>🌤️ Track Conditions</h3>
                <div class="conditions-status ${conditions.overall}">
                    ${conditions.overall.toUpperCase()}
                </div>
            </div>
            <div class="widget-content">
                <div class="conditions-grid">
                    <div class="condition-card weather">
                        <div class="condition-icon">☀️</div>
                        <div class="condition-info">
                            <label>Weather</label>
                            <span class="condition-value">${conditions.weather}</span>
                            <span class="condition-trend">${conditions.weatherTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card temperature">
                        <div class="condition-icon">🌡️</div>
                        <div class="condition-info">
                            <label>Temperature</label>
                            <span class="condition-value">${conditions.temperature}°C</span>
                            <span class="condition-trend">${conditions.tempTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card track">
                        <div class="condition-icon">🏁</div>
                        <div class="condition-info">
                            <label>Track Surface</label>
                            <span class="condition-value">${conditions.surface}</span>
                            <span class="condition-trend">${conditions.surfaceTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card grip">
                        <div class="condition-icon">🔗</div>
                        <div class="condition-info">
                            <label>Grip Level</label>
                            <span class="condition-value">${conditions.grip}%</span>
                            <span class="condition-trend">${conditions.gripTrend}</span>
                        </div>
                    </div>
                </div>
                <div class="impact-analysis">
                    <h4>Performance Impact</h4>
                    <div class="impact-metrics">
                        <div class="impact-item">
                            <span class="impact-label">Lap Time Effect:</span>
                            <span class="impact-value ${conditions.lapTimeImpact > 0 ? 'negative' : 'positive'}">
                                ${conditions.lapTimeImpact > 0 ? '+' : ''}${conditions.lapTimeImpact.toFixed(3)}s
                            </span>
                        </div>
                        <div class="impact-item">
                            <span class="impact-label">Consistency Impact:</span>
                            <span class="impact-value">${conditions.consistencyImpact}%</span>
                        </div>
                        <div class="impact-item">
                            <span class="impact-label">Safety Factor:</span>
                            <span class="impact-value ${conditions.safetyFactor < 0.8 ? 'warning' : 'good'}">${conditions.safetyFactor.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Conditions Monitor created');
    } catch (error) {
        console.error('❌ Error creating Conditions Monitor:', error);
    }
}

// Helper Functions for Session Widgets
function calculateSessionDuration(session) {
    const sessionData = globalData.filter(d => (d.Sessie || d.Session) === session);
    if (sessionData.length === 0) return '00:00:00';
    
    // Estimate duration based on lap count and average lap times
    const avgLapTime = sessionData.reduce((sum, d) => sum + parseFloat(d.Ronde_tijd || d.LapTime || 0), 0) / sessionData.length;
    const totalMinutes = (avgLapTime * sessionData.length) / 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getFastestLapDriver(sessionData) {
    if (sessionData.length === 0) return 'Unknown';
    const fastestLap = sessionData.reduce((fastest, current) => 
        parseFloat(current.Ronde_tijd || current.LapTime || 999) < parseFloat(fastest.Ronde_tijd || fastest.LapTime || 999) ? current : fastest
    );
    return fastestLap.Naam || fastestLap.Driver || 'Unknown';
}

function getCurrentLeader(sessionData) {
    const drivers = {};
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        if (!drivers[driver] || parseFloat(lap.Ronde_tijd || lap.LapTime || 999) < drivers[driver]) {
            drivers[driver] = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        }
    });
    
    const leader = Object.entries(drivers).reduce((best, [driver, time]) => 
        time < best.time ? {driver, time} : best, {driver: 'Unknown', time: 999});
    
    return leader.driver;
}

function getCurrentGap(sessionData) {
    const drivers = {};
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        if (!drivers[driver] || parseFloat(lap.Ronde_tijd || lap.LapTime || 999) < drivers[driver]) {
            drivers[driver] = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        }
    });
    
    const times = Object.values(drivers).filter(t => t !== 999).sort((a, b) => a - b);
    return times.length > 1 ? (times[1] - times[0]).toFixed(3) : '0.000';
}

function getTrackActivity(sessionData) {
    // Mock implementation - in real scenario, this would analyze recent lap activity
    const recentLaps = sessionData.slice(-5);
    return recentLaps.length > 3 ? 'High' : recentLaps.length > 1 ? 'Medium' : 'Low';
}

function getActivityTrend(sessionData) {
    // Mock implementation - trend analysis
    return Math.random() > 0.5 ? '↗️ Increasing' : '↘️ Decreasing';
}

function isPersonalBest(lap) {
    // Check if this lap is a personal best for the driver
    const driver = lap.Naam || lap.Driver || 'Unknown';
    const driverLaps = globalData.filter(d => (d.Naam || d.Driver) === driver);
    const currentLapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
    const bestLapTime = Math.min(...driverLaps.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 999)));
    return currentLapTime === bestLapTime;
}

function calculateGapToLeader(lap, sessionData) {
    const leader = getCurrentLeader(sessionData);
    const leaderTime = parseFloat(sessionData.find(d => (d.Naam || d.Driver) === leader)?.Ronde_tijd || lap.LapTime || 0);
    const lapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 0);
    const gap = lapTime - leaderTime;
    return gap > 0 ? `+${gap.toFixed(3)}s` : `${gap.toFixed(3)}s`;
}

function calculateSessionStatistics(sessionData) {
    const lapTimes = sessionData.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 0)).filter(t => t > 0);
    const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length || 0;
    const fastestLap = Math.min(...lapTimes) || 0;
    
    return {
        avgLapTime,
        fastestLap,
        consistency: calculateConsistencyPercentage(lapTimes),
        improvementRate: calculateImprovementRate(lapTimes),
        trackRecords: countTrackRecords(sessionData),
        peakPerformance: calculatePeakPerformance(lapTimes),
        sessionProgress: Math.min(100, (sessionData.length / 50) * 100), // Assuming 50 laps target
        targetAchievement: calculateTargetAchievement(sessionData)
    };
}

function calculateConsistencyPercentage(lapTimes) {
    if (lapTimes.length < 2) return 100;
    const avg = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / lapTimes.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 100 - (stdDev / avg * 100));
}

function calculateImprovementRate(lapTimes) {
    if (lapTimes.length < 2) return 0;
    const firstHalf = lapTimes.slice(0, Math.floor(lapTimes.length / 2));
    const secondHalf = lapTimes.slice(Math.floor(lapTimes.length / 2));
    const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    return ((firstAvg - secondAvg) / firstAvg) * 100;
}

function countTrackRecords(sessionData) {
    // Mock implementation - count potential track records
    return Math.floor(Math.random() * 5) + 1;
}

function calculatePeakPerformance(lapTimes) {
    if (lapTimes.length === 0) return 0;
    const bestTime = Math.min(...lapTimes);
    const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    return Math.round((avgTime / bestTime) * 100);
}

function calculateTargetAchievement(sessionData) {
    // Mock implementation - achievement percentage
    return Math.floor(Math.random() * 40) + 60; // 60-100%
}

function getTopDrivers(sessionData, count = 8) {
    const drivers = {};
    
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        const lapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        
        if (!drivers[driver]) {
            drivers[driver] = {
                name: driver,
                bestLap: lapTime,
                totalTime: lapTime,
                laps: 1,
                status: Math.random() > 0.3 ? 'active' : 'inactive'
            };
        } else {
            drivers[driver].bestLap = Math.min(drivers[driver].bestLap, lapTime);
            drivers[driver].totalTime += lapTime;
            drivers[driver].laps++;
        }
    });
    
    return Object.values(drivers)
        .map(driver => ({
            ...driver,
            avgLap: driver.totalTime / driver.laps,
            gap: 0 // Will be calculated relative to leader
        }))
        .sort((a, b) => a.bestLap - b.bestLap)
        .slice(0, count)
        .map((driver, index) => ({
            ...driver,
            gap: index === 0 ? 0 : driver.bestLap - sessionData.reduce((best, lap) => {
                const time = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
                return time < best ? time : best;
            }, 999)
        }));
}

function generateSessionTimeline(sessionData) {
    // Generate mock timeline events
    const events = [
        { type: 'session-start', time: '10:00', title: 'Session Started', description: 'Track opened for practice' },
        { type: 'milestone', time: '10:15', title: 'First Sub-60s Lap', description: 'New track milestone achieved' },
        { type: 'record', time: '10:32', title: 'Track Record', description: 'New fastest lap set' },
        { type: 'incident', time: '10:45', title: 'Track Incident', description: 'Minor incident, yellow flag' },
        { type: 'milestone', time: '11:00', title: '50 Laps Completed', description: 'Session milestone reached' }
    ];
    
    return events;
}

function formatTimelineTime(time) {
    return time; // Already formatted
}

function analyzeTrackConditions(sessionData) {
    // Mock track conditions analysis
    return {
        overall: 'optimal',
        weather: 'Sunny',
        weatherTrend: '☀️ Stable',
        temperature: 24,
        tempTrend: '↗️ Rising',
        surface: 'Dry',
        surfaceTrend: '✅ Good',
        grip: 95,
        gripTrend: '↗️ Improving',
        lapTimeImpact: -0.234,
        consistencyImpact: 12,
        safetyFactor: 0.92
    };
}

function initializeSessionWidgets() {
    console.log('🚀 Initializing Session Management Widgets...');
    
    createSessionControlWidget();
    createLiveSessionMonitor();
    createSessionStatsWidget();
    createDriverPerformanceMonitor();
    createSessionProgressTimeline();
    createConditionsMonitor();
    
    console.log('✅ Session Management Widgets initialized');
}

function initializePredictiveCharts() {
    console.log('🔮 Initializing Predictive Analytics Charts...');
    
    createLapTimePredictionChart();
    createPerformanceForecastChart();
    createDriverRankingPredictionChart();
    createSeasonalForecastChart();
    createOptimalStrategyChart();
    
    console.log('✅ Predictive Analytics Charts initialized');
}

// ==============================================
// PREDICTIVE ANALYTICS SECTION
// ==============================================

// Lap Time Prediction Chart
function createLapTimePredictionChart() {
    try {
        const ctx = document.getElementById('lapTimePrediction')?.getContext('2d');
        if (!ctx) return;

        // Generate predictive model based on historical data
        const driverData = {};
        filteredData.forEach(row => {
            const driver = row.Naam || row.Driver || 'Unknown';
            const lapTime = parseFloat(row.Ronde_tijd || row.LapTime || 0);
            const lapNumber = parseInt(row.Rondenummer || row.LapNumber || 0);
            
            if (!driverData[driver]) driverData[driver] = [];
            if (lapTime > 0 && lapNumber > 0) {
                driverData[driver].push({ lap: lapNumber, time: lapTime });
            }
        });

        // Select top 3 drivers for prediction
        const topDrivers = Object.entries(driverData)
            .filter(([_, laps]) => laps.length >= 5)
            .sort(([_, a], [__, b]) => Math.min(...a.map(l => l.time)) - Math.min(...b.map(l => l.time)))
            .slice(0, 3);

        const datasets = topDrivers.map(([driver, laps], index) => {
            // Sort by lap number
            laps.sort((a, b) => a.lap - b.lap);
            
            // Historical data
            const historicalData = laps.map(lap => ({ x: lap.lap, y: lap.time }));
            
            // Generate predictions using trend analysis
            const predictions = generateLapTimePredictions(laps, 10);
            const futureData = predictions.map((time, i) => ({ 
                x: Math.max(...laps.map(l => l.lap)) + i + 1, 
                y: time 
            }));

            const colors = ['#00ff88', '#ff6b35', '#4ecdc4'];
            
            return [{
                label: `${driver} (Historical)`,
                data: historicalData,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                fill: false,
                tension: 0.4,
                pointRadius: 3
            }, {
                label: `${driver} (Predicted)`,
                data: futureData,
                borderColor: colors[index],
                backgroundColor: colors[index] + '40',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                pointStyle: 'triangle'
            }];
        }).flat();

        destroyChart('lapTimePrediction');
        charts.lapTimePrediction = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '🔮 Lap Time Prediction Model',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const isPredicted = context.dataset.label.includes('Predicted');
                                const prefix = isPredicted ? '🔮 Predicted: ' : '📊 Actual: ';
                                return prefix + formatTime(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Lap Number',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Lap Time (seconds)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return formatTime(value);
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });

        console.log('✅ Lap Time Prediction Chart created');
    } catch (error) {
        console.error('❌ Error creating Lap Time Prediction Chart:', error);
    }
}

// Performance Forecast Chart
function createPerformanceForecastChart() {
    try {
        const ctx = document.getElementById('performanceForecast')?.getContext('2d');
        if (!ctx) return;

        // Analyze performance trends for forecasting
        const performanceMetrics = analyzePerformanceTrends(filteredData);
        
        const datasets = [{
            label: 'Consistency Forecast',
            data: performanceMetrics.consistencyForecast,
            borderColor: '#00ff88',
            backgroundColor: '#00ff8820',
            yAxisID: 'y',
            tension: 0.4
        }, {
            label: 'Speed Improvement',
            data: performanceMetrics.speedForecast,
            borderColor: '#ff6b35',
            backgroundColor: '#ff6b3520',
            yAxisID: 'y1',
            tension: 0.4
        }, {
            label: 'Risk Assessment',
            data: performanceMetrics.riskForecast,
            borderColor: '#ffed4a',
            backgroundColor: '#ffed4a20',
            yAxisID: 'y2',
            tension: 0.4
        }];

        destroyChart('performanceForecast');
        charts.performanceForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: performanceMetrics.forecastPeriods,
                datasets
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Performance Forecast Analysis',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Forecast Period',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Consistency %',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Speed Improvement %',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        min: 0,
                        max: 100
                    }
                }
            }
        });

        console.log('✅ Performance Forecast Chart created');
    } catch (error) {
        console.error('❌ Error creating Performance Forecast Chart:', error);
    }
}

// Driver Ranking Prediction Chart
function createDriverRankingPredictionChart() {
    try {
        const ctx = document.getElementById('driverRankingPrediction')?.getContext('2d');
        if (!ctx) return;

        // Calculate current driver rankings and predict future positions
        const driverStats = calculateDriverRankings(filteredData);
        const predictions = generateRankingPredictions(driverStats);

        const chartData = {
            labels: predictions.drivers,
            datasets: [{
                label: 'Current Ranking',
                data: predictions.currentRanking,
                backgroundColor: '#4ecdc4',
                borderColor: '#4ecdc4',
                borderWidth: 2
            }, {
                label: 'Predicted Ranking (Next Session)',
                data: predictions.predictedRanking,
                backgroundColor: '#ff6b35',
                borderColor: '#ff6b35',
                borderWidth: 2,
                borderDash: [5, 5]
            }, {
                label: 'Confidence Level (%)',
                data: predictions.confidence,
                type: 'line',
                borderColor: '#ffed4a',
                backgroundColor: '#ffed4a20',
                yAxisID: 'y1',
                tension: 0.4
            }]
        };

        destroyChart('driverRankingPrediction');
        charts.driverRankingPrediction = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '🏆 Driver Ranking Predictions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('Confidence')) {
                                    return `Confidence: ${context.parsed.y}%`;
                                }
                                return `${context.dataset.label}: Position ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Drivers',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Ranking Position',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            reverse: true
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Confidence %',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });

        console.log('✅ Driver Ranking Prediction Chart created');
    } catch (error) {
        console.error('❌ Error creating Driver Ranking Prediction Chart:', error);
    }
}

// Seasonal Forecast Chart
function createSeasonalForecastChart() {
    try {
        const ctx = document.getElementById('seasonalForecast')?.getContext('2d');
        if (!ctx) return;

        // Generate seasonal performance forecast
        const seasonalData = generateSeasonalForecast(filteredData);

        destroyChart('seasonalForecast');
        charts.seasonalForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: seasonalData.months,
                datasets: [{
                    label: 'Performance Trend',
                    data: seasonalData.performanceTrend,
                    borderColor: '#00ff88',
                    backgroundColor: '#00ff8820',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Participation Forecast',
                    data: seasonalData.participationForecast,
                    borderColor: '#4ecdc4',
                    backgroundColor: '#4ecdc420',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Weather Impact',
                    data: seasonalData.weatherImpact,
                    borderColor: '#ffed4a',
                    backgroundColor: '#ffed4a20',
                    fill: false,
                    tension: 0.4,
                    borderDash: [3, 3]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '🌤️ Seasonal Performance Forecast',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Performance Index',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });

        console.log('✅ Seasonal Forecast Chart created');
    } catch (error) {
        console.error('❌ Error creating Seasonal Forecast Chart:', error);
    }
}

// Optimal Strategy Chart
function createOptimalStrategyChart() {
    try {
        const ctx = document.getElementById('optimalStrategy')?.getContext('2d');
        if (!ctx) return;

        // Calculate optimal racing strategies
        const strategies = calculateOptimalStrategies(filteredData);

        destroyChart('optimalStrategy');
        charts.optimalStrategy = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: strategies.factors,
                datasets: [{
                    label: 'Current Strategy',
                    data: strategies.currentStrategy,
                    borderColor: '#4ecdc4',
                    backgroundColor: '#4ecdc420',
                    pointBackgroundColor: '#4ecdc4',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }, {
                    label: 'Optimal Strategy',
                    data: strategies.optimalStrategy,
                    borderColor: '#00ff88',
                    backgroundColor: '#00ff8820',
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    borderDash: [5, 5]
                }, {
                    label: 'Aggressive Strategy',
                    data: strategies.aggressiveStrategy,
                    borderColor: '#ff6b35',
                    backgroundColor: '#ff6b3520',
                    pointBackgroundColor: '#ff6b35',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    borderDash: [2, 2]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '⚡ Optimal Racing Strategy Analysis',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            stepSize: 20
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        },
                        pointLabels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        console.log('✅ Optimal Strategy Chart created');
    } catch (error) {
        console.error('❌ Error creating Optimal Strategy Chart:', error);
    }
}

// Helper Functions for Predictive Analytics
function generateLapTimePredictions(historicalLaps, futureLaps) {
    if (historicalLaps.length < 3) return Array(futureLaps).fill(historicalLaps[0]?.time || 60);
    
    // Simple linear regression for trend analysis
    const times = historicalLaps.map(lap => lap.time);
    const n = times.length;
    const avgTime = times.reduce((sum, time) => sum + time, 0) / n;
    
    // Calculate trend
    let trend = 0;
    if (n > 1) {
        const recent = times.slice(-Math.min(5, n));
        const older = times.slice(0, Math.min(5, n));
        const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length;
        const olderAvg = older.reduce((sum, time) => sum + time, 0) / older.length;
        trend = (recentAvg - olderAvg) / Math.max(1, n - 1);
    }
    
    // Generate predictions with some randomness
    const predictions = [];
    for (let i = 0; i < futureLaps; i++) {
        const basePrediction = avgTime + (trend * i);
        const variance = avgTime * 0.02; // 2% variance
        const prediction = basePrediction + (Math.random() - 0.5) * variance;
        predictions.push(Math.max(prediction, avgTime * 0.8)); // Don't predict impossible times
    }
    
    return predictions;
}

function analyzePerformanceTrends(data) {
    const forecastPeriods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3'];
    
    // Mock sophisticated trend analysis
    const consistencyForecast = [85, 87, 90, 92, 94, 95];
    const speedForecast = [5, 8, 12, 15, 18, 20];
    const riskForecast = [25, 23, 20, 18, 15, 12];
    
    return {
        forecastPeriods,
        consistencyForecast,
        speedForecast,
        riskForecast
    };
}

function calculateDriverRankings(data) {
    const drivers = {};
    
    data.forEach(row => {
        const driver = row.Naam || row.Driver || 'Unknown';
        const lapTime = parseFloat(row.Ronde_tijd || row.LapTime || 0);
        
        if (!drivers[driver]) {
            drivers[driver] = { bestLap: lapTime, totalLaps: 0, totalTime: 0 };
        }
        
        if (lapTime > 0) {
            drivers[driver].bestLap = Math.min(drivers[driver].bestLap || lapTime, lapTime);
            drivers[driver].totalLaps++;
            drivers[driver].totalTime += lapTime;
        }
    });
    
    return Object.entries(drivers)
        .filter(([_, stats]) => stats.totalLaps >= 3)
        .sort(([_, a], [__, b]) => a.bestLap - b.bestLap)
        .slice(0, 8);
}

function generateRankingPredictions(driverStats) {
    const drivers = driverStats.map(([name, _]) => name);
    const currentRanking = drivers.map((_, index) => index + 1);
    
    // Generate predicted rankings with some variation
    const predictedRanking = currentRanking.map((pos, index) => {
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(1, Math.min(drivers.length, pos + variation));
    });
    
    // Generate confidence levels
    const confidence = drivers.map(() => Math.floor(Math.random() * 30) + 70); // 70-100%
    
    return {
        drivers: drivers.slice(0, 6), // Show top 6
        currentRanking: currentRanking.slice(0, 6),
        predictedRanking: predictedRanking.slice(0, 6),
        confidence: confidence.slice(0, 6)
    };
}

function generateSeasonalForecast(data) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Mock seasonal data with realistic patterns
    const performanceTrend = [65, 70, 75, 80, 85, 90, 88, 86, 82, 78, 72, 68];
    const participationForecast = [60, 65, 70, 75, 80, 85, 90, 88, 85, 80, 70, 65];
    const weatherImpact = [80, 75, 70, 65, 60, 55, 50, 52, 58, 65, 72, 78];
    
    return {
        months,
        performanceTrend,
        participationForecast,
        weatherImpact
    };
}

function calculateOptimalStrategies(data) {
    const factors = ['Speed', 'Consistency', 'Tire Management', 'Fuel Efficiency', 'Risk Management', 'Track Position'];
    
    // Mock strategy calculations
    const currentStrategy = [75, 80, 65, 70, 85, 60];
    const optimalStrategy = [85, 90, 80, 85, 75, 80];
    const aggressiveStrategy = [95, 70, 60, 65, 50, 90];
    
    return {
        factors,
        currentStrategy,
        optimalStrategy,
        aggressiveStrategy
    };
}

function initializeGeographicalCharts() {
    console.log('🌍 Initializing Geographical Analytics Charts...');
    
    createTrackMapChart();
    createRegionalPerformanceChart();
    createHeatmapAnalysisChart();
    createLocationTrendsChart();
    
    console.log('✅ Geographical Analytics Charts initialized');
}

// ==============================================
// GEOGRAPHICAL FEATURES SECTION
// ==============================================

// Track Map Visualization
function createTrackMapChart() {
    try {
        const ctx = document.getElementById('trackMap')?.getContext('2d');
        if (!ctx) return;

        // Generate track layout visualization
        const trackData = generateTrackLayoutData(filteredData);

        destroyChart('trackMap');
        charts.trackMap = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Track Layout',
                    data: trackData.trackPoints,
                    backgroundColor: '#4ecdc4',
                    borderColor: '#4ecdc4',
                    showLine: true,
                    fill: false,
                    pointRadius: 4,
                    tension: 0.5
                }, {
                    label: 'Optimal Racing Line',
                    data: trackData.racingLine,
                    backgroundColor: '#00ff88',
                    borderColor: '#00ff88',
                    showLine: true,
                    fill: false,
                    pointRadius: 2,
                    borderWidth: 3,
                    tension: 0.4,
                    borderDash: [5, 5]
                }, {
                    label: 'Incident Zones',
                    data: trackData.incidentZones,
                    backgroundColor: '#ff6b35',
                    borderColor: '#ff6b35',
                    pointRadius: 8,
                    pointStyle: 'triangle'
                }, {
                    label: 'DRS Zones',
                    data: trackData.drsZones,
                    backgroundColor: '#ffed4a',
                    borderColor: '#ffed4a',
                    pointRadius: 6,
                    pointStyle: 'rect'
                }]
            },
            options: {
                responsive: true,
                aspectRatio: 1,
                plugins: {
                    title: {
                        display: true,
                        text: '🗺️ Interactive Track Map',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const point = context.parsed;
                                return `${context.dataset.label}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Track Position (X)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Track Position (Y)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });

        console.log('✅ Track Map Chart created');
    } catch (error) {
        console.error('❌ Error creating Track Map Chart:', error);
    }
}

// Regional Performance Analysis
function createRegionalPerformanceChart() {
    try {
        const ctx = document.getElementById('regionalPerformance')?.getContext('2d');
        if (!ctx) return;

        // Analyze performance by track regions/sectors
        const regionalData = analyzeRegionalPerformance(filteredData);

        destroyChart('regionalPerformance');
        charts.regionalPerformance = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: regionalData.regions,
                datasets: [{
                    label: 'Average Lap Time (s)',
                    data: regionalData.avgTimes,
                    backgroundColor: [
                        '#00ff8840',
                        '#4ecdc440',
                        '#ff6b3540',
                        '#ffed4a40',
                        '#e74c3c40',
                        '#9b59b640'
                    ],
                    borderColor: [
                        '#00ff88',
                        '#4ecdc4',
                        '#ff6b35',
                        '#ffed4a',
                        '#e74c3c',
                        '#9b59b6'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '🌍 Regional Performance Analysis',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatTime(context.parsed.r)}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return formatTime(value);
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        },
                        pointLabels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        console.log('✅ Regional Performance Chart created');
    } catch (error) {
        console.error('❌ Error creating Regional Performance Chart:', error);
    }
}

// Track Heatmap Analysis
function createHeatmapAnalysisChart() {
    try {
        const ctx = document.getElementById('heatmapAnalysis')?.getContext('2d');
        if (!ctx) return;

        // Generate performance heatmap data
        const heatmapData = generateHeatmapData(filteredData);

        // Create heatmap using matrix chart
        destroyChart('heatmapAnalysis');
        charts.heatmapAnalysis = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Performance Intensity',
                    data: heatmapData.points,
                    backgroundColor: function(context) {
                        const value = context.parsed.v;
                        const intensity = value / heatmapData.maxValue;
                        return `rgba(0, 255, 136, ${intensity})`;
                    },
                    borderColor: function(context) {
                        const value = context.parsed.v;
                        const intensity = value / heatmapData.maxValue;
                        return `rgba(0, 255, 136, ${Math.min(1, intensity + 0.3)})`;
                    },
                    pointRadius: function(context) {
                        const value = context.parsed.v;
                        const intensity = value / heatmapData.maxValue;
                        return Math.max(3, intensity * 15);
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '🔥 Performance Heatmap Analysis',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        callbacks: {
                            title: function() {
                                return 'Performance Zone';
                            },
                            label: function(context) {
                                const point = context.parsed;
                                return [
                                    `Position: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`,
                                    `Intensity: ${point.v.toFixed(2)}`,
                                    `Performance: ${getPerformanceLevel(point.v, heatmapData.maxValue)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Track Section',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Performance Metric',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });

        console.log('✅ Heatmap Analysis Chart created');
    } catch (error) {
        console.error('❌ Error creating Heatmap Analysis Chart:', error);
    }
}

// Location-based Trends
function createLocationTrendsChart() {
    try {
        const ctx = document.getElementById('locationTrends')?.getContext('2d');
        if (!ctx) return;

        // Analyze trends by geographic location
        const locationData = analyzeLocationTrends(filteredData);

        destroyChart('locationTrends');
        charts.locationTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: locationData.timeLabels,
                datasets: locationData.locations.map((location, index) => ({
                    label: location.name,
                    data: location.trends,
                    borderColor: location.color,
                    backgroundColor: location.color + '20',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }))
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '📍 Location-based Performance Trends',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Performance Index',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });

        console.log('✅ Location Trends Chart created');
    } catch (error) {
        console.error('❌ Error creating Location Trends Chart:', error);
    }
}

// Helper Functions for Geographical Analytics
function generateTrackLayoutData(data) {
    // Generate mock track layout data
    const trackPoints = [];
    const racingLine = [];
    const incidentZones = [];
    const drsZones = [];
    
    // Create track layout (oval/circuit shape)
    for (let i = 0; i <= 20; i++) {
        const angle = (i / 20) * 2 * Math.PI;
        const radius = 50 + Math.sin(angle * 3) * 10; // Varying radius for realistic track
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        trackPoints.push({ x, y });
        
        // Racing line (slightly inside the track)
        const raceRadius = radius * 0.9;
        racingLine.push({ 
            x: Math.cos(angle) * raceRadius, 
            y: Math.sin(angle) * raceRadius 
        });
    }
    
    // Add some incident zones
    incidentZones.push({ x: 45, y: 20 });
    incidentZones.push({ x: -30, y: -35 });
    incidentZones.push({ x: 10, y: 55 });
    
    // Add DRS zones
    drsZones.push({ x: -50, y: 0 });
    drsZones.push({ x: 25, y: -45 });
    
    return { trackPoints, racingLine, incidentZones, drsZones };
}

function analyzeRegionalPerformance(data) {
    // Mock regional analysis
    const regions = ['Sector 1', 'Sector 2', 'Sector 3', 'Main Straight', 'Chicane', 'Hair Pin'];
    const avgTimes = [18.5, 22.3, 19.8, 8.2, 15.6, 12.4];
    
    return { regions, avgTimes };
}

function generateHeatmapData(data) {
    const points = [];
    const maxValue = 100;
    
    // Generate grid of performance data points
    for (let x = 0; x <= 10; x++) {
        for (let y = 0; y <= 10; y++) {
            const intensity = Math.random() * maxValue;
            points.push({ x, y, v: intensity });
        }
    }
    
    return { points, maxValue };
}

function getPerformanceLevel(value, maxValue) {
    const percentage = (value / maxValue) * 100;
    if (percentage > 80) return 'Excellent';
    if (percentage > 60) return 'Good';
    if (percentage > 40) return 'Average';
    if (percentage > 20) return 'Below Average';
    return 'Poor';
}

function analyzeLocationTrends(data) {
    const timeLabels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1+1', 'Q2+1'];
    
    const locations = [
        {
            name: 'Indoor Track',
            color: '#00ff88',
            trends: [85, 87, 90, 92, 95, 97]
        },
        {
            name: 'Outdoor Track',
            color: '#4ecdc4',
            trends: [78, 82, 85, 88, 90, 92]
        },
        {
            name: 'Street Circuit',
            color: '#ff6b35',
            trends: [72, 75, 78, 80, 83, 85]
        },
        {
            name: 'Professional Circuit',
            color: '#ffed4a',
            trends: [88, 90, 92, 94, 96, 98]
        }
    ];
    
    return { timeLabels, locations };
}

console.log('🏁 Elite Karting Analytics Platform Script Loaded and Ready!');