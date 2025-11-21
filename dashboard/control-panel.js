// Control Panel Logic
let logs = [];
let systemData = {
    drivers: [],
    tracks: [],
    data: [],
    colorMap: {}
};

// ========== NAVIGATION ==========
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');
    
    // Load page-specific data
    if (pageId === 'colors') loadColorSettings();
    if (pageId === 'drivers') loadDriverManagement();
    if (pageId === 'tracks') loadTrackManagement();
    if (pageId === 'logs') updateLogDisplay();
}

// ========== LOGGING ==========
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    logs.push({ timestamp, message, type });
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function updateLogDisplay() {
    const container = document.getElementById('logContainer');
    if (!container) return;
    
    container.innerHTML = logs.slice(-100).reverse().map(l => 
        `<div class="log-entry">
            <span class="log-time">${l.timestamp}</span> 
            <span class="log-${l.type}">[${l.type.toUpperCase()}] ${l.message}</span>
        </div>`
    ).join('');
}

function clearLogs() {
    logs = [];
    updateLogDisplay();
    addAlert('Logs cleared', 'success');
}

function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karting-logs-${new Date().toISOString()}.json`;
    a.click();
    addAlert('Logs exported successfully', 'success');
}

// ========== ALERTS ==========
function addAlert(message, type = 'info', container = 'diagnosticAlerts') {
    const alertsDiv = document.getElementById(container);
    if (!alertsDiv) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${message}`;
    alertsDiv.appendChild(alert);
    
    log(message, type);
    
    setTimeout(() => alert.remove(), 5000);
}

// ========== STATUS INDICATORS ==========
function setStatus(id, status) {
    const el = document.getElementById(id);
    if (el) el.className = `status-indicator status-${status}`;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ========== DIAGNOSTICS ==========
function checkCoreSystem() {
    log('Checking core system...', 'info');
    
    const coreLoaded = typeof window.CHART_COLORS !== 'undefined';
    setValue('coreLoaded', coreLoaded ? '✅ Yes' : '❌ No');
    setValue('chartColorsCount', window.CHART_COLORS?.length || '0');
    setValue('getDriverColorFunc', typeof window.getDriverColor);
    setValue('colorMapSize', Object.keys(window.driverColorMap || {}).length);
    
    setStatus('statusCore', coreLoaded ? 'pass' : 'fail');
    
    if (!coreLoaded) {
        log('ERROR: Core system not loaded!', 'error');
        addAlert('Core system failed to load. Check if core.js is accessible.', 'error');
        return false;
    } else {
        log(`Core system OK. ${window.CHART_COLORS.length} colors available.`, 'success');
        return true;
    }
}

async function checkDataSystem() {
    log('Checking data system...', 'info');
    
    try {
        const response = await fetch('Karten.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(l => l.trim());
        
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((h, i) => row[h.trim()] = values[i]?.trim());
            return row;
        });
        
        const drivers = [...new Set(data.map(r => r.Driver))].filter(Boolean);
        const tracks = [...new Set(data.map(r => r.Track))].filter(Boolean);
        
        systemData.data = data;
        systemData.drivers = drivers;
        systemData.tracks = tracks;
        
        setValue('csvLoaded', '✅ Yes');
        setValue('totalRecords', data.length.toLocaleString());
        setValue('uniqueDrivers', drivers.length);
        setValue('uniqueTracks', tracks.length);
        setStatus('statusData', 'pass');
        
        log(`Data loaded: ${data.length} records, ${drivers.length} drivers, ${tracks.length} tracks`, 'success');
        
        return true;
    } catch (error) {
        setValue('csvLoaded', '❌ Failed');
        setStatus('statusData', 'fail');
        log(`ERROR loading data: ${error.message}`, 'error');
        addAlert(`Failed to load CSV data: ${error.message}`, 'error');
        return false;
    }
}

