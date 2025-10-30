// ========== LAP & SESSION CHARTS MODULE ==========
// Extracted from script.js

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


