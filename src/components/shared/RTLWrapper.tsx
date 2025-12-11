'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RTLWrapperProps {
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * RTLWrapper component for consistent RTL styling
 * Wraps content with proper RTL direction and Arabic text alignment
 */
export function RTLWrapper({ children, className, as: Component = 'div' }: RTLWrapperProps) {
  return (
    <Component
      dir="rtl"
      className={cn('text-right font-arabic', className)}
    >
      {children}
    </Component>
  )
}

/**
 * Hook to get RTL-aware positioning classes
 */
export function useRTLClasses() {
  return {
    // Margin utilities (swapped for RTL)
    mlAuto: 'me-auto', // margin-left auto becomes margin-end
    mrAuto: 'ms-auto', // margin-right auto becomes margin-start
    ml: (size: number) => `me-${size}`,
    mr: (size: number) => `ms-${size}`,

    // Padding utilities
    pl: (size: number) => `pe-${size}`,
    pr: (size: number) => `ps-${size}`,

    // Flex utilities
    flexRowReverse: 'flex-row', // Normal flex-row in RTL appears reversed
    flexRow: 'flex-row-reverse', // Use this for LTR appearance in RTL context

    // Text alignment
    textLeft: 'text-end',
    textRight: 'text-start',

    // Border utilities
    borderL: 'border-e',
    borderR: 'border-s',
    roundedL: 'rounded-e',
    roundedR: 'rounded-s',
  }
}

/**
 * RTL-aware text component
 */
interface RTLTextProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function RTLText({ children, className, align = 'start' }: RTLTextProps) {
  const alignmentClass = {
    start: 'text-right',
    center: 'text-center',
    end: 'text-left',
  }[align]

  return <span className={cn(alignmentClass, 'font-arabic', className)}>{children}</span>
}
