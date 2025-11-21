// ========== DRIVER PERFORMANCE CHARTS MODULE ==========
// Extracted from script.js


// Track difficulty multipliers for consistency scoring
// Higher values = more challenging track (yellow flags, traffic, complex layout)
// This adjusts consistency expectations - difficult tracks allow wider variance
const TRACK_DIFFICULTY = {
    'De Voltage': 1.25,  // Frequent yellow flags, heavy traffic
    'Circuit Park Berghem': 1.1,  // Moderate difficulty
    'default': 1.0  // Standard expectation for unknown tracks
};

function getTrackDifficultyMultiplier(trackName) {
    return TRACK_DIFFICULTY[trackName] || TRACK_DIFFICULTY['default'];
}

// Helper function to adjust color brightness for track variations
function adjustColorBrightness(color, amount) {
    // Remove # if present
    color = color.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);
    
    // Adjust
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Make function globally accessible
window.initializeDriverPerformanceCharts = function() {
    // Check if data is available
    if (!window.filteredData || window.filteredData.length === 0) {
        // Retry after a delay
        setTimeout(() => {
            if (window.filteredData && window.filteredData.length > 0) {
                window.initializeDriverPerformanceCharts();
            }
        }, 2000); // Increased delay to 2 seconds
        return;
    }
    
    // Use window.filteredData for safety
    const filteredData = window.filteredData;
    
    // Populate track selector for ranking chart
    const trackSelect = document.getElementById('rankingTrackSelect');
    const fastestLapTrackSelect = document.getElementById('fastestLapTrackSelect');
    
    const tracks = [...new Set(filteredData.map(row => row.Track))].sort();
    
    // Populate ranking track selector
    if (trackSelect) {
        trackSelect.innerHTML = '<option value="all">All Tracks</option>';
        tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track;
            option.textContent = track;
            trackSelect.appendChild(option);
        });
    }
    
    // Populate fastest lap track selector
    if (fastestLapTrackSelect) {
        fastestLapTrackSelect.innerHTML = '<option value="all">All Tracks</option>';
        tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track;
            option.textContent = track;
            fastestLapTrackSelect.appendChild(option);
        });
    }
    
    // Show/hide track selector based on metric selection
    const metricSelect = document.getElementById('rankingMetricSelect');
    if (metricSelect && trackSelect) {
        metricSelect.addEventListener('change', () => {
            if (metricSelect.value === 'avgpertrack') {
                trackSelect.style.display = 'inline-block';
            } else {
                trackSelect.style.display = 'none';
            }
        });
    }
    
    // Add event listeners for controls
    addChartEventListener('rankingMetricSelect', createDriverRankingChart);
    addChartEventListener('rankingTrackSelect', createDriverRankingChart);
    addChartEventListener('fastestLapTrackSelect', createFastestLapChart);
    addChartEventListener('avgLapGroupBy', createAvgLapTimeChart);
    addChartEventListener('avgLapTrackSelect', createAvgLapTimeChart);
    addChartEventListener('consistencyGroupBy', createConsistencyChart);
    addChartEventListener('improvementGroupBy', createImprovementChart);
    addChartEventListener('improvementDriverSelect', createImprovementChart);
    addChartEventListener('improvementTrackSelect', createImprovementChart);
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
}; // End of window.initializeDriverPerformanceCharts

// 1.1 Driver Activity Over Time
function createDriverRankingChart() {
    const ctx = document.getElementById('driverRankingChart');
    if (!ctx) {
        return;
    }

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) {
        return;
    }

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const metric = document.getElementById('rankingMetricSelect')?.value || 'totallaps';
    const selectedTrack = document.getElementById('rankingTrackSelect')?.value || 'all';
    
    // Get all unique dates from the data
    const allDates = [...new Set(filteredData.map(row => row.Date))].sort();
    
    const datasets = drivers.slice(0, 8).map((driver, index) => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        let cumulativeLaps = 0;
        const lapsAddedPerDate = {}; // Store laps added for tooltip
        
        const data = allDates.map(date => {
            const sessionData = filteredData.filter(row => 
                row.Driver === driver && 
                row.Date === date
            );
            
            if (metric === 'totallaps') {
                // Cumulative total laps (keep lines connected)
                const lapsAddedToday = sessionData.length;
                cumulativeLaps += lapsAddedToday;
                lapsAddedPerDate[date] = lapsAddedToday;
                return cumulativeLaps;
            } else if (metric === 'totaltracks') {
                // Cumulative total unique tracks driven up to this date
                const tracksUpToDate = filteredData.filter(row => 
                    row.Driver === driver && 
                    row.Date <= date
                );
                const uniqueTracks = new Set(tracksUpToDate.map(row => row.Track));
                return uniqueTracks.size;
            } else {
                // Avg Lap Time
                if (sessionData.length === 0) return null;
                
                if (selectedTrack !== 'all') {
                    // Single track mode - show average lap time for this specific track
                    const trackData = sessionData.filter(row => row.Track === selectedTrack);
                    if (trackData.length === 0) return null;
                    const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                    if (lapTimes.length === 0) return null;
                    return lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                }
                
                // All tracks mode - normalized performance (difference from field average)
                const tracksOnDate = [...new Set(sessionData.map(row => row.Track))];
                let totalDifference = 0;
                let trackCount = 0;
                
                tracksOnDate.forEach(track => {
                    // Driver's avg on this track on this date
                    const driverTrackLaps = sessionData.filter(row => row.Track === track);
                    const driverLapTimes = driverTrackLaps.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                    if (driverLapTimes.length === 0) return;
                    const driverAvg = driverLapTimes.reduce((sum, time) => sum + time, 0) / driverLapTimes.length;
                    
                    // All drivers' avg on this track on this date
                    const allTrackLaps = filteredData.filter(row => row.Track === track && row.Date === date);
                    const allLapTimes = allTrackLaps.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                    if (allLapTimes.length === 0) return;
                    const trackAvg = allLapTimes.reduce((sum, time) => sum + time, 0) / allLapTimes.length;
                    
                    // Difference from average (negative = faster than average)
                    totalDifference += (driverAvg - trackAvg);
                    trackCount++;
                });
                
                // Return average difference across all tracks (0 = average, negative = faster, positive = slower)
                return trackCount > 0 ? totalDifference / trackCount : null;
            }
        });

        // Use consistent driver color from global color map
        const driverColor = window.getDriverColor(driver);
        
        return {
            label: driver,
            data: data,
            lapsAddedPerDate: lapsAddedPerDate, // Store for tooltip
            borderColor: driverColor,
            backgroundColor: driverColor + '40',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: driverColor,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            spanGaps: true // Connect all lines even if drivers miss races
        };
    });

    const yAxisLabel = metric === 'totallaps' ? 'Total Laps Driven' :
                       metric === 'totaltracks' ? 'Total Tracks Driven' :
                       selectedTrack === 'all' ? 'Avg Performance vs Field (s)' : `Avg Lap Time at ${selectedTrack} (s)`;

    destroyChart('driverRanking');
    charts.driverRanking = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allDates,
            datasets: datasets
        },
        options: {
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
            scales: {
                y: {
                    beginAtZero: metric !== 'avgpertrack' || selectedTrack === 'all',
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '600'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 10,
                        callback: function(value) {
                            if (value === null || value === undefined) return 'N/A';
                            if (metric === 'avgpertrack' && selectedTrack !== 'all') {
                                return value.toFixed(3) + 's';
                            } else if (metric === 'avgpertrack') {
                                return (value >= 0 ? '+' : '') + value.toFixed(2) + 's';
                            }
                            return value;
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Race Date',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '600'
                        },
                        padding: { top: 15, bottom: 0 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 10
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
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    enabled: false, // Disable default tooltip
                    mode: 'index', // Show all datasets at the x-axis point
                    intersect: false, // Don't require hovering directly on point
                    external: function(context) {
                        const tooltipModel = context.tooltip;
                        const statsContent = document.getElementById('driverActivityStatsContent');
                        
                        if (!statsContent) return;
                        
                        // Hide if no tooltip
                        if (tooltipModel.opacity === 0) {
                            statsContent.innerHTML = `
                                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                                    <i class="fas fa-mouse-pointer" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                                    <p>Move your mouse over the chart to view driver statistics</p>
                                </div>
                            `;
                            return;
                        }
                        
                        // Build HTML content
                        const dataPoint = tooltipModel.dataPoints[0];
                        const date = dataPoint.label;
                        
                        // Sort items by value
                        let sortedItems = [...tooltipModel.dataPoints];
                        if (metric === 'totallaps' || metric === 'totaltracks') {
                            sortedItems.sort((a, b) => b.parsed.y - a.parsed.y);
                        } else if (metric === 'avgpertrack' && selectedTrack === 'all') {
                            sortedItems.sort((a, b) => a.parsed.y - b.parsed.y);
                        } else {
                            sortedItems.sort((a, b) => {
                                const aVal = a.parsed.y === null ? Infinity : a.parsed.y;
                                const bVal = b.parsed.y === null ? Infinity : b.parsed.y;
                                return aVal - bVal;
                            });
                        }
                        
                        let html = `
                            <div class="stat-highlight" style="margin-bottom: 20px;">
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-calendar"></i> Date</span>
                                    <span class="stat-value">${date}</span>
                                </div>
                            </div>
                        `;
                        
                        sortedItems.forEach((item, index) => {
                            const dataset = item.dataset;
                            const value = item.parsed.y;
                            const driver = dataset.label;
                            const driverColor = dataset.borderColor;
                            
                            let valueText = '';
                            if (metric === 'totallaps') {
                                const lapsAdded = dataset.lapsAddedPerDate ? dataset.lapsAddedPerDate[date] || 0 : 0;
                                valueText = `${value} laps${lapsAdded > 0 ? ' (+' + lapsAdded + ')' : ''}`;
                            } else if (metric === 'totaltracks') {
                                valueText = `${value} tracks`;
                            } else {
                                if (selectedTrack === 'all') {
                                    if (value === null || value === undefined) {
                                        valueText = 'No data';
                                    } else {
                                        const sign = value >= 0 ? '+' : '';
                                        valueText = `${sign}${value.toFixed(3)}s vs avg`;
                                    }
                                } else {
                                    valueText = (value !== null && value !== undefined) ? value.toFixed(3) + 's' : 'No data';
                                }
                            }
                            
                            // Add rank indicator for top 3
                            let rankEmoji = '';
                            if (index === 0) rankEmoji = '🥇';
                            else if (index === 1) rankEmoji = '🥈';
                            else if (index === 2) rankEmoji = '🥉';
                            
                            html += `
                                <div class="stat-row" style="margin-bottom: 12px;">
                                    <span class="stat-label" style="display: flex; align-items: center; gap: 8px;">
                                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${driverColor};"></span>
                                        <strong>${driver}</strong>
                                        ${rankEmoji}
                                    </span>
                                    <span class="stat-value">${valueText}</span>
                                </div>
                            `;
                        });
                        
                        statsContent.innerHTML = html;
                    }
                }
            },
            interaction: {
                mode: 'index', // Show all datasets at the x-axis point
                intersect: false // Don't require hovering directly on point
            },
            onHover: (event, activeElements, chart) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
}


// 1.2 Fastest Lap by Driver (Per Track - Relative Performance)
// 1.2 Performance Gap Analysis Chart
function createFastestLapChart() {
    const ctx = document.getElementById('fastestLapChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const allTracks = [...new Set(filteredData.map(row => row.Track))];
    const selectedTrack = document.getElementById('fastestLapTrackSelect')?.value || 'all';
    
    // Filter tracks based on selection
    const tracks = selectedTrack === 'all' ? allTracks : [selectedTrack];
    
    // Calculate performance gap in seconds (not percentage)
    const driverPerformance = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        
        // Calculate average gap to best lap per track in SECONDS
        let totalGapSeconds = 0;
        let trackCount = 0;
        
        tracks.forEach(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const driverTrackData = driverData.filter(row => row.Track === track);
            
            if (driverTrackData.length === 0) return;
            
            const trackBest = Math.min(...trackData.map(row => parseFloat(row.LapTime || 999)).filter(time => time < 999));
            const driverBest = Math.min(...driverTrackData.map(row => parseFloat(row.LapTime || 999)).filter(time => time < 999));
            
            if (driverBest < 999 && trackBest > 0) {
                const gapSeconds = driverBest - trackBest;
                totalGapSeconds += gapSeconds;
                trackCount++;
            }
        });
        
        return {
            driver: driver,
            avgGapSeconds: trackCount > 0 ? totalGapSeconds / trackCount : 999,
            totalLaps: driverData.length,
            tracksVisited: trackCount
        };
    }).filter(d => d.avgGapSeconds < 999 && d.totalLaps >= 10) // Only drivers with 10+ laps
      .sort((a, b) => a.avgGapSeconds - b.avgGapSeconds)
      .slice(0, 12); // Top 12 drivers

    const trackLabel = selectedTrack === 'all' ? `${driverPerformance[0]?.tracksVisited || 0} tracks` : selectedTrack;
    const labels = driverPerformance.map(d => d.driver);
    const gapSeconds = driverPerformance.map(d => d.avgGapSeconds);

    destroyChart('fastestLap');
    charts.fastestLap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: selectedTrack === 'all' ? 'Avg Gap to Track Record (all tracks)' : `Avg Gap to Track Record (${selectedTrack})`,
                data: gapSeconds,
                backgroundColor: gapSeconds.map((gap, index) => {
                    // Color gradient: green (best) to red (worst)
                    if (gap < 0.5) return '#10b981CC'; // Green
                    if (gap < 1.5) return '#3b82f6CC'; // Blue
                    if (gap < 3.0) return '#f59e0bCC'; // Orange
                    return '#ef4444CC'; // Red
                }),
                borderColor: gapSeconds.map((gap, index) => {
                    if (gap < 0.5) return '#10b981';
                    if (gap < 1.5) return '#3b82f6';
                    if (gap < 3.0) return '#f59e0b';
                    return '#ef4444';
                }),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
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
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...gapSeconds) * 1.15, // Fixed max prevents infinite expansion
                    title: {
                        display: true,
                        text: selectedTrack === 'all' ? 'Avg Gap to Track Record (seconds)' : `Avg Gap to ${selectedTrack} Record (seconds)`,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 10,
                        callback: function(value) {
                            return value !== null && value !== undefined ? '+' + value.toFixed(2) + 's' : 'N/A';
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 10
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
                    borderWidth: 2,
                    padding: 16,
                    titleFont: {
                        size: 18,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return value !== null && value !== undefined ? `Gap: +${value.toFixed(3)}s` : 'Gap: N/A';
                        }
                    }
                }
            }
        }
    });
}

