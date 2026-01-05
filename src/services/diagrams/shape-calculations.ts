/**
 * Shape Calculation Utilities
 *
 * Pre-calculation logic for intersection points, shaded regions, and path generation
 * for overlapping shape patterns used in GAT geometry questions.
 *
 * @see src/lib/constants/diagram-patterns.ts for pattern definitions
 * @see src/skills/qudurat-diagrams/references/overlapping-shapes.md for formulas
 */

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export interface Circle {
  center: Point;
  radius: number;
}

export interface Rectangle {
  topLeft: Point;
  width: number;
  height: number;
}

export interface Sector {
  center: Point;
  radius: number;
  startAngle: number;  // in degrees
  endAngle: number;    // in degrees
}

/**
 * Calculate intersection points between two circles
 */
export function circleIntersectionPoints(c1: Circle, c2: Circle): Point[] {
  const dx = c2.center.x - c1.center.x;
  const dy = c2.center.y - c1.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // No intersection if circles are too far apart or one contains the other
  if (d > c1.radius + c2.radius || d < Math.abs(c1.radius - c2.radius)) {
    return [];
  }

  // Circles are coincident
  if (d === 0 && c1.radius === c2.radius) {
    return [];
  }

  const a = (c1.radius * c1.radius - c2.radius * c2.radius + d * d) / (2 * d);
  const h = Math.sqrt(c1.radius * c1.radius - a * a);

  const px = c1.center.x + (a * dx) / d;
  const py = c1.center.y + (a * dy) / d;

  const intersections: Point[] = [
    {
      x: px + (h * dy) / d,
      y: py - (h * dx) / d
    },
    {
      x: px - (h * dy) / d,
      y: py + (h * dx) / d
    }
  ];

  return intersections;
}

/**
 * Calculate area of circle
 */
export function circleArea(radius: number): number {
  return Math.PI * radius * radius;
}

/**
 * Calculate area of sector (portion of circle)
 * @param radius - radius of circle
 * @param angleInDegrees - angle of sector in degrees
 */
export function sectorArea(radius: number, angleInDegrees: number): number {
  return (angleInDegrees / 360) * Math.PI * radius * radius;
}

/**
 * Calculate area of triangle
 */
export function triangleArea(base: number, height: number): number {
  return 0.5 * base * height;
}

/**
 * Calculate area of equilateral triangle
 */
export function equilateralTriangleArea(side: number): number {
  return (Math.sqrt(3) / 4) * side * side;
}

/**
 * Calculate area of square
 */
export function squareArea(side: number): number {
  return side * side;
}

/**
 * Calculate area of rectangle
 */
export function rectangleArea(width: number, height: number): number {
  return width * height;
}

/**
 * Generate SVG path for a circle arc
 * @param center - center point of circle
 * @param radius - radius
 * @param startAngle - start angle in degrees
 * @param endAngle - end angle in degrees
 * @param largeArc - use large arc flag (for arcs > 180°)
 */
export function generateArcPath(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  largeArc: boolean = false
): string {
  const start = polarToCartesian(center, radius, startAngle);
  const end = polarToCartesian(center, radius, endAngle);

  const largeArcFlag = largeArc ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

/**
 * Convert polar coordinates to Cartesian
 */
export function polarToCartesian(center: Point, radius: number, angleInDegrees: number): Point {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angleInRadians),
    y: center.y + radius * Math.sin(angleInRadians)
  };
}

/**
 * Convert Cartesian coordinates to polar
 */
export function cartesianToPolar(center: Point, point: Point): { radius: number; angle: number } {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { radius, angle };
}

/**
 * Pattern-specific calculation: Square with corner circles
 * Returns shaded area calculation
 */
