// ========== TEMPORAL CHARTS MODULE ==========
// Extracted from script.js

// Make function globally accessible
window.initializeTemporalCharts = function() {
    
    // Add event listeners for controls
    addChartEventListener('seasonalMetric', createSeasonalTrendsChart);
    addChartEventListener('timeOfDayDriver', createTimeOfDayChart);
    addChartEventListener('weeklyPatternType', createWeeklyPatternsChart);
    
    // Create all charts
    createSeasonalTrendsChart();
    createTimeOfDayChart();
    createWeeklyPatternsChart();
    createMonthlyAnalysisChart();
    createPeakPerformanceChart();
    createHistoricalProgressionChart();
}; // End of window.initializeTemporalCharts

// 6.1 Seasonal Trends Chart
function createSeasonalTrendsChart() {
    const ctx = document.getElementById('seasonalTrendsChart');
    if (!ctx) return;

    const metric = document.getElementById('seasonalMetric')?.value || 'performance';
    
    // Group data by month
    const monthlyData = {};
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const month = date.getMonth(); // 0-11
        const monthName = date.toLocaleString('default', { month: 'long' });
        
        if (!monthlyData[month]) {
            monthlyData[month] = {
                monthName,
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                positions: []
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        const position = parseInt(row.Position || 0);
        
        if (lapTime > 0) monthlyData[month].lapTimes.push(lapTime);
        if (position > 0) monthlyData[month].positions.push(position);
        monthlyData[month].drivers.add(row.Driver);
        monthlyData[month].sessions.add(row.SessionDate);
    });
    
    // Sort by month order
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => parseInt(a) - parseInt(b));
    const labels = sortedMonths.map(month => monthlyData[month].monthName);
    
    let chartData = [];
    
    if (metric === 'performance') {
        // Show improvement percentage instead of absolute lap times
        const improvementPerMonth = sortedMonths.map(month => {
            const monthSessions = [...monthlyData[month].sessions];
            let totalImprovement = 0;
            let sessionCount = 0;
            
            monthSessions.forEach(session => {
                const sessionLaps = filteredData.filter(row => row.SessionDate === session)
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
        
        chartData = [{
            label: 'Avg Session Improvement (%)',
            data: improvementPerMonth,
            borderColor: '#FF6B35',
            backgroundColor: '#FF6B3540',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6
        }];
    } else if (metric === 'participation') {
        const uniqueDrivers = sortedMonths.map(month => monthlyData[month].drivers.size);
        const totalSessions = sortedMonths.map(month => monthlyData[month].sessions.size);
        
        chartData = [
            {
                label: 'Unique Drivers',
                data: uniqueDrivers,
                borderColor: '#4ECDC4',
                backgroundColor: '#4ECDC440',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Total Sessions',
                data: totalSessions,
                borderColor: '#45B7D1',
                backgroundColor: '#45B7D140',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ];
    } else {
        const consistency = sortedMonths.map(month => {
            const times = monthlyData[month].lapTimes;
            return times.length > 0 ? calculateStandardDeviation(times) : 0;
        });
        
        chartData = [{
            label: 'Consistency (Lower = Better)',
            data: consistency,
            borderColor: '#F7DC6F',
            backgroundColor: '#F7DC6F40',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6
        }];
    }

    destroyChart('seasonalTrends');
    charts.seasonalTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric !== 'performance',
                    title: {
                        display: true,
                        text: metric === 'performance' ? 'Lap Time (seconds)' :
                              metric === 'participation' ? 'Number of Drivers' : 'Standard Deviation',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: metric === 'participation' ? {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Sessions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                } : undefined,
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

// 6.2 Time of Day Performance Chart
function createTimeOfDayChart() {
    const ctx = document.getElementById('timeOfDayChart');
    if (!ctx) return;

    const selectedDriver = document.getElementById('timeOfDayDriver')?.value;
    let dataToAnalyze = filteredData;
    
    if (selectedDriver && selectedDriver !== 'all') {
        dataToAnalyze = filteredData.filter(row => row.Driver === selectedDriver);
    }
    
    // Simulate time of day data (since we don't have actual time data)
    const hourlyData = {};
    
    dataToAnalyze.forEach(row => {
        // Simulate hour based on session date hash for consistency
        const dateStr = row.SessionDate + row.Driver;
        const hash = dateStr.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hour = Math.abs(hash % 12) + 8; // 8 AM to 7 PM
        
        if (!hourlyData[hour]) {
            hourlyData[hour] = {
                lapTimes: [],
                drivers: new Set(),
                totalLaps: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        if (lapTime > 0) {
            hourlyData[hour].lapTimes.push(lapTime);
        }
        hourlyData[hour].drivers.add(row.Driver);
        hourlyData[hour].totalLaps++;
    });
    
    // Create hourly performance data
    const hours = Array.from({length: 12}, (_, i) => i + 8); // 8 AM to 7 PM
    const labels = hours.map(hour => `${hour}:00`);
    
    const avgPerformance = hours.map(hour => {
        const data = hourlyData[hour];
        if (!data || data.lapTimes.length === 0) return null;
        return data.lapTimes.reduce((sum, time) => sum + time, 0) / data.lapTimes.length;
    });
    
    const activity = hours.map(hour => {
        const data = hourlyData[hour];
        return data ? data.totalLaps : 0;
    });

    destroyChart('timeOfDay');
    charts.timeOfDay = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Lap Time',
                    data: avgPerformance,
                    borderColor: '#FF6B35',
                    backgroundColor: '#FF6B3540',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Activity Level (Laps)',
                    data: activity,
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC440',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    yAxisID: 'y1'
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
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
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
                        drawOnChartArea: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time of Day',
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

// 6.3 Weekly Patterns Chart
function createWeeklyPatternsChart() {
    const ctx = document.getElementById('weeklyPatternsChart');
    if (!ctx) return;

    const patternType = document.getElementById('weeklyPatternType')?.value || 'performance';
    
    // Group data by day of week
    const weeklyData = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek];
        
        if (!weeklyData[dayOfWeek]) {
            weeklyData[dayOfWeek] = {
                dayName,
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                totalLaps: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        if (lapTime > 0) {
            weeklyData[dayOfWeek].lapTimes.push(lapTime);
        }
        weeklyData[dayOfWeek].drivers.add(row.Driver);
        weeklyData[dayOfWeek].sessions.add(row.SessionDate);
        weeklyData[dayOfWeek].totalLaps++;
    });
    
    const sortedDays = Object.keys(weeklyData).sort((a, b) => parseInt(a) - parseInt(b));
    const labels = sortedDays.map(day => weeklyData[day].dayName);
    
    let chartData = [];
    
    if (patternType === 'performance') {
        const avgTimes = sortedDays.map(day => {
            const times = weeklyData[day].lapTimes;
            return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
        });
        
        chartData = [{
            label: 'Average Lap Time',
            data: avgTimes,
            backgroundColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#FF6B35CC' : '#4ECDC4CC';
            }),
            borderColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#FF6B35' : '#4ECDC4';
            }),
            borderWidth: 2,
            borderRadius: 8
        }];
    } else if (patternType === 'activity') {
        const totalLaps = sortedDays.map(day => weeklyData[day].totalLaps);
        const uniqueDrivers = sortedDays.map(day => weeklyData[day].drivers.size);
        
        chartData = [
            {
                label: 'Total Laps',
                data: totalLaps,
                backgroundColor: '#22C55ECC',
                borderColor: '#22C55E',
                borderWidth: 2,
                borderRadius: 6,
                yAxisID: 'y'
            },
            {
                label: 'Unique Drivers',
                data: uniqueDrivers,
                backgroundColor: '#3B82F6CC',
                borderColor: '#3B82F6',
                borderWidth: 2,
                borderRadius: 6,
                yAxisID: 'y1'
            }
        ];
    } else {
        const sessions = sortedDays.map(day => weeklyData[day].sessions.size);
        
        chartData = [{
            label: 'Number of Sessions',
            data: sessions,
            backgroundColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#F59E0BCC' : '#8B5CF6CC';
            }),
            borderColor: dayNames.map((_, index) => {
                const isWeekend = index === 0 || index === 6;
                return isWeekend ? '#F59E0B' : '#8B5CF6';
            }),
            borderWidth: 2,
            borderRadius: 8
        }];
    }

    destroyChart('weeklyPatterns');
    charts.weeklyPatterns = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: patternType !== 'performance',
                    title: {
                        display: true,
                        text: patternType === 'performance' ? 'Lap Time (seconds)' :
                              patternType === 'activity' ? 'Number of Laps' : 'Number of Sessions',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y1: patternType === 'activity' ? {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Drivers',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                } : undefined,
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

// 6.4 Monthly Analysis Chart
function createMonthlyAnalysisChart() {
    const ctx = document.getElementById('monthlyAnalysisChart');
    if (!ctx) return;

    // Group data by year-month
    const monthlyData = {};
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = {
                lapTimes: [],
                drivers: new Set(),
                sessions: new Set(),
                positions: [],
                totalRevenue: 0
            };
        }
        
        const lapTime = parseFloat(row.LapTime || 0);
        const position = parseInt(row.Position || 0);
        
        if (lapTime > 0) monthlyData[yearMonth].lapTimes.push(lapTime);
        if (position > 0) monthlyData[yearMonth].positions.push(position);
        monthlyData[yearMonth].drivers.add(row.Driver);
        monthlyData[yearMonth].sessions.add(row.SessionDate);
        monthlyData[yearMonth].totalRevenue += 2; // $2 per lap simulation
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    });
    
    // Calculate metrics
    const avgPerformance = sortedMonths.map(month => {
        const times = monthlyData[month].lapTimes;
        return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    });
    
    const participation = sortedMonths.map(month => monthlyData[month].drivers.size);
    const revenue = sortedMonths.map(month => monthlyData[month].totalRevenue);

    destroyChart('monthlyAnalysis');
    charts.monthlyAnalysis = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Performance',
                    data: avgPerformance,
                    borderColor: '#FF6B35',
                    backgroundColor: '#FF6B3540',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Driver Participation',
                    data: participation,
                    borderColor: '#4ECDC4',
                    backgroundColor: '#4ECDC440',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Revenue ($)',
                    data: revenue,
                    borderColor: '#22C55E',
                    backgroundColor: '#22C55E40',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y2'
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
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Avg Lap Time (s)',
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Drivers',
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
                    beginAtZero: true
                },
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

// 6.5 Peak Performance Times Chart
function createPeakPerformanceChart() {
    const ctx = document.getElementById('peakPerformanceChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Find peak performance for each driver
    const peakData = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        
        // Group by session to find best session
        const sessionPerformance = {};
        driverData.forEach(row => {
            const session = row.SessionDate;
            if (!sessionPerformance[session]) {
                sessionPerformance[session] = [];
            }
            const lapTime = parseFloat(row.LapTime || 0);
            if (lapTime > 0) {
                sessionPerformance[session].push(lapTime);
            }
        });
        
        // Find best session (lowest average lap time)
        let bestSession = null;
        let bestAverage = Infinity;
        let bestLap = Infinity;
        
        Object.keys(sessionPerformance).forEach(session => {
            const times = sessionPerformance[session];
            if (times.length > 0) {
                const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
                const fastest = Math.min(...times);
                
                if (avg < bestAverage) {
                    bestAverage = avg;
                    bestSession = session;
                    bestLap = fastest;
                }
            }
        });
        
        // Simulate peak time (morning/afternoon/evening)
        const sessionHash = (bestSession || '').split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const peakHour = Math.abs(sessionHash % 12) + 8; // 8 AM to 7 PM
        const peakTime = peakHour < 12 ? 'Morning' : peakHour < 17 ? 'Afternoon' : 'Evening';
        
        return {
            driver,
            bestSession,
            bestAverage: bestAverage === Infinity ? 0 : bestAverage,
            bestLap: bestLap === Infinity ? 0 : bestLap,
            peakTime,
            peakHour
        };
    });
    
    // Group by peak time
    const timeGroups = { Morning: [], Afternoon: [], Evening: [] };
    peakData.forEach(data => {
        if (data.bestAverage > 0) {
            timeGroups[data.peakTime].push(data);
        }
    });
    
    const labels = Object.keys(timeGroups);
    const avgPerformance = labels.map(time => {
        const group = timeGroups[time];
        if (group.length === 0) return 0;
        return group.reduce((sum, driver) => sum + driver.bestAverage, 0) / group.length;
    });
    
    const driverCounts = labels.map(time => timeGroups[time].length);

    destroyChart('peakPerformance');
    charts.peakPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Peak Performance',
                    data: avgPerformance,
                    backgroundColor: ['#FFD700CC', '#FF6B35CC', '#8B5CF6CC'],
                    borderColor: ['#FFD700', '#FF6B35', '#8B5CF6'],
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Peak Performers',
                    data: driverCounts,
                    backgroundColor: '#4ECDC4CC',
                    borderColor: '#4ECDC4',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y1'
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
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Drivers',
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

// 6.6 Historical Progression Chart
function createHistoricalProgressionChart() {
    const ctx = document.getElementById('historicalProgressionChart');
    if (!ctx) return;

    // Create progression data over time
    const progressionData = {};
    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Sort all data by date
    const sortedData = filteredData.sort((a, b) => new Date(a.SessionDate) - new Date(b.SessionDate));
    
    // Track cumulative statistics for each driver
    drivers.forEach(driver => {
        progressionData[driver] = {
            sessions: [],
            cumulativeLaps: 0,
            bestLapProgression: [],
            avgLapProgression: [],
            consistencyProgression: []
        };
    });
    
    const sessionDates = [...new Set(sortedData.map(row => row.SessionDate))].sort();
    
    sessionDates.forEach(sessionDate => {
        const sessionData = sortedData.filter(row => row.SessionDate === sessionDate);
        
        drivers.forEach(driver => {
            const driverSessionData = sessionData.filter(row => row.Driver === driver);
            const driverAllData = sortedData.filter(row => 
                row.Driver === driver && new Date(row.SessionDate) <= new Date(sessionDate)
            );
            
            if (driverSessionData.length > 0) {
                const lapTimes = driverAllData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
                
                if (lapTimes.length > 0) {
                    const bestLap = Math.min(...lapTimes);
                    const avgLap = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
                    const consistency = calculateStandardDeviation(lapTimes);
                    
                    progressionData[driver].sessions.push(sessionDate);
                    progressionData[driver].cumulativeLaps = lapTimes.length;
                    progressionData[driver].bestLapProgression.push(bestLap);
                    progressionData[driver].avgLapProgression.push(avgLap);
                    progressionData[driver].consistencyProgression.push(consistency);
                }
            }
        });
    });
    
    // Create datasets for top 3 most active drivers
    const activeDrivers = drivers.map(driver => ({
        driver,
        laps: progressionData[driver].cumulativeLaps
    })).sort((a, b) => b.laps - a.laps).slice(0, 3);
    
    const datasets = activeDrivers.map((item, index) => {
        const driver = item.driver;
        const data = progressionData[driver];
        
        return {
            label: `${driver} (Best Lap)`,
            data: data.sessions.map((session, i) => ({
                x: session,
                y: data.bestLapProgression[i]
            })),
            borderColor: window.getDriverColor(driver),
            backgroundColor: window.getDriverColor(driver) + '40',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 4
        };
    });

    destroyChart('historicalProgression');
    charts.historicalProgression = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD',
                        displayFormats: {
                            day: 'MMM DD',
                            month: 'MMM YYYY'
                        }
                    },
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
                },
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

// ==============================================
// SESSION MANAGEMENT WIDGETS SECTION
// ==============================================

// Session Control Widget
function createSessionControlWidget() {
    try {
        const container = document.getElementById('session-control-widget');
        if (!container) return;

        const sessions = [...new Set(globalData.map(d => d.Sessie || d.Session || 'Unknown Session'))];
        const currentSession = sessionState.activeSession || sessions[0];
        const totalLaps = globalData.filter(d => (d.Sessie || d.Session) === currentSession).length;
        
        container.innerHTML = `
            <div class="widget-header">
                <h3>🎮 Session Control</h3>
                <div class="session-status ${sessionState.isLive ? 'live' : 'stopped'}">
                    ${sessionState.isLive ? 'LIVE' : 'STOPPED'}
                </div>
            </div>
            <div class="widget-content">
                <div class="session-selector">
                    <label>Active Session:</label>
                    <select id="session-select" onchange="switchSession(this.value)">
                        ${sessions.map(s => 
                            `<option value="${s}" ${s === currentSession ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="session-metrics">
                    <div class="metric">
                        <label>Total Laps</label>
                        <span class="value">${totalLaps}</span>
                    </div>
                    <div class="metric">
                        <label>Drivers</label>
                        <span class="value">${new Set(globalData.filter(d => (d.Sessie || d.Session) === currentSession).map(d => d.Naam || d.Driver || 'Unknown')).size}</span>
                    </div>
                    <div class="metric">
                        <label>Duration</label>
                        <span class="value">${calculateSessionDuration(currentSession)}</span>
                    </div>
                </div>
                <div class="session-controls">
                    <button class="btn-primary" onclick="toggleSessionRecording()">
                        ${sessionState.isRecording ? '⏹️ Stop Recording' : '▶️ Start Recording'}
                    </button>
                    <button class="btn-secondary" onclick="exportSessionData()">📊 Export Session</button>
                    <button class="btn-secondary" onclick="resetSession()">🔄 Reset Session</button>
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Live Session Monitor
function createLiveSessionMonitor() {
    try {
        const container = document.getElementById('live-session-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const recentLaps = sessionData.slice(-10);
        const activeFastestLap = Math.min(...sessionData.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 999)));

        container.innerHTML = `
            <div class="widget-header">
                <h3>📡 Live Monitor</h3>
                <div class="live-indicator ${sessionState.isLive ? 'active' : ''}">
                    <span class="pulse"></span>
                    ${sessionState.isLive ? 'Broadcasting' : 'Offline'}
                </div>
            </div>
            <div class="widget-content">
                <div class="live-stats">
                    <div class="stat-card fastest-lap">
                        <div class="stat-label">Fastest Lap</div>
                        <div class="stat-value">${activeFastestLap === 999 ? '--:--' : formatTime(activeFastestLap)}</div>
                        <div class="stat-driver">${getFastestLapDriver(sessionData)}</div>
                    </div>
                    <div class="stat-card current-leader">
                        <div class="stat-label">Current Leader</div>
                        <div class="stat-value">${getCurrentLeader(sessionData)}</div>
                        <div class="stat-gap">+${getCurrentGap(sessionData)}s</div>
                    </div>
                    <div class="stat-card track-activity">
                        <div class="stat-label">Track Activity</div>
                        <div class="stat-value">${getTrackActivity(sessionData)}</div>
                        <div class="stat-trend">${getActivityTrend(sessionData)}</div>
                    </div>
                </div>
                <div class="recent-laps">
                    <h4>Recent Lap Times</h4>
                    <div class="lap-feed">
                        ${recentLaps.reverse().map(lap => `
                            <div class="lap-entry ${isPersonalBest(lap) ? 'personal-best' : ''}">
                                <span class="driver">${lap.Naam || lap.Driver || 'Unknown'}</span>
                                <span class="lap-time">${formatTime(lap.Ronde_tijd || lap.LapTime)}</span>
                                <span class="gap">${calculateGapToLeader(lap, sessionData)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Session Statistics Widget
function createSessionStatsWidget() {
    try {
        const container = document.getElementById('session-stats-widget');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        
        const stats = calculateSessionStatistics(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>📈 Session Statistics</h3>
                <button class="refresh-btn" onclick="createSessionStatsWidget()">🔄</button>
            </div>
            <div class="widget-content">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <label>Average Lap Time</label>
                            <span class="stat-value">${formatTime(stats.avgLapTime)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🏁</div>
                        <div class="stat-info">
                            <label>Fastest Lap</label>
                            <span class="stat-value">${formatTime(stats.fastestLap)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <label>Consistency</label>
                            <span class="stat-value">${stats.consistency.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🔄</div>
                        <div class="stat-info">
                            <label>Improvement Rate</label>
                            <span class="stat-value">${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate.toFixed(2)}%</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <label>Track Records</label>
                            <span class="stat-value">${stats.trackRecords}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-info">
                            <label>Peak Performance</label>
                            <span class="stat-value">${stats.peakPerformance}%</span>
                        </div>
                    </div>
                </div>
                <div class="progress-indicators">
                    <div class="progress-item">
                        <label>Session Progress</label>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.sessionProgress}%"></div>
                        </div>
                        <span>${stats.sessionProgress}%</span>
                    </div>
                    <div class="progress-item">
                        <label>Target Achievement</label>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.targetAchievement}%"></div>
                        </div>
                        <span>${stats.targetAchievement}%</span>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Driver Performance Monitor
function createDriverPerformanceMonitor() {
    try {
        const container = document.getElementById('driver-performance-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const drivers = getTopDrivers(sessionData, 8);

        container.innerHTML = `
            <div class="widget-header">
                <h3>👥 Driver Performance Monitor</h3>
                <div class="view-toggle">
                    <button class="toggle-btn active" onclick="switchDriverView('live')">Live</button>
                    <button class="toggle-btn" onclick="switchDriverView('overall')">Overall</button>
                </div>
            </div>
            <div class="widget-content">
                <div class="driver-cards">
                    ${drivers.map((driver, index) => `
                        <div class="driver-card ${index === 0 ? 'leader' : ''}">
                            <div class="driver-position">${index + 1}</div>
                            <div class="driver-info">
                                <div class="driver-name">${driver.name}</div>
                                <div class="driver-time">${formatTime(driver.bestLap)}</div>
                            </div>
                            <div class="driver-metrics">
                                <div class="metric">
                                    <span class="metric-label">Laps</span>
                                    <span class="metric-value">${driver.laps}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Avg</span>
                                    <span class="metric-value">${formatTime(driver.avgLap)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Gap</span>
                                    <span class="metric-value">+${driver.gap.toFixed(3)}s</span>
                                </div>
                            </div>
                            <div class="driver-status ${driver.status}">
                                <span class="status-indicator"></span>
                                ${driver.status.toUpperCase()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Session Progress Timeline
function createSessionProgressTimeline() {
    try {
        const container = document.getElementById('session-progress-timeline');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const timeline = generateSessionTimeline(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>📅 Session Timeline</h3>
                <div class="timeline-controls">
                    <button class="btn-small" onclick="zoomTimeline('hour')">1H</button>
                    <button class="btn-small active" onclick="zoomTimeline('session')">Session</button>
                    <button class="btn-small" onclick="zoomTimeline('all')">All</button>
                </div>
            </div>
            <div class="widget-content">
                <div class="timeline-container">
                    <div class="timeline">
                        ${timeline.map(event => `
                            <div class="timeline-event ${event.type}" data-time="${event.time}">
                                <div class="event-marker"></div>
                                <div class="event-content">
                                    <div class="event-time">${formatTimelineTime(event.time)}</div>
                                    <div class="event-title">${event.title}</div>
                                    <div class="event-description">${event.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="timeline-summary">
                    <div class="summary-item">
                        <span class="summary-label">Duration:</span>
                        <span class="summary-value">${calculateSessionDuration(currentSession)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Key Events:</span>
                        <span class="summary-value">${timeline.filter(e => e.type === 'milestone').length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Records Set:</span>
                        <span class="summary-value">${timeline.filter(e => e.type === 'record').length}</span>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Weather & Track Conditions Monitor
function createConditionsMonitor() {
    try {
        const container = document.getElementById('conditions-monitor');
        if (!container) return;

        const currentSession = sessionState.activeSession;
        const sessionData = globalData.filter(d => (d.Sessie || d.Session) === currentSession);
        const conditions = analyzeTrackConditions(sessionData);

        container.innerHTML = `
            <div class="widget-header">
                <h3>🌤️ Track Conditions</h3>
                <div class="conditions-status ${conditions.overall}">
                    ${conditions.overall.toUpperCase()}
                </div>
            </div>
            <div class="widget-content">
                <div class="conditions-grid">
                    <div class="condition-card weather">
                        <div class="condition-icon">☀️</div>
                        <div class="condition-info">
                            <label>Weather</label>
                            <span class="condition-value">${conditions.weather}</span>
                            <span class="condition-trend">${conditions.weatherTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card temperature">
                        <div class="condition-icon">🌡️</div>
                        <div class="condition-info">
                            <label>Temperature</label>
                            <span class="condition-value">${conditions.temperature}°C</span>
                            <span class="condition-trend">${conditions.tempTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card track">
                        <div class="condition-icon">🏁</div>
                        <div class="condition-info">
                            <label>Track Surface</label>
                            <span class="condition-value">${conditions.surface}</span>
                            <span class="condition-trend">${conditions.surfaceTrend}</span>
                        </div>
                    </div>
                    <div class="condition-card grip">
                        <div class="condition-icon">🔗</div>
                        <div class="condition-info">
                            <label>Grip Level</label>
                            <span class="condition-value">${conditions.grip}%</span>
                            <span class="condition-trend">${conditions.gripTrend}</span>
                        </div>
                    </div>
                </div>
                <div class="impact-analysis">
                    <h4>Performance Impact</h4>
                    <div class="impact-metrics">
                        <div class="impact-item">
                            <span class="impact-label">Lap Time Effect:</span>
                            <span class="impact-value ${conditions.lapTimeImpact > 0 ? 'negative' : 'positive'}">
                                ${conditions.lapTimeImpact > 0 ? '+' : ''}${conditions.lapTimeImpact.toFixed(3)}s
                            </span>
                        </div>
                        <div class="impact-item">
                            <span class="impact-label">Consistency Impact:</span>
                            <span class="impact-value">${conditions.consistencyImpact}%</span>
                        </div>
                        <div class="impact-item">
                            <span class="impact-label">Safety Factor:</span>
                            <span class="impact-value ${conditions.safetyFactor < 0.8 ? 'warning' : 'good'}">${conditions.safetyFactor.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
    }
}

// Helper Functions for Session Widgets
function calculateSessionDuration(session) {
    const sessionData = globalData.filter(d => (d.Sessie || d.Session) === session);
    if (sessionData.length === 0) return '00:00:00';
    
    // Estimate duration based on lap count and average lap times
    const avgLapTime = sessionData.reduce((sum, d) => sum + parseFloat(d.Ronde_tijd || d.LapTime || 0), 0) / sessionData.length;
    const totalMinutes = (avgLapTime * sessionData.length) / 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getFastestLapDriver(sessionData) {
    if (sessionData.length === 0) return 'Unknown';
    const fastestLap = sessionData.reduce((fastest, current) => 
        parseFloat(current.Ronde_tijd || current.LapTime || 999) < parseFloat(fastest.Ronde_tijd || fastest.LapTime || 999) ? current : fastest
    );
    return fastestLap.Naam || fastestLap.Driver || 'Unknown';
}

function getCurrentLeader(sessionData) {
    const drivers = {};
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        if (!drivers[driver] || parseFloat(lap.Ronde_tijd || lap.LapTime || 999) < drivers[driver]) {
            drivers[driver] = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        }
    });
    
    const leader = Object.entries(drivers).reduce((best, [driver, time]) => 
        time < best.time ? {driver, time} : best, {driver: 'Unknown', time: 999});
    
    return leader.driver;
}

function getCurrentGap(sessionData) {
    const drivers = {};
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        if (!drivers[driver] || parseFloat(lap.Ronde_tijd || lap.LapTime || 999) < drivers[driver]) {
            drivers[driver] = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        }
    });
    
    const times = Object.values(drivers).filter(t => t !== 999).sort((a, b) => a - b);
    return times.length > 1 ? (times[1] - times[0]).toFixed(3) : '0.000';
}

function getTrackActivity(sessionData) {
    // Mock implementation - in real scenario, this would analyze recent lap activity
    const recentLaps = sessionData.slice(-5);
    return recentLaps.length > 3 ? 'High' : recentLaps.length > 1 ? 'Medium' : 'Low';
}

function getActivityTrend(sessionData) {
    // Mock implementation - trend analysis
    return Math.random() > 0.5 ? '↗️ Increasing' : '↘️ Decreasing';
}

function isPersonalBest(lap) {
    // Check if this lap is a personal best for the driver
    const driver = lap.Naam || lap.Driver || 'Unknown';
    const driverLaps = globalData.filter(d => (d.Naam || d.Driver) === driver);
    const currentLapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
    const bestLapTime = Math.min(...driverLaps.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 999)));
    return currentLapTime === bestLapTime;
}

function calculateGapToLeader(lap, sessionData) {
    const leader = getCurrentLeader(sessionData);
    const leaderTime = parseFloat(sessionData.find(d => (d.Naam || d.Driver) === leader)?.Ronde_tijd || lap.LapTime || 0);
    const lapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 0);
    const gap = lapTime - leaderTime;
    return gap > 0 ? `+${gap.toFixed(3)}s` : `${gap.toFixed(3)}s`;
}

function calculateSessionStatistics(sessionData) {
    const lapTimes = sessionData.map(d => parseFloat(d.Ronde_tijd || d.LapTime || 0)).filter(t => t > 0);
    const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length || 0;
    const fastestLap = Math.min(...lapTimes) || 0;
    
    return {
        avgLapTime,
        fastestLap,
        consistency: calculateConsistencyPercentage(lapTimes),
        improvementRate: calculateImprovementRate(lapTimes),
        trackRecords: countTrackRecords(sessionData),
        peakPerformance: calculatePeakPerformance(lapTimes),
        sessionProgress: Math.min(100, (sessionData.length / 50) * 100), // Assuming 50 laps target
        targetAchievement: calculateTargetAchievement(sessionData)
    };
}

function calculateConsistencyPercentage(lapTimes) {
    if (lapTimes.length < 2) return 100;
    const avg = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / lapTimes.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 100 - (stdDev / avg * 100));
}

function calculateImprovementRate(lapTimes) {
    if (lapTimes.length < 2) return 0;
    const firstHalf = lapTimes.slice(0, Math.floor(lapTimes.length / 2));
    const secondHalf = lapTimes.slice(Math.floor(lapTimes.length / 2));
    const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    return ((firstAvg - secondAvg) / firstAvg) * 100;
}

function countTrackRecords(sessionData) {
    // Mock implementation - count potential track records
    return Math.floor(Math.random() * 5) + 1;
}

function calculatePeakPerformance(lapTimes) {
    if (lapTimes.length === 0) return 0;
    const bestTime = Math.min(...lapTimes);
    const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    return Math.round((avgTime / bestTime) * 100);
}

function calculateTargetAchievement(sessionData) {
    // Mock implementation - achievement percentage
    return Math.floor(Math.random() * 40) + 60; // 60-100%
}

function getTopDrivers(sessionData, count = 8) {
    const drivers = {};
    
    sessionData.forEach(lap => {
        const driver = lap.Naam || lap.Driver || 'Unknown';
        const lapTime = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
        
        if (!drivers[driver]) {
            drivers[driver] = {
                name: driver,
                bestLap: lapTime,
                totalTime: lapTime,
                laps: 1,
                status: Math.random() > 0.3 ? 'active' : 'inactive'
            };
        } else {
            drivers[driver].bestLap = Math.min(drivers[driver].bestLap, lapTime);
            drivers[driver].totalTime += lapTime;
            drivers[driver].laps++;
        }
    });
    
    return Object.values(drivers)
        .map(driver => ({
            ...driver,
            avgLap: driver.totalTime / driver.laps,
            gap: 0 // Will be calculated relative to leader
        }))
        .sort((a, b) => a.bestLap - b.bestLap)
        .slice(0, count)
        .map((driver, index) => ({
            ...driver,
            gap: index === 0 ? 0 : driver.bestLap - sessionData.reduce((best, lap) => {
                const time = parseFloat(lap.Ronde_tijd || lap.LapTime || 999);
                return time < best ? time : best;
            }, 999)
        }));
}

function generateSessionTimeline(sessionData) {
    // Generate mock timeline events
    const events = [
        { type: 'session-start', time: '10:00', title: 'Session Started', description: 'Track opened for practice' },
        { type: 'milestone', time: '10:15', title: 'First Sub-60s Lap', description: 'New track milestone achieved' },
        { type: 'record', time: '10:32', title: 'Track Record', description: 'New fastest lap set' },
        { type: 'incident', time: '10:45', title: 'Track Incident', description: 'Minor incident, yellow flag' },
        { type: 'milestone', time: '11:00', title: '50 Laps Completed', description: 'Session milestone reached' }
    ];
    
    return events;
}

function formatTimelineTime(time) {
    return time; // Already formatted
}

function analyzeTrackConditions(sessionData) {
    // Mock track conditions analysis
    return {
        overall: 'optimal',
        weather: 'Sunny',
        weatherTrend: '☀️ Stable',
        temperature: 24,
        tempTrend: '↗️ Rising',
        surface: 'Dry',
        surfaceTrend: '✅ Good',
        grip: 95,
        gripTrend: '↗️ Improving',
        lapTimeImpact: -0.234,
        consistencyImpact: 12,
        safetyFactor: 0.92
    };
}

function initializeSessionWidgets() {
    
    createSessionControlWidget();
    createLiveSessionMonitor();
    createSessionStatsWidget();
    createDriverPerformanceMonitor();
    createSessionProgressTimeline();
    createConditionsMonitor();
    
}


