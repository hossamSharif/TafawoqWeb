'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReviewBookmarkButtonProps {
  questionIndex: number
  isBookmarked: boolean
  onToggle: (questionIndex: number) => Promise<void>
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

/**
 * ReviewBookmarkButton - Toggle bookmark for a question
 *
 * Features:
 * - Star icon (filled when bookmarked, outline when not)
 * - Optimistic UI via parent hook
 * - Loading state during API call
 * - Accessible with ARIA labels
 * - RTL support for Arabic labels
 */
export function ReviewBookmarkButton({
  questionIndex,
  isBookmarked,
  onToggle,
  className,
  size = 'md',
  showLabel = false,
}: ReviewBookmarkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await onToggle(questionIndex)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  }

  const label = isBookmarked ? 'إزالة الإشارة المرجعية' : 'إضافة إشارة مرجعية'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'relative transition-all',
        isBookmarked && 'text-yellow-600 hover:text-yellow-700',
        !isBookmarked && 'text-gray-400 hover:text-yellow-600',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={label}
      title={label}
    >
      <Star
        size={iconSizes[size]}
        className={cn(
          'transition-all',
          isBookmarked && 'fill-current',
          isLoading && 'animate-pulse'
        )}
      />

      {showLabel && (
        <span className="mr-2 text-sm font-medium" dir="rtl">
          {label}
        </span>
      )}

      {/* Accessibility: Screen reader announcement */}
      <span className="sr-only">
        {isBookmarked
          ? 'تمت إضافة إشارة مرجعية لهذا السؤال'
          : 'إزالة الإشارة المرجعية من هذا السؤال'}
      </span>
    </Button>
  )
}

export default ReviewBookmarkButton