function checkChartSystem() {
    log('Checking chart system...', 'info');
    
    const chartjsLoaded = typeof Chart !== 'undefined';
    setValue('chartjsLoaded', chartjsLoaded ? '✅ Yes' : '❌ No');
    setValue('chartModulesLoaded', typeof window.initializeDriverPerformanceCharts !== 'undefined' ? '✅ Yes' : '⏳ Not loaded');
    setValue('activeCharts', Object.keys(window.charts || {}).length);
    
    setStatus('statusCharts', chartjsLoaded ? 'pass' : 'fail');
    
    if (!chartjsLoaded) {
        log('ERROR: Chart.js not loaded!', 'error');
        addAlert('Chart.js failed to load from CDN. Check internet connection.', 'error');
        return false;
    } else {
        log('Chart.js loaded successfully', 'success');
        return true;
    }
}

async function runDiagnostics() {
    log('=== Starting diagnostics ===', 'info');
    document.getElementById('diagnosticAlerts').innerHTML = '';
    
    const coreOK = checkCoreSystem();
    const dataOK = await checkDataSystem();
    const chartsOK = checkChartSystem();
    
    if (coreOK && dataOK && chartsOK) {
        addAlert('All systems operational ✅', 'success');
    } else {
        addAlert('Some systems have errors. Check details above.', 'error');
    }
    
    log('=== Diagnostics complete ===', 'info');
}

// ========== COLOR MANAGEMENT ==========
function loadColorSettings() {
    log('Loading color settings...', 'info');
    
    // Display main color palette with edit capability
    displayMainColorPalette();
    
    // Display current driver colors
    const container = document.getElementById('driverColorsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (systemData.drivers.length === 0) {
        container.innerHTML = '<p style="color: #8b949e;">No drivers loaded. Run diagnostics first.</p>';
        return;
    }
    
    systemData.drivers.forEach(driver => {
        const color = window.getDriverColor(driver);
        const swatch = document.createElement('span');
        swatch.className = 'color-swatch';
        swatch.style.background = color || '#000';
        swatch.style.color = '#fff';
        swatch.style.cursor = 'pointer';
        swatch.style.transition = 'transform 0.2s';
        swatch.textContent = driver;
        swatch.title = 'Click to edit color';
        swatch.onclick = () => selectDriverForColorChange(driver, color);
        swatch.onmouseenter = (e) => e.target.style.transform = 'scale(1.05)';
        swatch.onmouseleave = (e) => e.target.style.transform = 'scale(1)';
        container.appendChild(swatch);
    });
    
    // Populate driver dropdown
    const select = document.getElementById('driverColorSelect');
    if (select) {
        select.innerHTML = '<option value="">Choose a driver...</option>' + 
            systemData.drivers.map(d => `<option value="${d}">${d}</option>`).join('');
    }
    
    // Display available colors
    updateAvailableColors();
}

function displayMainColorPalette() {
    const palette = document.getElementById('mainColorPalette');
    if (!palette || !window.CHART_COLORS) return;
    
    palette.innerHTML = '';
    
    window.CHART_COLORS.forEach((color, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.textAlign = 'center';
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-picker-item';
        colorDiv.style.background = color;
        colorDiv.style.cursor = 'pointer';
        colorDiv.title = `Click to edit color ${index + 1}: ${color}`;
        colorDiv.onclick = () => editPaletteColor(index, color);
        
        const label = document.createElement('div');
        label.style.fontSize = '10px';
        label.style.color = '#8b949e';
        label.style.marginTop = '4px';
        label.textContent = color;
        
        wrapper.appendChild(colorDiv);
        wrapper.appendChild(label);
        palette.appendChild(wrapper);
    });
}

function editPaletteColor(index, currentColor) {
    const newColor = prompt(`Edit Color ${index + 1}\n\nEnter new hex color (e.g., #FF5733):`, currentColor);
    
    if (!newColor) return;
    
    // Validate hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexPattern.test(newColor)) {
        addAlert('Invalid color format! Use hex format like #FF5733', 'error', 'paletteAlerts');
        return;
    }
    
    // Update the color
    window.CHART_COLORS[index] = newColor;
    
    // Save to localStorage
    localStorage.setItem('CHART_COLORS', JSON.stringify(window.CHART_COLORS));
    
    addAlert(`Color ${index + 1} updated to ${newColor}`, 'success', 'paletteAlerts');
    log(`Updated palette color ${index} to ${newColor}`, 'success');
    
    // Refresh display
    displayMainColorPalette();
    updateAvailableColors();
}

