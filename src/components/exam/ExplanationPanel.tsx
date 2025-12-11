'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Lightbulb, BookOpen, Target, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ExplanationPanelProps {
  /** Main explanation text */
  explanation: string
  /** Optional solving strategy */
  solvingStrategy?: string
  /** Optional tip for the student */
  tip?: string
  /** Whether this is for a correct answer */
  isCorrect?: boolean
  /** Whether explanation is locked (free user delay) */
  isLocked?: boolean
  /** Hours remaining until unlock */
  hoursRemaining?: number
  /** Whether to start collapsed */
  defaultCollapsed?: boolean
  /** Called when upgrade is requested */
  onUpgradeClick?: () => void
  className?: string
}

/**
 * ExplanationPanel - Displays answer explanations with expandable sections
 */
export function ExplanationPanel({
  explanation,
  solvingStrategy,
  tip,
  isCorrect,
  isLocked = false,
  hoursRemaining,
  defaultCollapsed = false,
  onUpgradeClick,
  className,
}: ExplanationPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  if (isLocked) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-gray-50 p-6 text-center',
          className
        )}
        dir="rtl"
      >
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          الشرح مقفل مؤقتاً
        </h3>
        <p className="text-gray-600 mb-4">
          {hoursRemaining
            ? `الشرح سيكون متاحاً بعد ${hoursRemaining} ساعة`
            : 'الشرح متاح للمشتركين في الباقة المميزة'}
        </p>
        {onUpgradeClick && (
          <Button onClick={onUpgradeClick} className="mx-auto">
            ترقية للوصول الفوري
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        isCorrect !== undefined && isCorrect && 'border-green-200 bg-green-50',
        isCorrect !== undefined && !isCorrect && 'border-amber-200 bg-amber-50',
        isCorrect === undefined && 'border-gray-200 bg-gray-50',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-right transition-colors',
          isCorrect !== undefined && isCorrect && 'hover:bg-green-100',
          isCorrect !== undefined && !isCorrect && 'hover:bg-amber-100',
          isCorrect === undefined && 'hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-2">
          <BookOpen
            className={cn(
              'w-5 h-5',
              isCorrect !== undefined && isCorrect && 'text-green-600',
              isCorrect !== undefined && !isCorrect && 'text-amber-600',
              isCorrect === undefined && 'text-gray-600'
            )}
          />
          <span className="font-semibold text-gray-800">الشرح</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* Main Explanation */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </p>
          </div>

          {/* Solving Strategy */}
          {solvingStrategy && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">
                  استراتيجية الحل
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {solvingStrategy}
              </p>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">
                  نصيحة
                </span>
              </div>
              <p className="text-sm text-yellow-700 leading-relaxed">{tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExplanationPanel
