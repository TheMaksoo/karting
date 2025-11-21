// ========== FINANCIAL CHARTS MODULE ==========
// Extracted from script.js

// Make function globally accessible
window.initializeFinancialCharts = function() {
    
    // Add event listeners for controls
    addChartEventListener('costAnalysisType', createCostAnalysisChart);
    addChartEventListener('pricingAnalysisMetric', createDynamicPricingChart);
    addChartEventListener('revenueTimeframe', createRevenueTrendsChart);
    
    // Create all charts
    createCostAnalysisChart();
    createDynamicPricingChart();
    createRevenueTrendsChart();
    createDriverValueChart();
    createSessionProfitabilityChart();
    createROICalculationChart();
}; // End of window.initializeFinancialCharts

// 5.1 Cost per Session Analysis
function createCostAnalysisChart() {
    const ctx = document.getElementById('costAnalysisChart');
    if (!ctx) return;

    const analysisType = document.getElementById('costAnalysisType')?.value || 'perSession';
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Simulate cost data based on session characteristics
    const costData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        const avgLapTime = sessionData.reduce((sum, row) => sum + parseFloat(row.LapTime || 0), 0) / sessionData.length;
        
        // Base costs (simulated)
        const trackRental = 200; // Base track rental
        const fuelCost = totalLaps * 0.5; // $0.50 per lap
        const maintenance = totalLaps * 0.3; // $0.30 per lap
        const staffCost = uniqueDrivers * 15; // $15 per driver
        const equipmentCost = totalLaps * 0.2; // $0.20 per lap
        const overhead = (trackRental + fuelCost + maintenance + staffCost + equipmentCost) * 0.15;
        
        const totalCost = trackRental + fuelCost + maintenance + staffCost + equipmentCost + overhead;
        
        return {
            session,
            trackRental,
            fuelCost,
            maintenance,
            staffCost,
            equipmentCost,
            overhead,
            totalCost,
            costPerLap: totalLaps > 0 ? totalCost / totalLaps : 0,
            costPerDriver: uniqueDrivers > 0 ? totalCost / uniqueDrivers : 0
        };
    });

    let chartData, labels;
    
    if (analysisType === 'perSession') {
        labels = sessions;
        chartData = [
            {
                label: 'Track Rental',
                data: costData.map(item => item.trackRental),
                backgroundColor: '#FF6B35CC',
                borderColor: '#FF6B35',
                borderWidth: 1
            },
            {
                label: 'Fuel Cost',
                data: costData.map(item => item.fuelCost),
                backgroundColor: '#4ECDC4CC',
                borderColor: '#4ECDC4',
                borderWidth: 1
            },
            {
                label: 'Maintenance',
                data: costData.map(item => item.maintenance),
                backgroundColor: '#45B7D1CC',
                borderColor: '#45B7D1',
                borderWidth: 1
            },
            {
                label: 'Staff Cost',
                data: costData.map(item => item.staffCost),
                backgroundColor: '#F7DC6FCC',
                borderColor: '#F7DC6F',
                borderWidth: 1
            },
            {
                label: 'Equipment',
                data: costData.map(item => item.equipmentCost),
                backgroundColor: '#BB8FCECC',
                borderColor: '#BB8FCE',
                borderWidth: 1
            },
            {
                label: 'Overhead',
                data: costData.map(item => item.overhead),
                backgroundColor: '#85C1E9CC',
                borderColor: '#85C1E9',
                borderWidth: 1
            }
        ];
    } else if (analysisType === 'perLap') {
        labels = sessions;
        chartData = [{
            label: 'Cost per Lap ($)',
            data: costData.map(item => item.costPerLap),
            backgroundColor: '#FF6B35CC',
            borderColor: '#FF6B35',
            borderWidth: 2,
            borderRadius: 8
        }];
    } else {
        labels = sessions;
        chartData = [{
            label: 'Cost per Driver ($)',
            data: costData.map(item => item.costPerDriver),
            backgroundColor: '#4ECDC4CC',
            borderColor: '#4ECDC4',
            borderWidth: 2,
            borderRadius: 8
        }];
    }

    destroyChart('costAnalysis');
    charts.costAnalysis = new Chart(ctx, {
        type: analysisType === 'perSession' ? 'bar' : 'line',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: analysisType === 'perSession',
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    stacked: analysisType === 'perSession',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
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
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// 5.2 Dynamic Pricing Analysis
function createDynamicPricingChart() {
    const ctx = document.getElementById('dynamicPricingChart');
    if (!ctx) return;

    const metric = document.getElementById('pricingAnalysisMetric')?.value || 'demand';
    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Calculate pricing factors
    const pricingData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        const avgLapTime = sessionData.reduce((sum, row) => sum + parseFloat(row.LapTime || 0), 0) / sessionData.length;
        
        // Demand factor (based on number of drivers and laps)
        const baseDemand = 50;
        const demandFactor = baseDemand + (uniqueDrivers * 5) + (totalLaps * 0.1);
        
        // Peak time factor (simulate weekend/evening pricing)
        const dayOfWeek = new Date(session).getDay();
        const peakMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0; // Weekend premium
        
        // Performance factor based on track consistency (lower std dev = premium track)
        const lapTimes = sessionData.map(row => parseFloat(row.LapTime || 0)).filter(t => t > 0);
        const consistency = lapTimes.length > 1 ? calculateStandardDeviation(lapTimes) : 0;
        const performanceFactor = 0.8 + Math.max(0, Math.min(0.4, (5 - consistency) / 10));
        
        // Base price calculation
        const basePrice = 25; // $25 base price per session
        const dynamicPrice = basePrice * performanceFactor * peakMultiplier * (demandFactor / 50);
        
        return {
            session,
            basePrice,
            demandFactor,
            peakMultiplier,
            performanceFactor,
            dynamicPrice,
            priceChange: ((dynamicPrice - basePrice) / basePrice) * 100
        };
    });

    let chartData;
    
    if (metric === 'demand') {
        chartData = [{
            label: 'Demand Factor',
            data: pricingData.map(item => item.demandFactor),
            backgroundColor: '#FF6B35CC',
            borderColor: '#FF6B35',
            borderWidth: 3,
            fill: false,
            tension: 0.4
        }];
    } else if (metric === 'pricing') {
        chartData = [
            {
                label: 'Base Price',
                data: pricingData.map(item => item.basePrice),
                backgroundColor: '#94A3B8CC',
                borderColor: '#94A3B8',
                borderWidth: 2,
                type: 'line',
                fill: false
            },
            {
                label: 'Dynamic Price',
                data: pricingData.map(item => item.dynamicPrice),
                backgroundColor: '#22C55ECC',
                borderColor: '#22C55E',
                borderWidth: 3,
                type: 'line',
                fill: false,
                tension: 0.4
            }
        ];
    } else {
        chartData = [{
            label: 'Price Change (%)',
            data: pricingData.map(item => item.priceChange),
            backgroundColor: pricingData.map(item => item.priceChange >= 0 ? '#22C55ECC' : '#EF4444CC'),
            borderColor: pricingData.map(item => item.priceChange >= 0 ? '#22C55E' : '#EF4444'),
            borderWidth: 2,
            borderRadius: 6
        }];
    }

    destroyChart('dynamicPricing');
    charts.dynamicPricing = new Chart(ctx, {
        type: metric === 'change' ? 'bar' : 'line',
        data: {
            labels: sessions,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: metric !== 'change',
                    title: {
                        display: true,
                        text: metric === 'demand' ? 'Demand Factor' : 
                              metric === 'pricing' ? 'Price ($)' : 'Price Change (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            if (metric === 'pricing') return '$' + value.toFixed(0);
                            if (metric === 'change') return value.toFixed(1) + '%';
                            return value.toFixed(0);
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
                    borderWidth: 1
                }
            }
        }
    });
}

