/**
 * TypeScript type definitions for diagram configurations
 * Feature: GAT Exam Platform v3.0
 *
 * These types align with:
 * - data-model.md DiagramConfig section
 * - question-generation-api.yaml DiagramConfig schema
 * - Skills modules (qudurat-diagrams)
 */

// ============================================================================
// Core Diagram Types
// ============================================================================

export type RenderHint = 'SVG' | 'JSXGraph' | 'Chart.js';

export type ShadingType = 'difference' | 'intersection' | 'union';

export interface DiagramConfig {
  // Routing & Rendering
  type: string;  // "circle", "triangle", "overlapping-shapes", "bar-chart"
  subtype?: string;  // For overlapping: "three-tangent-circles", etc.
  renderHint: RenderHint;

  // Shape Data (varies by type)
  data: ShapeData | ChartData;

  // Overlapping Shapes Specific (FR-011, FR-013)
  shading?: ShadingConfig;
  overlap?: OverlapConfig;
  formulaUsed?: string;  // Arabic formula for area calculation

  // Accessibility (FR-018, FR-019) - REQUIRED
  caption: string;  // Arabic description for screen readers
  accessibilityFeatures?: AccessibilityFeatures;

  // Rendering Constraints
  aspectRatio?: number;  // Default 1:1
  minWidth?: number;  // Minimum 200px
  maxWidth?: number;  // Maximum 600px
}

export interface ShadingConfig {
  type: ShadingType;
  operation: string;  // "square - 4_quarter_circles"
  shadedRegion: string;  // Description of shaded area
  fillColor: string;  // "#e74c3c"
  fillOpacity: number;  // 0.3-0.6
}

export interface OverlapConfig {
  type: string;  // "quarter-circle-inside-square"
  angle?: number;  // For sectors
  description: string;  // Arabic description
}

export interface AccessibilityFeatures {
  highContrast: boolean;
  patternOverlay: boolean;  // For colorblind users
  textAlternative: string;  // Full text description
}

// ============================================================================
// Shape Data Types (SVG Rendering)
// ============================================================================

export type ShapeData =
  | CircleData
  | TriangleData
  | QuadrilateralData
  | PolygonData
  | Shape3DData
  | CoordinatePlaneData;

export interface Point {
  x: number;
  y: number;
}

export interface Label {
  text: string;  // Arabic text
  position: Point;
  anchor?: 'start' | 'middle' | 'end';
}

// Circle (with radius, diameter, chord, sector, tangent options)
export interface CircleData {
  type: 'circle';
  center: Point;
  radius: number;
  features?: ('diameter' | 'chord' | 'sector' | 'tangent')[];
  chord?: {
    start: Point;
    end: Point;
  };
  sector?: {
    startAngle: number;  // Degrees
    endAngle: number;
  };
  tangent?: {
    point: Point;  // Point of tangency
    lineAngle: number;  // Tangent line angle
  };
  labels: Label[];
}

// Triangle (right, isosceles, equilateral, scalene)
export interface TriangleData {
  type: 'triangle';
  triangleType: 'right' | 'isosceles' | 'equilateral' | 'scalene';
  vertices: [Point, Point, Point];
  angles?: [number, number, number];  // Degrees
  sides?: [number, number, number];  // Lengths
  labels: Label[];
}

// Quadrilaterals (square, rectangle, parallelogram, rhombus, trapezoid)
export interface QuadrilateralData {
  type: 'quadrilateral';
  quadType: 'square' | 'rectangle' | 'parallelogram' | 'rhombus' | 'trapezoid';
  vertices: [Point, Point, Point, Point];
  sides?: [number, number, number, number];
  angles?: [number, number, number, number];
  labels: Label[];
}

// Regular Polygons (pentagon, hexagon)
export interface PolygonData {
  type: 'polygon';
  polygonType: 'pentagon' | 'hexagon';
  center: Point;
  radius: number;  // Circumradius
  rotation?: number;  // Degrees
  labels: Label[];
}

// 3D Shapes (isometric projection)
export interface Shape3DData {
  type: '3d-shape';
  shapeType: 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere';
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
  };
  viewAngle?: {
    rotation: number;
    tilt: number;
  };
  labels: Label[];
}

// Coordinate Plane
export interface CoordinatePlaneData {
  type: 'coordinate-plane';
  xRange: [number, number];
  yRange: [number, number];
  gridSpacing?: number;
  points?: Array<{
    coords: Point;
    label: string;
  }>;
  lines?: Array<{
    start: Point;
    end: Point;
    label?: string;
  }>;
  curves?: Array<{
    equation: string;  // e.g., "y = x^2"
    points: Point[];  // Pre-calculated
  }>;
  labels: Label[];
}

// ============================================================================
// Overlapping Shapes Data (JSXGraph Rendering)
// ============================================================================

export interface OverlappingShapesData {
  type: 'overlapping-shapes';
  pattern:
    | 'square-with-corner-circles'
    | 'square-vertex-at-circle-center'
    | 'rose-pattern-in-square'
    | 'three-tangent-circles'
    | 'sector-minus-triangle'
    | 'circles-in-rectangle'
    | 'inscribed-circle-in-square'
    | 'inscribed-square-in-circle';

  shapes: OverlappingShape[];
  intersections: Point[];  // Pre-calculated intersection points
  shadedRegion: {
    path: string;  // JSXGraph curve definition or SVG path
    area: number;  // Pre-calculated area
  };
}

