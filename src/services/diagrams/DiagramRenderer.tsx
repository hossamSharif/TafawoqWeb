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
import { OverlappingShapesSVG } from './OverlappingShapesSVG';

export interface DiagramRendererProps {
  config?: any;
  diagram?: any; // Support both config and diagram props
  width?: number;
  height?: number;
  className?: string;
  enableZoom?: boolean;
  onLoadSuccess?: () => void;
  onLoadError?: (error: string) => void;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  config,
  diagram,
  width = 400,
  height = 400,
  className = '',
  onLoadSuccess,
  onLoadError,
}) => {
  // Support both config and diagram prop names
  const diagramConfig = config || diagram;

  if (!diagramConfig) {
    return (
      <div className="text-red-500 p-4">
        Error: No diagram configuration provided
      </div>
    );
  }

  const { renderHint } = diagramConfig;

  switch (renderHint) {
    case 'SVG':
      return (
        <SVGRenderer
          config={diagramConfig}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'JSXGraph':
      // Use pure SVG for overlapping-shapes to avoid JSXGraph bundling issues
      if (diagramConfig.type === 'overlapping-shapes') {
        return (
          <OverlappingShapesSVG
            config={diagramConfig}
            width={width}
            height={height}
            className={className}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
          />
        );
      }
      return (
        <JSXGraphRenderer
          config={diagramConfig}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'Chart.js':
      return (
        <ChartRenderer
          config={diagramConfig}
          width={width}
          height={height}
          className={className}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
        />
      );

    default:
      return (
        <div className="text-yellow-600 p-4">
          Warning: Unknown renderHint '{renderHint}'. Defaulting to SVG.
          <SVGRenderer
            config={diagramConfig}
            width={width}
            height={height}
            className={className}
          />
        </div>
      );
  }
};