// 5.3 Revenue Trends Chart
function createRevenueTrendsChart() {
    const ctx = document.getElementById('revenueTrendsChart');
    if (!ctx) return;

    const timeframe = document.getElementById('revenueTimeframe')?.value || 'monthly';
    
    // Group data by timeframe
    const revenueData = {};
    
    filteredData.forEach(row => {
        const date = new Date(row.SessionDate);
        let key;
        
        if (timeframe === 'daily') {
            key = row.SessionDate;
        } else if (timeframe === 'weekly') {
            const week = getWeekNumber(date);
            key = `${date.getFullYear()}-W${week}`;
        } else if (timeframe === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = date.getFullYear().toString();
        }
        
        if (!revenueData[key]) {
            revenueData[key] = {
                totalLaps: 0,
                uniqueDrivers: new Set(),
                sessions: new Set(),
                revenue: 0
            };
        }
        
        revenueData[key].totalLaps++;
        revenueData[key].uniqueDrivers.add(row.Driver);
        revenueData[key].sessions.add(row.SessionDate);
    });
    
    // Calculate revenue for each period
    Object.keys(revenueData).forEach(key => {
        const data = revenueData[key];
        const avgPricePerSession = 30; // $30 average per session
        const avgPricePerLap = 2; // $2 per lap
        
        data.revenue = (data.sessions.size * avgPricePerSession) + (data.totalLaps * avgPricePerLap);
        data.uniqueDrivers = data.uniqueDrivers.size;
    });
    
    const labels = Object.keys(revenueData).sort();
    const revenues = labels.map(key => revenueData[key].revenue);
    const drivers = labels.map(key => revenueData[key].uniqueDrivers);

    destroyChart('revenueTrends');
    charts.revenueTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: revenues,
                    borderColor: '#22C55E',
                    backgroundColor: '#22C55E40',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Unique Drivers',
                    data: drivers,
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F640',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
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
                    title: {
                        display: true,
                        text: timeframe.charAt(0).toUpperCase() + timeframe.slice(1) + ' Period',
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

// 5.4 Driver Value Analysis Chart
function createDriverValueChart() {
    const ctx = document.getElementById('driverValueChart');
    if (!ctx) return;

    const drivers = [...new Set(filteredData.map(row => row.Driver))];
    
    // Calculate driver value metrics
    const driverValues = drivers.map(driver => {
        const driverData = filteredData.filter(row => row.Driver === driver);
        const totalLaps = driverData.length;
        const sessions = new Set(driverData.map(row => row.SessionDate)).size;
        
        // Revenue contribution
        const sessionRevenue = sessions * 30; // $30 per session
        const lapRevenue = totalLaps * 2; // $2 per lap
        const totalRevenue = sessionRevenue + lapRevenue;
        
        // Loyalty score (based on session frequency)
        const loyaltyScore = Math.min(sessions * 10, 100);
        
        // Performance value based on consistency (consistent drivers are engaged customers)
        const lapTimes = driverData.map(row => parseFloat(row.LapTime || 0)).filter(time => time > 0);
        const consistency = lapTimes.length > 1 ? calculateStandardDeviation(lapTimes) : 0;
        const engagementValue = Math.max(0, 100 - (consistency * 10)) * 5; // Lower std dev = more engaged
        
        // Total customer value
        const customerValue = totalRevenue + loyaltyScore + engagementValue;
        
        return {
            driver,
            totalRevenue,
            loyaltyScore,
            performanceValue: engagementValue,
            customerValue,
            sessions,
            totalLaps
        };
    });
    
    // Sort by customer value
    driverValues.sort((a, b) => b.customerValue - a.customerValue);

    destroyChart('driverValue');
    charts.driverValue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: driverValues.map(item => item.driver),
            datasets: [
                {
                    label: 'Revenue Contribution',
                    data: driverValues.map(item => item.totalRevenue),
                    backgroundColor: '#22C55ECC',
                    borderColor: '#22C55E',
                    borderWidth: 1
                },
                {
                    label: 'Loyalty Value',
                    data: driverValues.map(item => item.loyaltyScore),
                    backgroundColor: '#3B82F6CC',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                },
                {
                    label: 'Performance Value',
                    data: driverValues.map(item => item.performanceValue),
                    backgroundColor: '#F59E0BCC',
                    borderColor: '#F59E0B',
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Customer Value ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
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
                        footer: function(tooltipItems) {
                            const driverIndex = tooltipItems[0].dataIndex;
                            const driver = driverValues[driverIndex];
                            return `Total Value: $${driver.customerValue.toFixed(0)}\nSessions: ${driver.sessions}\nLaps: ${driver.totalLaps}`;
                        }
                    }
                }
            }
        }
    });
}

