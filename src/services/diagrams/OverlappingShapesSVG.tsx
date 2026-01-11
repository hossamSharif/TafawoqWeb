/**
 * OverlappingShapesSVG.tsx
 * Pure SVG implementation of overlapping shapes with shading
 *
 * This replaces JSXGraph due to Next.js bundling compatibility issues.
 * Renders all 8 overlapping shape patterns using native SVG.
 *
 * @see specs/1-gat-exam-v3/plan.md - Overlapping Shapes
 * @see User Story 1 - Overlapping shapes with shading
 */

'use client';

import React from 'react';

export interface OverlappingShapeConfig {
  type: string;
  subtype?: string;
  data: {
    subtype?: string;
    dimensions?: {
      side?: number;
      radius?: number;
      diameter?: number;
    };
    shading?: {
      region?: string;
      color?: string;
      opacity?: number;
    };
  };
  renderHint: string;
  caption?: string;
}

export interface OverlappingShapesSVGProps {
  config: OverlappingShapeConfig;
  width?: number;
  height?: number;
  className?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: string) => void;
}

// Default colors and settings
const DEFAULT_FILL_COLOR = '#3B82F6';
const DEFAULT_FILL_OPACITY = 0.4;
const DEFAULT_STROKE_COLOR = '#1E3A8A';
const DEFAULT_STROKE_WIDTH = 2;

// SVG viewbox size
const VIEWBOX_SIZE = 200;
const CENTER = VIEWBOX_SIZE / 2;

export const OverlappingShapesSVG: React.FC<OverlappingShapesSVGProps> = ({
  config,
  width = 300,
  height = 300,
  className = '',
  onLoadSuccess,
}) => {
  // Track if we've already called onLoadSuccess
  const hasCalledOnLoad = React.useRef(false);

  // Call onLoadSuccess on mount since SVG renders immediately
  React.useEffect(() => {
    if (onLoadSuccess && !hasCalledOnLoad.current) {
      hasCalledOnLoad.current = true;
      onLoadSuccess();
    }
  }, []); // Empty dependency array - only run on mount

  const subtype = config.data?.subtype || config.subtype;
  const dimensions = config.data?.dimensions || {};
  const shading = config.data?.shading || {};

  const fillColor = shading.color || DEFAULT_FILL_COLOR;
  const fillOpacity = shading.opacity || DEFAULT_FILL_OPACITY;

  const renderPattern = () => {
    switch (subtype) {
      case 'inscribed-circle-in-square':
        return renderInscribedCircleInSquare(dimensions, fillColor, fillOpacity);
      case 'inscribed-square-in-circle':
        return renderInscribedSquareInCircle(dimensions, fillColor, fillOpacity);
      case 'square-with-corner-circles':
        return renderSquareWithCornerCircles(dimensions, fillColor, fillOpacity);
      case 'square-vertex-at-circle-center':
        return renderSquareVertexAtCircleCenter(dimensions, fillColor, fillOpacity);
      case 'rose-pattern-in-square':
        return renderRosePatternInSquare(dimensions, fillColor, fillOpacity);
      case 'three-tangent-circles':
        return renderThreeTangentCircles(dimensions, fillColor, fillOpacity);
      case 'overlapping-semicircles':
        return renderOverlappingSemicircles(dimensions, fillColor, fillOpacity);
      case 'quarter-circles-in-square':
        return renderQuarterCirclesInSquare(dimensions, fillColor, fillOpacity);
      default:
        return (
          <text x={CENTER} y={CENTER} textAnchor="middle" fill="#666">
            نمط غير معروف: {subtype}
          </text>
        );
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className={`overlapping-shapes-svg ${className}`}
      style={{ backgroundColor: '#fafafa' }}
    >
      <defs>
        {/* Clip paths for shading calculations */}
        <clipPath id="square-clip">
          <rect x={CENTER - 60} y={CENTER - 60} width={120} height={120} />
        </clipPath>
      </defs>
      {renderPattern()}
    </svg>
  );
};

// Pattern 1: Inscribed Circle in Square (دائرة داخل مربع)
function renderInscribedCircleInSquare(dimensions: any, fillColor: string, fillOpacity: number) {
  const side = dimensions.side || 10;
  const halfSide = 60; // SVG units
  const radius = halfSide; // Circle touches all sides

  return (
    <g>
      {/* Square background with shading */}
      <rect
        x={CENTER - halfSide}
        y={CENTER - halfSide}
        width={halfSide * 2}
        height={halfSide * 2}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Circle (white to show the corners are shaded) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill="white"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + halfSide + 20} textAnchor="middle" fontSize="12" fill="#333">
        جانب = {side}
      </text>
    </g>
  );
}