// 1.3 Average Performance per Driver (Track-Normalized)
function createAvgLapTimeChart() {
    const ctx = document.getElementById('avgLapTimeChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const groupBy = document.getElementById('avgLapGroupBy')?.value || 'overall';
    const selectedTrack = document.getElementById('avgLapTrackSelect')?.value || 'all';
    
    // Filter by track if selected
    const trackFilteredData = selectedTrack === 'all' ? filteredData : 
        filteredData.filter(row => row.Track === selectedTrack);
    
    const drivers = [...new Set(trackFilteredData.map(row => row.Driver))];
    const tracks = selectedTrack === 'all' ? [...new Set(trackFilteredData.map(row => row.Track))] : [selectedTrack];
    
    let datasets = [];
    let labels = [];
    let plugins = [];
    let pinnedBar = null; // Track which bar is pinned - MOVED TO FUNCTION SCOPE

    if (groupBy === 'overall') {
        // MASSIVE UPGRADE: Show comprehensive driver performance view
        labels = drivers.slice(0, 8); // Show top 8 drivers
        
        // For each track, calculate driver's average performance
        const trackDatasets = tracks.map((track, trackIndex) => {
            const data = labels.map(driver => {
                const driverTrackData = trackFilteredData.filter(row => row.Driver === driver && row.Track === track);
                const lapTimes = driverTrackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
            });
            
            return {
                label: track,
                data: data,
                backgroundColor: CHART_COLORS[trackIndex % CHART_COLORS.length] + 'DD',
                borderColor: CHART_COLORS[trackIndex % CHART_COLORS.length],
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 'flex',
                maxBarThickness: 40
            };
        });
        
        datasets = trackDatasets;
        
    } else if (groupBy === 'track') {
        labels = tracks;
        
        // Calculate track records (absolute fastest lap ever on each track)
        const trackRecords = tracks.map((track, idx) => {
            const trackData = trackFilteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 999)).filter(time => time < 999);
            return lapTimes.length > 0 ? Math.min(...lapTimes) : null;
        });
        
        // Calculate each driver's personal record on each track
        const driverPersonalRecords = {};
        
        datasets = drivers.slice(0, 6).map((driver, index) => {
            const data = tracks.map(track => {
                const trackData = trackFilteredData.filter(row => row.Driver === driver && row.Track === track);
                const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
            });
            
            // Store driver's personal best for each track
            driverPersonalRecords[driver] = tracks.map(track => {
                const trackData = trackFilteredData.filter(row => row.Driver === driver && row.Track === track);
                const lapTimes = trackData.map(row => parseFloat(row.LapTime || 999)).filter(time => time < 999);
                return lapTimes.length > 0 ? Math.min(...lapTimes) : null;
            });
            
            return {
                label: driver,
                data: data,
                backgroundColor: window.getDriverColor(driver) + 'CC',
                borderColor: window.getDriverColor(driver),
                borderWidth: 2,
                borderRadius: 4,
                personalRecords: driverPersonalRecords[driver], // Store for tooltip
                trackRecords: trackRecords // Store for tooltip
            };
        });
        
        // Add SEPARATE horizontal lines for each track record
        // Using a custom plugin to draw horizontal lines at specific indices
        
        plugins.push({
            id: 'trackRecordLines',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                // Draw track records
                trackRecords.forEach((record, index) => {
                    if (record === null) return;
                    
                    // Get the x position for this track
                    const xStart = xAxis.getPixelForValue(index) - (xAxis.width / tracks.length / 2);
                    const xEnd = xAxis.getPixelForValue(index) + (xAxis.width / tracks.length / 2);
                    const y = yAxis.getPixelForValue(record);
                    
                    // Draw red horizontal line for this track only
                    ctx.save();
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(xStart, y);
                    ctx.lineTo(xEnd, y);
                    ctx.stroke();
                    
                    // Add small label with "Track Record" text
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(`Record: ${record.toFixed(3)}s`, xEnd - 5, y - 5);
                    ctx.restore();
                });
                
                // Draw Personal Best lines ONLY for hovered/clicked bars
                const activeElements = chart.getActiveElements();
                const hoveredElements = activeElements.length > 0 ? activeElements : (pinnedBar ? [pinnedBar] : []);
                
                hoveredElements.forEach(element => {
                    const datasetIndex = element.datasetIndex;
                    const trackIndex = element.index;
                    const dataset = chart.data.datasets[datasetIndex];
                    
                    if (!dataset.personalRecords) return;
                    
                    const pb = dataset.personalRecords[trackIndex];
                    if (pb === null) return;
                    
                    const xStart = xAxis.getPixelForValue(trackIndex) - (xAxis.width / tracks.length / 2);
                    const xEnd = xAxis.getPixelForValue(trackIndex) + (xAxis.width / tracks.length / 2);
                    const y = yAxis.getPixelForValue(pb);
                    
                    // Use driver color for PB line
                    const driverColor = dataset.borderColor;
                    
                    // Draw PB line with driver color - HIGHLY VISIBLE
                    ctx.save();
                    ctx.strokeStyle = driverColor;
                    ctx.lineWidth = 4;
                    ctx.setLineDash([8, 4]);
                    ctx.globalAlpha = 1.0;
                    ctx.shadowColor = driverColor;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(xStart, y);
                    ctx.lineTo(xEnd, y);
                    ctx.stroke();
                    
                    // Add PB marker with background
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = driverColor;
                    const textX = (xStart + xEnd) / 2;
                    const textY = y - 5;
                    
                    // Background for text
                    ctx.fillRect(textX - 20, textY - 14, 40, 16);
                    
                    // Text
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PB', textX, textY);
                    ctx.restore();
                });
                
                // Draw partial bar highlighting to show PB position visually
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    if (!dataset.personalRecords) return;
                    
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta || meta.hidden) return;
                    
                    meta.data.forEach((bar, index) => {
                        const pb = dataset.personalRecords[index];
                        const avgValue = dataset.data[index];
                        
                        if (pb === null || avgValue === null) return;
                        
                        // Draw a highlight line at PB position within the bar
                        const barX = bar.x;
                        const barWidth = bar.width;
                        const pbY = yAxis.getPixelForValue(pb);
                        const barTop = bar.y;
                        const barBottom = yAxis.getPixelForValue(yAxis.min);
                        
                        // Only draw if PB is within the bar's range
                        if (pbY >= barTop && pbY <= barBottom) {
                            ctx.save();
                            ctx.strokeStyle = '#FFD700';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.8;
                            ctx.beginPath();
                            ctx.moveTo(barX - barWidth / 2, pbY);
                            ctx.lineTo(barX + barWidth / 2, pbY);
                            ctx.stroke();
                            ctx.restore();
                        }
                    });
                });
                
                // Highlight active element on hover with thicker line
                if (activeElements.length > 0) {
                    const element = activeElements[0];
                    const datasetIndex = element.datasetIndex;
                    const trackIndex = element.index;
                    const dataset = chart.data.datasets[datasetIndex];
                    
                    if (dataset.personalRecords && dataset.personalRecords[trackIndex] !== null) {
                        const pb = dataset.personalRecords[trackIndex];
                        const xStart = xAxis.getPixelForValue(trackIndex) - (xAxis.width / tracks.length / 2);
                        const xEnd = xAxis.getPixelForValue(trackIndex) + (xAxis.width / tracks.length / 2);
                        const y = yAxis.getPixelForValue(pb);
                        
                        // Draw highlighted golden PB line on hover
                        ctx.save();
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 4;
                        ctx.setLineDash([]);
                        ctx.shadowColor = '#FFD700';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.moveTo(xStart, y);
                        ctx.lineTo(xEnd, y);
                        ctx.stroke();
                        
                        // Add highlighted PB label
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'left';
                        ctx.fillText(`PB: ${pb.toFixed(3)}s`, xStart + 5, y - 6);
                        ctx.restore();
                    }
                }
            }
        });
        
    } else if (groupBy === 'session') {
        // Group by session per track
        const sessionsByTrack = {};
        tracks.forEach(track => {
            const trackData = trackFilteredData.filter(row => row.Track === track);
            sessionsByTrack[track] = [...new Set(trackData.map(row => `${row.Date}-${row.Heat}`))].sort();
        });
        
        // Use the track with most sessions for labels
        const allSessions = Object.values(sessionsByTrack).flat();
        const uniqueSessions = [...new Set(allSessions)].sort();
        labels = uniqueSessions.map(s => {
            const [date, heat] = s.split('-');
            return `${date} H${heat}`;
        });
        
        const sessionRecords = uniqueSessions.map((session, idx) => {
            const [date, heat] = session.split('-');
            const sessionData = trackFilteredData.filter(row => row.Date === date && row.Heat === heat);
            const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 999)).filter(time => time < 999);
            return lapTimes.length > 0 ? Math.min(...lapTimes) : null;
        });
        
        datasets = drivers.slice(0, 6).map((driver, index) => {
            const data = uniqueSessions.map(session => {
                const [date, heat] = session.split('-');
                const sessionData = trackFilteredData.filter(row => 
                    row.Driver === driver && 
                    row.Date === date && 
                    row.Heat === heat
                );
                const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                return lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : null;
            });
            
            return {
                label: driver,
                data: data,
                backgroundColor: window.getDriverColor(driver) + 'CC',
                borderColor: window.getDriverColor(driver),
                borderWidth: 2,
                borderRadius: 4
            };
        });
        
        // Add session record line
        datasets.push({
            label: 'Session Record',
            data: sessionRecords,
            type: 'line',
            borderColor: '#ff0000',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ff0000',
            borderDash: [],
            fill: false,
            order: 0  // Draw on top
        });
    }

    // Calculate the max value for proper scaling
    const allValues = datasets.flatMap(ds => ds.data.filter(v => v !== null));
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;
    const yMax = maxValue + (range * 0.15); // Add 15% padding at top
    const yMin = Math.max(0, minValue - (range * 0.05)); // Add 5% padding at bottom

    destroyChart('avgLapTime');
    charts.avgLapTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        plugins: plugins,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
            interaction: {
                mode: 'index', // Better for bar charts - matches entire x-axis position
                intersect: false // Don't require hovering directly on bar
            },
            layout: {
                padding: {
                    top: 30,
                    right: 30,
                    bottom: 30,
                    left: 30
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yMin,
                    max: yMax,
                    title: {
                        display: true,
                        text: groupBy === 'overall' ? 'Average Lap Time (seconds) - By Track' : 'Average Lap Time (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 19, // Increased for better readability
                            weight: '600' // Bolder
                        },
                        padding: 15, // More spacing
                        callback: function(value) {
                            return value !== null && value !== undefined ? value.toFixed(2) + 's' : 'N/A';
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 19, // Increased for better readability
                            weight: '600' // Bolder
                        },
                        padding: 10,
                        maxRotation: groupBy === 'session' ? 45 : 0,
                        minRotation: groupBy === 'session' ? 45 : 0
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
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 20,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    enabled: false, // Disable default tooltip, use stats panel instead
                    external: function(context) {
                        // Update stats panel instead of showing tooltip
                        const statsContent = document.getElementById('avgLapStatsContent');
                        if (!statsContent) return;
                        
                        const tooltipModel = context.tooltip;
                        
                        if (tooltipModel.opacity === 0) {
                            // Hide stats panel content when not hovering
                            return;
                        }
                        
                        if (tooltipModel.body) {
                            const dataPoint = tooltipModel.dataPoints[0];
                            const dataset = dataPoint.dataset;
                            const trackIndex = dataPoint.dataIndex;
                            
                            if (groupBy === 'track' && dataset.personalRecords && dataset.trackRecords) {
                                const personalRecord = dataset.personalRecords[trackIndex];
                                const trackRecord = dataset.trackRecords[trackIndex];
                                const avgTime = dataPoint.parsed.y;
                                const track = dataPoint.label;
                                const driver = dataset.label;
                                
                                let html = `
                                    <div class="stat-highlight">
                                        <div class="stat-label"><i class="fas fa-user-circle"></i> Driver</div>
                                        <div class="stat-value" style="font-size: 18px;">${driver}</div>
                                    </div>
                                    <div class="stat-highlight">
                                        <div class="stat-label"><i class="fas fa-map-marker-alt"></i> Track</div>
                                        <div class="stat-value" style="font-size: 18px;">${track}</div>
                                    </div>
                                `;
                                
                                // REORDERED: Show PB and Track Record first (swapped positions)
                                if (personalRecord !== null && personalRecord !== undefined) {
                                    html += `
                                        <div class="stat-row">
                                            <div class="stat-label"><i class="fas fa-star" style="color: #FFD700;"></i> Personal Best</div>
                                            <div class="stat-value" style="color: #FFD700; font-size: 17px; font-weight: 700;">${personalRecord.toFixed(3)}s</div>
                                        </div>
                                    `;
                                }
                                
                                if (trackRecord !== null && trackRecord !== undefined) {
                                    html += `
                                        <div class="stat-row">
                                            <div class="stat-label"><i class="fas fa-trophy" style="color: #ff0000;"></i> Track Record</div>
                                            <div class="stat-value" style="color: #ff0000; font-size: 17px; font-weight: 700;">${trackRecord.toFixed(3)}s</div>
                                        </div>
                                    `;
                                }
                                
                                // FIXED: Gap to Record is now PB to Track Record (not Average to Record)
                                if (personalRecord !== null && personalRecord !== undefined && trackRecord !== null && trackRecord !== undefined) {
                                    const gapPBToRecord = personalRecord - trackRecord;
                                    html += `
                                        <div class="stat-row">
                                            <div class="stat-label"><i class="fas fa-tachometer-alt"></i> Gap to Record</div>
                                            <div class="stat-value" style="color: ${gapPBToRecord < 0.5 ? '#10b981' : gapPBToRecord < 1 ? '#f59e0b' : '#ef4444'}; font-size: 16px; font-weight: 600;">+${gapPBToRecord.toFixed(3)}s</div>
                                        </div>
                                    `;
                                }
                                
                                html += `
                                    <div style="margin: 15px 0; border-top: 2px solid var(--border-color);"></div>
                                    <div class="stat-row">
                                        <div class="stat-label"><i class="fas fa-chart-line"></i> Average Lap Time</div>
                                        <div class="stat-value" style="font-size: 16px;">${avgTime !== null && avgTime !== undefined ? avgTime.toFixed(3) + 's' : 'N/A'}</div>
                                    </div>
                                `;
                                
                                if (personalRecord !== null && personalRecord !== undefined && avgTime !== null && avgTime !== undefined) {
                                    const gapToPB = avgTime - personalRecord;
                                    html += `
                                        <div class="stat-row">
                                            <div class="stat-label"><i class="fas fa-stopwatch"></i> Gap Avg to PB</div>
                                            <div class="stat-value" style="color: ${gapToPB < 0.5 ? '#10b981' : gapToPB < 1 ? '#f59e0b' : '#ef4444'}; font-size: 15px;">+${gapToPB.toFixed(3)}s</div>
                                        </div>
                                    `;
                                }
                                
                                // Add performance rating (based on PB to Record gap)
                                const gapToRecord = (personalRecord && trackRecord) ? (personalRecord - trackRecord) : 999;
                                let rating = '';
                                let ratingColor = '';
                                if (gapToRecord < 0.5) {
                                    rating = '🌟 Elite Performance!';
                                    ratingColor = '#10b981';
                                } else if (gapToRecord < 1.0) {
                                    rating = '✨ Excellent!';
                                    ratingColor = '#22c55e';
                                } else if (gapToRecord < 2.0) {
                                    rating = '👍 Very Good';
                                    ratingColor = '#eab308';
                                } else if (gapToRecord < 3.0) {
                                    rating = '📊 Good';
                                    ratingColor = '#f59e0b';
                                } else {
                                    rating = '⚠️ Room for Improvement';
                                    ratingColor = '#ef4444';
                                }
                                
                                html += `
                                    <div style="margin-top: 15px; padding: 12px; background: ${ratingColor}15; border-left: 3px solid ${ratingColor}; border-radius: 6px;">
                                        <div style="color: ${ratingColor}; font-weight: 600; font-size: 14px;">${rating}</div>
                                    </div>
                                `;
                                
                                statsContent.innerHTML = html;
                            }
                        }
                    }
                }
            },
            onClick: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const element = activeElements[0];
                    
                    // Toggle pin: if clicking the same bar, unpin it; otherwise pin the new one
                    if (pinnedBar && pinnedBar.datasetIndex === element.datasetIndex && pinnedBar.index === element.index) {
                        pinnedBar = null;
                        // Reset stats panel
                        const statsContent = document.getElementById('avgLapStatsContent');
                        if (statsContent) {
                            statsContent.innerHTML = `
                                <p style="color: var(--text-secondary); text-align: center; padding: 20px;">
                                    <i class="fas fa-mouse-pointer" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 10px;"></i>
                                    Hover over bars to see detailed statistics<br><small>Click to pin details</small>
                                </p>
                            `;
                        }
                    } else {
                        pinnedBar = element;
                        // Trigger tooltip update to show pinned stats
                        chart.tooltip.setActiveElements([element], {x: event.x, y: event.y});
                        chart.update('none');
                    }
                    chart.update('none');
                }
            },
            onHover: (event, activeElements, chart) => {
                // Highlight the active bar (unless a bar is pinned)
                if (activeElements.length > 0) {
                    const element = activeElements[0];
                    event.native.target.style.cursor = 'pointer';
                    
                    // Only update tooltip if not pinned OR if hovering over pinned bar
                    if (!pinnedBar) {
                        chart.tooltip.setActiveElements(activeElements, {x: event.x, y: event.y});
                        chart.update('none');
                    }
                } else {
                    event.native.target.style.cursor = 'default';
                    
                    // Only reset if not pinned
                    if (!pinnedBar) {
                        const statsContent = document.getElementById('avgLapStatsContent');
                        if (statsContent) {
                            statsContent.innerHTML = `
                                <p style="color: var(--text-secondary); text-align: center; padding: 20px;">
                                    <i class="fas fa-mouse-pointer" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 10px;"></i>
                                    Hover over bars to see detailed statistics<br><small>Click to pin details</small>
                                </p>
                            `;
                        }
                    }
                }
            }
        }
    });
}

// 1.4 Lap Time Variance Chart - REDESIGNED FOR BETTER INSIGHTS
function createConsistencyChart() {
    const ctx = document.getElementById('consistencyChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const groupBy = 'byTrack'; // Always split by track
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    const { ChartOptions, StatsPanelHelper, FormatUtils } = window.ChartUtils;
    const statsPanel = new StatsPanelHelper('consistencyStatsPanel');
    
    let datasets = [];
    let labels = tracks;
    
    // Group by track - show variance per track for each driver
    datasets = drivers.slice(0, 6).map((driver, index) => {
        const data = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Driver === driver && row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            
            if (lapTimes.length < 3) return null;
            
            const mean = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
            const min = Math.min(...lapTimes);
            const max = Math.max(...lapTimes);
            const range = max - min;
            
            return range; // Show the range (variance) as the metric
        });
        
        return {
            label: driver,
            data: data,
            backgroundColor: window.getDriverColor(driver) + 'DD',
            borderColor: window.getDriverColor(driver),
            borderWidth: 2,
            borderRadius: 6
        };
    });

    destroyChart('consistency');
    charts.consistency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 35,
                    right: 35,
                    bottom: 30,
                    left: 30
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time Variance (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 16
                        },
                        padding: 10,
                        callback: function(value) {
                            return value.toFixed(2) + 's';
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Track',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 15, bottom: 0 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 16
                        },
                        padding: 10
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 20,
                        usePointStyle: true,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            statsPanel.showEmptyState('fa-chart-bar', 'Hover over bars to see consistency details');
                            return;
                        }
                        if (!tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) return;
                        
                        const dataPoint = tooltipModel.dataPoints[0];
                        const value = dataPoint.parsed.y;
                        const label = dataPoint.label;
                        
                        if (groupBy === 'overall' && dataPoint.datasetIndex === 2 && dataPoint.dataset.driverStats) {
                            const stats = dataPoint.dataset.driverStats[dataPoint.dataIndex];
                            if (!stats) return;
                            
                            // Ultra-granular tolerance levels with 15 gradations for detailed feedback
                            let rating, ratingColor, ratingEmoji, advice;
                            if (stats.range < 0.3) {
                                rating = 'Superhuman Precision!';
                                ratingColor = '#047857';
                                ratingEmoji = '👑';
                                advice = 'World-class consistency. You are driving like a machine - absolutely flawless.';
                            } else if (stats.range < 0.5) {
                                rating = 'Exceptional Consistency!';
                                ratingColor = '#059669';
                                ratingEmoji = '🏆';
                                advice = 'Professional-level consistency. You have excellent control and muscle memory.';
                            } else if (stats.range < 0.8) {
                                rating = 'Elite Performance';
                                ratingColor = '#10b981';
                                ratingEmoji = '🌟';
                                advice = 'Outstanding consistency. Very few drivers achieve this level of precision.';
                            } else if (stats.range < 1.0) {
                                rating = 'Superb Consistency';
                                ratingColor = '#14b8a6';
                                ratingEmoji = '💎';
                                advice = 'Excellent control. Your lap times are remarkably consistent.';
                            } else if (stats.range < 1.3) {
                                rating = 'Excellent Consistency';
                                ratingColor = '#22c55e';
                                ratingEmoji = '✨';
                                advice = 'Strong performance. Focus on perfecting your racing line for even better results.';
                            } else if (stats.range < 1.6) {
                                rating = 'Very Good Consistency';
                                ratingColor = '#3b82f6';
                                ratingEmoji = '⭐';
                                advice = 'Solid driving. You are hitting your marks well. Minor improvements will get you to elite level.';
                            } else if (stats.range < 2.0) {
                                rating = 'Very Good';
                                ratingColor = '#84cc16';
                                ratingEmoji = '👍';
                                advice = 'Good consistency. Work on maintaining the same braking points each lap.';
                            } else if (stats.range < 2.3) {
                                rating = 'Good Consistency';
                                ratingColor = '#a3e635';
                                ratingEmoji = '👌';
                                advice = 'Respectable performance. Try to reduce variation in corner entry speeds.';
                            } else if (stats.range < 2.7) {
                                rating = 'Above Average';
                                ratingColor = '#bef264';
                                ratingEmoji = '📊';
                                advice = 'Decent consistency. Try to be more deliberate with throttle and steering inputs.';
                            } else if (stats.range < 3.2) {
                                rating = 'Moderate Consistency';
                                ratingColor = '#facc15';
                                ratingEmoji = '📈';
                                advice = 'Fair consistency. Focus on finding visual reference points for braking and turn-in.';
                            } else if (stats.range < 3.8) {
                                rating = 'Moderate Variance';
                                ratingColor = '#eab308';
                                ratingEmoji = '⚠️';
                                advice = 'Room for improvement. Focus on hitting the same apexes and finding reference points.';
                            } else if (stats.range < 4.5) {
                                rating = 'Noticeable Variance';
                                ratingColor = '#f59e0b';
                                ratingEmoji = '📉';
                                advice = 'Significant variation. Work on smoothness: ease onto throttle, gentle with steering.';
                            } else if (stats.range < 5.5) {
                                rating = 'High Variance';
                                ratingColor = '#f97316';
                                ratingEmoji = '⚡';
                                advice = 'Large gaps between laps. Try to drive at 85% pace consistently rather than pushing too hard.';
                            } else if (stats.range < 7.0) {
                                rating = 'Very Inconsistent';
                                ratingColor = '#ef4444';
                                ratingEmoji = '❌';
                                advice = 'High variability. Focus on fundamentals: smooth inputs, consistent lines, and track awareness.';
                            } else {
                                rating = 'Extreme Inconsistency';
                                ratingColor = '#dc2626';
                                ratingEmoji = '🚫';
                                advice = 'Massive lap time variation. Slow down and focus on repeatable, smooth driving before pushing harder.';
                            }
                            
                            // Calculate consistency percentage (inverse of variance)
                            const consistencyPct = Math.max(0, (1 - (stats.range / stats.mean)) * 100);
                            
                            statsPanel.setContent(`
                                <div class="stat-highlight"><div class="stat-row"><span class="stat-label">Driver</span><span class="stat-value" style="font-size:18px;">${label}</span></div></div>
                                <div class="stat-row"><span class="stat-label">Best Lap</span><span class="stat-value" style="color:#10b981;font-size:17px;">${FormatUtils.formatTime(stats.best)}</span></div>
                                <div class="stat-row"><span class="stat-label">Average</span><span class="stat-value" style="color:#f59e0b;font-size:16px;">${FormatUtils.formatTime(stats.mean)}</span></div>
                                <div class="stat-row"><span class="stat-label">Worst Lap</span><span class="stat-value" style="color:#ef4444;font-size:17px;">${FormatUtils.formatTime(stats.worst)}</span></div>
                                <div style="margin:15px 0;border-top:2px solid var(--border-color);"></div>
                                <div class="stat-row"><span class="stat-label">Time Range</span><span class="stat-value" style="font-size:16px;">${FormatUtils.formatTime(stats.range)}</span></div>
                                <div class="stat-row"><span class="stat-label">IQR (Middle 50%)</span><span class="stat-value">${FormatUtils.formatTime(stats.iqr)}</span></div>
                                <div class="stat-row"><span class="stat-label">Consistency Score</span><span class="stat-value" style="color:${ratingColor};font-weight:700;">${consistencyPct.toFixed(1)}%</span></div>
                                <div class="stat-row"><span class="stat-label">Total Laps</span><span class="stat-value">${stats.lapCount}</span></div>
                                <div style="margin:20px 0;padding:15px;background:${ratingColor}15;border-left:4px solid ${ratingColor};border-radius:8px;">
                                    <div style="color:${ratingColor};font-weight:700;font-size:16px;">${ratingEmoji} ${rating}</div>
                                </div>
                                <div style="margin-top:15px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:13px;color:var(--text-secondary);">
                                    💡 <strong>Insight:</strong> ${advice}
                                </div>
                            `);
                        } else if (groupBy === 'byTrack') {
                            const range = value;
                            const trackName = label;
                            const trackMultiplier = getTrackDifficultyMultiplier(trackName);
                            // Adjust range based on track difficulty
                            // Divide by multiplier so difficult tracks (like Voltage with 1.25) get more lenient ratings
                            const adjustedRange = range / trackMultiplier;
                            
                            // Ultra-granular track-specific consistency ratings with 15 levels
                            // Now adjusted for track difficulty - difficult tracks allow wider variance
                            let rating, ratingColor, ratingEmoji, advice;
                            if (adjustedRange < 0.3) {
                                rating = 'Perfect Track Mastery';
                                ratingColor = '#047857';
                                ratingEmoji = '👑';
                                advice = trackMultiplier > 1.1 ? 
                                    `Unbelievable precision on this challenging track! You are completely immune to yellow flags and traffic.` :
                                    `Unbelievable precision on this track. You could drive it blindfolded!`;
                            } else if (adjustedRange < 0.5) {
                                rating = 'Exceptional Track Mastery';
                                ratingColor = '#059669';
                                ratingEmoji = '🏆';
                                advice = trackMultiplier > 1.1 ?
                                    `You know this challenging track extremely well. Yellow flags barely affect you!` :
                                    `You know this track extremely well. Perfect consistency!`;
                            } else if (adjustedRange < 0.8) {
                                rating = 'Elite Track Knowledge';
                                ratingColor = '#10b981';
                                ratingEmoji = '🌟';
                                advice = trackMultiplier > 1.1 ?
                                    `Excellent familiarity despite the track challenges. Very few mistakes.` :
                                    `Excellent familiarity with this track. Very few mistakes.`;
                            } else if (adjustedRange < 1.0) {
                                rating = 'Superb Track Control';
                                ratingColor = '#14b8a6';
                                ratingEmoji = '💎';
                                advice = trackMultiplier > 1.1 ?
                                    `You handle this challenging track well. Managing yellow flags effectively.` :
                                    `You have memorized this track. Now focus on shaving off tenths.`;
                            } else if (adjustedRange < 1.3) {
                                rating = 'Strong Track Performance';
                                ratingColor = '#22c55e';
                                ratingEmoji = '✨';
                                advice = trackMultiplier > 1.1 ?
                                    `Good track knowledge despite challenges. Keep adapting to yellow flags.` :
                                    `Good track knowledge. Keep practicing to perfect your line.`;
                            } else if (adjustedRange < 1.6) {
                                rating = 'Very Good Track Familiarity';
                                ratingColor = '#3b82f6';
                                ratingEmoji = '⭐';
                                advice = trackMultiplier > 1.1 ?
                                    `You know this track well. Minor refinements in yellow flag management will help.` :
                                    `You know this track well. Minor refinements will get you to elite level.`;
                            } else if (adjustedRange < 2.0) {
                                rating = 'Good Consistency';
                                ratingColor = '#84cc16';
                                ratingEmoji = '👍';
                                advice = trackMultiplier > 1.1 ?
                                    `Solid performance. Try to maintain pace during yellow flag periods.` :
                                    `Solid performance. Focus on maintaining rhythm throughout the lap.`;
                            } else if (adjustedRange < 2.3) {
                                rating = 'Comfortable on Track';
                                ratingColor = '#a3e635';
                                ratingEmoji = '👌';
                                advice = trackMultiplier > 1.1 ?
                                    `Track is becoming familiar. Yellow flags are still affecting consistency.` :
                                    `Track is becoming familiar. Work on consistent corner entry speeds.`;
                            } else if (adjustedRange < 2.7) {
                                rating = 'Developing Consistency';
                                ratingColor = '#bef264';
                                ratingEmoji = '📊';
                                advice = trackMultiplier > 1.1 ?
                                    `Getting comfortable. More practice will help you handle yellow flags better.` :
                                    `Getting comfortable with this track. More laps will help build muscle memory.`;
                            } else if (adjustedRange < 3.2) {
                                rating = 'Building Track Knowledge';
                                ratingColor = '#facc15';
                                ratingEmoji = '📈';
                                advice = trackMultiplier > 1.1 ?
                                    `You are learning this challenging track. Yellow flags are causing variance.` :
                                    `You are learning the track. Focus on one corner at a time to improve.`;
                            } else if (adjustedRange < 3.8) {
                                rating = 'Learning Phase';
                                ratingColor = '#eab308';
                                ratingEmoji = '⚠️';
                                advice = trackMultiplier > 1.1 ?
                                    `Still learning. Track complexity and yellow flags make this harder.` :
                                    `Still learning the track. Focus on finding consistent braking and turn-in points.`;
                            } else if (adjustedRange < 4.5) {
                                rating = 'Early Familiarity';
                                ratingColor = '#f59e0b';
                                ratingEmoji = '📉';
                                advice = trackMultiplier > 1.1 ?
                                    `Track needs more practice. Yellow flags and traffic are major factors.` :
                                    `Track needs more practice. Study your fastest lap sectors and try to replicate them.`;
                            } else if (adjustedRange < 5.5) {
                                rating = 'High Track Variance';
                                ratingColor = '#f97316';
                                ratingEmoji = '⚡';
                                advice = trackMultiplier > 1.1 ?
                                    `Large variation. This challenging track requires more experience to master.` :
                                    `Large variation on this track. Focus on consistency before pushing for speed.`;
                            } else if (range < 7.0) {
                                rating = 'Unfamiliar Track';
                                ratingColor = '#ef4444';
                                ratingEmoji = '❌';
                                advice = 'New to this track? Focus on learning one section at a time to build consistency.';
                            } else {
                                rating = 'Very New to Track';
                                ratingColor = '#dc2626';
                                ratingEmoji = '🚫';
                                advice = 'First time here? Take it slow, learn the layout, and the speed will come naturally.';
                            }
                            
                            statsPanel.setContent(`
                                <div class="stat-highlight"><div class="stat-row"><span class="stat-label">Driver</span><span class="stat-value" style="font-size:18px;">${dataPoint.dataset.label}</span></div></div>
                                <div class="stat-highlight"><div class="stat-row"><span class="stat-label">Track</span><span class="stat-value" style="font-size:18px;">${label}</span></div></div>
                                ${trackMultiplier > 1.0 ? `<div class="stat-row"><span class="stat-label">⚠️ Track Difficulty</span><span class="stat-value" style="color:#f59e0b;">Challenging (${trackMultiplier.toFixed(2)}x)</span></div>` : ''}
                                <div class="stat-row"><span class="stat-label">Time Variance</span><span class="stat-value" style="color:${ratingColor};font-size:17px;font-weight:700;">${FormatUtils.formatTime(range)}</span></div>
                                ${trackMultiplier > 1.0 ? `<div class="stat-row"><span class="stat-label">Adjusted Variance</span><span class="stat-value" style="font-size:15px;">${FormatUtils.formatTime(adjustedRange)}</span></div>` : ''}
                                <div style="margin:20px 0;padding:15px;background:${ratingColor}15;border-left:4px solid ${ratingColor};border-radius:8px;">
                                    <div style="color:${ratingColor};font-weight:700;font-size:16px;">${ratingEmoji} ${rating}</div>
                                </div>
                                <div style="margin-top:15px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:13px;color:var(--text-secondary);">
                                    💡 <strong>Track Tip:</strong> ${advice}
                                </div>
                                ${trackMultiplier > 1.0 ? `<div style="margin-top:10px;padding:10px;background:#f59e0b15;border-left:3px solid #f59e0b;border-radius:6px;font-size:12px;color:var(--text-secondary);">ℹ️ This track has frequent yellow flags and traffic, so wider lap time variance is expected.</div>` : ''}
                            `);
                        }
                    },
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                    borderWidth: 2,
                    padding: 18,
                    titleFont: {
                        size: 18,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 16
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            
                            if (groupBy === 'overall' && context.datasetIndex === 2) {
                                // Worst lap dataset has the stats
                                const stats = context.dataset.driverStats[context.dataIndex];
                                if (!stats) return 'No data';
                                
                                return [
                                    `${context.dataset.label}: ${value.toFixed(3)}s`,
                                    '',
                                    `🏆 Best Lap: ${stats.best.toFixed(3)}s`,
                                    `� Average: ${stats.mean.toFixed(3)}s`,
                                    `� Worst: ${stats.worst.toFixed(3)}s`,
                                    `📏 Range: ${stats.range.toFixed(3)}s`,
                                    `📦 IQR: ${stats.iqr.toFixed(3)}s`,
                                    `🔢 Total Laps: ${stats.lapCount}`,
                                    '',
                                    stats.range < 1 ? '🌟 Excellent Consistency!' :
                                    stats.range < 2 ? '✨ Very Consistent' :
                                    stats.range < 3 ? '👍 Good Consistency' :
                                    '⚠️ Variable Performance'
                                ];
                            }
                            
                            if (groupBy === 'byTrack') {
                                const range = value;
                                return [
                                    `${context.dataset.label}: ${range.toFixed(3)}s range`,
                                    range < 1 ? '🌟 Excellent!' :
                                    range < 2 ? '✨ Very Good' :
                                    range < 3 ? '👍 Good' : '⚠️ Variable'
                                ];
                            }
                            
                            return `${context.dataset.label}: ${value.toFixed(3)}s`;
                        }
                    }
                }
            }
        }
    });
}

