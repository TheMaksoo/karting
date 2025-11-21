// ========== GEOGRAPHICAL CHARTS MODULE ==========
// Extracted from script.js

// Make function globally accessible
window.initializeGeographicalCharts = function() {
    
    createTrackMapChart();
    createRegionalPerformanceChart();
    createHeatmapAnalysisChart();
    createLocationTrendsChart();
    
}; // End of window.initializeGeographicalCharts

// ==============================================
// GEOGRAPHICAL FEATURES SECTION
// ==============================================

// Track Map Visualization using Leaflet
function createTrackMapChart() {
    try {
        const mapContainer = document.getElementById('trackMap');
        if (!mapContainer) {
            return;
        }
        
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            return;
        }
        

        // Track coordinates (verified actual locations)
        const trackLocations = {
            'Circuit Park Berghem': { 
                lat: 51.7538, 
                lng: 5.5786, 
                city: 'Berghem (Oss), Netherlands',
                address: 'Berghemseweg 35, 5351 NC Berghem'
            },
            'De Voltage': { 
                lat: 51.5469, 
                lng: 5.0884, 
                city: 'Tilburg, Netherlands',
                address: 'Groenstraat 139-391, 5021 LL Tilburg'
            },
            'Experience Factory Antwerp': { 
                lat: 51.1726, 
                lng: 4.4488, 
                city: 'Mortsel (Antwerp), Belgium',
                address: 'Roderveldlaan 5, 2640 Mortsel'
            },
            'Goodwill Karting': { 
                lat: 51.3294, 
                lng: 4.9378, 
                city: 'Turnhout, Belgium',
                address: 'Goodwill Karting Turnhout'
            },
            'Lot66': { 
                lat: 51.5889, 
                lng: 4.7758, 
                city: 'Breda, Netherlands',
                address: 'Lot66, Breda (Permanently Closed)'
            },
            'Fastkart Elche': { 
                lat: 38.2699, 
                lng: -0.6983, 
                city: 'Elche, Spain',
                address: 'Elche Karting Club, Alicante'
            },
            'Racing Center Gilesias': { 
                lat: 38.1143, 
                lng: -0.6580, 
                city: 'Guardamar del Segura, Spain',
                address: 'Ctra. Alicante-Cartagena KM 74'
            }
        };

        // Check if we have data
        if (!filteredData || filteredData.length === 0) {
            return;
        }
        

        // Calculate stats for each track
        const trackStats = {};
        
        // First pass: count laps, best times, and distance
        filteredData.forEach(row => {
            const track = row.Track;
            if (!track) return; // Skip if no track name
            
            if (!trackStats[track]) {
                trackStats[track] = {
                    sessions: 0,
                    laps: 0,
                    bestLap: Infinity,
                    totalDistance: 0,
                    totalCost: 0,
                    avgSpeed: 0,
                    speedCount: 0
                };
            }
            
            trackStats[track].laps++;
            
            const lapTime = parseFloat(row.LapTime);
            if (!isNaN(lapTime) && lapTime > 0 && lapTime < trackStats[track].bestLap) {
                trackStats[track].bestLap = lapTime;
            }
            
            const distance = parseFloat(row.TrackDistance);
            if (!isNaN(distance)) {
                trackStats[track].totalDistance += distance;
            }
            
            const avgSpeed = parseFloat(row.AvgSpeed);
            if (!isNaN(avgSpeed) && avgSpeed > 0) {
                trackStats[track].avgSpeed += avgSpeed;
                trackStats[track].speedCount++;
            }
        });

        // Second pass: count unique sessions and calculate cost per session
        const sessionCosts = {};
        filteredData.forEach(row => {
            const track = row.Track;
            if (!track || !trackStats[track]) return;
            
            const sessionKey = `${track}-${row.Date}-${row.Heat}`;
            if (!sessionCosts[sessionKey]) {
                sessionCosts[sessionKey] = true;
                trackStats[track].sessions++;
                
                // Add heat price once per session
                const heatPrice = parseFloat(row.HeatPrice);
                if (!isNaN(heatPrice)) {
                    trackStats[track].totalCost += heatPrice;
                }
            }
        });
        
        // Calculate average speed for each track
        Object.keys(trackStats).forEach(track => {
            const stats = trackStats[track];
            if (stats.speedCount > 0) {
                stats.avgSpeed = stats.avgSpeed / stats.speedCount;
            }
        });
        

        // Initialize map centered on BENELUX region
        if (window.trackMapInstance) {
            try {
                window.trackMapInstance.remove();
            } catch (e) {
            }
        }
        
        // Clear the container first
        mapContainer.innerHTML = '';
        
        
        let map;
        try {
            // Center on Europe to show Netherlands, Belgium, and Spain
            // Coordinates roughly centered between Benelux and Spain
            map = L.map('trackMap').setView([46.0, 2.5], 5);
            window.trackMapInstance = map;
        } catch (e) {
            throw e;
        }

        // Add OpenStreetMap tiles (FREE, no API key needed!)
        try {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 4
            }).addTo(map);
        } catch (e) {
            throw e;
        }
        
        // Fix map size issue (common Leaflet problem)
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 200);

        // Add markers for each track
        let markersAdded = 0;
        Object.keys(trackLocations).forEach(trackName => {
            try {
                const loc = trackLocations[trackName];
                const stats = trackStats[trackName] || { sessions: 0, laps: 0, bestLap: 0, totalCost: 0 };
                
                
                // Create custom icon based on number of sessions
                const iconSize = Math.min(40, 20 + (stats.sessions * 2));
            const customIcon = L.divIcon({
                html: `<div style="
                    background: #ff6b35;
                    border: 3px solid #fff;
                    border-radius: 50%;
                    width: ${iconSize}px;
                    height: ${iconSize}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${iconSize * 0.5}px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">🏁</div>`,
                className: 'custom-marker',
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize/2, iconSize/2]
            });

            const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
            
            // Create popup content with full address and stats
            const hasData = stats.laps > 0;
            const totalDistanceKm = (stats.totalDistance / 1000).toFixed(1);
            const avgSpeedKmh = stats.avgSpeed.toFixed(1);
            const costPerSession = stats.sessions > 0 ? (stats.totalCost / stats.sessions).toFixed(2) : '0.00';
            const costPerLap = stats.laps > 0 ? (stats.totalCost / stats.laps).toFixed(2) : '0.00';
            const avgLapTime = stats.laps > 0 ? (filteredData.filter(r => r.Track === trackName).reduce((sum, r) => sum + parseFloat(r.LapTime || 0), 0) / stats.laps).toFixed(2) : '0.00';
            
            
            const popupContent = `
                <div class="track-popup">
                    <h4 style="margin: 0 0 4px 0; color: #ff6b35; font-size: 1rem;">� ${trackName}</h4>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 0.75rem; border-bottom: 1px solid #eee; padding-bottom: 6px;">
                        📍 ${loc.address}
                    </p>
                    ${hasData ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.85rem;">
                        <div style="padding: 4px; background: #f8f9fa; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666; margin-bottom: 2px;">Sessions</div>
                            <div style="font-weight: bold; color: #000;">${stats.sessions}</div>
                        </div>
                        <div style="padding: 4px; background: #f8f9fa; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666; margin-bottom: 2px;">Total Laps</div>
                            <div style="font-weight: bold; color: #000;">${stats.laps}</div>
                        </div>
                        <div style="padding: 4px; background: #e8f5e9; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #2e7d32; margin-bottom: 2px;">🏆 Best Lap</div>
                            <div style="font-weight: bold; color: #1b5e20;">${stats.bestLap !== Infinity ? stats.bestLap.toFixed(2) + 's' : 'N/A'}</div>
                        </div>
                        <div style="padding: 4px; background: #e3f2fd; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #1565c0; margin-bottom: 2px;">⏱️ Avg Lap</div>
                            <div style="font-weight: bold; color: #0d47a1;">${avgLapTime}s</div>
                        </div>
                        <div style="padding: 4px; background: #fff3e0; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #e65100; margin-bottom: 2px;">⚡ Avg Speed</div>
                            <div style="font-weight: bold; color: #bf360c;">${avgSpeedKmh} km/h</div>
                        </div>
                        <div style="padding: 4px; background: #f3e5f5; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #6a1b9a; margin-bottom: 2px;">🛣️ Distance</div>
                            <div style="font-weight: bold; color: #4a148c;">${totalDistanceKm} km</div>
                        </div>
                        <div style="padding: 4px; background: #fce4ec; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #c2185b; margin-bottom: 2px;">💰 €/Session</div>
                            <div style="font-weight: bold; color: #880e4f;">€${costPerSession}</div>
                        </div>
                        <div style="padding: 4px; background: #fff9c4; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #f57f17; margin-bottom: 2px;">💶 €/Lap</div>
                            <div style="font-weight: bold; color: #f57f17;">€${costPerLap}</div>
                        </div>
                    </div>
                    <div style="margin-top: 6px; padding: 6px; background: #ffebee; border-radius: 4px; text-align: center; font-size: 0.85rem; border: 1px solid #ffcdd2;">
                        <strong style="color: #333;">Total Spent:</strong> <span style="color: #c62828; font-weight: bold; font-size: 0.95rem;">€${stats.totalCost.toFixed(2)}</span>
                    </div>
                    ` : `
                    <p style="margin: 8px 0; color: #999; font-style: italic; text-align: center;">
                        No data for this track
                    </p>
                    `}
                </div>
            `;
            
            marker.bindPopup(popupContent, { maxWidth: 320 });
            
            markersAdded++;
            } catch (e) {
            }
        });

    } catch (error) {
        
        // Fallback: Show simple chart if map fails
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

    }
}

// Sessions Per Track Chart
function createRegionalPerformanceChart() {
    try {
        const ctx = document.getElementById('regionalPerformance')?.getContext('2d');
        if (!ctx) return;

        // Count sessions per track
        const trackSessions = {};
        const sessionKeys = new Set();
        
        filteredData.forEach(row => {
            const track = row.Track;
            if (!track) return;
            
            const sessionKey = `${track}-${row.Date}-${row.Heat}`;
            if (!sessionKeys.has(sessionKey)) {
                sessionKeys.add(sessionKey);
                trackSessions[track] = (trackSessions[track] || 0) + 1;
            }
        });
        
        const tracks = Object.keys(trackSessions).sort();
        const sessionCounts = tracks.map(t => trackSessions[t]);

        destroyChart('regionalPerformance');
        charts.regionalPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tracks,
                datasets: [{
                    label: 'Number of Sessions',
                    data: sessionCounts,
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
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 Sessions Per Track',
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

    } catch (error) {
    }
}

// Average Lap Time Comparison by Track
function createHeatmapAnalysisChart() {
    try {
        const ctx = document.getElementById('heatmapAnalysis')?.getContext('2d');
        if (!ctx) return;

        // Calculate average lap time per track
        const trackLapTimes = {};
        
        filteredData.forEach(row => {
            const track = row.Track;
            const lapTime = parseFloat(row.LapTime);
            
            if (track && !isNaN(lapTime) && lapTime > 0) {
                if (!trackLapTimes[track]) {
                    trackLapTimes[track] = [];
                }
                trackLapTimes[track].push(lapTime);
            }
        });
        
        const tracks = Object.keys(trackLapTimes).sort();
        const avgLapTimes = tracks.map(track => {
            const times = trackLapTimes[track];
            return times.reduce((sum, t) => sum + t, 0) / times.length;
        });
        
        const bestLapTimes = tracks.map(track => {
            return Math.min(...trackLapTimes[track]);
        });

        destroyChart('heatmapAnalysis');
        charts.heatmapAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tracks,
                datasets: [{
                    label: 'Average Lap Time',
                    data: avgLapTimes,
                    backgroundColor: '#4ecdc4',
                    borderColor: '#4ecdc4',
                    borderWidth: 2
                }, {
                    label: 'Best Lap Time',
                    data: bestLapTimes,
                    backgroundColor: '#00ff88',
                    borderColor: '#00ff88',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '⏱️ Lap Time Comparison',
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
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}s`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Lap Time (seconds)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return value.toFixed(1) + 's';
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
                }
            }
        });

    } catch (error) {
    }
}