export function calculateSquareWithCornerCircles(squareSide: number, circleRadius: number): {
  squareArea: number;
  circleArea: number;
  shadedArea: number;
  formula: string;
} {
  const sq = squareArea(squareSide);
  const ca = circleArea(circleRadius);
  const shaded = sq - ca; // 4 quarter circles = 1 full circle

  return {
    squareArea: sq,
    circleArea: ca,
    shadedArea: shaded,
    formula: `${sq.toFixed(0)} - ${ca.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Pattern-specific calculation: Inscribed circle in square
 */
export function calculateInscribedCircleInSquare(squareSide: number): {
  squareArea: number;
  circleArea: number;
  shadedArea: number;
  formula: string;
} {
  const radius = squareSide / 2;
  const sq = squareArea(squareSide);
  const ca = circleArea(radius);
  const shaded = sq - ca;

  return {
    squareArea: sq,
    circleArea: ca,
    shadedArea: shaded,
    formula: `${sq.toFixed(0)} - ${ca.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Pattern-specific calculation: Inscribed square in circle
 */
export function calculateInscribedSquareInCircle(circleRadius: number): {
  squareArea: number;
  circleArea: number;
  shadedArea: number;
  formula: string;
} {
  // Square diagonal = circle diameter
  const diagonal = 2 * circleRadius;
  const squareSide = diagonal / Math.sqrt(2);
  const sq = squareArea(squareSide);
  const ca = circleArea(circleRadius);
  const shaded = ca - sq;

  return {
    squareArea: sq,
    circleArea: ca,
    shadedArea: shaded,
    formula: `${ca.toFixed(2)} - ${sq.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Pattern-specific calculation: Sector minus triangle
 */
export function calculateSectorMinusTriangle(
  radius: number,
  angleInDegrees: number
): {
  sectorArea: number;
  triangleArea: number;
  shadedArea: number;
  formula: string;
} {
  const sa = sectorArea(radius, angleInDegrees);
  // For a sector with two radii, triangle area = 0.5 * r * r * sin(angle)
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const ta = 0.5 * radius * radius * Math.sin(angleInRadians);
  const shaded = sa - ta;

  return {
    sectorArea: sa,
    triangleArea: ta,
    shadedArea: shaded,
    formula: `${sa.toFixed(2)} - ${ta.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Pattern-specific calculation: Three tangent circles
 * (forming equilateral triangle in the middle)
 */
export function calculateThreeTangentCircles(radius: number): {
  triangleArea: number;
  sectorsArea: number;
  shadedArea: number;
  formula: string;
} {
  // Side of equilateral triangle = 2 * radius (two radii touching)
  const side = 2 * radius;
  const ta = equilateralTriangleArea(side);
  // Three sectors of 60° each
  const sa = 3 * sectorArea(radius, 60);
  const shaded = ta - sa;

  return {
    triangleArea: ta,
    sectorsArea: sa,
    shadedArea: shaded,
    formula: `${ta.toFixed(2)} - ${sa.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Pattern-specific calculation: Circles in rectangle
 */
export function calculateCirclesInRectangle(
  width: number,
  height: number,
  circleRadius: number,
  circleCount: number
): {
  rectangleArea: number;
  circlesArea: number;
  shadedArea: number;
  formula: string;
} {
  const ra = rectangleArea(width, height);
  const ca = circleCount * circleArea(circleRadius);
  const shaded = ra - ca;

  return {
    rectangleArea: ra,
    circlesArea: ca,
    shadedArea: shaded,
    formula: `${ra.toFixed(0)} - ${ca.toFixed(2)} = ${shaded.toFixed(2)}`
  };
}

/**
 * Generate JSXGraph configuration for overlapping shapes
 * Returns array of JSXGraph element configurations
 */
export interface JSXGraphElement {
  type: 'circle' | 'polygon' | 'sector' | 'arc' | 'curve';
  points?: Point[];
  center?: Point;
  radius?: number;
  angles?: [number, number];
  style?: {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
  };
}

/**
 * Generate JSXGraph elements for square with corner circles pattern
 */
export function generateSquareWithCornerCirclesElements(
  squareSide: number,
  circleRadius: number,
  shadingConfig: { fillColor: string; fillOpacity: number }
): JSXGraphElement[] {
  const half = squareSide / 2;

  // Define square vertices centered at origin
  const vertices: Point[] = [
    { x: -half, y: -half, label: 'أ' },
    { x: half, y: -half, label: 'ب' },
    { x: half, y: half, label: 'ج' },
    { x: -half, y: half, label: 'د' }
  ];

  const elements: JSXGraphElement[] = [];

  // Add square
  elements.push({
    type: 'polygon',
    points: vertices,
    style: {
      fillColor: shadingConfig.fillColor,
      fillOpacity: shadingConfig.fillOpacity,
      strokeColor: '#2c3e50',
      strokeWidth: 2
    }
  });

  // Add four quarter circles at corners
  vertices.forEach(vertex => {
    elements.push({
      type: 'arc',
      center: vertex,
      radius: circleRadius,
      angles: [0, 90], // Quarter circle
      style: {
        fillColor: '#ffffff',
        fillOpacity: 1,
        strokeColor: '#2c3e50',
        strokeWidth: 2
      }
    });
  });

  return elements;
}

/**
 * Calculate bounds for diagram (for scaling and centering)
 */
export function calculateBounds(points: Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Format number for Arabic display (convert to Arabic numerals)
 */
export function toArabicNumerals(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map(digit => (digit >= '0' && digit <= '9' ? arabicNumerals[parseInt(digit)] : digit))
    .join('');
}
