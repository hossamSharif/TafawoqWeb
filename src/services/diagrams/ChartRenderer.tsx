/**
 * ChartRenderer.tsx
 * Renders statistical charts using Chart.js
 *
 * Supports:
 * - Bar charts (horizontal and vertical)
 * - Line charts
 * - Pie charts
 * - Arabic RTL labels
 * - Responsive scaling
 *
 * @see specs/1-gat-exam-v3/plan.md - Chart.js Integration
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface ChartRendererProps {
  config: {
    type: string;
    data: {
      title?: string;
      labels?: string[];
      values?: number[];
      datasets?: Array<{
        label?: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      }>;
      xAxisLabel?: string;
      yAxisLabel?: string;
      chartType?: string;
    };
    caption?: string;
    renderHint?: string;
  };
  width?: number;
  height?: number;
  className?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: string) => void;
}

// Color palette for charts
const CHART_COLORS = [
  'rgba(59, 130, 246, 0.8)',   // Blue
  'rgba(16, 185, 129, 0.8)',   // Green
  'rgba(245, 158, 11, 0.8)',   // Amber
  'rgba(239, 68, 68, 0.8)',    // Red
  'rgba(139, 92, 246, 0.8)',   // Purple
  'rgba(236, 72, 153, 0.8)',   // Pink
  'rgba(20, 184, 166, 0.8)',   // Teal
  'rgba(249, 115, 22, 0.8)',   // Orange
];

const CHART_BORDER_COLORS = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(20, 184, 166, 1)',
  'rgba(249, 115, 22, 1)',
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  width = 400,
  height = 300,
  className = '',
  onLoadSuccess,
  onLoadError,
}) => {
  const chartRef = useRef<ChartJS | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate config
    if (!config || !config.data) {
      const errMsg = 'Invalid chart configuration';
      setError(errMsg);
      onLoadError?.(errMsg);
      return;
    }

    // Mark as ready after a short delay to ensure Chart.js is initialized
    const timer = setTimeout(() => {
      setIsReady(true);
      onLoadSuccess?.();
    }, 100);

    return () => clearTimeout(timer);
  }, [config, onLoadSuccess, onLoadError]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 text-red-500 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const { type, data, caption } = config;
  const chartType = type || data?.chartType || 'bar-chart';

  // Prepare chart data
  const prepareChartData = (): ChartData<'bar' | 'line' | 'pie'> => {
    const labels = data.labels || [];
    const values = data.values || [];

    // If datasets are provided, use them directly
    if (data.datasets && data.datasets.length > 0) {
      return {
        labels,
        datasets: data.datasets.map((ds, idx) => ({
          label: ds.label || '',
          data: ds.data,
          backgroundColor: ds.backgroundColor || CHART_COLORS[idx % CHART_COLORS.length],
          borderColor: ds.borderColor || CHART_BORDER_COLORS[idx % CHART_BORDER_COLORS.length],
          borderWidth: 1,
        })),
      };
    }

    // Otherwise, create a single dataset from values
    const isPieChart = chartType.includes('pie');

    return {
      labels,
      datasets: [
        {
          label: data.title || '',
          data: values,
          backgroundColor: isPieChart
            ? CHART_COLORS.slice(0, values.length)
            : CHART_COLORS[0],
          borderColor: isPieChart
            ? CHART_BORDER_COLORS.slice(0, values.length)
            : CHART_BORDER_COLORS[0],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart options
  const prepareChartOptions = (): ChartOptions<'bar' | 'line' | 'pie'> => {
    const baseOptions: ChartOptions<'bar' | 'line' | 'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType.includes('pie'),
          position: 'bottom' as const,
          rtl: true,
          labels: {
            font: {
              family: 'inherit',
            },
          },
        },
        title: {
          display: !!data.title,
          text: data.title || '',
          font: {
            size: 14,
            weight: 'bold',
            family: 'inherit',
          },
        },
        tooltip: {
          rtl: true,
          titleFont: {
            family: 'inherit',
          },
          bodyFont: {
            family: 'inherit',
          },
        },
      },
    };

    // Add scales for bar and line charts
    if (!chartType.includes('pie')) {
      (baseOptions as ChartOptions<'bar' | 'line'>).scales = {
        x: {
          title: {
            display: !!data.xAxisLabel,
            text: data.xAxisLabel || '',
            font: {
              family: 'inherit',
            },
          },
          ticks: {
            font: {
              family: 'inherit',
            },
          },
        },
        y: {
          title: {
            display: !!data.yAxisLabel,
            text: data.yAxisLabel || '',
            font: {
              family: 'inherit',
            },
          },
          ticks: {
            font: {
              family: 'inherit',
            },
          },
          beginAtZero: true,
        },
      };
    }

    return baseOptions;
  };

  const chartData = prepareChartData();
  const chartOptions = prepareChartOptions();

  // Render appropriate chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar-chart':
      case 'bar':
      case 'histogram':
        return (
          <Bar
            ref={chartRef as React.RefObject<ChartJS<'bar'>>}
            data={chartData as ChartData<'bar'>}
            options={chartOptions as ChartOptions<'bar'>}
          />
        );

      case 'line-chart':
      case 'line':
      case 'line-graph':
        return (
          <Line
            ref={chartRef as React.RefObject<ChartJS<'line'>>}
            data={chartData as ChartData<'line'>}
            options={chartOptions as ChartOptions<'line'>}
          />
        );

      case 'pie-chart':
      case 'pie':
        return (
          <Pie
            ref={chartRef as React.RefObject<ChartJS<'pie'>>}
            data={chartData as ChartData<'pie'>}
            options={chartOptions as ChartOptions<'pie'>}
          />
        );

      default:
        // Default to bar chart
        return (
          <Bar
            ref={chartRef as React.RefObject<ChartJS<'bar'>>}
            data={chartData as ChartData<'bar'>}
            options={chartOptions as ChartOptions<'bar'>}
          />
        );
    }
  };

  return (
    <div
      className={`chart-container ${className}`}
      style={{ width, height, position: 'relative' }}
      role="img"
      aria-label={caption || data.title || 'Statistical chart'}
    >
      {!isReady ? (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">جاري تحميل الرسم...</p>
          </div>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
};