// Legacy heatmap function - keeping for compatibility
function createHeatmapAnalysisChart_OLD() {
    try {
        const ctx = document.getElementById('heatmapAnalysis_OLD')?.getContext('2d');
        if (!ctx) return;

        // Generate performance heatmap data
        const heatmapData = generateHeatmapData(filteredData);

        // Create heatmap using matrix chart
        destroyChart('heatmapAnalysis_OLD');
        charts.heatmapAnalysis_OLD = new Chart(ctx, {
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

    } catch (error) {
    }
}

// Location-based Trends
function createLocationTrendsChart() {
    try {
        const ctx = document.getElementById('locationTrends')?.getContext('2d');
        if (!ctx) return;

        // Calculate total distance and cost per track
        const trackData = {};
        
        filteredData.forEach(row => {
            const track = row.Track;
            if (!track) return;
            
            if (!trackData[track]) {
                trackData[track] = {
                    distance: 0,
                    cost: 0,
                    laps: 0
                };
            }
            
            const distance = parseFloat(row.TrackDistance);
            if (!isNaN(distance)) {
                trackData[track].distance += distance;
            }
            
            trackData[track].laps++;
        });
        
        // Count cost per track (once per session)
        const sessionCosts = {};
        filteredData.forEach(row => {
            const sessionKey = `${row.Track}-${row.Date}-${row.Heat}`;
            if (!sessionCosts[sessionKey]) {
                sessionCosts[sessionKey] = true;
                const heatPrice = parseFloat(row.HeatPrice);
                if (!isNaN(heatPrice) && trackData[row.Track]) {
                    trackData[row.Track].cost += heatPrice;
                }
            }
        });
        
        const tracks = Object.keys(trackData).sort();
        const distances = tracks.map(t => (trackData[t].distance / 1000).toFixed(1)); // Convert to km
        const costs = tracks.map(t => trackData[t].cost.toFixed(2));

        destroyChart('locationTrends');
        charts.locationTrends = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tracks,
                datasets: [{
                    label: 'Total Distance (km)',
                    data: distances,
                    backgroundColor: '#4ecdc4',
                    borderColor: '#4ecdc4',
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Total Cost (€)',
                    data: costs,
                    backgroundColor: '#ff6b35',
                    borderColor: '#ff6b35',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '�️ Distance & Cost by Track',
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
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Distance (km)',
                            color: '#4ecdc4'
                        },
                        ticks: {
                            color: '#4ecdc4'
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Cost (€)',
                            color: '#ff6b35'
                        },
                        ticks: {
                            color: '#ff6b35'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });

    } catch (error) {
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
    // Analyze performance by actual tracks
    const trackPerformance = {};
    
    data.forEach(row => {
        const track = row.Track;
        if (!track) return;
        
        if (!trackPerformance[track]) {
            trackPerformance[track] = {
                lapTimes: [],
                totalCost: 0,
                sessions: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime);
        if (!isNaN(lapTime) && lapTime > 0) {
            trackPerformance[track].lapTimes.push(lapTime);
        }
        
        const heatPrice = parseFloat(row.HeatPrice);
        if (!isNaN(heatPrice)) {
            trackPerformance[track].totalCost += heatPrice;
        }
    });
    
    // Calculate average lap time per track
    const regions = [];
    const avgTimes = [];
    
    Object.keys(trackPerformance).forEach(track => {
        const perf = trackPerformance[track];
        if (perf.lapTimes.length > 0) {
            regions.push(track);
            const avgTime = perf.lapTimes.reduce((sum, t) => sum + t, 0) / perf.lapTimes.length;
            avgTimes.push(avgTime);
        }
    });
    
    return { regions, avgTimes };
}

function generateHeatmapData(data) {
    // Create heatmap showing lap times by track and session number
    const points = [];
    let maxValue = 0;
    
    const trackIndex = {};
    const tracks = [...new Set(data.map(row => row.Track))];
    tracks.forEach((track, i) => trackIndex[track] = i);
    
    data.forEach(row => {
        const track = row.Track;
        const lapTime = parseFloat(row.LapTime);
        const lapNr = parseInt(row.LapNr);
        
        if (track && !isNaN(lapTime) && lapTime > 0 && !isNaN(lapNr)) {
            const x = trackIndex[track];
            const y = Math.min(lapNr, 30); // Cap at lap 30 for visualization
            const v = lapTime;
            
            points.push({ x, y, v });
            maxValue = Math.max(maxValue, v);
        }
    });
    
    return { points, maxValue, tracks };
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
    // Analyze performance trends over time by track
    const trackData = {};
    
    // Group data by track and date
    data.forEach(row => {
        const track = row.Track;
        const date = row.Date;
        const lapTime = parseFloat(row.LapTime);
        
        if (!track || !date || isNaN(lapTime) || lapTime <= 0) return;
        
        if (!trackData[track]) {
            trackData[track] = {};
        }
        
        if (!trackData[track][date]) {
            trackData[track][date] = [];
        }
        
        trackData[track][date].push(lapTime);
    });
    
    // Calculate average lap time per date for each track
    const locations = [];
    const colors = ['#00ff88', '#4ecdc4', '#ff6b35', '#ffed4a', '#e74c3c'];
    let colorIndex = 0;
    
    Object.keys(trackData).forEach(track => {
        const dates = Object.keys(trackData[track]).sort();
        const avgTimes = dates.map(date => {
            const times = trackData[track][date];
            return times.reduce((sum, t) => sum + t, 0) / times.length;
        });
        
        if (avgTimes.length > 0) {
            locations.push({
                name: track,
                color: colors[colorIndex % colors.length],
                trends: avgTimes
            });
            colorIndex++;
        }
    });
    
    // Get unique dates across all tracks
    const allDates = new Set();
    Object.values(trackData).forEach(dates => {
        Object.keys(dates).forEach(date => allDates.add(date));
    });
    const timeLabels = Array.from(allDates).sort().slice(0, 10); // Last 10 sessions
    
    return { timeLabels, locations };
}

