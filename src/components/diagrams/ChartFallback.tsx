'use client'

import { cn } from '@/lib/utils'
import type { ChartData } from './ChartDiagram'
import { chartDataToTextRepresentation } from '@/lib/diagrams/fallbacks'

interface ChartFallbackProps {
  data: ChartData
  caption?: string
  className?: string
}

/**
 * ChartFallback - Renders chart data as an accessible HTML table
 * Used when visual chart fails to load, providing text alternative
 */
export function ChartFallback({ data, caption, className }: ChartFallbackProps) {
  const textData = chartDataToTextRepresentation(data)

  // Determine table layout based on dataset count
  const hasMultipleDatasets = textData.datasets.length > 1

  return (
    <div
      className={cn(
        'chart-fallback p-6 bg-white rounded-lg border border-gray-200',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-sm font-medium text-gray-700">
            البيانات بصيغة نصية
          </h3>
        </div>

        {textData.title && (
          <p className="text-base font-semibold text-gray-900 mb-2">
            {textData.title}
          </p>
        )}

        <p className="text-xs text-gray-500">
          عرض البيانات بصيغة جدول نصي للاستفادة منها في الإجابة
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {hasMultipleDatasets ? (
          // Multiple datasets: Each dataset in separate table
          <div className="space-y-4">
            {textData.datasets.map((dataset, datasetIndex) => (
              <div key={datasetIndex}>
                {dataset.label && (
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {dataset.label}
                  </p>
                )}
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        الفئة
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        القيمة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataset.values.map((value, valueIndex) => (
                      <tr
                        key={valueIndex}
                        className={valueIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {value.label}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                          {value.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          // Single dataset: Simple two-column table
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {textData.datasets[0]?.label || 'الفئة'}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  القيمة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {textData.datasets[0]?.values.map((value, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {value.label}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {value.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <p className="mt-4 text-xs text-gray-600 text-center">{caption}</p>
      )}

      {/* Accessibility note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">ملاحظة:</span> هذا العرض النصي يحتوي على نفس البيانات الموجودة في الرسم البياني، ويمكنك استخدامه للإجابة على السؤال.
        </p>
      </div>
    </div>
  )
}

/**
 * ChartFallbackButton - Button to toggle fallback view
 */
export function ChartFallbackButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2',
        className
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      عرض كجدول نصي
    </button>
  )
}

export default ChartFallback