function updateAvailableColors() {
    const picker = document.getElementById('customColorPicker');
    const select = document.getElementById('driverColorSelect');
    
    if (!picker || !window.CHART_COLORS) return;
    
    picker.innerHTML = '';
    
    // Get currently assigned colors
    const assignedColors = new Set(Object.values(window.driverColorMap || {}));
    
    // Get the selected driver's current color (so they can keep it)
    const selectedDriver = select?.value;
    const currentDriverColor = selectedDriver ? window.driverColorMap[selectedDriver] : null;
    
    // Filter out assigned colors (except current driver's color)
    const availableColors = window.CHART_COLORS.filter(color => 
        !assignedColors.has(color) || color === currentDriverColor
    );
    
    if (availableColors.length === 0) {
        picker.innerHTML = '<p style="color: #8b949e; grid-column: 1/-1;">All colors are assigned! Reset some driver colors to free them up.</p>';
        return;
    }
    
    availableColors.forEach((color, idx) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-picker-item';
        colorDiv.style.background = color;
        colorDiv.dataset.color = color;
        colorDiv.onclick = () => selectColor(color, idx);
        
        // Show if this is the current driver's color
        if (color === currentDriverColor) {
            colorDiv.style.border = '3px solid #58a6ff';
            colorDiv.title = 'Current color';
        }
        
        picker.appendChild(colorDiv);
    });
}

let selectedColor = null;

function selectColor(color, index) {
    selectedColor = color;
    document.querySelectorAll('.color-picker-item').forEach(el => {
        if (el.dataset.color) {
            el.classList.remove('selected');
            if (el.dataset.color === color) {
                el.classList.add('selected');
            }
        }
    });
    log(`Selected color: ${color}`, 'info');
}