// 5.5 Session Profitability Chart
function createSessionProfitabilityChart() {
    const ctx = document.getElementById('sessionProfitabilityChart');
    if (!ctx) return;

    const sessions = [...new Set(filteredData.map(row => row.SessionDate))].sort();
    
    // Calculate profitability for each session
    const profitabilityData = sessions.map(session => {
        const sessionData = filteredData.filter(row => row.SessionDate === session);
        const totalLaps = sessionData.length;
        const uniqueDrivers = new Set(sessionData.map(row => row.Driver)).size;
        
        // Revenue calculation
        const sessionRevenue = uniqueDrivers * 30; // $30 per driver per session
        const lapRevenue = totalLaps * 2; // $2 per lap
        const totalRevenue = sessionRevenue + lapRevenue;
        
        // Cost calculation (from earlier function)
        const trackRental = 200;
        const fuelCost = totalLaps * 0.5;
        const maintenance = totalLaps * 0.3;
        const staffCost = uniqueDrivers * 15;
        const equipmentCost = totalLaps * 0.2;
        const overhead = (trackRental + fuelCost + maintenance + staffCost + equipmentCost) * 0.15;
        const totalCost = trackRental + fuelCost + maintenance + staffCost + equipmentCost + overhead;
        
        // Profit calculation
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        return {
            session,
            revenue: totalRevenue,
            cost: totalCost,
            profit,
            profitMargin,
            drivers: uniqueDrivers,
            laps: totalLaps
        };
    });

    destroyChart('sessionProfitability');
    charts.sessionProfitability = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sessions,
            datasets: [
                {
                    label: 'Revenue',
                    data: profitabilityData.map(item => item.revenue),
                    backgroundColor: '#22C55ECC',
                    borderColor: '#22C55E',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Cost',
                    data: profitabilityData.map(item => -item.cost), // Negative for visual effect
                    backgroundColor: '#EF4444CC',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Profit',
                    data: profitabilityData.map(item => item.profit),
                    backgroundColor: profitabilityData.map(item => item.profit >= 0 ? '#3B82F6CC' : '#F59E0BCC'),
                    borderColor: profitabilityData.map(item => item.profit >= 0 ? '#3B82F6' : '#F59E0B'),
                    borderWidth: 2,
                    borderRadius: 4,
                    type: 'line',
                    tension: 0.4,
                    pointRadius: 6
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
                        text: 'Amount ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + Math.abs(value).toFixed(0);
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
                            const value = Math.abs(context.parsed.y);
                            return context.dataset.label + ': $' + value.toFixed(0);
                        },
                        footer: function(tooltipItems) {
                            const sessionIndex = tooltipItems[0].dataIndex;
                            const data = profitabilityData[sessionIndex];
                            return `Margin: ${data.profitMargin.toFixed(1)}%\nDrivers: ${data.drivers}\nLaps: ${data.laps}`;
                        }
                    }
                }
            }
        }
    });
}

