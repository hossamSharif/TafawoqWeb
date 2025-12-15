'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'
import type { QuestionSection } from '@/types/question'

interface QuestionCountSelectorProps {
  value: number
  onChange: (count: number) => void
  min?: number
  max?: number
  isPremium?: boolean
  disabled?: boolean
  // T049: New props for practice limit display (FR-016, FR-017)
  examSectionCount?: number | null
  section?: QuestionSection | null
}

const PRESET_COUNTS = [5, 10, 20, 30, 50]

export function QuestionCountSelector({
  value,
  onChange,
  min = 5,
  max = 100,
  isPremium = false,
  disabled = false,
  examSectionCount,
  section,
}: QuestionCountSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState(value.toString())

  // For free tier, fix to 5 questions
  const effectiveMin = isPremium ? min : 5
  const effectiveMax = isPremium ? max : 5

  // T049: Filter presets based on tier AND practice limit (FR-016)
  const availablePresets = isPremium
    ? PRESET_COUNTS.filter((count) => count <= effectiveMax)
    : PRESET_COUNTS.filter((count) => count === 5)

  // T049: Check if practice limit is lower than the general max (100)
  const isPracticeLimitApplied = isPremium && max < 100

  const handlePresetClick = (count: number) => {
    if (disabled) return
    setShowCustomInput(false)
    onChange(count)
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setCustomValue(inputValue)

    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue)) {
      // Clamp value to min/max
      const clampedValue = Math.max(effectiveMin, Math.min(effectiveMax, numValue))
      onChange(clampedValue)
    }
  }

  const handleCustomInputBlur = () => {
    // Ensure value is valid on blur
    const numValue = parseInt(customValue, 10)
    if (isNaN(numValue) || numValue < effectiveMin) {
      setCustomValue(effectiveMin.toString())
      onChange(effectiveMin)
    } else if (numValue > effectiveMax) {
      setCustomValue(effectiveMax.toString())
      onChange(effectiveMax)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">عدد الأسئلة</h3>

      {!isPremium && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          الحد الأقصى للمستخدمين المجانيين: 5 أسئلة
        </p>
      )}

      {/* T050: Practice limit explanation for premium users (FR-016, FR-017) */}
      {isPremium && isPracticeLimitApplied && examSectionCount && (
        <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              الحد الأقصى للتمرين: {effectiveMax} سؤال
            </p>
            <p className="text-blue-500 text-xs mt-1">
              {section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي'} يحتوي على {examSectionCount} سؤال في الاختبار.
              التمرين محدود بنصف عدد أسئلة القسم.
            </p>
          </div>
        </div>
      )}

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-3">
        {availablePresets.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => handlePresetClick(count)}
            disabled={disabled}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              value === count && !showCustomInput
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-700',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {count}
          </button>
        ))}

        {/* Custom input toggle (premium only) */}
        {isPremium && (
          <button
            type="button"
            onClick={() => {
              if (disabled) return
              setShowCustomInput(!showCustomInput)
              if (!showCustomInput) {
                setCustomValue(value.toString())
              }
            }}
            disabled={disabled}
            className={cn(
              'flex h-12 items-center gap-2 rounded-lg border-2 px-4 font-medium transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              showCustomInput
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-700',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            مخصص
          </button>
        )}
      </div>

      {/* Custom input field */}
      {showCustomInput && isPremium && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={customValue}
              onChange={handleCustomValueChange}
              onBlur={handleCustomInputBlur}
              min={effectiveMin}
              max={effectiveMax}
              disabled={disabled}
              className="w-24 text-center font-bold"
            />
            <span className="text-gray-500">سؤال</span>
          </div>
          <p className="text-sm text-gray-500">
            اختر عدداً بين {effectiveMin} و {effectiveMax}
          </p>
        </div>
      )}

      {/* Current selection display */}
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-gray-600">العدد المحدد:</span>
        <span className="text-xl font-bold text-primary">{value}</span>
        <span className="text-gray-600">سؤال</span>
      </div>

      {/* Estimated time */}
      <p className="text-sm text-gray-500">
        الوقت المتوقع: حوالي {Math.ceil(value * 1.5)} دقيقة
      </p>
    </div>
  )
}

export default QuestionCountSelector