// Pattern 2: Inscribed Square in Circle (مربع داخل دائرة)
function renderInscribedSquareInCircle(dimensions: any, fillColor: string, fillOpacity: number) {
  const radius = dimensions.radius || 7;
  const r = 70; // SVG units
  // Square inscribed in circle: side = r * sqrt(2)
  const halfSide = r / Math.sqrt(2);

  return (
    <g>
      {/* Circle background with shading */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={r}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Square (white to show arcs are shaded) */}
      <rect
        x={CENTER - halfSide}
        y={CENTER - halfSide}
        width={halfSide * 2}
        height={halfSide * 2}
        fill="white"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
        transform={`rotate(0, ${CENTER}, ${CENTER})`}
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + r + 20} textAnchor="middle" fontSize="12" fill="#333">
        نصف القطر = {radius}
      </text>
    </g>
  );
}

// Pattern 3: Square with Corner Circles (مربع مع أرباع دوائر في الزوايا)
function renderSquareWithCornerCircles(dimensions: any, fillColor: string, fillOpacity: number) {
  const side = dimensions.side || 8;
  const halfSide = 60;
  const r = halfSide; // Quarter circles with radius = half side

  return (
    <g>
      {/* Square outline */}
      <rect
        x={CENTER - halfSide}
        y={CENTER - halfSide}
        width={halfSide * 2}
        height={halfSide * 2}
        fill="white"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Four quarter circles at corners - shaded */}
      {/* Top-left quarter circle */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER - halfSide}
            A ${r} ${r} 0 0 1 ${CENTER} ${CENTER - halfSide}
            L ${CENTER - halfSide} ${CENTER - halfSide} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Top-right quarter circle */}
      <path
        d={`M ${CENTER + halfSide} ${CENTER - halfSide}
            A ${r} ${r} 0 0 1 ${CENTER + halfSide} ${CENTER}
            L ${CENTER + halfSide} ${CENTER - halfSide} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Bottom-right quarter circle */}
      <path
        d={`M ${CENTER + halfSide} ${CENTER + halfSide}
            A ${r} ${r} 0 0 1 ${CENTER} ${CENTER + halfSide}
            L ${CENTER + halfSide} ${CENTER + halfSide} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Bottom-left quarter circle */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER + halfSide}
            A ${r} ${r} 0 0 1 ${CENTER - halfSide} ${CENTER}
            L ${CENTER - halfSide} ${CENTER + halfSide} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + halfSide + 20} textAnchor="middle" fontSize="12" fill="#333">
        جانب = {side}
      </text>
    </g>
  );
}

