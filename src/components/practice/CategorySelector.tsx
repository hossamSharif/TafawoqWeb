'use client'

import { cn } from '@/lib/utils'
import {
  QUANTITATIVE_CATEGORIES,
  VERBAL_CATEGORIES,
  CATEGORY_LABELS,
  type QuestionSection,
  type QuestionCategory,
} from '@/types/question'

interface CategorySelectorProps {
  section: QuestionSection | null
  value: QuestionCategory[]
  onChange: (categories: QuestionCategory[]) => void
  maxCategories?: number // For free tier restriction
  disabled?: boolean
}

export function CategorySelector({
  section,
  value,
  onChange,
  maxCategories,
  disabled = false,
}: CategorySelectorProps) {
  if (!section) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">اختر التصنيفات</h3>
        <p className="text-gray-500 text-sm">يرجى اختيار القسم أولاً</p>
      </div>
    )
  }

  const categories =
    section === 'quantitative' ? QUANTITATIVE_CATEGORIES : VERBAL_CATEGORIES

  const isSelected = (category: QuestionCategory) => value.includes(category)

  const handleToggle = (category: QuestionCategory) => {
    if (disabled) return

    if (isSelected(category)) {
      // Remove category
      onChange(value.filter((c) => c !== category))
    } else {
      // Add category (check max limit)
      if (maxCategories && value.length >= maxCategories) {
        // Replace last selected with new one
        const newValue = [...value.slice(0, -1), category]
        onChange(newValue)
      } else {
        onChange([...value, category])
      }
    }
  }

  const handleSelectAll = () => {
    if (disabled) return

    if (maxCategories) {
      // Select up to max categories
      onChange(categories.slice(0, maxCategories) as QuestionCategory[])
    } else {
      onChange([...categories] as QuestionCategory[])
    }
  }

  const handleClearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">اختر التصنيفات</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {maxCategories ? `اختر ${maxCategories}` : 'اختر الكل'}
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || value.length === 0}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            مسح الكل
          </button>
        </div>
      </div>

      {maxCategories && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          الحد الأقصى للمستخدمين المجانيين: {maxCategories} تصنيفات
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleToggle(category as QuestionCategory)}
            disabled={disabled}
            className={cn(
              'relative flex items-center gap-3 rounded-lg border-2 p-4 text-right transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected(category as QuestionCategory)
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 bg-white',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Checkbox */}
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                isSelected(category as QuestionCategory)
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 bg-white'
              )}
            >
              {isSelected(category as QuestionCategory) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'font-medium flex-1',
                isSelected(category as QuestionCategory)
                  ? 'text-primary'
                  : 'text-gray-700'
              )}
            >
              {CATEGORY_LABELS[category as QuestionCategory]}
            </span>
          </button>
        ))}
      </div>

      {/* Selection count */}
      <p className="text-sm text-gray-500">
        تم اختيار {value.length} من {categories.length} تصنيفات
        {maxCategories && value.length >= maxCategories && (
          <span className="text-amber-600 mr-2">(الحد الأقصى)</span>
        )}
      </p>
    </div>
  )
}

export default CategorySelector
