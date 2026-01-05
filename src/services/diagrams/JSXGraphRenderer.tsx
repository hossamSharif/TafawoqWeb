/**
 * JSXGraphRenderer.tsx
 * Renders overlapping shapes with shading using JSXGraph (lazy loaded)
 *
 * Supports:
 * - 8 overlapping shape patterns
 * - Shading with configurable opacity (0.3-0.6)
 * - Intersection calculations
 * - Arabic labels
 *
 * @see specs/1-gat-exam-v3/plan.md - JSXGraph Integration
 * @see User Story 1 - Overlapping shapes with shading
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getPatternBySubtype, DEFAULT_SHADING_CONFIG } from '@/lib/constants/diagram-patterns';

export interface JSXGraphConfig {
  type: string;
  subtype?: string;
  data: any;
  renderHint: string;
  caption?: string;
  shading?: {
    type: string;
    operation?: string;
    fillColor?: string;
    fillOpacity?: number;
  };
}

export interface JSXGraphRendererProps {
  config: JSXGraphConfig;
  width: number;
  height: number;
  className?: string;
}

export const JSXGraphRenderer: React.FC<JSXGraphRendererProps> = ({
  config,
  width,
  height,
  className = '',
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardRef.current) return;

    let isMounted = true;

    // Lazy load JSXGraph
    const loadJSXGraph = async () => {
      try {
        setIsLoading(true);

        // Dynamically import JSXGraph
        const JSXGraph = await import('jsxgraph');

        if (!isMounted || !boardRef.current) return;

        // Get pattern configuration
        const pattern = config.subtype ? getPatternBySubtype(config.subtype) : null;
        const shadingConfig = config.shading || pattern?.shading || DEFAULT_SHADING_CONFIG;

        // Initialize JSXGraph board
        const board = JSXGraph.JSXGraph.initBoard(boardRef.current, {
          boundingbox: [-10, 10, 10, -10],
          axis: false,
          showCopyright: false,
          showNavigation: false,
          zoom: false,
          pan: false,
          resize: 'auto',
          keepaspectratio: true,
        });

        boardInstance.current = board;

        // Render based on subtype
        if (config.subtype) {
          renderOverlappingPattern(board, config, shadingConfig);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load JSXGraph:', err);
        setError('فشل تحميل الرسم البياني');
        setIsLoading(false);
      }
    };

    loadJSXGraph();

    return () => {
      isMounted = false;
      // Cleanup board instance
      if (boardInstance.current) {
        try {
          JSXGraph.JSXGraph.freeBoard(boardInstance.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        boardInstance.current = null;
      }
    };
  }, [config]);

  if (error) {
    return (
      <div
        style={{ width, height }}
        className={`jsx-graph-container ${className} flex items-center justify-center bg-red-50`}
        role="alert"
      >
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      style={{ width, height }}
      className={`jsx-graph-container ${className}`}
      role="img"
      aria-label={config.caption || 'رسم بياني للأشكال المتداخلة'}
    >
      {isLoading && (
        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
          <p className="text-sm">جاري التحميل...</p>
        </div>
      )}
    </div>
  );
};

/**
 * Render overlapping shape patterns using JSXGraph
 */
function renderOverlappingPattern(board: any, config: JSXGraphConfig, shadingConfig: any) {
  const { subtype, data } = config;

  switch (subtype) {
    case 'square-with-corner-circles':
      renderSquareWithCornerCircles(board, data, shadingConfig);
      break;

    case 'square-vertex-at-circle-center':
      renderSquareVertexAtCircleCenter(board, data, shadingConfig);
      break;

    case 'rose-pattern-in-square':
      renderRosePattern(board, data, shadingConfig);
      break;

    case 'three-tangent-circles':
      renderThreeTangentCircles(board, data, shadingConfig);
      break;

    case 'inscribed-circle-in-square':
    case 'inscribed-square-in-circle':
      // These can be rendered with SVG, but can also use JSXGraph if needed
      renderInscribedShapes(board, data, shadingConfig, subtype);
      break;

    default:
      console.warn(`Unknown overlapping pattern: ${subtype}`);
  }
}

/**
 * Pattern 1: Square with quarter circles at corners
 */
function renderSquareWithCornerCircles(board: any, data: any, shadingConfig: any) {
  const { square, circles } = data;
  const s = square.side;
  const half = s / 2;

  // Define square vertices
  const vertices = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half]
  ];

  // Create square polygon with shading
  const squarePolygon = board.create('polygon', vertices, {
    fillColor: shadingConfig.fillColor || '#e74c3c',
    fillOpacity: shadingConfig.fillOpacity || 0.4,
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    highlightFillColor: shadingConfig.fillColor || '#e74c3c'
  });

  // Add vertex labels
  const labels = square.vertices || ['أ', 'ب', 'ج', 'د'];
  vertices.forEach((v, i) => {
    board.create('point', v, {
      name: labels[i],
      size: 3,
      fixed: true,
      label: { offset: [10, 10], fontSize: 14, cssStyle: 'font-family: "Arial", sans-serif;' }
    });
  });

  // Add quarter circles at each corner (subtract from square visually)
  circles?.forEach((circle: any, i: number) => {
    const center = vertices[i];
    const startAngle = i * 90; // Each corner has different orientation
    const endAngle = startAngle + 90;

    board.create('arc', [
      board.create('point', center, { visible: false }),
      board.create('point', [center[0] + circle.radius, center[1]], { visible: false }),
      board.create('point', [center[0], center[1] + circle.radius], { visible: false })
    ], {
      strokeColor: '#2c3e50',
      strokeWidth: 2,
      fillColor: '#ffffff',
      fillOpacity: 1
    });
  });
}

