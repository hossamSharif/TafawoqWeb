/**
 * DiagramRenderer.tsx
 * Routes diagrams to appropriate renderer based on renderHint
 *
 * Routing logic:
 * - SVG: Simple shapes
 * - JSXGraph: Overlapping shapes with shading
 * - Chart.js: Statistical charts
 *
 * @see specs/1-gat-exam-v3/plan.md - Diagram Rendering Architecture
 */

'use client';

import React from 'react';
import { SVGRenderer } from './SVGRenderer';
import { JSXGraphRenderer } from './JSXGraphRenderer';
import { ChartRenderer } from './ChartRenderer';

export interface DiagramRendererProps {
  config: any;
  width?: number;
  height?: number;
  className?: string;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  config,
  width = 400,
  height = 400,
  className = '',
}) => {
  if (!config) {
    return (
      <div className="text-red-500 p-4">
        Error: No diagram configuration provided
      </div>
    );
  }

  const { renderHint } = config;

  switch (renderHint) {
    case 'SVG':
      return (
        <SVGRenderer
          config={config}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'JSXGraph':
      return (
        <JSXGraphRenderer
          config={config}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'Chart.js':
      return (
        <ChartRenderer
          config={config}
          width={width}
          height={height}
          className={className}
        />
      );

    default:
      return (
        <div className="text-yellow-600 p-4">
          Warning: Unknown renderHint '{renderHint}'. Defaulting to SVG.
          <SVGRenderer
            config={config}
            width={width}
            height={height}
            className={className}
          />
        </div>
      );
  }
};
