/**
 * DiagramContainer.tsx
 * Responsive container for diagrams with scaling and aspect ratio support
 *
 * Features:
 * - Responsive scaling (320px-1920px)
 * - Clamp-based font sizing
 * - Aspect ratio preservation
 * - Touch-friendly sizing
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
}

export const DiagramContainer: React.FC<DiagramContainerProps> = ({
  config,
  className = '',
  minWidth = 200,
  maxWidth = 600,
  aspectRatio = 1,
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
      window.addEventListener('resize', updateDimensions);
    };
  }, [minWidth, maxWidth, aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={`diagram-container w-full flex justify-center ${className}`}
      style={{
        fontSize: `clamp(12px, ${dimensions.width / 40}px, 16px)`,
      }}
    >
      <DiagramRenderer
        config={config}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};
