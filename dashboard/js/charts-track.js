// ========== TRACK INSIGHTS CHARTS MODULE ==========
// Extracted from script.js

// Make function globally accessible
window.initializeTrackInsightsCharts = function() {
    
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
}; // End of window.initializeTrackInsightsCharts

// 3.1 Track Performance Comparison Chart (Track Characteristics)
function createTrackPerformanceChart() {
    const ctx = document.getElementById('trackPerformanceChart');
    if (!ctx) return;

    const metric = document.getElementById('trackPerformanceMetric')?.value || 'lapTime';
    const tracks = [...new Set(filteredData.map(row => row.Track))];
    
    let chartData = [];
    let ylabel = '';
    let chartTitle = '';
    
    if (metric === 'lapTime') {
        // Show average improvement % from first to best lap at each track
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const sessions = [...new Set(trackData.map(row => row.SessionDate))];
            
            let totalImprovement = 0;
            let sessionCount = 0;
            
            sessions.forEach(session => {
                const sessionLaps = trackData.filter(row => row.SessionDate === session)
                                            .map(row => parseFloat(row.LapTime || 0))
                                            .filter(time => time > 0);
                if (sessionLaps.length >= 2) {
                    const firstLap = sessionLaps[0];
                    const bestLap = Math.min(...sessionLaps);
                    const improvement = ((firstLap - bestLap) / firstLap) * 100;
                    totalImprovement += improvement;
                    sessionCount++;
                }
            });
            
            return sessionCount > 0 ? totalImprovement / sessionCount : 0;
        });
        ylabel = 'Average Improvement (%)';
        chartTitle = 'Session Improvement Rate';
    } else if (metric === 'bestLap') {
        // Show average speed (km/h) at each track
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const trackDistance = trackData.length > 0 ? parseFloat(trackData[0].TrackDistance || 1000) : 1000;
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            
            if (lapTimes.length === 0) return 0;
            const bestLap = Math.min(...lapTimes);
            return (trackDistance / bestLap) * 3.6; // Convert m/s to km/h
        });
        ylabel = 'Best Lap Speed (km/h)';
        chartTitle = 'Track Record Speeds';
    } else if (metric === 'consistency') {
        // Consistency is comparable across tracks
        chartData = tracks.map(track => {
            const trackData = filteredData.filter(row => row.Track === track);
            const lapTimes = trackData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
            return lapTimes.length > 0 ? calculateStandardDeviation(lapTimes) : 0;
        });
        ylabel = 'Lap Time Std Dev (s)';
        chartTitle = 'Consistency Index';
    }

    destroyChart('trackPerformance');
    charts.trackPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tracks,
            datasets: [{
                label: chartTitle,
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: ylabel,
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

// Note: initializeSessionWidgets, initializeLeaderboards, and initializeDataTable
// are now defined in their respective chart modules to avoid conflicts

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
    }
}

// ========== INITIALIZATION SYSTEM ==========

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
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
            initializeDashboard();
        })
        .catch(error => {
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

// Update the main update function to include all chart sections
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
    updateKPISummary();
    updateSessionWidgets();
    updateLeaderboards();
    updateDataTable();
}

// ========== 4. DRIVER BATTLE FEATURES ==========


