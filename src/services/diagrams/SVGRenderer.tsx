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

// Helper to normalize point from array [x,y] or object {x,y}
function normalizePoint(point: any): { x: number; y: number } {
  if (Array.isArray(point)) {
    return { x: point[0] || 0, y: point[1] || 0 };
  }
  if (point && typeof point === 'object') {
    return { x: point.x || 0, y: point.y || 0 };
  }
  return { x: 0, y: 0 };
}

// Helper to normalize vertices array
function normalizeVertices(vertices: any): Array<{ x: number; y: number }> {
  if (!Array.isArray(vertices)) return [];
  return vertices.map(normalizePoint);
}

// Helper to normalize labels (can be object or array)
function normalizeLabels(labels: any, vertexLabels?: string[]): Record<string, string> {
  // If it's already an object, return it
  if (labels && typeof labels === 'object' && !Array.isArray(labels)) {
    return labels;
  }

  // If vertexLabels provided (e.g., ["أ", "ب", "ج"]), convert to object
  if (Array.isArray(vertexLabels)) {
    const result: Record<string, string> = {};
    vertexLabels.forEach((label, i) => {
      result[`vertex${i}`] = label;
    });
    return result;
  }

  return {};
}

// Helper to safely extract label text from string or object
function getLabelText(label: any): string | null {
  if (typeof label === 'string') {
    return label;
  }
  if (label && typeof label === 'object') {
    // Handle objects with label, text, or name properties
    if (typeof label.label === 'string') return label.label;
    if (typeof label.text === 'string') return label.text;
    if (typeof label.name === 'string') return label.name;
  }
  return null;
}

