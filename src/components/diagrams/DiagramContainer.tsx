/**
 * DiagramContainer.tsx
 * Responsive container for diagrams with scaling and aspect ratio support
 *
 * Features:
 * - Responsive scaling (320px-1920px)
 * - Clamp-based font sizing
 * - Aspect ratio preservation
 * - Touch-friendly sizing
 * - Arabic RTL text direction
 * - Vertex and center label positioning
 *
 * @see specs/1-gat-exam-v3/plan.md - Responsive Diagram Container
 * @see User Story 1 (FR-016, FR-017) - Performance and responsive requirements
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { DiagramRenderer } from '@/services/diagrams/DiagramRenderer';

export interface DiagramContainerProps {
  config: any;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  aspectRatio?: number;
  /** Enable Arabic RTL text direction for labels */
  rtl?: boolean;
  /** Show vertex labels (defaults to true for overlapping shapes) */
  showLabels?: boolean;
}

export const DiagramContainer: React.FC<DiagramContainerProps> = ({
  config,
  className = '',
  minWidth = 200,
  maxWidth = 600,
  aspectRatio = 1,
  rtl = true,  // Default to RTL for Arabic labels
  showLabels = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const width = Math.max(minWidth, Math.min(maxWidth, containerWidth));
      const height = width / aspectRatio;

      setDimensions({ width, height });
    };

    // Initial calculation
    updateDimensions();

    // Update on window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [minWidth, maxWidth, aspectRatio]);

  // Add RTL-specific styles for Arabic text in SVG labels
  const rtlStyles = rtl ? {
    direction: 'rtl' as const,
    textAlign: 'right' as const
  } : {};

  return (
    <div
      ref={containerRef}
      className={`diagram-container w-full flex justify-center ${className}`}
      style={{
        fontSize: `clamp(12px, ${dimensions.width / 40}px, 16px)`,
        ...rtlStyles
      }}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div
        className="diagram-wrapper relative"
        style={{
          // Add CSS custom properties for label positioning
          '--label-font-size': `clamp(12px, ${dimensions.width / 30}px, 18px)`,
          '--label-offset': `${dimensions.width * 0.02}px`,
        } as React.CSSProperties}
      >
        <DiagramRenderer
          config={config}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* Optional: Overlay for custom Arabic labels if needed */}
        {showLabels && config.labels && (
          <div className="diagram-labels absolute inset-0 pointer-events-none">
            {renderArabicLabels(config.labels, dimensions, rtl)}
          </div>
        )}
      </div>

      {/* Add global styles for Arabic text in diagrams */}
      <style jsx global>{`
        .diagram-container svg text,
        .jsx-graph-container text {
          font-family: 'Arial', 'Tahoma', sans-serif;
          direction: ${rtl ? 'rtl' : 'ltr'};
          unicode-bidi: ${rtl ? 'bidi-override' : 'normal'};
        }

        .diagram-container .vertex-label,
        .diagram-container .center-label {
          font-size: var(--label-font-size, 14px);
          font-weight: 600;
          fill: #2c3e50;
          text-anchor: middle;
        }

        .diagram-container .vertex-label {
          /* Position vertex labels slightly outside the shape */
          transform: translate(var(--label-offset, 5px), var(--label-offset, 5px));
        }

        .diagram-container .center-label {
          /* Center labels remain at their position */
          font-size: calc(var(--label-font-size, 14px) * 0.9);
          fill: #34495e;
        }

        /* RTL-specific adjustments */
        [dir="rtl"] .diagram-container text {
          text-anchor: end;
        }

        [dir="rtl"] .diagram-container .vertex-label {
          text-anchor: start;
        }
      `}</style>
    </div>
  );
};

/**
 * Helper function to render Arabic labels as HTML overlays
 * Used when SVG text rendering doesn't properly support Arabic RTL
 */
function renderArabicLabels(
  labels: Array<any>,
  dimensions: { width: number; height: number },
  rtl: boolean
) {
  return labels.map((label, index) => {
    // Safely extract label text from various formats
    let labelText: string | null = null;
    if (typeof label === 'string') {
      labelText = label;
    } else if (label && typeof label === 'object') {
      labelText = label.text || label.label || label.name || null;
    }

    // Skip labels without valid text or position
    if (!labelText || typeof label.x !== 'number' || typeof label.y !== 'number') {
      return null;
    }

    const labelClass = label.type === 'center' ? 'center-label' : 'vertex-label';

    return (
      <div
        key={index}
        className={`absolute ${labelClass} text-gray-800`}
        style={{
          left: `${(label.x / 100) * dimensions.width}px`,
          top: `${(label.y / 100) * dimensions.height}px`,
          transform: 'translate(-50%, -50%)',
          fontSize: 'var(--label-font-size, 14px)',
          fontWeight: 600,
          direction: rtl ? 'rtl' : 'ltr'
        }}
      >
        {labelText}
      </div>
    );
  });
}

/**
 * LabelPosition - Helper component for positioning Arabic labels
 */
export interface LabelPositionProps {
  text: string;
  x: number;
  y: number;
  offset?: { dx?: number; dy?: number };
  type?: 'vertex' | 'center' | 'annotation';
  className?: string;
}

export const LabelPosition: React.FC<LabelPositionProps> = ({
  text,
  x,
  y,
  offset = {},
  type = 'vertex',
  className = ''
}) => {
  const { dx = 0, dy = 0 } = offset;

  const typeStyles: Record<string, React.CSSProperties> = {
    vertex: {
      fontWeight: 700,
      fontSize: '1em'
    },
    center: {
      fontWeight: 600,
      fontSize: '0.9em',
      opacity: 0.9
    },
    annotation: {
      fontWeight: 400,
      fontSize: '0.85em',
      fontStyle: 'italic'
    }
  };

  return (
    <text
      x={x + dx}
      y={y + dy}
      className={`diagram-label ${type}-label ${className}`}
      style={typeStyles[type]}
    >
      {text}
    </text>
  );
};

export default DiagramContainer;
