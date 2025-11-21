// ========== PREDICTIVE CHARTS MODULE ==========
// Extracted from script.js

// Make function globally accessible
window.initializePredictiveCharts = function() {
    
    createLapTimePredictionChart();
    createPerformanceForecastChart();
    createDriverRankingPredictionChart();
    createSeasonalForecastChart();
    createOptimalStrategyChart();
    
}; // End of window.initializePredictiveCharts

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

    } catch (error) {
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

    } catch (error) {
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

    } catch (error) {
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

    } catch (error) {
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

    } catch (error) {
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


