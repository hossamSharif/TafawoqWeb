'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Input } from './input'
import { Label } from './label'
import { validateSaudiPhone } from '@/lib/validation/phone'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  label?: string
  helperText?: string
  required?: boolean
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  error,
  disabled,
  label = 'رقم الجوال (السعودية)',
  helperText = 'أدخل رقم جوالك السعودي (يبدأ بـ 5 ويتكون من 9 أرقام)',
  required = false,
  className,
}: PhoneInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({
    isValid: false,
  })
  const [touched, setTouched] = useState(false)

  // Validate whenever local value changes
  useEffect(() => {
    if (localValue && localValue.length > 0) {
      const result = validateSaudiPhone(localValue)
      setValidation(result)

      // Only update parent with formatted value if valid
      if (result.isValid && result.formatted) {
        onChange(result.formatted)
      }
    } else {
      setValidation({ isValid: false })
      onChange('')
    }
  }, [localValue])

  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value)
    }
  }, [value])

  const showValidation = touched && localValue.length > 0
  const showError = error || (showValidation && !validation.isValid && validation.error)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="phone-input">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}

      <div className="relative">
        {/* Country code prefix */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none z-10"
          aria-hidden="true"
        >
          +966
        </div>

        {/* Phone number input */}
        <Input
          id="phone-input"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          className={cn(
            'text-left pr-16 pl-12',
            showError && 'border-red-500 focus-visible:ring-red-500'
          )}
          placeholder="501234567"
          value={localValue}
          onChange={(e) => {
            // Only allow digits, spaces, dashes, parentheses, and + at start
            const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '')
            setLocalValue(cleaned)
          }}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          aria-invalid={!!showError}
          aria-describedby={showError ? 'phone-error' : 'phone-helper'}
        />

        {/* Validation icon */}
        {showValidation && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {validation.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="رقم صحيح" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" aria-label="رقم غير صحيح" />
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {showError && (
        <p id="phone-error" className="text-xs text-red-500" role="alert">
          {error || validation.error}
        </p>
      )}

      {/* Helper text */}
      {!showError && helperText && (
        <p id="phone-helper" className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}