export interface OverlappingShape {
  id: string;
  type: 'circle' | 'square' | 'rectangle' | 'sector' | 'triangle';
  position: Point;  // Center or anchor point
  size: number | { width: number; height: number };
  rotation?: number;  // Degrees
  label?: string;
}

// ============================================================================
// Chart Data Types (Chart.js Rendering)
// ============================================================================

export type ChartData =
  | BarChartData
  | LineChartData
  | PieChartData
  | HistogramData
  | AreaChartData
  | FrequencyTableData;

// Bar Chart (vertical, horizontal, grouped)
export interface BarChartData {
  type: 'bar-chart';
  orientation: 'vertical' | 'horizontal';
  grouped?: boolean;
  labels: string[];  // Arabic labels
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
  options?: {
    scales?: {
      x?: { title?: { text: string } };
      y?: { title?: { text: string } };
    };
  };
}

// Line Graph (single line, multiple lines)
export interface LineChartData {
  type: 'line-chart';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    fill?: boolean;
    tension?: number;  // Curve smoothing
  }>;
  options?: {
    scales?: {
      x?: { title?: { text: string } };
      y?: { title?: { text: string } };
    };
  };
}

// Pie Chart / Doughnut Chart
export interface PieChartData {
  type: 'pie-chart' | 'doughnut-chart';
  labels: string[];
  data: number[];
  backgroundColor: string[];
  options?: {
    plugins?: {
      legend?: { position: 'top' | 'bottom' | 'left' | 'right' };
    };
  };
}

// Histogram
export interface HistogramData {
  type: 'histogram';
  bins: Array<{
    range: [number, number];
    frequency: number;
    label: string;
  }>;
  options?: {
    scales?: {
      x?: { title?: { text: string } };
      y?: { title?: { text: string } };
    };
  };
}

// Area Chart
export interface AreaChartData {
  type: 'area-chart';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    fill: boolean;
  }>;
  options?: {
    scales?: {
      x?: { title?: { text: string } };
      y?: { title?: { text: string } };
    };
  };
}

// Frequency Table (HTML table, not Chart.js)
export interface FrequencyTableData {
  type: 'frequency-table';
  headers: string[];  // Column headers in Arabic
  rows: Array<{
    value: string | number;
    frequency: number;
    relativeFrequency?: number;
    cumulativeFrequency?: number;
  }>;
}

// ============================================================================
// Pattern-Specific Interfaces
// ============================================================================

// Square with Quarter Circles at Corners
export interface SquareWithCornerCircles {
  pattern: 'square-with-corner-circles';
  squareSide: number;
  quarterCircleRadius: number;
  shadedArea: number;  // Pre-calculated: squareSide² - π × radius²
}

// Three Mutually Tangent Circles
export interface ThreeTangentCircles {
  pattern: 'three-tangent-circles';
  circleRadius: number;
  centers: [Point, Point, Point];  // Pre-calculated
  shadedArea: number;  // Pre-calculated: r²(√3 - π/2)
}

// Rose Pattern (Four Semicircles from Midpoints)
export interface RosePattern {
  pattern: 'rose-pattern-in-square';
  squareSide: number;
  semicircleRadius: number;  // squareSide / 2
  shadedArea: number;  // Pre-calculated
}

// Sector Minus Triangle
export interface SectorMinusTriangle {
  pattern: 'sector-minus-triangle';
  radius: number;
  angle: number;  // Sector angle in degrees
  triangleArea: number;  // Pre-calculated
  sectorArea: number;  // Pre-calculated
  shadedArea: number;  // sectorArea - triangleArea
}

// ============================================================================
// Validation Functions
// ============================================================================

export function validateDiagramConfig(config: DiagramConfig): boolean {
  // Required fields
  if (!config.type || !config.renderHint || !config.data || !config.caption) {
    return false;
  }

  // Accessibility caption required (FR-018)
  if (config.caption.trim().length === 0) {
    return false;
  }

  // Overlapping shapes must have shading and overlap
  if (config.type === 'overlapping-shapes') {
    if (!config.shading || !config.overlap || !config.formulaUsed) {
      return false;
    }
  }

  return true;
}

export function getRenderHint(type: string, subtype?: string): RenderHint {
  if (type === 'overlapping-shapes') {
    return 'JSXGraph';
  }

  if (type.includes('chart') || type.includes('graph') || type === 'histogram') {
    return 'Chart.js';
  }

  return 'SVG';
}

// ============================================================================
// Constants
// ============================================================================

export const OVERLAPPING_PATTERNS = [
  'square-with-corner-circles',
  'square-vertex-at-circle-center',
  'rose-pattern-in-square',
  'three-tangent-circles',
  'sector-minus-triangle',
  'circles-in-rectangle',
  'inscribed-circle-in-square',
  'inscribed-square-in-circle',
] as const;

export const SIMPLE_SHAPES = [
  'circle',
  'triangle',
  'quadrilateral',
  'polygon',
  '3d-shape',
  'coordinate-plane',
] as const;

export const CHART_TYPES = [
  'bar-chart',
  'line-chart',
  'pie-chart',
  'histogram',
  'area-chart',
  'frequency-table',
] as const;

// Accessibility color palette (colorblind-safe)
export const DIAGRAM_COLORS = {
  primary: '#e74c3c',  // Red (for shaded regions)
  secondary: '#3498db',  // Blue
  background: '#ffffff',
  text: '#2c3e50',
  gridLines: '#ecf0f1',
} as const;

// Contrast ratios (WCAG 2.1 AA)
export const MIN_CONTRAST_RATIO = 4.5;  // Normal text
export const MIN_CONTRAST_RATIO_LARGE = 3.0;  // Large text (18pt+)