// 5.6 ROI Calculation Chart
function createROICalculationChart() {
    const ctx = document.getElementById('roiCalculationChart');
    if (!ctx) return;

    // Calculate ROI for different investment scenarios
    const investments = [
        { name: 'Track Upgrade', cost: 5000, monthlyReturn: 800 },
        { name: 'New Karts', cost: 15000, monthlyReturn: 2200 },
        { name: 'Safety Equipment', cost: 3000, monthlyReturn: 400 },
        { name: 'Timing System', cost: 8000, monthlyReturn: 1100 },
        { name: 'Marketing Campaign', cost: 2000, monthlyReturn: 600 },
        { name: 'Staff Training', cost: 1500, monthlyReturn: 300 }
    ];
    
    // Calculate various ROI metrics
    const roiData = investments.map(investment => {
        const monthsToBreakeven = investment.cost / investment.monthlyReturn;
        const annualReturn = investment.monthlyReturn * 12;
        const roiPercentage = (annualReturn / investment.cost) * 100;
        const paybackPeriod = investment.cost / investment.monthlyReturn;
        
        return {
            ...investment,
            monthsToBreakeven,
            annualReturn,
            roiPercentage,
            paybackPeriod
        };
    });

    destroyChart('roiCalculation');
    charts.roiCalculation = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Investment Opportunities',
                data: roiData.map(item => ({
                    x: item.cost,
                    y: item.roiPercentage,
                    r: Math.sqrt(item.monthlyReturn) / 3, // Size based on monthly return
                    investment: item.name,
                    monthlyReturn: item.monthlyReturn,
                    payback: item.paybackPeriod
                })),
                backgroundColor: roiData.map((item, index) => {
                    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
                    return colors[index % colors.length] + 'CC';
                }),
                borderColor: roiData.map((item, index) => {
                    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9'];
                    return colors[index % colors.length];
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Investment Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Annual ROI (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return value.toFixed(0) + '%';
                        }
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
                            return context[0].raw.investment;
                        },
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Investment: $${data.x.toLocaleString()}`,
                                `Annual ROI: ${data.y.toFixed(1)}%`,
                                `Monthly Return: $${data.monthlyReturn}`,
                                `Payback Period: ${data.payback.toFixed(1)} months`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ========== 6. TEMPORAL ANALYTICS ==========


