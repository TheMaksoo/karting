// ========== ELITE KARTING ANALYTICS PLATFORM ==========
// Complete JavaScript implementation with 40+ charts and advanced analytics

// ========== GLOBAL VARIABLES & STATE ==========
let kartingData = [];
let filteredData = [];
let charts = {};
let currentTheme = 'dark';
let loadingTimeout;
// Timers used to coordinate loading screen hide/fade to prevent flicker
let loadingFadeTimeout = null;
let loadingHideTimeout = null;
// Once the initial load completes and the overlay has been hidden, prevent accidental re-shows
let initialLoadComplete = false;

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
// Note: Main DOMContentLoaded listener is at the bottom of the file to ensure proper initialization order

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
    // Only enhance selects explicitly opted-in via the 'enhanced' class.
    // This avoids duplicating UI for primary driver/track selects which should remain native for accessibility.
    const selects = Array.from(document.querySelectorAll('.filter-select.enhanced'));
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
    
    // Initialize all chart sections (if modules are loaded)
    // Charts will be initialized after lazy loading completes
    if (typeof initializeDriverPerformanceCharts === 'function') {
        console.log('📊 Chart modules already loaded, initializing now...');
        initializeAllCharts();
    } else {
        console.log('⏳ Waiting for chart modules to load via lazy loading...');
    }
    
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
        
        // Calculate total distance and average speed
        const totalDistanceMeters = driverData.reduce((sum, row) => {
            const distance = parseFloat(row.TrackDistance);
            return sum + (isNaN(distance) ? 0 : distance);
        }, 0);
        const totalDistanceKm = totalDistanceMeters / 1000;
        const distanceDisplay = totalDistanceKm >= 1 
            ? `${totalDistanceKm.toFixed(1)} km` 
            : `${totalDistanceMeters.toFixed(0)} m`;
        
        console.log('Driver distance calc:', { totalDistanceMeters, driverDataLength: driverData.length, sampleDistance: driverData[0]?.TrackDistance });
        
        // Calculate average speed from all laps
        const avgSpeedValues = driverData
            .map(row => {
                const speed = parseFloat(row.AvgSpeed);
                return speed;
            })
            .filter(speed => !isNaN(speed) && speed > 0);
        const overallAvgSpeed = avgSpeedValues.length > 0
            ? avgSpeedValues.reduce((sum, speed) => sum + speed, 0) / avgSpeedValues.length
            : 0;
        
        console.log('Driver speed calc:', { avgSpeedValues: avgSpeedValues.slice(0, 5), overallAvgSpeed, count: avgSpeedValues.length });
        
        // Calculate total corners
        const totalCorners = driverData.reduce((sum, row) => {
            const corners = parseFloat(row.Corners);
            return sum + (isNaN(corners) ? 0 : corners);
        }, 0);
        
        console.log('Driver corners calc:', { totalCorners, sampleCorners: driverData[0]?.Corners });
        
        // Calculate average of fastest laps per heat
        const heatFastestLaps = heatKeys.map(heatKey => {
            const heatLaps = heats[heatKey];
            const lapTimes = heatLaps.map(row => parseFloat(row.LapTime)).filter(time => time > 0 && !isNaN(time));
            return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
        }).filter(time => time > 0);
        
        const avgFastestLap = heatFastestLaps.length > 0 
            ? heatFastestLaps.reduce((sum, time) => sum + time, 0) / heatFastestLaps.length
            : 0;
        
        // Calculate consistency (standard deviation of lap times)
        const allLapTimes = driverData
            .map(row => parseFloat(row.LapTime))
            .filter(time => time > 0 && !isNaN(time));
        let consistency = 0;
        if (allLapTimes.length > 1) {
            const mean = allLapTimes.reduce((sum, time) => sum + time, 0) / allLapTimes.length;
            const variance = allLapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / allLapTimes.length;
            consistency = Math.sqrt(variance);
        }
        
        // Calculate cost per km
        const costPerKm = totalDistanceKm > 0 ? (totalCost / totalDistanceKm) : 0;
        
        // Calculate cost per session
        const costPerSession = totalHeats > 0 ? (totalCost / totalHeats) : 0;
        
        // Calculate win rate
        const winRate = totalHeats > 0 ? (heatsWon / totalHeats) * 100 : 0;
        
        // Calculate CO2 emissions
        // Experience Factory Antwerp = E-karts (50g CO2/km), others = Gas karts (150g CO2/km)
        let totalCO2kg = 0;
        driverData.forEach(row => {
            const distanceKm = (parseFloat(row.TrackDistance) || 0) / 1000;
            const isEKart = row.Track === "Experience Factory Antwerp";
            const co2PerKm = isEKart ? 0.05 : 0.15; // kg CO2 per km
            totalCO2kg += distanceKm * co2PerKm;
        });
        
        // Calculate trees needed (1 tree absorbs ~21kg CO2/year)
        const treesNeeded = totalCO2kg / 21;
        
        // Data points calculation
        const dataColumnsCount = 30;
        const driverDataPoints = totalLapsForDriver * dataColumnsCount;
        
        // Update KPI tiles with driver metrics
        updateElement('totalLaps', totalLapsForDriver.toLocaleString());
        updateElement('avgLapOverall', `${overallAvgLapTime.toFixed(2)}s`);
        updateElement('fastestLap', `${avgFastestLap.toFixed(2)}s`);
        updateElement('consistency', `±${consistency.toFixed(2)}s`);
        updateElement('totalHeats', totalHeats);
        updateElement('totalDistance', distanceDisplay);
        updateElement('avgSpeed', `${overallAvgSpeed.toFixed(1)}`);
        updateElement('totalCorners', totalCorners.toLocaleString());
        updateElement('sessionsWon', heatsWon);
        updateElement('winRate', `${winRate.toFixed(1)}%`);
        updateElement('avgLapsPerSession', avgLapsPerHeat.toFixed(1));
        updateElement('totalTracks', uniqueTracks);
        updateElement('totalCost', `€${totalCost.toFixed(2)}`);
        updateElement('costPerLap', `€${avgCostPerLap.toFixed(2)}`);
        updateElement('costPerKm', `€${costPerKm.toFixed(2)}`);
        updateElement('costPerSession', `€${costPerSession.toFixed(2)}`);
        updateElement('totalEntries', totalLapsForDriver.toLocaleString());
        updateElement('dataPoints', driverDataPoints.toLocaleString());
        updateElement('co2Emissions', totalCO2kg >= 1 ? `${totalCO2kg.toFixed(1)} kg` : `${(totalCO2kg * 1000).toFixed(0)} g`);
        updateElement('treesOffset', treesNeeded >= 1 ? `${treesNeeded.toFixed(1)}` : `<1`);
        
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
        
        // Calculate total distance and average speed (global)
        const totalDistanceMeters = filteredData.reduce((sum, row) => {
            const distance = parseFloat(row.TrackDistance);
            return sum + (isNaN(distance) ? 0 : distance);
        }, 0);
        const totalDistanceKm = totalDistanceMeters / 1000;
        const distanceDisplay = totalDistanceKm >= 1 
            ? `${totalDistanceKm.toFixed(1)} km` 
            : `${totalDistanceMeters.toFixed(0)} m`;
        
        console.log('Global distance calc:', { totalDistanceMeters, filteredDataLength: filteredData.length, sampleDistance: filteredData[0]?.TrackDistance });
        
        // Calculate average speed from all laps (global)
        const avgSpeedValues = filteredData
            .map(row => {
                const speed = parseFloat(row.AvgSpeed);
                return speed;
            })
            .filter(speed => !isNaN(speed) && speed > 0);
        const overallAvgSpeed = avgSpeedValues.length > 0
            ? avgSpeedValues.reduce((sum, speed) => sum + speed, 0) / avgSpeedValues.length
            : 0;
        
        console.log('Global speed calc:', { avgSpeedValues: avgSpeedValues.slice(0, 5), overallAvgSpeed, count: avgSpeedValues.length });
        
        // Calculate total corners (global)
        const totalCorners = filteredData.reduce((sum, row) => {
            const corners = parseFloat(row.Corners);
            return sum + (isNaN(corners) ? 0 : corners);
        }, 0);
        
        console.log('Global corners calc:', { totalCorners, sampleCorners: filteredData[0]?.Corners });
        
        // Calculate average of fastest laps per heat (global)
        const heatFastestLaps = Object.keys(globalHeats).map(heatKey => {
            const heatLaps = globalHeats[heatKey];
            const lapTimes = heatLaps.map(row => parseFloat(row.LapTime)).filter(time => time > 0 && !isNaN(time));
            return lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
        }).filter(time => time > 0);
        
        const avgFastestLap = heatFastestLaps.length > 0 
            ? heatFastestLaps.reduce((sum, time) => sum + time, 0) / heatFastestLaps.length
            : 0;
        
        // Calculate average cost per lap (global)
        const avgCostPerLap = filteredData.length > 0 ? (stats.totalCost / filteredData.length) : 0;
        
        // Calculate consistency across all drivers (global)
        const allLapTimes = filteredData
            .map(row => parseFloat(row.LapTime))
            .filter(time => time > 0 && !isNaN(time));
        let consistency = 0;
        if (allLapTimes.length > 1) {
            const mean = allLapTimes.reduce((sum, time) => sum + time, 0) / allLapTimes.length;
            const variance = allLapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / allLapTimes.length;
            consistency = Math.sqrt(variance);
        }
        
        // Calculate cost per km (global)
        const costPerKm = totalDistanceKm > 0 ? (stats.totalCost / totalDistanceKm) : 0;
        
        // Calculate cost per session (global)
        const totalHeatCount = Object.keys(globalHeats).length;
        const costPerSession = totalHeatCount > 0 ? (stats.totalCost / totalHeatCount) : 0;
        
        // Calculate average laps per session (global)
        const avgLapsPerSession = totalHeatCount > 0 ? (filteredData.length / totalHeatCount) : 0;
        
        // Calculate win rate (global - average across all drivers)
        const winRate = totalHeatCount > 0 ? (totalHeatsWonAllDrivers / totalHeatCount) * 100 : 0;
        
        // Calculate CO2 emissions (global)
        let totalCO2kg = 0;
        filteredData.forEach(row => {
            const distanceKm = (parseFloat(row.TrackDistance) || 0) / 1000;
            const isEKart = row.Track === "Experience Factory Antwerp";
            const co2PerKm = isEKart ? 0.05 : 0.15; // kg CO2 per km
            totalCO2kg += distanceKm * co2PerKm;
        });
        
        // Calculate trees needed (1 tree absorbs ~21kg CO2/year)
        const treesNeeded = totalCO2kg / 21;
        
        // Data points calculation
        const dataColumnsCount = 30;
        const globalDataPoints = filteredData.length * dataColumnsCount;
        
        // Update KPI tiles with global metrics
        updateElement('totalLaps', filteredData.length.toLocaleString());
        updateElement('avgLapOverall', `${stats.avgLapTime.toFixed(2)}s`);
        updateElement('fastestLap', `${avgFastestLap.toFixed(2)}s`);
        updateElement('consistency', `±${consistency.toFixed(2)}s`);
        updateElement('totalHeats', totalHeatCount);
        updateElement('totalDistance', distanceDisplay);
        updateElement('avgSpeed', `${overallAvgSpeed.toFixed(1)}`);
        updateElement('totalCorners', totalCorners.toLocaleString());
        updateElement('sessionsWon', totalHeatsWonAllDrivers);
        updateElement('winRate', `${winRate.toFixed(1)}%`);
        updateElement('avgLapsPerSession', avgLapsPerSession.toFixed(1));
        updateElement('totalTracks', uniqueTracks);
        updateElement('totalCost', `€${stats.totalCost.toFixed(2)}`);
        updateElement('costPerLap', `€${avgCostPerLap.toFixed(2)}`);
        updateElement('costPerKm', `€${costPerKm.toFixed(2)}`);
        updateElement('costPerSession', `€${costPerSession.toFixed(2)}`);
        updateElement('totalEntries', filteredData.length.toLocaleString());
        updateElement('dataPoints', globalDataPoints.toLocaleString());
        updateElement('co2Emissions', totalCO2kg >= 1 ? `${totalCO2kg.toFixed(1)} kg` : `${(totalCO2kg * 1000).toFixed(0)} g`);
        updateElement('treesOffset', treesNeeded >= 1 ? `${treesNeeded.toFixed(1)}` : `<1`);
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Section toggle functionality
function toggleSection(headerElement) {
    const section = headerElement.closest('.section');
    if (section) {
        const wasCollapsed = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');
        
        // If expanding a section, trigger AOS animation refresh
        if (wasCollapsed && typeof AOS !== 'undefined') {
            setTimeout(() => AOS.refresh(), 100);
        }
        
        // Save state to localStorage
        const sectionClass = section.className.split(' ').find(c => c.includes('-section'));
        if (sectionClass) {
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem(`section-${sectionClass}`, isCollapsed ? 'collapsed' : 'expanded');
        }
    }
}