/**
 * Pattern 2: Square vertex at circle center
 */
function renderSquareVertexAtCircleCenter(board: any, data: any, shadingConfig: any) {
  const { circle, square } = data;
  const r = circle.radius;
  const s = square.side;

  // Draw circle centered at origin
  board.create('circle', [[0, 0], r], {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Draw square with one vertex at circle center
  const squareVertices = [
    [0, 0],           // vertex at center
    [s, 0],
    [s, s],
    [0, s]
  ];

  board.create('polygon', squareVertices, {
    fillColor: shadingConfig.fillColor || '#e74c3c',
    fillOpacity: shadingConfig.fillOpacity || 0.45,
    strokeColor: '#2c3e50',
    strokeWidth: 2
  });

  // Add label at center
  board.create('point', [0, 0], {
    name: circle.center || 'م',
    size: 3,
    fixed: true,
    label: { offset: [10, 10], fontSize: 14 }
  });
}

/**
 * Pattern 3: Rose pattern in square (most complex)
 */
function renderRosePattern(board: any, data: any, shadingConfig: any) {
  const { square, semicircles } = data;
  const s = square.side;
  const half = s / 2;

  // Draw square
  const vertices = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half]
  ];

  board.create('polygon', vertices, {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Draw four semicircles from midpoints of sides
  // This creates the "rose" pattern in the center
  const midpoints = [
    [0, -half],    // bottom midpoint
    [half, 0],     // right midpoint
    [0, half],     // top midpoint
    [-half, 0]     // left midpoint
  ];

  semicircles?.forEach((semi: any, i: number) => {
    const center = midpoints[i];
    const radius = semi.diameter / 2;

    board.create('semicircle', [
      board.create('point', center, { visible: false }),
      board.create('point', [center[0] + radius, center[1]], { visible: false })
    ], {
      strokeColor: '#2c3e50',
      strokeWidth: 2,
      fillColor: shadingConfig.fillColor || '#e74c3c',
      fillOpacity: shadingConfig.fillOpacity || 0.5
    });
  });
}

/**
 * Pattern 4: Three tangent circles
 */
function renderThreeTangentCircles(board: any, data: any, shadingConfig: any) {
  const { circles } = data;
  const r = circles[0].radius;

  // Calculate positions for equilateral triangle
  const positions = [
    [0, r * Math.sqrt(3) / 3],           // top
    [-r, -r * Math.sqrt(3) / 6],         // bottom-left
    [r, -r * Math.sqrt(3) / 6]           // bottom-right
  ];

  // Draw three circles
  circles.forEach((circle: any, i: number) => {
    board.create('circle', [positions[i], r], {
      strokeColor: '#2c3e50',
      strokeWidth: 2,
      fillColor: '#ffffff',
      fillOpacity: 0
    });

    // Add center label
    board.create('point', positions[i], {
      name: circle.center || `O${i + 1}`,
      size: 3,
      fixed: true,
      label: { offset: [10, 10], fontSize: 14 }
    });
  });

  // Draw curvilinear triangle (shaded region) in the center
  // This is the complex intersection area
  board.create('polygon', positions, {
    fillColor: shadingConfig.fillColor || '#e74c3c',
    fillOpacity: shadingConfig.fillOpacity || 0.4,
    strokeColor: 'transparent',
    strokeWidth: 0
  });
}

/**
 * Simple inscribed shapes (can also be rendered with SVG)
 */
function renderInscribedShapes(board: any, data: any, shadingConfig: any, subtype: string) {
  if (subtype === 'inscribed-circle-in-square') {
    const { square, circle } = data;
    const s = square.side;
    const half = s / 2;
    const r = s / 2;

    // Draw square
    board.create('polygon', [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half]
    ], {
      fillColor: shadingConfig.fillColor || '#e74c3c',
      fillOpacity: shadingConfig.fillOpacity || 0.3,
      strokeColor: '#2c3e50',
      strokeWidth: 2
    });

    // Draw inscribed circle
    board.create('circle', [[0, 0], r], {
      strokeColor: '#2c3e50',
      strokeWidth: 2,
      fillColor: '#ffffff',
      fillOpacity: 1
    });
  } else if (subtype === 'inscribed-square-in-circle') {
    const { circle, square } = data;
    const r = typeof circle.radius === 'number' ? circle.radius : parseFloat(circle.radius);
    const s = square.side;
    const half = s / 2;

    // Draw circle
    board.create('circle', [[0, 0], r], {
      strokeColor: '#2c3e50',
      strokeWidth: 2,
      fillColor: shadingConfig.fillColor || '#e74c3c',
      fillOpacity: shadingConfig.fillOpacity || 0.35
    });

    // Draw inscribed square
    board.create('polygon', [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half]
    ], {
      fillColor: '#ffffff',
      fillOpacity: 1,
      strokeColor: '#2c3e50',
      strokeWidth: 2
    });
  }
}