export const SVGRenderer: React.FC<SVGRendererProps> = ({
  config,
  width,
  height,
  className = '',
}) => {
  const viewBox = `0 0 ${width} ${height}`;

  const renderShape = () => {
    if (!config) return null;
    const { type, data } = config;
    if (!data) return null;

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
    // Normalize center point (can be [x,y] or {x,y})
    const center = normalizePoint(data.center);
    // Handle both 'radius' number and scaled radius
    const radius = typeof data.radius === 'number' ? data.radius * 10 : 50; // Scale up for visibility
    const features = data.features || [];
    const normalizedLabels = normalizeLabels(data.labels);

    // Handle label from data.label (string like "نق = 7 سم")
    const labelText = data.label || '';

    return (
      <g>
        {/* Main circle */}
        <circle
          cx={center.x || width / 2}
          cy={center.y || height / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Show radius line if showRadius is true */}
        {data.showRadius && (
          <line
            x1={center.x || width / 2}
            y1={center.y || height / 2}
            x2={(center.x || width / 2) + radius}
            y2={center.y || height / 2}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        )}

        {/* Features (diameter, chord, etc.) */}
        {(features.includes('diameter') || data.showDiameter) && (
          <line
            x1={(center.x || width / 2) - radius}
            y1={center.y || height / 2}
            x2={(center.x || width / 2) + radius}
            y2={center.y || height / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* Main label (e.g., "نق = 7 سم") */}
        {labelText && (
          <text
            x={(center.x || width / 2) + radius / 2}
            y={(center.y || height / 2) - 10}
            textAnchor="middle"
            className="text-sm"
            direction="rtl"
            fill="currentColor"
          >
            {labelText}
          </text>
        )}

        {/* Labels from labels object */}
        {Object.entries(normalizedLabels).map(([key, value]) => {
          const labelPos = getLabelPosition(key, center.x ? center : { x: width / 2, y: height / 2 }, radius);
          return (
            <text
              key={key}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              className="text-sm"
              direction="rtl"
              fill="currentColor"
            >
              {String(value)}
            </text>
          );
        })}
      </g>
    );
  };

  const renderTriangle = (data: any) => {
    // Normalize vertices - Claude generates [[x,y], ...] but we need [{x,y}, ...]
    const rawVertices = data.vertices || [];
    const normalizedVertices = normalizeVertices(rawVertices);

    // If no vertices, create default right triangle
    const vertices = normalizedVertices.length >= 3
      ? normalizedVertices
      : [
          { x: width * 0.2, y: height * 0.8 },
          { x: width * 0.8, y: height * 0.8 },
          { x: width * 0.2, y: height * 0.2 }
        ];

    const points = vertices.map(v => `${v.x},${v.y}`).join(' ');

    // Handle labels - can be array ["أ", "ب", "ج"] or object
    const labelArray = Array.isArray(data.labels) ? data.labels : [];
    const sides = Array.isArray(data.sides) ? data.sides : [];
    const angles = Array.isArray(data.angles) ? data.angles : [];

    return (
      <g>
        <polygon
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Vertex labels from array */}
        {labelArray.map((label: any, index: number) => {
          const vertex = vertices[index];
          const labelText = getLabelText(label);
          if (!vertex || !labelText) return null;

          // Position label outside the triangle
          const offsetY = index === 2 ? -15 : 20;
          const offsetX = index === 0 ? -10 : (index === 1 ? 10 : 0);

          return (
            <text
              key={`vertex-${index}`}
              x={vertex.x + offsetX}
              y={vertex.y + offsetY}
              textAnchor="middle"
              className="text-sm font-bold"
              direction="rtl"
              fill="currentColor"
            >
              {labelText}
            </text>
          );
        })}

        {/* Side labels */}
        {sides.map((side: any, index: number) => {
          if (!side) return null;

          // Extract label from side object or use side directly if string
          const sideLabel = getLabelText(side);
          if (!sideLabel) return null;

          const v1 = vertices[index];
          const v2 = vertices[(index + 1) % vertices.length];
          if (!v1 || !v2) return null;

          const midX = (v1.x + v2.x) / 2;
          const midY = (v1.y + v2.y) / 2;

          // Offset label away from line
          const dx = v2.x - v1.x;
          const dy = v2.y - v1.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const offsetX = (-dy / len) * 15;
          const offsetY = (dx / len) * 15;

          return (
            <text
              key={`side-${index}`}
              x={midX + offsetX}
              y={midY + offsetY}
              textAnchor="middle"
              className="text-xs"
              direction="rtl"
              fill="currentColor"
            >
              {sideLabel}
            </text>
          );
        })}

        {/* Right angle marker */}
        {angles.some((a: any) => {
          // Handle both direct values and object format {at, value, label}
          const angleValue = typeof a === 'object' ? (a.value || a.label) : a;
          return angleValue === '90°' || angleValue === 90 || angleValue === '90';
        }) && (
          <rect
            x={vertices[0].x}
            y={vertices[0].y - 15}
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        )}
      </g>
    );
  };

  const renderRectangle = (data: any) => {
    // Scale dimensions for visibility
    const w = (data.width || 100) * 15;
    const h = (data.height || 60) * 15;
    const x = data.x ?? (width - w) / 2;
    const y = data.y ?? (height - h) / 2;

    // Handle labels - can be array ["أ", "ب", "ج", "د"] or object
    const labelArray = Array.isArray(data.labels) ? data.labels : [];

    // Corner positions for 4 labels
    const corners = [
      { x: x, y: y - 10 },           // Top left
      { x: x + w, y: y - 10 },       // Top right
      { x: x + w, y: y + h + 15 },   // Bottom right
      { x: x, y: y + h + 15 }        // Bottom left
    ];

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

        {/* Corner labels from array */}
        {labelArray.map((label: any, index: number) => {
          const corner = corners[index];
          const labelText = getLabelText(label);
          if (!corner || !labelText) return null;

          return (
            <text
              key={`corner-${index}`}
              x={corner.x}
              y={corner.y}
              textAnchor="middle"
              className="text-sm font-bold"
              direction="rtl"
              fill="currentColor"
            >
              {labelText}
            </text>
          );
        })}

        {/* Show dimensions if requested */}
        {data.showDimensions && (
          <>
            {/* Width label */}
            <text
              x={x + w / 2}
              y={y + h + 30}
              textAnchor="middle"
              className="text-xs"
              direction="rtl"
              fill="currentColor"
            >
              {data.width} سم
            </text>
            {/* Height label */}
            <text
              x={x - 20}
              y={y + h / 2}
              textAnchor="middle"
              className="text-xs"
              direction="rtl"
              fill="currentColor"
              transform={`rotate(-90, ${x - 20}, ${y + h / 2})`}
            >
              {data.height} سم
            </text>
          </>
        )}

        {/* Show diagonal if requested */}
        {data.showDiagonal && (
          <line
            x1={x}
            y1={y}
            x2={x + w}
            y2={y + h}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}
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
        {labels.map((label: any, index: number) => {
          // Use helper function to safely extract label text
          const labelText = getLabelText(label);
          if (!labelText) return null;

          return (
            <text
              key={`label-${index}`}
              x={width / 2}
              y={height - 10 - (index * 20)}
              textAnchor="middle"
              className="text-sm"
              direction="rtl"
            >
              {labelText}
            </text>
          );
        })}
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
