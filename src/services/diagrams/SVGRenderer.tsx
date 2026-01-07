/**
 * SVGRenderer.tsx
 * Renders simple geometric shapes using SVG
 *
 * Supports:
 * - 18 simple shape types (circle, triangle, rectangle, etc.)
 * - Arabic RTL text labels
 * - Responsive scaling
 * - Accessibility features
 *
 * @see specs/1-gat-exam-v3/plan.md - Diagram Rendering Strategy
 * @see User Story 1 - Simple shape rendering
 */

'use client';

import React from 'react';

export interface SVGRendererProps {
  /** Diagram configuration */
  config: any;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Additional CSS classes */
  className?: string;
}

export const SVGRenderer: React.FC<SVGRendererProps> = ({
  config,
  width,
  height,
  className = '',
}) => {
  const viewBox = `0 0 ${width} ${height}`;

  const renderShape = () => {
    const { type, data } = config;

    switch (type) {
      case 'circle':
        return renderCircle(data);
      case 'triangle':
        return renderTriangle(data);
      case 'rectangle':
        return renderRectangle(data);
      case 'square':
        return renderSquare(data);
      case 'polygon':
        return renderPolygon(data);
      case 'composite-shape':
        return renderCompositeShape(data);
      default:
        return null;
    }
  };

  const renderCircle = (data: any) => {
    const { center, radius, features = [], labels = {} } = data;

    return (
      <g>
        {/* Main circle */}
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Features (diameter, chord, etc.) */}
        {features.includes('diameter') && (
          <line
            x1={center.x - radius}
            y1={center.y}
            x2={center.x + radius}
            y2={center.y}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* Labels */}
        {Object.entries(labels).map(([key, value]) => {
          const labelPos = getLabelPosition(key, center, radius);
          return (
            <text
              key={key}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              className="text-sm"
              direction="rtl"
            >
              {String(value)}
            </text>
          );
        })}
      </g>
    );
  };

  const renderTriangle = (data: any) => {
    const { vertices, labels = {} } = data;
    const points = vertices.map((v: any) => `${v.x},${v.y}`).join(' ');

    return (
      <g>
        <polygon
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Vertex labels */}
        {vertices.map((vertex: any, index: number) => {
          const labelKey = `vertex${index}`;
          const label = labels[labelKey];
          if (!label) return null;

          return (
            <text
              key={labelKey}
              x={vertex.x}
              y={vertex.y - 10}
              textAnchor="middle"
              className="text-sm font-bold"
              direction="rtl"
            >
              {label}
            </text>
          );
        })}
      </g>
    );
  };

  const renderRectangle = (data: any) => {
    const { x, y, width: w, height: h, labels = {} } = data;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Corner labels */}
        {Object.entries(labels).map(([key, value]) => {
          const labelPos = getRectLabelPosition(key, x, y, w, h);
          return (
            <text
              key={key}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              className="text-sm font-bold"
              direction="rtl"
            >
              {String(value)}
            </text>
          );
        })}
      </g>
    );
  };

  const renderSquare = (data: any) => {
    const { x, y, side, labels = {} } = data;
    return renderRectangle({ x, y, width: side, height: side, labels });
  };

  const renderPolygon = (data: any) => {
    const { vertices, labels = {} } = data;
    const points = vertices.map((v: any) => `${v.x},${v.y}`).join(' ');

    return (
      <g>
        <polygon
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Labels */}
        {Object.entries(labels).map(([key, value], index) => {
          const vertex = vertices[index];
          if (!vertex) return null;

          return (
            <text
              key={key}
              x={vertex.x}
              y={vertex.y - 10}
              textAnchor="middle"
              className="text-sm"
              direction="rtl"
            >
              {String(value)}
            </text>
          );
        })}
      </g>
    );
  };

  const renderCompositeShape = (data: any) => {
    const { shapes = [], labels = [], shaded = false } = data;

    return (
      <g>
        {/* Render each shape in the composite */}
        {shapes.map((shape: any, index: number) => {
          const key = `shape-${index}`;
          const fillColor = shaded ? 'rgba(59, 130, 246, 0.1)' : 'none';

          switch (shape.type) {
            case 'rectangle':
              return (
                <rect
                  key={key}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={fillColor}
                  stroke="currentColor"
                  strokeWidth="2"
                />
              );

            case 'circle':
              if (shape.half) {
                // Render half circle using path
                const startAngle = -Math.PI / 2; // Start from top
                const endAngle = Math.PI / 2;    // End at bottom
                const x1 = shape.cx + shape.radius * Math.cos(startAngle);
                const y1 = shape.cy + shape.radius * Math.sin(startAngle);
                const x2 = shape.cx + shape.radius * Math.cos(endAngle);
                const y2 = shape.cy + shape.radius * Math.sin(endAngle);

                return (
                  <path
                    key={key}
                    d={`M ${x1} ${y1} A ${shape.radius} ${shape.radius} 0 0 1 ${x2} ${y2} L ${shape.cx} ${y2} L ${shape.cx} ${y1} Z`}
                    fill={fillColor}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                );
              } else {
                return (
                  <circle
                    key={key}
                    cx={shape.cx}
                    cy={shape.cy}
                    r={shape.radius}
                    fill={fillColor}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                );
              }

            default:
              return null;
          }
        })}

        {/* Render labels */}
        {labels.map((label: string, index: number) => (
          <text
            key={`label-${index}`}
            x={width / 2}
            y={height - 10 - (index * 20)}
            textAnchor="middle"
            className="text-sm"
            direction="rtl"
          >
            {label}
          </text>
        ))}
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={`inline-block ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={config?.caption || 'Geometric diagram'}
    >
      {renderShape()}
    </svg>
  );
};

// Helper functions
function getLabelPosition(
  key: string,
  center: { x: number; y: number },
  radius: number
): { x: number; y: number } {
  const offsets: Record<string, { x: number; y: number }> = {
    center: { x: 0, y: 5 },
    top: { x: 0, y: -radius - 15 },
    bottom: { x: 0, y: radius + 20 },
    left: { x: -radius - 20, y: 5 },
    right: { x: radius + 20, y: 5 },
  };

  const offset = offsets[key] || { x: 0, y: 0 };
  return {
    x: center.x + offset.x,
    y: center.y + offset.y,
  };
}

function getRectLabelPosition(
  key: string,
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    topLeft: { x: x, y: y - 10 },
    topRight: { x: x + width, y: y - 10 },
    bottomLeft: { x: x, y: y + height + 20 },
    bottomRight: { x: x + width, y: y + height + 20 },
    center: { x: x + width / 2, y: y + height / 2 },
  };

  return positions[key] || { x, y };
}
