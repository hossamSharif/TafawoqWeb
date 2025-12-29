'use client'

import { useRef, useState, TouchEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SwipeHandlerProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  enabled?: boolean
  minSwipeDistance?: number
  children: ReactNode
  className?: string
}

/**
 * SwipeHandler - Detects swipe gestures for mobile navigation
 *
 * Usage:
 * <SwipeHandler onSwipeLeft={nextQuestion} onSwipeRight={prevQuestion}>
 *   <QuestionContent />
 * </SwipeHandler>
 */
export function SwipeHandler({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  minSwipeDistance = 50,
  children,
  className,
}: SwipeHandlerProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    setSwipeDirection(null)
    setSwipeProgress(0)
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || !touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Prevent page scrolling during swipe
      e.preventDefault()

      // Determine swipe direction
      if (deltaX > 10) {
        setSwipeDirection('right')
      } else if (deltaX < -10) {
        setSwipeDirection('left')
      }

      // Calculate swipe progress (0-100%)
      const progress = Math.min(Math.abs(deltaX) / minSwipeDistance, 1) * 100
      setSwipeProgress(progress)
    }
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || !touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Reset visual feedback
    setSwipeDirection(null)
    setSwipeProgress(0)

    // Horizontal swipe detection
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const distance = Math.abs(deltaX)
      const velocity = distance / deltaTime // pixels per ms

      // Trigger swipe if:
      // 1. Distance exceeds minimum threshold OR
      // 2. Velocity is high enough (fast swipe)
      if (distance >= minSwipeDistance || velocity > 0.5) {
        if (deltaX > 0 && onSwipeRight) {
          // Swipe right (previous question in RTL layout)
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swipe left (next question in RTL layout)
          onSwipeLeft()
        }
      }
    }

    touchStartRef.current = null
  }

  const handleTouchCancel = () => {
    touchStartRef.current = null
    setSwipeDirection(null)
    setSwipeProgress(0)
  }

  return (
    <div
      className={cn('relative touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}

      {/* Swipe visual feedback */}
      {swipeDirection && swipeProgress > 20 && (
        <div
          className={cn(
            'fixed top-1/2 -translate-y-1/2 z-50',
            'bg-primary text-white rounded-full p-4',
            'shadow-lg transition-opacity',
            swipeDirection === 'left' ? 'left-8' : 'right-8',
            swipeProgress > 80 ? 'opacity-100 scale-110' : 'opacity-60'
          )}
          style={{
            opacity: Math.min(swipeProgress / 100, 1),
            transform: `translateY(-50%) scale(${Math.min(swipeProgress / 100 + 0.5, 1.1)})`,
          }}
        >
          {swipeDirection === 'left' ? (
            <ChevronLeft className="w-8 h-8" />
          ) : (
            <ChevronRight className="w-8 h-8" />
          )}
        </div>
      )}

      {/* Swipe progress indicator */}
      {swipeDirection && swipeProgress > 0 && (
        <div
          className={cn(
            'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
            'bg-white rounded-full px-4 py-2',
            'shadow-md text-sm font-medium text-gray-700',
            'transition-opacity'
          )}
          style={{
            opacity: Math.min(swipeProgress / 100, 1),
          }}
        >
          {swipeDirection === 'left' ? 'السؤال التالي ←' : '→ السؤال السابق'}
        </div>
      )}
    </div>
  )
}

export default SwipeHandler
