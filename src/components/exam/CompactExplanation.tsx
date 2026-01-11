'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, BookOpen, Target, Lightbulb, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CompactExplanationProps {
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
  /** Called when upgrade is requested */
  onUpgradeClick?: () => void
  className?: string
}

/**
 * CompactExplanation - Compact explanation display for answer card header
 * Displays explanation inline with expansion capability
 */
export function CompactExplanation({
  explanation,
  solvingStrategy,
  tip,
  isCorrect,
  isLocked = false,
  hoursRemaining,
  onUpgradeClick,
  className,
}: CompactExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLocked) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          isCorrect !== undefined && isCorrect && 'bg-green-50 border-green-200',
          isCorrect !== undefined && !isCorrect && 'bg-amber-50 border-amber-200',
          isCorrect === undefined && 'bg-gray-50 border-gray-200',
          className
        )}
        dir="rtl"
      >
        <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {hoursRemaining
              ? `الشرح متاح بعد ${hoursRemaining} ساعة`
              : 'الشرح متاح للمشتركين'}
          </p>
        </div>
        {onUpgradeClick && (
          <Button 
            onClick={onUpgradeClick} 
            size="sm"
            variant="outline"
            className="text-xs"
          >
            ترقية
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        isCorrect !== undefined && isCorrect && 'bg-green-50 border-green-200',
        isCorrect !== undefined && !isCorrect && 'bg-amber-50 border-amber-200',
        isCorrect === undefined && 'bg-gray-50 border-gray-200',
        className
      )}
      dir="rtl"
    >
      {/* Header - Always Visible */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 text-right"
        >
          <div className="flex items-center gap-2">
            <BookOpen
              className={cn(
                'w-5 h-5 flex-shrink-0',
                isCorrect !== undefined && isCorrect && 'text-green-600',
                isCorrect !== undefined && !isCorrect && 'text-amber-600',
                isCorrect === undefined && 'text-gray-600'
              )}
            />
            <span className="font-semibold text-sm text-gray-800">الشرح</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          )}
        </button>

        {/* Main Explanation - Truncated when collapsed */}
        {!isExpanded && (
          <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-relaxed">
            {explanation}
          </p>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200/50 pt-3">
          {/* Full Explanation */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </p>
          </div>

          {/* Solving Strategy */}
          {solvingStrategy && (
            <div className="p-3 bg-white/60 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-800">
                  استراتيجية الحل
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {solvingStrategy}
              </p>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-yellow-800">
                  نصيحة
                </span>
              </div>
              <p className="text-xs text-yellow-700 leading-relaxed">{tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CompactExplanation
