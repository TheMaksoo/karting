// ========== DRIVER PERFORMANCE CHARTS MODULE ==========
// Extracted from script.js

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