// Placeholder function for Leaderboards section
function initializeLeaderboardsSection() {
    console.log('🏆 Leaderboards section - placeholder (to be implemented)');
    const leaderboardContainer = document.querySelector('.leaderboards-section .section-content');
    if (leaderboardContainer && filteredData.length > 0) {
        // Calculate top drivers by best lap time
        const driverStats = {};
        filteredData.forEach(row => {
            const driver = row.Driver;
            const lapTime = parseFloat(row.LapTime);
            if (!driverStats[driver]) {
                driverStats[driver] = { bestLap: Infinity, totalLaps: 0 };
            }
            if (lapTime > 0 && lapTime < driverStats[driver].bestLap) {
                driverStats[driver].bestLap = lapTime;
            }
            driverStats[driver].totalLaps++;
        });
        
        const topDrivers = Object.entries(driverStats)
            .sort((a, b) => a[1].bestLap - b[1].bestLap)
            .slice(0, 10);
        
        let html = '<div style="padding: 1rem;"><h3>Top 10 Drivers (Best Lap Time)</h3><ul style="list-style: none; padding: 0;">';
        topDrivers.forEach(([driver, stats], index) => {
            html += `<li style="padding: 0.5rem; margin: 0.25rem 0; background: rgba(255,107,53,0.05); border-radius: 8px;">
                <span style="font-weight: bold;">${index + 1}. ${driver}</span> - ${stats.bestLap.toFixed(2)}s (${stats.totalLaps} laps)
            </li>`;
        });
        html += '</ul></div>';
        leaderboardContainer.innerHTML = html;
    }
}