// 1.5 Improvement Over Laps Chart - CLEAN BAR CHART PER DRIVER-TRACK
function createImprovementChart() {
    const ctx = document.getElementById('improvementChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const selectedDriver = document.getElementById('improvementDriverSelect')?.value;
    const selectedTrack = document.getElementById('improvementTrackSelect')?.value;
    
    // Require both driver and track selection for cleaner visualization
    if (!selectedDriver || selectedDriver === 'all' || !selectedTrack || selectedTrack === 'all') {
        // Show empty state with instruction
        destroyChart('improvement');
        const { StatsPanelHelper } = window.ChartUtils;
        const statsPanel = new StatsPanelHelper('improvementStatsPanel');
        statsPanel.showEmptyState('fa-filter', 'Please select a specific driver AND track to see lap-by-lap improvement analysis');
        return;
    }
    
    const { StatsPanelHelper, FormatUtils } = window.ChartUtils;
    const statsPanel = new StatsPanelHelper('improvementStatsPanel');
    
    // Get laps for selected driver and track
    let trackLaps = filteredData.filter(row => 
        row.Driver === selectedDriver && 
        row.Track === selectedTrack &&
        parseFloat(row.LapTime || 0) > 0
    );
    
    if (trackLaps.length < 5) {
        destroyChart('improvement');
        statsPanel.showEmptyState('fa-exclamation-triangle', 'Not enough laps for this driver-track combination (need at least 5)');
        return;
    }
    
    // Sort chronologically
    trackLaps = trackLaps
        .map(row => ({
            date: row.SessionDate || row.Date,
            lapTime: parseFloat(row.LapTime),
            track: row.Track,
            driver: row.Driver,
            originalLapNumber: parseInt(row.LapNumber || 0),
            sessionId: `${row.Date}-${row.Heat}`
        }))
        .sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.originalLapNumber - b.originalLapNumber;
        });
    
    // Calculate track average
    const allLapTimes = trackLaps.map(l => l.lapTime);
    const trackAverage = allLapTimes.reduce((sum, t) => sum + t, 0) / allLapTimes.length;
    const personalBest = Math.min(...allLapTimes);
    
    // Build lap data with colors based on performance
    const lapData = trackLaps.map((lap, lapIndex) => {
        const cumulativeLapNumber = lapIndex + 1;
        const improvement = trackAverage - lap.lapTime; // Positive = faster
        const improvementPercent = (improvement / trackAverage) * 100;
        
        // Color based on performance
        let barColor;
        if (improvement > 1.5) barColor = '#059669'; // Exceptional
        else if (improvement > 0.7) barColor = '#10b981'; // Great
        else if (improvement > 0.3) barColor = '#22c55e'; // Solid
        else if (improvement > 0.1) barColor = '#84cc16'; // Good
        else if (improvement > -0.1) barColor = '#eab308'; // Average
        else if (improvement > -0.5) barColor = '#f59e0b'; // Below
        else if (improvement > -1.0) barColor = '#ef4444'; // Poor
        else barColor = '#dc2626'; // Very poor
        
        return {
            lapNumber: cumulativeLapNumber,
            lapTime: lap.lapTime,
            improvement: improvement,
            improvementPercent: improvementPercent,
            trackAverage: trackAverage,
            personalBest: personalBest,
            date: lap.date,
            sessionId: lap.sessionId,
            track: lap.track,
            driver: lap.driver,
            color: barColor
        };
    });
    
    const labels = lapData.map(d => `Lap ${d.lapNumber}`);
    const colors = lapData.map(d => d.color);

    destroyChart('improvement');
    charts.improvement = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `${selectedDriver} @ ${selectedTrack}`,
                data: lapData.map(d => d.improvement),
                backgroundColor: colors,
                borderColor: colors.map(c => c + 'DD'),
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.85,
                categoryPercentage: 0.9,
                lapDetails: lapData
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const detail = lapData[dataIndex];
                    showLapDetails(detail, statsPanel, FormatUtils);
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 15,
                        boxWidth: 0, // Hide color box since bars are colored individually
                        usePointStyle: false
                    }
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        const tooltipModel = context.tooltip;
                        
                        if (tooltipModel.opacity === 0 || !tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) {
                            statsPanel.showEmptyState('fa-mouse-pointer', 'Hover over or click bars to see lap details');
                            return;
                        }
                        
                        const dataIndex = tooltipModel.dataPoints[0].dataIndex;
                        const detail = lapData[dataIndex];
                        showLapDetails(detail, statsPanel, FormatUtils);
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Improvement vs Track Average',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 16,
                            weight: '600'
                        }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 13
                        },
                        callback: function(value) {
                            return value !== null && value !== undefined ? (value >= 0 ? '+' : '') + value.toFixed(2) + 's' : 'N/A';
                        },
                        padding: 10
                    },
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 0) {
                                return 'rgba(34, 197, 94, 0.5)'; // Green zero line
                            }
                            return getComputedStyle(document.documentElement).getPropertyValue('--border-color') + '40';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 0) return 3;
                            return 1;
                        },
                        drawBorder: false
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Lap Progression (Chronological)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 16,
                            weight: '600'
                        }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 30,
                        padding: 8
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}

