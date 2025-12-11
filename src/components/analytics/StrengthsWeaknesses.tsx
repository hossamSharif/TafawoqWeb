'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Category labels mapping for Arabic display
export const CATEGORY_LABELS: Record<string, string> = {
  algebra: 'الجبر',
  geometry: 'الهندسة',
  statistics: 'الإحصاء',
  ratios: 'النسب والتناسب',
  'ratio-proportion': 'النسب والتناسب',
  probability: 'الاحتمالات',
  speed_distance_time: 'السرعة والمسافة',
  'speed-time-distance': 'السرعة والمسافة',
  reading_comprehension: 'استيعاب المقروء',
  'reading-comprehension': 'استيعاب المقروء',
  sentence_completion: 'إكمال الجمل',
  'sentence-completion': 'إكمال الجمل',
  contextual_error: 'الخطأ السياقي',
  'context-error': 'الخطأ السياقي',
  verbal_analogy: 'التناظر اللفظي',
  analogy: 'التناظر اللفظي',
  association_difference: 'الارتباط والاختلاف',
  'association-difference': 'الارتباط والاختلاف',
  vocabulary: 'المفردات',
}

export interface StrengthWeaknessItem {
  category: string
  score?: number
  correct?: number
  total?: number
  trend?: 'up' | 'down' | 'stable'
}

interface StrengthsWeaknessesProps {
  strengths: (string | StrengthWeaknessItem)[]
  weaknesses: (string | StrengthWeaknessItem)[]
  maxItems?: number
  showTrend?: boolean
  variant?: 'card' | 'inline' | 'compact'
  className?: string
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

function StrengthItem({
  item,
  showTrend,
  variant,
}: {
  item: string | StrengthWeaknessItem
  showTrend?: boolean
  variant: 'card' | 'inline' | 'compact'
}) {
  const isDetailed = typeof item !== 'string'
  const category = typeof item === 'string' ? item : item.category
  const score = isDetailed ? item.score : undefined
  const trend = isDetailed ? item.trend : undefined

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-sm">
        {getCategoryLabel(category)}
        {score !== undefined && <span className="font-medium">{score}%</span>}
      </span>
    )
  }

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg',
        variant === 'inline' && 'px-2 py-1.5'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
        <span className={variant === 'inline' ? 'text-sm' : ''}>
          {getCategoryLabel(category)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {score !== undefined && (
          <span className="text-sm font-medium">{score}%</span>
        )}
        {showTrend && trend && (
          <span>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-orange-600" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
          </span>
        )}
      </div>
    </li>
  )
}

function WeaknessItem({
  item,
  showTrend,
  variant,
}: {
  item: string | StrengthWeaknessItem
  showTrend?: boolean
  variant: 'card' | 'inline' | 'compact'
}) {
  const isDetailed = typeof item !== 'string'
  const category = typeof item === 'string' ? item : item.category
  const score = isDetailed ? item.score : undefined
  const trend = isDetailed ? item.trend : undefined

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-1 rounded text-sm">
        {getCategoryLabel(category)}
        {score !== undefined && <span className="font-medium">{score}%</span>}
      </span>
    )
  }

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg',
        variant === 'inline' && 'px-2 py-1.5'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
        <span className={variant === 'inline' ? 'text-sm' : ''}>
          {getCategoryLabel(category)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {score !== undefined && (
          <span className="text-sm font-medium">{score}%</span>
        )}
        {showTrend && trend && (
          <span>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
          </span>
        )}
      </div>
    </li>
  )
}

/**
 * Display strengths and weaknesses in side-by-side or stacked layout
 */
export function StrengthsWeaknesses({
  strengths,
  weaknesses,
  maxItems = 3,
  showTrend = false,
  variant = 'card',
  className,
}: StrengthsWeaknessesProps) {
  const displayedStrengths = strengths.slice(0, maxItems)
  const displayedWeaknesses = weaknesses.slice(0, maxItems)

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {displayedStrengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>نقاط القوة</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayedStrengths.map((item, i) => (
                <StrengthItem key={i} item={item} variant="compact" />
              ))}
            </div>
          </div>
        )}
        {displayedWeaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <TrendingDown className="w-3 h-3 text-orange-500" />
              <span>يحتاج تحسين</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayedWeaknesses.map((item, i) => (
                <WeaknessItem key={i} item={item} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('grid md:grid-cols-2 gap-6', className)}>
      {/* Strengths */}
      <div className={cn(
        variant === 'card' && 'bg-white rounded-xl shadow-sm p-6'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-gray-900">نقاط القوة</h3>
        </div>
        {displayedStrengths.length > 0 ? (
          <ul className="space-y-2">
            {displayedStrengths.map((item, i) => (
              <StrengthItem
                key={i}
                item={item}
                showTrend={showTrend}
                variant={variant}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">لا توجد نقاط قوة واضحة بعد</p>
        )}
      </div>

      {/* Weaknesses */}
      <div className={cn(
        variant === 'card' && 'bg-white rounded-xl shadow-sm p-6'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-900">نقاط تحتاج تحسين</h3>
        </div>
        {displayedWeaknesses.length > 0 ? (
          <ul className="space-y-2">
            {displayedWeaknesses.map((item, i) => (
              <WeaknessItem
                key={i}
                item={item}
                showTrend={showTrend}
                variant={variant}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">أداء متوازن في جميع المجالات</p>
        )}
      </div>
    </div>
  )
}

interface StrengthsOnlyProps {
  items: (string | StrengthWeaknessItem)[]
  maxItems?: number
  variant?: 'list' | 'tags'
  className?: string
}

/**
 * Display only strengths in a list or tag format
 */
export function StrengthsOnly({
  items,
  maxItems = 3,
  variant = 'list',
  className,
}: StrengthsOnlyProps) {
  const displayed = items.slice(0, maxItems)

  if (variant === 'tags') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {displayed.map((item, i) => {
          const category = typeof item === 'string' ? item : item.category
          return (
            <span
              key={i}
              className="text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm"
            >
              {getCategoryLabel(category)}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {displayed.map((item, i) => (
        <StrengthItem key={i} item={item} variant="card" />
      ))}
    </ul>
  )
}

interface WeaknessesOnlyProps {
  items: (string | StrengthWeaknessItem)[]
  maxItems?: number
  variant?: 'list' | 'tags'
  className?: string
}

/**
 * Display only weaknesses in a list or tag format
 */
export function WeaknessesOnly({
  items,
  maxItems = 3,
  variant = 'list',
  className,
}: WeaknessesOnlyProps) {
  const displayed = items.slice(0, maxItems)

  if (variant === 'tags') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {displayed.map((item, i) => {
          const category = typeof item === 'string' ? item : item.category
          return (
            <span
              key={i}
              className="text-orange-700 bg-orange-50 px-3 py-1 rounded-full text-sm"
            >
              {getCategoryLabel(category)}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {displayed.map((item, i) => (
        <WeaknessItem key={i} item={item} variant="card" />
      ))}
    </ul>
  )
}

export default StrengthsWeaknesses
