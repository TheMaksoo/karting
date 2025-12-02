import { computed } from 'vue'
import type { ChartOptions } from 'chart.js'

export function useChartConfig() {
  // Color palette from your original dashboard
  const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF6384', '#C9CBCF', '#4BC0C0'
  ]

  // Base chart options
  const baseOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', 'Segoe UI', system-ui, sans-serif",
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {},
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }

  // Line chart options
  const lineChartOptions = computed<ChartOptions<'line'>>(() => ({
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }))

  // Bar chart options
  const barChartOptions = computed<ChartOptions<'bar'>>(() => ({
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }))

  // Radar chart options
  const radarChartOptions = computed<ChartOptions<'radar'>>(() => ({
    ...baseOptions,
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          backdropColor: 'transparent',
        },
      },
    },
  }))

  // Pie/Doughnut chart options
  const pieChartOptions = computed<ChartOptions<'pie'>>(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        position: 'right',
      },
    },
  }))

  // Scatter chart options
  const scatterChartOptions = computed<ChartOptions<'scatter'>>(() => ({
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        beginAtZero: true,
      },
    },
  }))

  // Helper function to get color from palette
  const getColor = (index: number): string => {
    const color = colorPalette[index % colorPalette.length]
    return color || colorPalette[0]!
  }

  // Helper function to generate dataset colors
  const generateColors = (count: number, alpha: number = 1): string[] => {
    return Array.from({ length: count }, (_, i) => {
      const color = getColor(i)
      if (alpha < 1) {
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      return color
    })
  }

  // Format time (seconds to mm:ss.ms)
  const formatLapTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  return {
    colorPalette,
    baseOptions,
    lineChartOptions,
    barChartOptions,
    radarChartOptions,
    pieChartOptions,
    scatterChartOptions,
    getColor,
    generateColors,
    formatLapTime,
    formatNumber,
  }
}
