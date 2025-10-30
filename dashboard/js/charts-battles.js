// ========== DRIVER BATTLE CHARTS MODULE ==========
// Extracted from script.js

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