// Helper function to show lap details
function showLapDetails(detail, statsPanel, FormatUtils) {
    // Determine rating based on improvement
    let rating, ratingColor, ratingEmoji, advice;
    if (detail.improvement > 1.5) {
        rating = 'Exceptional Lap!';
        ratingColor = '#059669';
        ratingEmoji = '🏆';
        advice = 'Outstanding! Significantly faster than your track average.';
    } else if (detail.improvement > 0.7) {
        rating = 'Great Lap';
        ratingColor = '#10b981';
        ratingEmoji = '🌟';
        advice = 'Strong performance! Well above your average pace.';
    } else if (detail.improvement > 0.3) {
        rating = 'Solid Lap';
        ratingColor = '#22c55e';
        ratingEmoji = '✨';
        advice = 'Good lap! Beating your average comfortably.';
    } else if (detail.improvement > 0.1) {
        rating = 'Above Average';
        ratingColor = '#84cc16';
        ratingEmoji = '👍';
        advice = 'Slightly faster than your typical pace.';
    } else if (detail.improvement > -0.1) {
        rating = 'Average Pace';
        ratingColor = '#eab308';
        ratingEmoji = '➡️';
        advice = 'Right on your average pace.';
    } else if (detail.improvement > -0.5) {
        rating = 'Slight Drop';
        ratingColor = '#f59e0b';
        ratingEmoji = '⚠️';
        advice = 'A bit slower than usual. Stay focused!';
    } else if (detail.improvement > -1.0) {
        rating = 'Below Average';
        ratingColor = '#ef4444';
        ratingEmoji = '📉';
        advice = 'Slower lap. Review what happened.';
    } else {
        rating = 'Poor Lap';
        ratingColor = '#dc2626';
        ratingEmoji = '🔻';
        advice = 'Significantly slower. Likely an incident or issue.';
    }
    
    statsPanel.setContent(`
        <div class="stat-highlight">
            <div class="stat-row">
                <span class="stat-label"><i class="fas fa-user"></i> Driver</span>
                <span class="stat-value" style="font-size:16px;">${detail.driver}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label"><i class="fas fa-map-marker-alt"></i> Track</span>
                <span class="stat-value" style="font-size:16px;">${detail.track}</span>
            </div>
        </div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-flag-checkered"></i> Lap Number</span>
            <span class="stat-value" style="font-size:20px;font-weight:700;">#${detail.lapNumber}</span>
        </div>
        ${detail.date ? `<div class="stat-row">
            <span class="stat-label"><i class="fas fa-calendar"></i> Date</span>
            <span class="stat-value">${detail.date}</span>
        </div>` : ''}
        ${detail.sessionId ? `<div class="stat-row">
            <span class="stat-label"><i class="fas fa-flag"></i> Session</span>
            <span class="stat-value">${detail.sessionId}</span>
        </div>` : ''}
        <div style="margin:15px 0;border-top:2px solid var(--border-color);"></div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-stopwatch"></i> Lap Time</span>
            <span class="stat-value" style="font-size:18px;font-weight:700;color:#3b82f6;">${FormatUtils.formatTime(detail.lapTime)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-chart-line"></i> Track Average</span>
            <span class="stat-value" style="color:#f59e0b;">${FormatUtils.formatTime(detail.trackAverage)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-trophy"></i> Personal Best</span>
            <span class="stat-value" style="color:#10b981;">${FormatUtils.formatTime(detail.personalBest)}</span>
        </div>
        <div style="margin:15px 0;border-top:2px solid var(--border-color);"></div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-tachometer-alt"></i> Improvement</span>
            <span class="stat-value" style="font-size:18px;font-weight:700;color:${ratingColor};">${detail.improvement >= 0 ? '+' : ''}${FormatUtils.formatTime(detail.improvement)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label"><i class="fas fa-percentage"></i> Improvement %</span>
            <span class="stat-value" style="font-size:16px;color:${ratingColor};">${detail.improvementPercent !== null && detail.improvementPercent !== undefined ? (detail.improvementPercent >= 0 ? '+' : '') + detail.improvementPercent.toFixed(2) + '%' : 'N/A'}</span>
        </div>
        <div class="stat-row" style="font-size:12px;color:var(--text-secondary);margin-top:8px;">
            <span style="font-style:italic;">vs Your Track Average</span>
        </div>
        <div style="margin:20px 0;padding:15px;background:${ratingColor}15;border-left:4px solid ${ratingColor};border-radius:8px;">
            <div style="color:${ratingColor};font-weight:700;font-size:16px;">${ratingEmoji} ${rating}</div>
        </div>
        <div style="margin-top:15px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:13px;color:var(--text-secondary);">
            💡 <strong>Insight:</strong> ${advice}
        </div>
    `);
}

