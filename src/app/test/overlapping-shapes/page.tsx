'use client';

import React, { useState } from 'react';
import { DiagramRenderer } from '@/services/diagrams/DiagramRenderer';

// All 8 overlapping shape patterns with test data
const testDiagrams = [
  // Pattern 1: Square with Corner Circles (Easy)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'square-with-corner-circles',
      dimensions: { side: 10, radius: 2 },
      shading: {
        region: 'outer',
        color: '#3B82F6',
        opacity: 0.4
      }
    },
    caption: 'مربع مع أرباع دوائر في الزوايا - المنطقة المظللة هي المنطقة خارج الدوائر'
  },

  // Pattern 2: Square Vertex at Circle Center (Medium)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'square-vertex-at-circle-center',
      dimensions: { side: 8, radius: 8 },
      shading: {
        region: 'intersection',
        color: '#10B981',
        opacity: 0.4
      }
    },
    caption: 'مربع مع زاوية على مركز دائرة - المنطقة المشتركة مظللة'
  },

  // Pattern 3: Rose Pattern in Square (Hard)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'rose-pattern-in-square',
      dimensions: { side: 12 },
      shading: {
        region: 'petals',
        color: '#EC4899',
        opacity: 0.4
      }
    },
    caption: 'نمط الوردة في مربع - البتلات مظللة'
  },

  // Pattern 4: Three Tangent Circles (Hard)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'three-tangent-circles',
      dimensions: { radius: 5 },
      shading: {
        region: 'center-gap',
        color: '#F59E0B',
        opacity: 0.4
      }
    },
    caption: 'ثلاث دوائر متماسة - المنطقة المحصورة مظللة'
  },

  // Pattern 5: Inscribed Circle in Square (Easy)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'inscribed-circle-in-square',
      dimensions: { side: 14 },
      shading: {
        region: 'corners',
        color: '#8B5CF6',
        opacity: 0.4
      }
    },
    caption: 'دائرة داخل مربع - الزوايا مظللة'
  },

  // Pattern 6: Inscribed Square in Circle (Easy)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'inscribed-square-in-circle',
      dimensions: { radius: 10 },
      shading: {
        region: 'crescents',
        color: '#14B8A6',
        opacity: 0.4
      }
    },
    caption: 'مربع داخل دائرة - الأقواس مظللة'
  },

  // Pattern 7: Overlapping Semicircles (Medium)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'overlapping-semicircles',
      dimensions: { radius: 6, distance: 6 },
      shading: {
        region: 'intersection',
        color: '#F97316',
        opacity: 0.4
      }
    },
    caption: 'نصفا دائرتين متقاطعتين - التقاطع مظلل'
  },

  // Pattern 8: Quarter Circles in Square (Medium)
  {
    type: 'overlapping-shapes',
    renderHint: 'JSXGraph',
    data: {
      subtype: 'quarter-circles-in-square',
      dimensions: { side: 8 },
      shading: {
        region: 'lens',
        color: '#EF4444',
        opacity: 0.4
      }
    },
    caption: 'ربعا دائرة متقاطعان في مربع - منطقة العدسة مظللة'
  }
];

export default function OverlappingShapesTestPage() {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleLoadSuccess = (index: number) => {
    setLoadedCount(prev => prev + 1);
    console.log(`[Test] Pattern ${index + 1} loaded successfully`);
  };

  const handleLoadError = (index: number, error: string) => {
    setErrors(prev => [...prev, `Pattern ${index + 1}: ${error}`]);
    console.error(`[Test] Pattern ${index + 1} error:`, error);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            اختبار رسم الأشكال المتداخلة
          </h1>
          <p className="text-gray-600">
            Overlapping Shapes Rendering Test - JSXGraph
          </p>

          <div className="mt-4 flex justify-center gap-4">
            <div className="px-4 py-2 bg-green-100 rounded-lg">
              <span className="text-green-800 font-medium">
                Loaded: {loadedCount} / {testDiagrams.length}
              </span>
            </div>
            {errors.length > 0 && (
              <div className="px-4 py-2 bg-red-100 rounded-lg">
                <span className="text-red-800 font-medium">
                  Errors: {errors.length}
                </span>
              </div>
            )}
          </div>
        </header>

        {errors.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">Rendering Errors:</h3>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testDiagrams.map((diagram, index) => (
            <div key={index} className="bg-white border rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {index + 1}. {diagram.data.subtype}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {diagram.renderHint}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="w-full aspect-square max-h-[400px] bg-gray-50 rounded-lg overflow-hidden">
                  <DiagramRenderer
                    diagram={diagram}
                    width={400}
                    height={400}
                    className="w-full h-full"
                    onLoadSuccess={() => handleLoadSuccess(index)}
                    onLoadError={(error) => handleLoadError(index, error)}
                  />
                </div>

                <p className="mt-3 text-sm text-gray-600 text-center">
                  {diagram.caption}
                </p>

                <div className="mt-3 text-xs text-gray-500">
                  <details>
                    <summary className="cursor-pointer hover:text-gray-700">
                      View Config JSON
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-left overflow-auto max-h-32">
                      {JSON.stringify(diagram, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Test page for User Story 1 (Overlapping Shapes) - GAT Exam v3</p>
          <p className="mt-1">
            Expected: All 8 patterns should render with correct shading regions
          </p>
        </footer>
      </div>
    </div>
  );
}
