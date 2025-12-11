'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  ({ length = 6, value, onChange, disabled = false, autoFocus = true, className }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    // Convert value string to array of characters
    const valueArray = React.useMemo(() => {
      const arr = value.split('')
      // Pad with empty strings if needed
      while (arr.length < length) {
        arr.push('')
      }
      return arr.slice(0, length)
    }, [value, length])

    // Focus first input on mount
    React.useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }, [autoFocus])

    const handleChange = (index: number, inputValue: string) => {
      // Only allow digits
      const digit = inputValue.replace(/\D/g, '').slice(-1)

      const newValue = [...valueArray]
      newValue[index] = digit

      // Update parent value
      onChange(newValue.join(''))

      // Move focus to next input if digit was entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Backspace':
          if (!valueArray[index] && index > 0) {
            // If current input is empty, move to previous and clear it
            inputRefs.current[index - 1]?.focus()
            const newValue = [...valueArray]
            newValue[index - 1] = ''
            onChange(newValue.join(''))
          }
          break
        case 'ArrowLeft':
          if (index > 0) {
            e.preventDefault()
            inputRefs.current[index - 1]?.focus()
          }
          break
        case 'ArrowRight':
          if (index < length - 1) {
            e.preventDefault()
            inputRefs.current[index + 1]?.focus()
          }
          break
        case 'Delete':
          const newValue = [...valueArray]
          newValue[index] = ''
          onChange(newValue.join(''))
          break
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text')
      const digits = pastedData.replace(/\D/g, '').slice(0, length)

      if (digits) {
        onChange(digits.padEnd(length, '').slice(0, length))

        // Focus the next empty input or last input
        const nextEmptyIndex = digits.length < length ? digits.length : length - 1
        inputRefs.current[nextEmptyIndex]?.focus()
      }
    }

    const handleFocus = (index: number) => {
      // Select the input content on focus
      inputRefs.current[index]?.select()
    }

    return (
      <div
        ref={ref}
        className={cn('flex gap-2 justify-center', className)}
        dir="ltr" // OTP should always be LTR
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={valueArray[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              valueArray[index]
                ? 'border-primary bg-primary/5'
                : 'border-input bg-background',
              'hover:border-primary/50'
            )}
            aria-label={`رقم ${index + 1} من ${length}`}
          />
        ))}
      </div>
    )
  }
)
OTPInput.displayName = 'OTPInput'

export { OTPInput }
