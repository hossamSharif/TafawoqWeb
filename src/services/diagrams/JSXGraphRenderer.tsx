/**
 * JSXGraphRenderer.tsx
 * Renders overlapping shapes with shading using JSXGraph (loaded via CDN)
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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getPatternBySubtype, DEFAULT_SHADING_CONFIG } from '@/lib/constants/diagram-patterns';

// CDN URL for JSXGraph
const JSXGRAPH_CDN_URL = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js';
const JSXGRAPH_CSS_URL = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraph.css';

// Track if JSXGraph is loaded globally
let jsxGraphLoadPromise: Promise<void> | null = null;
let jsxGraphLoaded = false;

// Load JSXGraph from CDN
function loadJSXGraphFromCDN(): Promise<void> {
  if (jsxGraphLoaded && (window as any).JXG) {
    return Promise.resolve();
  }

  if (jsxGraphLoadPromise) {
    return jsxGraphLoadPromise;
  }

  jsxGraphLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).JXG) {
      jsxGraphLoaded = true;
      resolve();
      return;
    }

    // Load CSS first
    if (!document.querySelector('link[href*="jsxgraph.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = JSXGRAPH_CSS_URL;
      document.head.appendChild(cssLink);
    }

    // Load JS
    const script = document.createElement('script');
    script.src = JSXGRAPH_CDN_URL;
    script.async = true;

    script.onload = () => {
      if ((window as any).JXG) {
        jsxGraphLoaded = true;
        resolve();
      } else {
        reject(new Error('JSXGraph loaded but JXG not found on window'));
      }
    };

    script.onerror = () => {
      jsxGraphLoadPromise = null;
      reject(new Error('Failed to load JSXGraph from CDN'));
    };

    document.head.appendChild(script);
  });

  return jsxGraphLoadPromise;
}

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

  // Generate unique ID for the board container
  const boardId = useRef(`jsx-board-${Math.random().toString(36).substring(2, 11)}`);

  const initializeBoard = useCallback(async () => {
    if (!boardRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load JSXGraph from CDN
      await loadJSXGraphFromCDN();

      const JXG = (window as any).JXG;
      if (!JXG || !JXG.JSXGraph) {
        throw new Error('JSXGraph not properly loaded');
      }

      // Clean up existing board if any
      if (boardInstance.current) {
        try {
          JXG.JSXGraph.freeBoard(boardInstance.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        boardInstance.current = null;
      }

      // Clear the container
      boardRef.current.innerHTML = '';

      // Get pattern configuration
      const pattern = config.data?.subtype ? getPatternBySubtype(config.data.subtype) : null;
      const shadingConfig = config.data?.shading || pattern?.shading || DEFAULT_SHADING_CONFIG;

      // Initialize JSXGraph board
      const board = JXG.JSXGraph.initBoard(boardRef.current, {
        boundingbox: [-12, 12, 12, -12],
        axis: false,
        showCopyright: false,
        showNavigation: false,
        zoom: { enabled: false },
        pan: { enabled: false },
        keepaspectratio: true,
      });

      boardInstance.current = board;

      // Render based on subtype from data
      const subtype = config.data?.subtype || config.subtype;
      if (subtype) {
        renderOverlappingPattern(board, { ...config, subtype }, shadingConfig);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize JSXGraph board:', err);
      setError('فشل تحميل الرسم البياني');
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    let mounted = true;

    // Initialize board
    initializeBoard();

    return () => {
      mounted = false;
      // Cleanup board instance
      if (boardInstance.current && (window as any).JXG) {
        try {
          (window as any).JXG.JSXGraph.freeBoard(boardInstance.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        boardInstance.current = null;
      }
      // Clear container
      if (boardRef.current) {
        boardRef.current.innerHTML = '';
      }
    };
  }, [initializeBoard]);

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
 * Normalize data from Claude's format to the expected render format
 * Handles both new format (dimensions) and legacy format (square, circle, etc.)
 */
function normalizePatternData(subtype: string, data: any): any {
  // If data already has the legacy structure, return as-is
  if (data.square || data.circle || data.circles) {
    return data;
  }

  // Convert from dimensions format to legacy format
  const dimensions = data.dimensions || data;
  const side = dimensions.side || 10;
  const radius = dimensions.radius || side / 5;

  switch (subtype) {
    case 'square-with-corner-circles':
      return {
        square: { side, vertices: ['أ', 'ب', 'ج', 'د'] },
        circles: [
          { radius, center: 'corner' },
          { radius, center: 'corner' },
          { radius, center: 'corner' },
          { radius, center: 'corner' }
        ]
      };

    case 'square-vertex-at-circle-center':
      return {
        circle: { radius: radius || side, center: 'م' },
        square: { side }
      };

    case 'rose-pattern-in-square':
      return {
        square: { side },
        semicircles: [
          { diameter: side },
          { diameter: side },
          { diameter: side },
          { diameter: side }
        ]
      };

    case 'three-tangent-circles':
      return {
        circles: [
          { radius: dimensions.radius || 5, center: [0, 0] },
          { radius: dimensions.radius || 5, center: [0, 0] },
          { radius: dimensions.radius || 5, center: [0, 0] }
        ]
      };

    case 'inscribed-circle-in-square':
      return {
        square: { side },
        circle: { radius: side / 2 }
      };

    case 'inscribed-square-in-circle':
      return {
        circle: { radius: dimensions.radius || 10 },
        square: { diagonal: (dimensions.radius || 10) * 2 }
      };

    case 'overlapping-semicircles':
      return {
        semicircles: [
          { radius: dimensions.radius || 6 },
          { radius: dimensions.radius || 6 }
        ],
        distance: dimensions.distance || dimensions.radius || 6
      };

    case 'quarter-circles-in-square':
      return {
        square: { side },
        quarterCircles: [
          { radius: side },
          { radius: side }
        ]
      };

    default:
      return data;
  }
}