// Pattern 4: Square Vertex at Circle Center (مربع رأسه على مركز دائرة)
function renderSquareVertexAtCircleCenter(dimensions: any, fillColor: string, fillOpacity: number) {
  const side = dimensions.side || 6;
  const radius = dimensions.radius || 6;
  const halfSide = 50;
  const r = 50;

  // Position: square's corner at circle center
  const squareX = CENTER - halfSide / 2;
  const squareY = CENTER - halfSide / 2;

  return (
    <g>
      {/* Circle */}
      <circle
        cx={squareX}
        cy={squareY}
        r={r}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Square */}
      <rect
        x={squareX}
        y={squareY}
        width={halfSide}
        height={halfSide}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Intersection area (quarter circle inside square) */}
      <path
        d={`M ${squareX} ${squareY}
            L ${squareX + r} ${squareY}
            A ${r} ${r} 0 0 1 ${squareX} ${squareY + r}
            L ${squareX} ${squareY} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Labels */}
      <text x={CENTER} y={CENTER + 70} textAnchor="middle" fontSize="12" fill="#333">
        جانب = {side}، نصف القطر = {radius}
      </text>
    </g>
  );
}

// Pattern 5: Rose Pattern in Square (نمط الوردة داخل مربع)
function renderRosePatternInSquare(dimensions: any, fillColor: string, fillOpacity: number) {
  const side = dimensions.side || 10;
  const halfSide = 60;
  const r = halfSide; // Semicircles with diameter = side

  return (
    <g>
      {/* Square outline */}
      <rect
        x={CENTER - halfSide}
        y={CENTER - halfSide}
        width={halfSide * 2}
        height={halfSide * 2}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Four semicircles from each side - creating petal pattern */}
      {/* Top semicircle going down */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER - halfSide}
            A ${halfSide} ${halfSide} 0 0 1 ${CENTER + halfSide} ${CENTER - halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Right semicircle going left */}
      <path
        d={`M ${CENTER + halfSide} ${CENTER - halfSide}
            A ${halfSide} ${halfSide} 0 0 1 ${CENTER + halfSide} ${CENTER + halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Bottom semicircle going up */}
      <path
        d={`M ${CENTER + halfSide} ${CENTER + halfSide}
            A ${halfSide} ${halfSide} 0 0 1 ${CENTER - halfSide} ${CENTER + halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Left semicircle going right */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER + halfSide}
            A ${halfSide} ${halfSide} 0 0 1 ${CENTER - halfSide} ${CENTER - halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Center intersection (approximated as circle) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={20}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + halfSide + 20} textAnchor="middle" fontSize="12" fill="#333">
        جانب = {side}
      </text>
    </g>
  );
}

// Pattern 6: Three Tangent Circles (ثلاث دوائر متماسة)
function renderThreeTangentCircles(dimensions: any, fillColor: string, fillOpacity: number) {
  const radius = dimensions.radius || 5;
  const r = 40;

  // Three circles arranged in triangle, touching each other
  // Distance between centers = 2r
  const cx1 = CENTER;
  const cy1 = CENTER - r * 0.7;
  const cx2 = CENTER - r * 0.87;
  const cy2 = CENTER + r * 0.5;
  const cx3 = CENTER + r * 0.87;
  const cy3 = CENTER + r * 0.5;

  return (
    <g>
      {/* Three circles */}
      <circle cx={cx1} cy={cy1} r={r} fill="none" stroke={DEFAULT_STROKE_COLOR} strokeWidth={DEFAULT_STROKE_WIDTH} />
      <circle cx={cx2} cy={cy2} r={r} fill="none" stroke={DEFAULT_STROKE_COLOR} strokeWidth={DEFAULT_STROKE_WIDTH} />
      <circle cx={cx3} cy={cy3} r={r} fill="none" stroke={DEFAULT_STROKE_COLOR} strokeWidth={DEFAULT_STROKE_WIDTH} />
      {/* Central triangle (shaded) */}
      <path
        d={`M ${CENTER} ${cy1 + r * 0.4}
            L ${cx2 + r * 0.5} ${cy2 - r * 0.2}
            L ${cx3 - r * 0.5} ${cy3 - r * 0.2} Z`}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + r * 2} textAnchor="middle" fontSize="12" fill="#333">
        نصف القطر = {radius}
      </text>
    </g>
  );
}

// Pattern 7: Overlapping Semicircles (نصفا دائرة متداخلان)
function renderOverlappingSemicircles(dimensions: any, fillColor: string, fillOpacity: number) {
  const diameter = dimensions.diameter || 12;
  const r = 50;

  return (
    <g>
      {/* Left semicircle (opening right) */}
      <path
        d={`M ${CENTER - r/2} ${CENTER - r}
            A ${r} ${r} 0 0 1 ${CENTER - r/2} ${CENTER + r}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Right semicircle (opening left) */}
      <path
        d={`M ${CENTER + r/2} ${CENTER - r}
            A ${r} ${r} 0 0 0 ${CENTER + r/2} ${CENTER + r}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Lens intersection (shaded) - approximated */}
      <ellipse
        cx={CENTER}
        cy={CENTER}
        rx={r/3}
        ry={r * 0.8}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + r + 20} textAnchor="middle" fontSize="12" fill="#333">
        القطر = {diameter}
      </text>
    </g>
  );
}

// Pattern 8: Quarter Circles in Square (أرباع دوائر في مربع)
function renderQuarterCirclesInSquare(dimensions: any, fillColor: string, fillOpacity: number) {
  const side = dimensions.side || 10;
  const halfSide = 60;
  const r = halfSide * 2; // Quarter circles from corners to opposite corners

  return (
    <g>
      {/* Square outline */}
      <rect
        x={CENTER - halfSide}
        y={CENTER - halfSide}
        width={halfSide * 2}
        height={halfSide * 2}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={DEFAULT_STROKE_WIDTH}
      />
      {/* Two quarter circles from opposite corners */}
      {/* From bottom-left to top-right */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER + halfSide}
            A ${r} ${r} 0 0 1 ${CENTER + halfSide} ${CENTER - halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* From top-left to bottom-right */}
      <path
        d={`M ${CENTER - halfSide} ${CENTER - halfSide}
            A ${r} ${r} 0 0 0 ${CENTER + halfSide} ${CENTER + halfSide}`}
        fill="none"
        stroke={DEFAULT_STROKE_COLOR}
        strokeWidth={1.5}
      />
      {/* Lens intersection in center (shaded) */}
      <ellipse
        cx={CENTER}
        cy={CENTER}
        rx={25}
        ry={50}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke="none"
        transform={`rotate(45, ${CENTER}, ${CENTER})`}
      />
      {/* Label */}
      <text x={CENTER} y={CENTER + halfSide + 20} textAnchor="middle" fontSize="12" fill="#333">
        جانب = {side}
      </text>
    </g>
  );
}

export default OverlappingShapesSVG;