// Placeholder function for Data Table section
function initializeDataTableSection() {
    console.log('📊 Data Table section - placeholder (to be implemented)');
    const tableContainer = document.querySelector('.data-table-section .section-content');
    if (tableContainer && filteredData.length > 0) {
        let html = '<div style="padding: 1rem; overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">';
        html += '<thead><tr style="background: rgba(255,107,53,0.1);">';
        html += '<th style="padding: 0.5rem; text-align: left; border: 1px solid rgba(255,107,53,0.2);">Date</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border: 1px solid rgba(255,107,53,0.2);">Driver</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border: 1px solid rgba(255,107,53,0.2);">Track</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border: 1px solid rgba(255,107,53,0.2);">Lap Time</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border: 1px solid rgba(255,107,53,0.2);">Position</th>';
        html += '</tr></thead><tbody>';
        
        filteredData.slice(0, 50).forEach(row => {
            html += '<tr style="border-bottom: 1px solid rgba(255,107,53,0.1);">';
            html += `<td style="padding: 0.5rem;">${row.Date}</td>`;
            html += `<td style="padding: 0.5rem;">${row.Driver}</td>`;
            html += `<td style="padding: 0.5rem;">${row.Track}</td>`;
            html += `<td style="padding: 0.5rem;">${parseFloat(row.LapTime).toFixed(2)}s</td>`;
            html += `<td style="padding: 0.5rem;">${row.Position}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        if (filteredData.length > 50) {
            html += `<p style="margin-top: 1rem; color: var(--text-secondary);">Showing first 50 of ${filteredData.length} entries</p>`;
        }
        html += '</div>';
        tableContainer.innerHTML = html;
    }
}

// Initialize all chart modules
window.initializeAllCharts = function() {
    console.log('🚀 Initializing all chart modules...');
    
    try {
        if (typeof initializeDriverPerformanceCharts === 'function') {
            initializeDriverPerformanceCharts();
            console.log('✅ Driver Performance Charts initialized');
        }
        
        if (typeof initializeLapSessionCharts === 'function') {
            initializeLapSessionCharts();
            console.log('✅ Lap Session Charts initialized');
        }
        
        if (typeof initializeTrackInsightsCharts === 'function') {
            initializeTrackInsightsCharts();
            console.log('✅ Track Insights Charts initialized');
        }
        
        if (typeof initializeDriverBattleCharts === 'function') {
            initializeDriverBattleCharts();
            console.log('✅ Driver Battle Charts initialized');
        }
        
        if (typeof initializeFinancialCharts === 'function') {
            initializeFinancialCharts();
            console.log('✅ Financial Charts initialized');
        }
        
        if (typeof initializeTemporalCharts === 'function') {
            initializeTemporalCharts();
            console.log('✅ Temporal Charts initialized');
        }
        
        if (typeof initializePredictiveCharts === 'function') {
            initializePredictiveCharts();
            console.log('✅ Predictive Charts initialized');
        }
        
        if (typeof initializeGeographicalCharts === 'function') {
            initializeGeographicalCharts();
            console.log('✅ Geographical Charts initialized');
        }
        
        // Initialize Session Widgets component (from charts-temporal.js)
        if (typeof initializeSessionWidgets === 'function') {
            initializeSessionWidgets();
            console.log('✅ Session Widgets initialized');
        } else {
            console.warn('⚠️ initializeSessionWidgets not found');
        }
        
        // Initialize Leaderboards section (placeholder)
        initializeLeaderboardsSection();
        
        // Initialize Data Table section (placeholder)
        initializeDataTableSection();
        
        console.log('✅ All chart modules initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing charts:', error);
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
            // If the initial load already completed and overlay was hidden, don't re-show automatically
            if (initialLoadComplete) return;
            // If a hide/fadeout is pending, cancel it so the overlay stays visible continuously
            if (loadingFadeTimeout) {
                clearTimeout(loadingFadeTimeout);
                loadingFadeTimeout = null;
            }
            if (loadingHideTimeout) {
                clearTimeout(loadingHideTimeout);
                loadingHideTimeout = null;
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
            loadingFadeTimeout = setTimeout(() => {
                loadingScreen.style.opacity = '0';
                // After fade completes, add the hidden class and reset opacity
                loadingHideTimeout = setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    loadingScreen.style.opacity = '1'; // Reset for next time
                    loadingFadeTimeout = null;
                    loadingHideTimeout = null;
                    // Mark that the initial load finished so accidental re-shows are ignored
                    initialLoadComplete = true;
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

// ========== CHART MODULES EXTRACTED TO /js DIRECTORY ==========
// All chart initialization functions have been moved to separate module files:
// - charts-driver.js: initializeDriverPerformanceCharts()
// - charts-session.js: initializeLapSessionCharts()
// - charts-track.js: initializeTrackInsightsCharts()
// - charts-battles.js: initializeDriverBattleCharts()
// - charts-financial.js: initializeFinancialCharts()
// - charts-temporal.js: initializeTemporalCharts()
// - charts-predictive.js: initializePredictiveCharts()
// - charts-geo.js: initializeGeographicalCharts()

// ========== SESSION & UI WIDGETS ==========

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
    
    // Initialize UI components first (before showing loading screen)
    initializeTheme();
    initializeEventListeners();
    initializeAOS();
    initializeDateTimeDisplay();
    
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

// ========== END OF SCRIPT.JS ==========
// All chart implementations have been moved to /js/charts-*.js modules
console.log('🏁 Elite Karting Analytics Platform Script Loaded and Ready!');