/**
 * Render overlapping shape patterns using JSXGraph
 */
function renderOverlappingPattern(board: any, config: JSXGraphConfig, shadingConfig: any) {
  const { subtype, data } = config;

  // Normalize the data format
  const normalizedData = normalizePatternData(subtype || '', data);

  switch (subtype) {
    case 'square-with-corner-circles':
      renderSquareWithCornerCircles(board, normalizedData, shadingConfig);
      break;

    case 'square-vertex-at-circle-center':
      renderSquareVertexAtCircleCenter(board, normalizedData, shadingConfig);
      break;

    case 'rose-pattern-in-square':
      renderRosePattern(board, normalizedData, shadingConfig);
      break;

    case 'three-tangent-circles':
      renderThreeTangentCircles(board, normalizedData, shadingConfig);
      break;

    case 'inscribed-circle-in-square':
    case 'inscribed-square-in-circle':
      renderInscribedShapes(board, normalizedData, shadingConfig, subtype);
      break;

    case 'overlapping-semicircles':
      renderOverlappingSemicircles(board, normalizedData, shadingConfig);
      break;

    case 'quarter-circles-in-square':
      renderQuarterCirclesInSquare(board, normalizedData, shadingConfig);
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
    // Side can be provided directly or calculated from diagonal
    const s = square.side || (square.diagonal ? square.diagonal / Math.sqrt(2) : r * Math.sqrt(2));
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

/**
 * Pattern 7: Overlapping semicircles
 */
function renderOverlappingSemicircles(board: any, data: any, shadingConfig: any) {
  const { semicircles, distance } = data;
  const r = semicircles[0].radius;
  const d = distance || r;

  // Draw two overlapping semicircles
  // First semicircle centered at (-d/2, 0)
  board.create('semicircle', [
    board.create('point', [-d / 2, 0], { visible: false }),
    board.create('point', [-d / 2 + r, 0], { visible: false })
  ], {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Second semicircle centered at (d/2, 0)
  board.create('semicircle', [
    board.create('point', [d / 2, 0], { visible: false }),
    board.create('point', [d / 2 + r, 0], { visible: false })
  ], {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Draw intersection region (lens shape)
  // This is a simplified representation - actual intersection is complex
  const intersectionWidth = 2 * r - d;
  if (intersectionWidth > 0) {
    board.create('polygon', [
      [0, -intersectionWidth / 2],
      [intersectionWidth / 4, 0],
      [0, intersectionWidth / 2],
      [-intersectionWidth / 4, 0]
    ], {
      fillColor: shadingConfig.fillColor || '#F97316',
      fillOpacity: shadingConfig.fillOpacity || 0.4,
      strokeColor: 'transparent'
    });
  }

  // Add center points
  board.create('point', [-d / 2, 0], {
    name: 'O₁',
    size: 3,
    fixed: true,
    label: { offset: [10, -15], fontSize: 14 }
  });

  board.create('point', [d / 2, 0], {
    name: 'O₂',
    size: 3,
    fixed: true,
    label: { offset: [10, -15], fontSize: 14 }
  });
}

/**
 * Pattern 8: Quarter circles in square
 */
function renderQuarterCirclesInSquare(board: any, data: any, shadingConfig: any) {
  const { square, quarterCircles } = data;
  const s = square.side;
  const half = s / 2;
  const r = quarterCircles[0].radius || s;

  // Draw square
  const vertices = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half]
  ];

  board.create('polygon', vertices, {
    fillColor: '#ffffff',
    fillOpacity: 0,
    strokeColor: '#2c3e50',
    strokeWidth: 2
  });

  // Draw quarter circle from bottom-left corner
  board.create('arc', [
    board.create('point', [-half, -half], { visible: false }),
    board.create('point', [-half + r, -half], { visible: false }),
    board.create('point', [-half, -half + r], { visible: false })
  ], {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Draw quarter circle from bottom-right corner
  board.create('arc', [
    board.create('point', [half, -half], { visible: false }),
    board.create('point', [half, -half + r], { visible: false }),
    board.create('point', [half - r, -half], { visible: false })
  ], {
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0
  });

  // Draw lens-shaped intersection (simplified)
  // The lens is formed where the two quarter circles overlap
  board.create('polygon', [
    [0, -half],
    [half / 2, 0],
    [0, half / 2],
    [-half / 2, 0]
  ], {
    fillColor: shadingConfig.fillColor || '#EF4444',
    fillOpacity: shadingConfig.fillOpacity || 0.4,
    strokeColor: 'transparent'
  });

  // Add corner labels
  const labels = ['أ', 'ب', 'ج', 'د'];
  vertices.forEach((v, i) => {
    board.create('point', v, {
      name: labels[i],
      size: 3,
      fixed: true,
      label: { offset: [i < 2 ? 10 : -15, i % 2 === 0 ? -15 : 10], fontSize: 14 }
    });
  });
}