// 1.6 Lap Time Distribution Per Track - REDESIGNED
function createLapDistributionChart() {
    const ctx = document.getElementById('lapDistributionChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const selectedDriver = document.getElementById('distributionDriverSelect')?.value;
    const driversToShow = selectedDriver && selectedDriver !== 'all' ? [selectedDriver] : 
                         [...new Set(filteredData.map(row => row.Driver))].slice(0, 3);
    
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    const { StatsPanelHelper, FormatUtils } = window.ChartUtils;
    const statsPanel = new StatsPanelHelper('lapDistributionStatsPanel');
    
    // Create datasets showing lap time distribution PER TRACK for each driver
    // Each bar shows Q1-Q3 (middle 50%), with data stored for wicks
    const datasets = driversToShow.map((driver, driverIndex) => {
        const trackData = tracks.map(track => {
            const trackLaps = filteredData
                .filter(row => row.Driver === driver && row.Track === track)
                .map(row => parseFloat(row.LapTime || 0))
                .filter(time => time > 0 && time < 200)
                .sort((a, b) => a - b);
            
            if (trackLaps.length < 3) return null;
            
            // Calculate statistics
            const q1Index = Math.floor(trackLaps.length * 0.25);
            const q2Index = Math.floor(trackLaps.length * 0.50);
            const q3Index = Math.floor(trackLaps.length * 0.75);
            
            const min = trackLaps[0]; // PB (fastest = lower limit)
            const q1 = trackLaps[q1Index];
            const median = trackLaps[q2Index];
            const q3 = trackLaps[q3Index];
            const max = trackLaps[trackLaps.length - 1]; // Slowest (upper limit)
            const mean = trackLaps.reduce((sum, time) => sum + time, 0) / trackLaps.length;
            const range = max - min;
            const iqr = q3 - q1;
            
            return { min, q1, median, q3, max, mean, range, iqr, lapCount: trackLaps.length };
        });
        
        return {
            label: driver,
            // Data points for positioning only (won't be visible)
            data: trackData.map(d => d ? d.q1 : null),
            backgroundColor: window.getDriverColor(driver) + '00', // Fully transparent
            borderColor: window.getDriverColor(driver) + '00', // Fully transparent
            borderWidth: 0,
            trackStats: trackData, // Store complete stats
            actualColor: window.getDriverColor(driver), // Store actual color for plugin
            barThickness: 'flex',
            maxBarThickness: 60
        };
    });

    // Calculate min/max across all datasets for proper Y-axis scaling
    let globalMin = Infinity;
    let globalMax = -Infinity;
    datasets.forEach(dataset => {
        dataset.trackStats.forEach(stats => {
            if (stats) {
                globalMin = Math.min(globalMin, stats.min);
                globalMax = Math.max(globalMax, stats.max);
            }
        });
    });
    
    // Add 5% padding to ensure wicks don't extend outside
    const range = globalMax - globalMin;
    const yMin = globalMin - range * 0.05;
    const yMax = globalMax + range * 0.05;

    destroyChart('lapDistribution');
    charts.lapDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tracks,
            datasets: datasets
        },
        plugins: [{
            id: 'boxPlot',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                // Draw box plot elements for each bar
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (meta.hidden || !dataset.trackStats) return;
                    
                    meta.data.forEach((bar, index) => {
                        const stats = dataset.trackStats[index];
                        if (!stats) return;
                        
                        const x = bar.x;
                        const barWidth = bar.width;
                        
                        // Calculate Y positions
                        const yMin = yAxis.getPixelForValue(stats.min); // Bottom (PB - fastest)
                        const yMax = yAxis.getPixelForValue(stats.max); // Top (slowest)
                        const yQ1 = yAxis.getPixelForValue(stats.q1);
                        const yQ3 = yAxis.getPixelForValue(stats.q3);
                        const yMean = yAxis.getPixelForValue(stats.mean);
                        
                        const barColor = dataset.actualColor || dataset.borderColor;
                        
                        ctx.save();
                        ctx.strokeStyle = barColor;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([]);
                        
                        // Draw the box (Q1 to Q3) - middle 50% of data
                        ctx.fillStyle = barColor + 'DD';
                        ctx.fillRect(x - barWidth / 2, yQ3, barWidth, yQ1 - yQ3);
                        ctx.strokeRect(x - barWidth / 2, yQ3, barWidth, yQ1 - yQ3);
                        
                        // Upper whisker (Q3 to max)
                        ctx.beginPath();
                        ctx.moveTo(x, yQ3);
                        ctx.lineTo(x, yMax);
                        ctx.stroke();
                        
                        // Lower whisker (Q1 to min/PB)
                        ctx.beginPath();
                        ctx.moveTo(x, yQ1);
                        ctx.lineTo(x, yMin);
                        ctx.stroke();
                        
                        // Caps
                        const capWidth = barWidth * 0.4;
                        ctx.lineWidth = 3;
                        
                        // Top cap (slowest)
                        ctx.beginPath();
                        ctx.moveTo(x - capWidth / 2, yMax);
                        ctx.lineTo(x + capWidth / 2, yMax);
                        ctx.stroke();
                        
                        // Bottom cap (PB)
                        ctx.beginPath();
                        ctx.moveTo(x - capWidth / 2, yMin);
                        ctx.lineTo(x + capWidth / 2, yMin);
                        ctx.stroke();
                        
                        // Draw GOLD line for MEAN (average)
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = '#FFD700';
                        ctx.shadowColor = '#FFD700';
                        ctx.shadowBlur = 4;
                        ctx.beginPath();
                        ctx.moveTo(x - barWidth / 2, yMean);
                        ctx.lineTo(x + barWidth / 2, yMean);
                        ctx.stroke();
                        
                        ctx.restore();
                    });
                });
            }
        }],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index', // Better for bar charts - matches entire x-axis position
                intersect: false // Don't require hovering directly on bar
            },
            layout: {
                padding: {
                    top: 40,
                    right: 40,
                    bottom: 30,
                    left: 30
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yMin,
                    max: yMax,
                    title: {
                        display: true,
                        text: 'Lap Time (seconds) - Box Plot',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 16
                        },
                        padding: 10,
                        stepSize: 1, // More space between tick marks
                        callback: function(value) {
                            return value !== null && value !== undefined ? value.toFixed(2) + 's' : 'N/A';
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') + '50'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Track',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 15, bottom: 0 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 16
                        },
                        padding: 10
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 16
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            // Add explanation items for box plot structure
                            return [
                                ...original,
                                {
                                    text: '━━ Box: Q1-Q3 (middle 50% of laps)',
                                    fillStyle: 'rgba(74, 158, 255, 0.3)',
                                    strokeStyle: '#4a9eff',
                                    lineWidth: 2,
                                    hidden: false,
                                    index: 999
                                },
                                {
                                    text: '━━ Gold Line: Mean (Average lap time)',
                                    fillStyle: '#FFD700',
                                    strokeStyle: '#FFD700',
                                    lineWidth: 3,
                                    hidden: false,
                                    index: 1000
                                },
                                {
                                    text: '│ Whiskers: PB (min) ↔ Slowest (max)',
                                    fillStyle: 'transparent',
                                    strokeStyle: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                                    lineWidth: 2,
                                    hidden: false,
                                    index: 1001
                                }
                            ];
                        }
                    }
                },
                tooltip: {
                    enabled: false, // Disable default tooltip, use side panel
                    external: function(context) {
                        const tooltipModel = context.tooltip;
                        const statsContent = document.getElementById('lapDistributionStatsContent');
                        
                        if (!statsContent) return;
                        
                        // Hide if no tooltip
                        if (tooltipModel.opacity === 0) {
                            statsContent.innerHTML = `
                                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                                    <i class="fas fa-mouse-pointer" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                                    <p>Hover over bars to see detailed lap time statistics</p>
                                </div>
                            `;
                            return;
                        }
                        
                        if (tooltipModel.dataPoints && tooltipModel.dataPoints.length > 0) {
                            const dataPoint = tooltipModel.dataPoints[0];
                            const dataset = dataPoint.dataset;
                            const stats = dataset.trackStats?.[dataPoint.dataIndex];
                            
                            if (!stats) {
                                statsContent.innerHTML = `
                                    <div class="stat-highlight">
                                        <div class="stat-label" style="color: var(--text-secondary);">No data available</div>
                                        <div class="stat-value">Need 3+ laps</div>
                                    </div>
                                `;
                                return;
                            }
                            
                            const driver = dataset.label;
                            const track = dataPoint.label;
                            
                            // Calculate consistency rating
                            let consistencyRating, consistencyColor, consistencyEmoji;
                            if (stats.iqr < 0.5) {
                                consistencyRating = 'Excellent!';
                                consistencyColor = '#10b981';
                                consistencyEmoji = '🌟';
                            } else if (stats.iqr < 1.0) {
                                consistencyRating = 'Very Consistent';
                                consistencyColor = '#22c55e';
                                consistencyEmoji = '✨';
                            } else if (stats.iqr < 1.5) {
                                consistencyRating = 'Good';
                                consistencyColor = '#84cc16';
                                consistencyEmoji = '👍';
                            } else if (stats.iqr < 2.0) {
                                consistencyRating = 'Moderate Variance';
                                consistencyColor = '#eab308';
                                consistencyEmoji = '⚠️';
                            } else {
                                consistencyRating = 'High Variance';
                                consistencyColor = '#ef4444';
                                consistencyEmoji = '❌';
                            }
                            
                            let html = `
                                <div class="stat-highlight" style="margin-bottom: 20px;">
                                    <div class="stat-row">
                                        <span class="stat-label"><i class="fas fa-user"></i> Driver</span>
                                        <span class="stat-value">${driver}</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="stat-label"><i class="fas fa-map-marker-alt"></i> Track</span>
                                        <span class="stat-value" style="font-size: 14px;">${track}</span>
                                    </div>
                                </div>
                                
                                <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 12px; font-size: 16px;">
                                    <i class="fas fa-chart-bar"></i> Lap Time Distribution
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-trophy" style="color: #FFD700;"></i> Best Lap</span>
                                    <span class="stat-value" style="color: #10b981;">${stats.min !== null && stats.min !== undefined ? stats.min.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-box"></i> Q1 (25%)</span>
                                    <span class="stat-value">${stats.q1 !== null && stats.q1 !== undefined ? stats.q1.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-chart-line" style="color: #FFD700;"></i> Median</span>
                                    <span class="stat-value" style="font-weight: 800; color: #FFD700;">${stats.median !== null && stats.median !== undefined ? stats.median.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-calculator"></i> Mean (Avg)</span>
                                    <span class="stat-value">${stats.mean !== null && stats.mean !== undefined ? stats.mean.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-box"></i> Q3 (75%)</span>
                                    <span class="stat-value">${stats.q3 !== null && stats.q3 !== undefined ? stats.q3.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-arrow-up" style="color: #ef4444;"></i> Worst Lap</span>
                                    <span class="stat-value" style="color: #ef4444;">${stats.max !== null && stats.max !== undefined ? stats.max.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div style="margin: 20px 0; border-top: 2px solid var(--border-color);"></div>
                                
                                <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 12px; font-size: 16px;">
                                    <i class="fas fa-chart-area"></i> Consistency Metrics
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-arrows-alt-v"></i> Range</span>
                                    <span class="stat-value">${stats.range !== null && stats.range !== undefined ? stats.range.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-compress-arrows-alt"></i> IQR (Spread)</span>
                                    <span class="stat-value">${stats.iqr !== null && stats.iqr !== undefined ? stats.iqr.toFixed(3) + 's' : 'N/A'}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-list-ol"></i> Total Laps</span>
                                    <span class="stat-value">${stats.lapCount}</span>
                                </div>
                                
                                <div style="margin-top: 20px; padding: 15px; background: ${consistencyColor}15; border-left: 4px solid ${consistencyColor}; border-radius: 8px;">
                                    <div style="color: ${consistencyColor}; font-weight: 700; font-size: 15px;">
                                        ${consistencyEmoji} ${consistencyRating}
                                    </div>
                                </div>
                            `;
                            
                            statsContent.innerHTML = html;
                        }
                    }
                },
                onHover: (event, activeElements, chart) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                    
                    if (activeElements.length > 0) {
                        chart.tooltip.setActiveElements(activeElements, {x: event.x, y: event.y});
                        chart.update('none');
                    }
                }
            }
        }
    });
}

