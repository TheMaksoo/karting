// ========== GEOGRAPHICAL CHARTS MODULE ==========
// Extracted from script.js

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
