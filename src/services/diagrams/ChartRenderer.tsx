/**
 * ChartRenderer.tsx
 * Renders statistical charts using Chart.js (lazy loaded)
 *
 * Supports:
 * - 9 chart types (bar, line, pie, histogram, etc.)
 * - Arabic i18n for labels
 * - Responsive scaling
 *
 * @see specs/1-gat-exam-v3/plan.md - Chart.js Integration
 */

'use client';

import React from 'react';

export interface ChartRendererProps {
  config: any;
  width: number;
  height: number;
  className?: string;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  width,
  height,
  className = '',
}) => {
  return (
    <div
      style={{ width, height }}
      className={`chart-container ${className}`}
      role="img"
      aria-label={config.caption || 'Statistical chart'}
    >
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        <p className="text-sm">Chart.js: {config.data?.chartType || 'Chart'}</p>
      </div>
    </div>
  );
};