function selectDriverForColorChange(driver, currentColor) {
    const select = document.getElementById('driverColorSelect');
    if (select) {
        select.value = driver;
        updateAvailableColors();
        
        // Auto-select current color
        selectedColor = currentColor;
        document.querySelectorAll('.color-picker-item').forEach(el => {
            if (el.dataset.color === currentColor) {
                el.classList.add('selected');
            }
        });
        
        // Scroll to color customization section
        document.querySelector('#colors .card:last-child').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function saveDriverColor() {
    const driver = document.getElementById('driverColorSelect')?.value;
    if (!driver) {
        addAlert('Please select a driver', 'warning', 'colorAlerts');
        return;
    }
    
    if (!selectedColor) {
        addAlert('Please select a color', 'warning', 'colorAlerts');
        return;
    }
    
    // Update the color map
    window.driverColorMap[driver] = selectedColor;
    
    // Save to localStorage
    localStorage.setItem('driverColorMap', JSON.stringify(window.driverColorMap));
    
    addAlert(`Color updated for ${driver}`, 'success', 'colorAlerts');
    log(`Updated ${driver} color to ${selectedColor}`, 'success');
    
    // Refresh display
    loadColorSettings();
}

function resetAllColors() {
    if (!confirm('Reset all driver colors to defaults?')) return;
    
    window.driverColorMap = {};
    window.driverColorIndex = 0;
    localStorage.removeItem('driverColorMap');
    
    addAlert('All colors reset to defaults', 'success', 'colorAlerts');
    log('Reset all driver colors', 'info');
    
    loadColorSettings();
}

function testColorSystem() {
    log('Testing color system...', 'info');
    
    if (!window.getDriverColor) {
        addAlert('getDriverColor function not found!', 'error');
        return;
    }
    
    const testDrivers = ['Test A', 'Test B', 'Test C'];
    let allPassed = true;
    
    testDrivers.forEach(driver => {
        const color = window.getDriverColor(driver);
        if (!color) {
            log(`FAIL: getDriverColor returned undefined for "${driver}"`, 'error');
            allPassed = false;
        } else {
            log(`PASS: "${driver}" = ${color}`, 'success');
        }
    });
    
    if (allPassed) {
        addAlert('Color system test PASSED ✅', 'success');
    } else {
        addAlert('Color system test FAILED ❌', 'error');
    }
}

function fixColors() {
    log('Attempting to fix colors...', 'info');
    
    // Reinitialize colors for all drivers
    if (systemData.drivers.length > 0) {
        window.driverColorMap = {};
        window.driverColorIndex = 0;
        
        systemData.drivers.forEach(driver => {
            window.getDriverColor(driver);
        });
        
        addAlert(`Reinitialized colors for ${systemData.drivers.length} drivers`, 'success');
        log(`Fixed colors for ${systemData.drivers.length} drivers`, 'success');
    } else {
        addAlert('No drivers found. Run diagnostics first.', 'warning');
    }
}

// ========== DRIVER MANAGEMENT ==========
let driverNicknames = {};

function loadDriverManagement() {
    log('Loading driver management...', 'info');
    
    // Load nicknames from localStorage
    const saved = localStorage.getItem('driverNicknames');
    if (saved) {
        try {
            driverNicknames = JSON.parse(saved);
        } catch (e) {
            driverNicknames = {};
        }
    }
    
    const container = document.getElementById('driverStats');
    if (!container) return;
    
    if (systemData.data.length === 0) {
        container.innerHTML = '<p style="color: #8b949e;">No data loaded. Run diagnostics first.</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>Driver</th><th>Nickname</th><th>Total Laps</th><th>Best Time</th><th>Avg Time</th><th>Tracks</th>' +
        '</tr></thead><tbody>';
    
    systemData.drivers.forEach(driver => {
        const driverData = systemData.data.filter(r => r.Driver === driver);
        const lapTimes = driverData.map(r => parseFloat(r.LapTime)).filter(t => t > 0);
        const tracks = [...new Set(driverData.map(r => r.Track))];
        
        const bestTime = lapTimes.length > 0 ? Math.min(...lapTimes).toFixed(3) : 'N/A';
        const avgTime = lapTimes.length > 0 ? (lapTimes.reduce((a,b) => a+b, 0) / lapTimes.length).toFixed(3) : 'N/A';
        
        const color = window.getDriverColor(driver);
        const nickname = driverNicknames[driver] || '-';
        
        html += `<tr>
            <td><span class="color-swatch" style="background: ${color}; padding: 4px 12px; font-size: 12px;">${driver}</span></td>
            <td style="color: #58a6ff;">${nickname}</td>
            <td>${driverData.length}</td>
            <td>${bestTime}s</td>
            <td>${avgTime}s</td>
            <td>${tracks.length}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Populate nickname selector
    populateNicknameSelector();
}

function populateNicknameSelector() {
    const select = document.getElementById('driverNicknameSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choose a driver...</option>' +
        systemData.drivers.map(d => `<option value="${d}">${d}</option>`).join('');
}

function loadDriverNickname() {
    const select = document.getElementById('driverNicknameSelect');
    const section = document.getElementById('nicknameSection');
    const originalName = document.getElementById('driverOriginalName');
    const nicknameInput = document.getElementById('driverNickname');
    
    if (!select || !section) return;
    
    const driver = select.value;
    
    if (driver === '') {
        section.style.display = 'none';
        return;
    }
    
    originalName.value = driver;
    nicknameInput.value = driverNicknames[driver] || '';
    section.style.display = 'block';
    
    log(`Loaded nickname settings for ${driver}`, 'info');
}

function saveDriverNickname() {
    const select = document.getElementById('driverNicknameSelect');
    const nicknameInput = document.getElementById('driverNickname');
    
    if (!select || !nicknameInput) return;
    
    const driver = select.value;
    const nickname = nicknameInput.value.trim();
    
    if (!driver) {
        addAlert('Please select a driver', 'warning', 'nicknameAlerts');
        return;
    }
    
    if (!nickname) {
        addAlert('Please enter a nickname', 'warning', 'nicknameAlerts');
        return;
    }
    
    // Save nickname
    driverNicknames[driver] = nickname;
    localStorage.setItem('driverNicknames', JSON.stringify(driverNicknames));
    
    addAlert(`Nickname "${nickname}" saved for ${driver}`, 'success', 'nicknameAlerts');
    log(`Set nickname for ${driver}: ${nickname}`, 'success');
    
    // Refresh stats table
    loadDriverManagement();
}

function clearDriverNickname() {
    const select = document.getElementById('driverNicknameSelect');
    const nicknameInput = document.getElementById('driverNickname');
    
    if (!select) return;
    
    const driver = select.value;
    
    if (!driver) {
        addAlert('Please select a driver', 'warning', 'nicknameAlerts');
        return;
    }
    
    if (!confirm(`Clear nickname for ${driver}?`)) return;
    
    // Remove nickname
    delete driverNicknames[driver];
    localStorage.setItem('driverNicknames', JSON.stringify(driverNicknames));
    
    nicknameInput.value = '';
    
    addAlert(`Nickname cleared for ${driver}`, 'info', 'nicknameAlerts');
    log(`Cleared nickname for ${driver}`, 'info');
    
    // Refresh stats table
    loadDriverManagement();
}

// ========== TRACK MANAGEMENT ==========
let tracksConfig = null;
let currentTrackConfig = null;
let currentTrackIndex = null;

async function loadTrackManagement() {
    log('Loading track management...', 'info');
    
    const container = document.getElementById('trackStats');
    if (!container) return;
    
    if (systemData.data.length === 0) {
        container.innerHTML = '<p style="color: #8b949e;">No data loaded. Run diagnostics first.</p>';
        return;
    }
    
    // Load tracks.json for configuration
    await loadTracksJson();
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>Track</th><th>Total Laps</th><th>Drivers</th><th>Best Time</th><th>Avg Time</th>' +
        '</tr></thead><tbody>';
    
    systemData.tracks.forEach(track => {
        const trackData = systemData.data.filter(r => r.Track === track);
        const lapTimes = trackData.map(r => parseFloat(r.LapTime)).filter(t => t > 0);
        const drivers = [...new Set(trackData.map(r => r.Driver))];
        
        const bestTime = lapTimes.length > 0 ? Math.min(...lapTimes).toFixed(3) : 'N/A';
        const avgTime = lapTimes.length > 0 ? (lapTimes.reduce((a,b) => a+b, 0) / lapTimes.length).toFixed(3) : 'N/A';
        
        html += `<tr>
            <td><strong>${track}</strong></td>
            <td>${trackData.length}</td>
            <td>${drivers.length}</td>
            <td>${bestTime}s</td>
            <td>${avgTime}s</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Populate track selector
    populateTrackSelector();
}

async function loadTracksJson() {
    try {
        // First check if there are local edits in localStorage
        const localEdits = localStorage.getItem('trackEdits');
        if (localEdits) {
            try {
                const edits = JSON.parse(localEdits);
                log(`Loaded ${Object.keys(edits).length} track edits from localStorage`, 'info');
                
                // Load original tracks.json
                const response = await fetch('../tracks.json');
                tracksConfig = await response.json();
                
                // Apply local edits
                if (tracksConfig.tracks) {
                    tracksConfig.tracks.forEach((track, index) => {
                        if (edits[track.trackId]) {
                            tracksConfig.tracks[index] = edits[track.trackId];
                        }
                    });
                }
                
                log('Applied local track edits', 'success');
            } catch (e) {
                log(`Error loading local edits: ${e.message}`, 'warn');
                // Fall through to load original tracks.json
            }
        }
        
        // Load tracks.json if not already loaded
        if (!tracksConfig) {
            const response = await fetch('../tracks.json');
            tracksConfig = await response.json();
        }
        
        log('Loaded tracks.json configuration', 'success');
    } catch (error) {
        log(`Failed to load tracks.json: ${error.message}`, 'error');
        tracksConfig = { tracks: [] };
    }
}

function populateTrackSelector() {
    const select = document.getElementById('trackSelect');
    if (!select || !tracksConfig) return;
    
    select.innerHTML = '<option value="">Choose a track...</option>';
    
    if (tracksConfig.tracks) {
        tracksConfig.tracks.forEach((track, index) => {
            select.innerHTML += `<option value="${index}">${track.name}</option>`;
        });
    }
}

function loadTrackConfig() {
    const select = document.getElementById('trackSelect');
    const section = document.getElementById('trackConfigSection');
    
    if (!select || !section) return;
    
    const trackIndex = select.value;
    
    if (trackIndex === '') {
        section.style.display = 'none';
        return;
    }
    
    currentTrackIndex = parseInt(trackIndex);
    currentTrackConfig = JSON.parse(JSON.stringify(tracksConfig.tracks[currentTrackIndex])); // Deep copy
    
    // Populate form fields
    document.getElementById('trackId').value = currentTrackConfig.trackId || '';
    document.getElementById('trackName').value = currentTrackConfig.name || '';
    
    // Location
    document.getElementById('trackCity').value = currentTrackConfig.location?.city || '';
    document.getElementById('trackCountry').value = currentTrackConfig.location?.country || '';
    document.getElementById('trackRegion').value = currentTrackConfig.location?.region || '';
    
    // Specifications
    document.getElementById('trackDistance').value = currentTrackConfig.specifications?.distance || '';
    document.getElementById('trackCorners').value = currentTrackConfig.specifications?.corners || '';
    document.getElementById('trackWidth').value = currentTrackConfig.specifications?.width || '';
    document.getElementById('trackIndoor').value = currentTrackConfig.specifications?.indoor ? 'true' : 'false';
    
    // Pricing
    document.getElementById('trackPricingSession').value = currentTrackConfig.pricing?.session || '';
    document.getElementById('trackPricingChallenge').value = currentTrackConfig.pricing?.challenge || '';
    
    // Contact
    document.getElementById('trackWebsite').value = currentTrackConfig.website || '';
    document.getElementById('trackPhone').value = currentTrackConfig.contact?.phone || '';
    document.getElementById('trackEmail').value = currentTrackConfig.contact?.email || '';
    
    // Features (array to comma-separated string)
    document.getElementById('trackFeatures').value = (currentTrackConfig.features || []).join(', ');
    
    // Karts (array to comma-separated string)
    document.getElementById('trackKarts').value = (currentTrackConfig.karts || []).join(', ');
    
    section.style.display = 'block';
    closeJsonView();
    
    log(`Loaded configuration for ${currentTrackConfig.name}`, 'info');
}

function saveTrackConfig() {
    if (currentTrackIndex === null) return;
    
    try {
        // Build updated config from form fields
        const updatedConfig = {
            trackId: document.getElementById('trackId').value,
            name: document.getElementById('trackName').value,
            location: {
                city: document.getElementById('trackCity').value,
                country: document.getElementById('trackCountry').value,
                region: document.getElementById('trackRegion').value
            },
            specifications: {
                distance: parseInt(document.getElementById('trackDistance').value) || 0,
                corners: parseInt(document.getElementById('trackCorners').value) || 0,
                indoor: document.getElementById('trackIndoor').value === 'true'
            },
            pricing: {
                session: parseFloat(document.getElementById('trackPricingSession').value) || 0
            },
            contact: {
                phone: document.getElementById('trackPhone').value,
                email: document.getElementById('trackEmail').value
            },
            website: document.getElementById('trackWebsite').value,
            features: document.getElementById('trackFeatures').value
                .split(',')
                .map(f => f.trim())
                .filter(f => f),
            karts: document.getElementById('trackKarts').value
                .split(',')
                .map(k => k.trim())
                .filter(k => k)
        };
        
        // Add optional fields
        const width = parseInt(document.getElementById('trackWidth').value);
        if (width) updatedConfig.specifications.width = width;
        
        const challenge = parseFloat(document.getElementById('trackPricingChallenge').value);
        if (challenge) updatedConfig.pricing.challenge = challenge;
        
        // Validate required fields
        if (!updatedConfig.name || !updatedConfig.trackId) {
            addAlert('Track must have "name" and "trackId" fields', 'error', 'trackConfigAlerts');
            return;
        }
        
        // Update in memory
        tracksConfig.tracks[currentTrackIndex] = updatedConfig;
        currentTrackConfig = updatedConfig;
        
        // Save to localStorage
        let trackEdits = {};
        const saved = localStorage.getItem('trackEdits');
        if (saved) {
            try {
                trackEdits = JSON.parse(saved);
            } catch (e) {
                trackEdits = {};
            }
        }
        trackEdits[updatedConfig.trackId] = updatedConfig;
        localStorage.setItem('trackEdits', JSON.stringify(trackEdits));
        
        addAlert(`✅ Configuration saved for ${updatedConfig.name}. Changes persisted to localStorage and will reload on page refresh.`, 'success', 'trackConfigAlerts');
        log(`Saved track configuration: ${updatedConfig.name}`, 'success');
        
        // Refresh selector in case name changed
        const currentIndex = currentTrackIndex;
        populateTrackSelector();
        document.getElementById('trackSelect').value = currentIndex;
        
    } catch (error) {
        addAlert(`Error saving: ${error.message}`, 'error', 'trackConfigAlerts');
        log(`Save error: ${error.message}`, 'error');
    }
}

function resetTrackConfig() {
    if (currentTrackIndex === null) return;
    
    // Reload from original config
    currentTrackConfig = JSON.parse(JSON.stringify(tracksConfig.tracks[currentTrackIndex]));
    
    const select = document.getElementById('trackSelect');
    const currentValue = select.value;
    select.value = ''; // Reset
    select.value = currentValue; // Trigger reload
    loadTrackConfig();
    
    addAlert('Changes reset', 'info', 'trackConfigAlerts');
}

function viewTrackJson() {
    const modal = document.getElementById('jsonViewModal');
    const preview = document.getElementById('trackJsonPreview');
    
    if (!modal || !preview) return;
    
    // Build current config from form
    const config = {
        trackId: document.getElementById('trackId').value,
        name: document.getElementById('trackName').value,
        location: {
            city: document.getElementById('trackCity').value,
            country: document.getElementById('trackCountry').value,
            region: document.getElementById('trackRegion').value
        },
        specifications: {
            distance: parseInt(document.getElementById('trackDistance').value) || 0,
            corners: parseInt(document.getElementById('trackCorners').value) || 0,
            indoor: document.getElementById('trackIndoor').value === 'true'
        },
        pricing: {
            session: parseFloat(document.getElementById('trackPricingSession').value) || 0
        },
        contact: {
            phone: document.getElementById('trackPhone').value,
            email: document.getElementById('trackEmail').value
        },
        website: document.getElementById('trackWebsite').value,
        features: document.getElementById('trackFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        karts: document.getElementById('trackKarts').value.split(',').map(k => k.trim()).filter(k => k)
    };
    
    const width = parseInt(document.getElementById('trackWidth').value);
    if (width) config.specifications.width = width;
    
    const challenge = parseFloat(document.getElementById('trackPricingChallenge').value);
    if (challenge) config.pricing.challenge = challenge;
    
    preview.value = JSON.stringify(config, null, 2);
    modal.style.display = 'block';
}

function closeJsonView() {
    const modal = document.getElementById('jsonViewModal');
    if (modal) modal.style.display = 'none';
}

function exportTrackEdits() {
    const trackEdits = localStorage.getItem('trackEdits');
    
    if (!trackEdits || trackEdits === '{}') {
        addAlert('No track edits to export', 'warning', 'trackConfigAlerts');
        return;
    }
    
    const blob = new Blob([trackEdits], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track-edits-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAlert('Track edits exported successfully', 'success', 'trackConfigAlerts');
    log('Exported track edits', 'success');
}

// ========== INITIALIZATION ==========
window.addEventListener('DOMContentLoaded', () => {
    log('Control Panel loaded', 'info');
    setTimeout(runDiagnostics, 500);
});