// 1.7 Best Lap Heatmap - BEST IN CLASS KARTING HEATMAP
function createBestLapHeatmap() {
    const container = document.getElementById('bestLapHeatmap');
    if (!container) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    // Calculate comprehensive data for each driver-track combination
    const heatmapData = [];
    let globalMin = Infinity;
    let globalMax = 0;
    
    drivers.forEach(driver => {
        tracks.forEach(track => {
            const data = filteredData.filter(row => row.Driver === driver && row.Track === track);
            const lapTimes = data.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            
            if (lapTimes.length > 0) {
                const bestLap = Math.min(...lapTimes);
                const avgLap = lapTimes.reduce((sum, t) => sum + t, 0) / lapTimes.length;
                const worstLap = Math.max(...lapTimes);
                
                globalMin = Math.min(globalMin, bestLap);
                globalMax = Math.max(globalMax, bestLap);
                
                heatmapData.push({
                    driver,
                    track,
                    bestLap,
                    avgLap,
                    worstLap,
                    lapCount: lapTimes.length,
                    consistency: worstLap - bestLap
                });
            } else {
                heatmapData.push({
                    driver,
                    track,
                    bestLap: null,
                    avgLap: null,
                    worstLap: null,
                    lapCount: 0,
                    consistency: 0
                });
            }
        });
    });

    // Calculate track records
    const trackRecords = {};
    tracks.forEach(track => {
        const trackTimes = heatmapData.filter(d => d.track === track && d.bestLap !== null);
        if (trackTimes.length > 0) {
            trackRecords[track] = Math.min(...trackTimes.map(d => d.bestLap));
        }
    });

    // Build enhanced heatmap with explanations
    let html = `
        <div class="heatmap-container">
            <div class="heatmap-explanation" style="padding: 20px; background: var(--card-bg); border-radius: 12px; margin-bottom: 20px; border: 2px solid var(--border-color);">
                <h3 style="margin-top: 0; color: var(--text-primary); font-size: 18px;">🏁 Best Lap Time Heatmap - Performance Overview</h3>
                <p style="color: var(--text-secondary); margin: 12px 0; line-height: 1.6;">
                    This heatmap shows each driver's <strong>best lap time</strong> at each track. Colors indicate relative performance:
                </p>
                <ul style="color: var(--text-secondary); margin: 10px 0; padding-left: 25px; line-height: 1.8;">
                    <li><strong style="color: #059669;">🟢 Dark Green</strong> = 0.1s or less from record</li>
                    <li><strong style="color: #10b981;">🟢 Green</strong> = 0.25s or less from record</li>
                    <li><strong style="color: #84cc16;">🟢 Light Green</strong> = Within 0.5s of record</li>
                    <li><strong style="color: #fbbf24;">🟡 Yellow</strong> = Within 1.0s of record</li>
                    <li><strong style="color: #f97316;">🟠 Orange</strong> = Within 2.5s of record</li>
                    <li><strong style="color: #dc2626;">🔴 Red</strong> = More than 2.5s off record</li>
                </ul>
                <p style="color: var(--text-secondary); margin: 12px 0; font-size: 16px;">
                    💡 <strong>Tip:</strong> Hover over cells for detailed statistics. 🏆 Gold borders indicate track records.
                </p>
            </div>
            
            <div class="heatmap-grid" style="grid-template-columns: 150px repeat(${tracks.length}, minmax(120px, 1fr)); gap: 3px; background: var(--border-color); padding: 3px; border-radius: 10px;">
    `;
    
    // Header row - SIMPLIFIED COLORS
    html += '<div class="heatmap-cell header-cell" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; font-weight: bold; padding: 15px 10px; border-radius: 6px; font-size: 18px;">Driver / Track</div>';
    tracks.forEach(track => {
        const record = trackRecords[track];
        // Calculate average lap time for this track
        const trackData = heatmapData.filter(d => d.track === track && d.avgLap !== null);
        const overallAvg = trackData.length > 0 
            ? trackData.reduce((sum, d) => sum + d.avgLap, 0) / trackData.length 
            : null;
        
        html += `<div class="heatmap-cell header-cell" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; font-weight: bold; padding: 15px 8px; border-radius: 6px; font-size: 14px; text-align: center;">
            ${track}<br>
            <small style="font-size: 11px; opacity: 0.9; font-weight: 400;">📊 ${overallAvg ? overallAvg.toFixed(3) + 's' : 'N/A'}</small>
        </div>`;
    });
    
    // Data rows - SIMPLIFIED DRIVER COLORS
    drivers.forEach((driver, driverIndex) => {
        // Use simpler gray tones for driver names instead of bright colors
        const driverBg = driverIndex % 2 === 0 ? '#475569' : '#64748b';
        html += `<div class="heatmap-cell row-header" style="background: ${driverBg}; color: white; font-weight: 600; padding: 12px 10px; border-radius: 6px; font-size: 16px;">${driver}</div>`;
        
        tracks.forEach(track => {
            const cellData = heatmapData.find(d => d.driver === driver && d.track === track);
            const record = trackRecords[track];
            let style = 'background: #1e293b; color: var(--text-secondary);';
            let content = '<span style="font-size: 12px;">No Data</span>';
            let diff = null;
            let isRecord = false;
            
            if (cellData && cellData.bestLap !== null) {
                diff = cellData.bestLap - record;
                
                // PRECISE COLOR SCHEME per user requirements
                let bgColor = '#dc2626'; // Red - above 2.5s
                if (diff <= 0.1) bgColor = '#059669'; // Dark green - 0.1s or less
                else if (diff <= 0.25) bgColor = '#10b981'; // Green - 0.25s or less
                else if (diff <= 0.5) bgColor = '#84cc16'; // Light green - within 0.5s
                else if (diff <= 1.0) bgColor = '#fbbf24'; // Yellow - within 1s
                else if (diff <= 2.5) bgColor = '#f97316'; // Orange - within 2.5s
                // else >2.5s = red
                
                isRecord = cellData.bestLap === record;
                
                // KEEP gold border for records permanently
                style = `background: ${bgColor}; color: white; font-weight: ${isRecord ? 'bold' : '500'}; ${isRecord ? 'box-shadow: 0 0 0 3px gold inset, 0 4px 12px rgba(255, 215, 0, 0.4);' : ''}`;
                content = `
                    <div style="font-size: 16px; font-weight: bold;">${isRecord ? '🏆 ' : ''}${cellData.bestLap.toFixed(3)}s</div>
                    <div style="font-size: 11px; opacity: 0.95; margin-top: 3px;">${cellData.lapCount} laps</div>
                    <div style="font-size: 10px; opacity: 0.85; margin-top: 2px;">${diff > 0 ? '+' : ''}${diff.toFixed(3)}s</div>
                `;
            }
            
            const tooltip = cellData && cellData.bestLap ? 
                `${driver} at ${track}\nBest: ${cellData.bestLap.toFixed(3)}s\nAvg: ${cellData.avgLap.toFixed(3)}s\nWorst: ${cellData.worstLap.toFixed(3)}s\nLaps: ${cellData.lapCount}\nConsistency: ${cellData.consistency.toFixed(3)}s range` :
                `${driver} at ${track}: No data`;
            
            // Keep gold border on hover, don't remove it
            const cellDataJSON = cellData && cellData.bestLap !== null ? JSON.stringify({
                driver: driver,
                track: track,
                bestLap: cellData.bestLap,
                avgLap: cellData.avgLap,
                worstLap: cellData.worstLap,
                lapCount: cellData.lapCount,
                consistency: cellData.consistency,
                record: record,
                diff: diff,
                isRecord: isRecord
            }).replace(/"/g, '&quot;') : null;
            
            html += `<div class="heatmap-cell data-cell" data-cell-info='${cellDataJSON || '{}'}' style="${style} padding: 10px 8px; border-radius: 6px; text-align: center; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">${content}</div>`;
        });
    });
    
    html += '</div></div>';
    
    container.innerHTML = html;
    
    // Add stats panel interaction
    const statsPanel = document.getElementById('heatmapStatsPanel');
    const statsContent = document.getElementById('heatmapStatsContent');
    
    if (statsPanel && statsContent) {
        const cells = container.querySelectorAll('.heatmap-cell.data-cell[data-cell-info]');
        
        cells.forEach(cell => {
            cell.addEventListener('mouseenter', function() {
                const data = JSON.parse(this.getAttribute('data-cell-info') || '{}');
                if (!data.driver) return;
                
                statsPanel.style.display = 'flex';
                
                const diffColor = data.diff < 0.5 ? '#10b981' : data.diff < 1 ? '#22c55e' : data.diff < 2 ? '#eab308' : '#ef4444';
                const rating = data.diff < 0.1 ? '🌟 Elite' : data.diff < 0.5 ? '✨ Excellent' : data.diff < 1 ? '👍 Very Good' : data.diff < 2 ? '📊 Good' : '⚠️ Off Pace';
                
                statsContent.innerHTML = `
                    <div class="stat-highlight">
                        <div class="stat-row"><span class="stat-label">Driver</span><span class="stat-value" style="font-size:18px;">${data.driver || 'N/A'}</span></div>
                        <div class="stat-row"><span class="stat-label">Track</span><span class="stat-value" style="font-size:18px;">${data.track || 'N/A'}</span></div>
                    </div>
                    ${data.isRecord ? '<div style="margin:15px 0;padding:15px;background:#FFD70020;border-left:4px solid #FFD700;border-radius:8px;color:#FFD700;font-weight:700;font-size:16px;">🏆 TRACK RECORD HOLDER!</div>' : ''}
                    <div class="stat-row"><span class="stat-label">Best Lap</span><span class="stat-value" style="color:#10b981;font-size:18px;font-weight:700;">${data.bestLap ? data.bestLap.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div class="stat-row"><span class="stat-label">Average Lap</span><span class="stat-value" style="font-size:16px;">${data.avgLap ? data.avgLap.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div class="stat-row"><span class="stat-label">Worst Lap</span><span class="stat-value" style="color:#ef4444;font-size:16px;">${data.worstLap ? data.worstLap.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div style="margin:15px 0;border-top:2px solid var(--border-color);"></div>
                    <div class="stat-row"><span class="stat-label">Track Record</span><span class="stat-value" style="color:#ff0000;font-size:17px;font-weight:700;">${data.record ? data.record.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div class="stat-row"><span class="stat-label">Gap to Record</span><span class="stat-value" style="color:${diffColor};font-size:17px;font-weight:600;">+${data.diff ? data.diff.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div class="stat-row"><span class="stat-label">Consistency Range</span><span class="stat-value">${data.consistency ? data.consistency.toFixed(3) + 's' : 'N/A'}</span></div>
                    <div class="stat-row"><span class="stat-label">Total Laps</span><span class="stat-value">${data.lapCount || 0}</span></div>
                    <div style="margin-top:20px;padding:15px;background:${diffColor}15;border-left:4px solid ${diffColor};border-radius:8px;color:${diffColor};font-weight:700;">${rating}</div>
                `;
                
                // Scale animation
                this.style.transform = 'scale(1.05)';
                if (!this.style.boxShadow.includes('gold')) {
                    this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                }
            });
            
            cell.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                if (!this.style.boxShadow.includes('gold')) {
                    this.style.boxShadow = 'none';
                }
            });
        });
    }
}

// 1.8 Start vs End Pace Analysis Chart - COMPLETELY REDESIGNED
function createPaceAnalysisChart() {
    const ctx = document.getElementById('paceAnalysisChart');
    if (!ctx) return;

    const filteredData = window.filteredData || [];
    if (filteredData.length === 0) return;

    const { StatsPanelHelper, FormatUtils } = window.ChartUtils;
    const statsPanel = new StatsPanelHelper('paceStatsPanel');
    
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))];
    
    const paceData = [];
    
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
            const startPace = startPaceSum / validSessions;
            const endPace = endPaceSum / validSessions;
            const degradation = endPace - startPace;
            const degradationPercent = (degradation / startPace) * 100;
            
            paceData.push({
                driver,
                startPace,
                endPace,
                degradation,
                degradationPercent,
                sessions: validSessions
            });
        }
    });

    // Create scatter plot showing degradation pattern
    const scatterData = paceData.map((d, index) => ({
        x: d.startPace,
        y: d.endPace,
        driver: d.driver,
        degradation: d.degradation,
        degradationPercent: d.degradationPercent,
        sessions: d.sessions,
        color: window.getDriverColor(d.driver)
    }));

    destroyChart('paceAnalysis');
    charts.paceAnalysis = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pace Comparison',
                data: scatterData,
                backgroundColor: scatterData.map(d => d.color + 'CC'),
                borderColor: scatterData.map(d => d.color),
                borderWidth: 3,
                pointRadius: 12,
                pointHoverRadius: 16,
                pointStyle: 'circle'
            }, {
                label: 'No Change Line (Start = End)',
                data: [{x: Math.min(...scatterData.map(d => d.x)) - 1, y: Math.min(...scatterData.map(d => d.x)) - 1}, 
                       {x: Math.max(...scatterData.map(d => d.x)) + 1, y: Math.max(...scatterData.map(d => d.x)) + 1}],
                type: 'line',
                borderColor: '#94a3b8',
                borderWidth: 2,
                borderDash: [8, 4],
                pointRadius: 0,
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 60,
                    right: 60,
                    bottom: 35,
                    left: 35
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Start Pace - Avg First 1/3 of Session (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 15, bottom: 0 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 13
                        },
                        padding: 10
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') + '50',
                        lineWidth: 1.5
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'End Pace - Avg Last 1/3 of Session (seconds)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 15 }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 13
                        },
                        padding: 10
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') + '50',
                        lineWidth: 1.5
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            weight: '500'
                        },
                        padding: 18,
                        usePointStyle: true,
                        filter: function(item, chart) {
                            return item.text !== 'Pace Comparison'; // Hide main dataset from legend
                        }
                    }
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            statsPanel.showEmptyState('fa-tachometer-alt', 'Hover over a point to see pace analysis');
                            return;
                        }
                        if (!tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) return;
                        
                        const dataPoint = tooltipModel.dataPoints[0];
                        if (dataPoint.datasetIndex === 1) return; // Skip reference line
                        
                        const point = dataPoint.raw;
                        
                        let interpretation, interpretColor, interpretEmoji, detailedAdvice;
                        if (point.degradation < -0.8) {
                            interpretation = 'Elite Progression!';
                            interpretColor = '#059669';
                            interpretEmoji = '🏆';
                            detailedAdvice = 'Exceptional! You are getting significantly faster as sessions progress. This shows excellent adaptation, tire management, and mental focus. Keep doing what you are doing!';
                        } else if (point.degradation < -0.5) {
                            interpretation = 'Getting Much Faster!';
                            interpretColor = '#10b981';
                            interpretEmoji = '🔥';
                            detailedAdvice = 'Outstanding warm-up pattern! You are learning the track quickly and building confidence. Your end-of-session pace shows you have more speed to unlock.';
                        } else if (point.degradation < -0.2) {
                            interpretation = 'Improving During Session';
                            interpretColor = '#22c55e';
                            interpretEmoji = '📈';
                            detailedAdvice = 'Strong progression! You are getting faster as tires warm up and you find rhythm. This is ideal for learning tracks and improving lap times.';
                        } else if (point.degradation < 0.1) {
                            interpretation = 'Excellent Pace Maintenance';
                            interpretColor = '#84cc16';
                            interpretEmoji = '✅';
                            detailedAdvice = 'Perfect consistency! You maintain the same pace throughout sessions. This shows excellent fitness, concentration, and driving technique.';
                        } else if (point.degradation < 0.3) {
                            interpretation = 'Minor Dropoff';
                            interpretColor = '#eab308';
                            interpretEmoji = '⚠️';
                            detailedAdvice = 'Slight pace degradation detected. Could be normal tire wear or minor concentration drop. Monitor this across multiple sessions.';
                        } else if (point.degradation < 0.5) {
                            interpretation = 'Noticeable Degradation';
                            interpretColor = '#f59e0b';
                            interpretEmoji = '📉';
                            detailedAdvice = 'Pace is dropping noticeably. Consider: 1) Driving smoother to save tires, 2) Working on fitness/endurance, 3) Managing mental focus better late in sessions.';
                        } else if (point.degradation < 1.0) {
                            interpretation = 'Moderate Degradation';
                            interpretColor = '#f97316';
                            interpretEmoji = '⛔';
                            detailedAdvice = 'Significant pace loss detected. Focus areas: physical fitness for longer sessions, smooth driving to preserve tires, mental stamina to stay sharp.';
                        } else {
                            interpretation = 'High Degradation';
                            interpretColor = '#ef4444';
                            interpretEmoji = '🚨';
                            detailedAdvice = 'Major pace dropoff. Immediate action needed: 1) Cardiovascular fitness training, 2) Practice maintaining smooth inputs when tired, 3) Hydration & nutrition during sessions.';
                        }
                        
                        statsPanel.setContent(`
                            <div class="stat-highlight"><div class="stat-row"><span class="stat-label">Driver</span><span class="stat-value" style="font-size:18px;">${point.driver}</span></div></div>
                            <div style="margin-top:20px;padding:15px;background:${interpretColor}15;border-left:4px solid ${interpretColor};border-radius:8px;">
                                <div style="color:${interpretColor};font-weight:700;font-size:16px;">${interpretEmoji} ${interpretation}</div>
                                <div style="color:${interpretColor};font-size:22px;font-weight:800;margin:8px 0;">${point.degradation >= 0 ? '+' : ''}${FormatUtils.formatTime(point.degradation)}</div>
                                <div style="color:var(--text-secondary);font-size:13px;">${point.degradationPercent >= 0 ? '+' : ''}${point.degradationPercent.toFixed(2)}% change</div>
                            </div>
                            <div style="margin:15px 0;border-top:2px solid var(--border-color);"></div>
                            <div class="stat-row"><span class="stat-label">Start Pace (First 1/3)</span><span class="stat-value" style="font-size:17px;color:#10b981;">${FormatUtils.formatTime(point.x)}</span></div>
                            <div class="stat-row"><span class="stat-label">End Pace (Last 1/3)</span><span class="stat-value" style="font-size:17px;color:${point.degradation > 0 ? '#ef4444' : '#10b981'};">${FormatUtils.formatTime(point.y)}</span></div>
                            <div class="stat-row"><span class="stat-label">Sessions Analyzed</span><span class="stat-value">${point.sessions}</span></div>
                            <div style="margin-top:20px;padding:12px;background:var(--bg-secondary);border-radius:8px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
                                💡 <strong>Detailed Analysis:</strong> ${detailedAdvice}
                            </div>
                        `);
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

// Verify function is defined
