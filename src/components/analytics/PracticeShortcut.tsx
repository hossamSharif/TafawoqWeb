'use client'

import { cn } from '@/lib/utils'
import { Target, ArrowLeft, Zap, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS } from './StrengthsWeaknesses'

// Category to section mapping
const CATEGORY_SECTIONS: Record<string, 'quantitative' | 'verbal'> = {
  algebra: 'quantitative',
  geometry: 'quantitative',
  statistics: 'quantitative',
  ratios: 'quantitative',
  'ratio-proportion': 'quantitative',
  probability: 'quantitative',
  speed_distance_time: 'quantitative',
  'speed-time-distance': 'quantitative',
  reading_comprehension: 'verbal',
  'reading-comprehension': 'verbal',
  sentence_completion: 'verbal',
  'sentence-completion': 'verbal',
  contextual_error: 'verbal',
  'context-error': 'verbal',
  verbal_analogy: 'verbal',
  analogy: 'verbal',
  association_difference: 'verbal',
  'association-difference': 'verbal',
  vocabulary: 'verbal',
}

export interface WeakArea {
  category: string
  score: number
  questionsAttempted?: number
}

interface PracticeShortcutProps {
  weakAreas: (string | WeakArea)[]
  maxItems?: number
  variant?: 'card' | 'inline' | 'button-only'
  onStartPractice?: (category: string) => void
  className?: string
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

function getCategorySection(category: string): 'quantitative' | 'verbal' {
  return CATEGORY_SECTIONS[category] || 'quantitative'
}

function buildPracticeUrl(category: string): string {
  const section = getCategorySection(category)
  // Normalize category name for URL
  const normalizedCategory = category.replace(/_/g, '-')
  return `/practice/new?section=${section}&category=${normalizedCategory}&difficulty=medium`
}

function PracticeShortcutCard({
  area,
  onStartPractice,
}: {
  area: string | WeakArea
  onStartPractice?: (category: string) => void
}) {
  const category = typeof area === 'string' ? area : area.category
  const score = typeof area === 'string' ? undefined : area.score
  const section = getCategorySection(category)
  const practiceUrl = buildPracticeUrl(category)

  return (
    <div className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {getCategoryLabel(category)}
            </h4>
            <p className="text-sm text-gray-500">
              {section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي'}
              {score !== undefined && ` • ${score}%`}
            </p>
          </div>
        </div>
        {onStartPractice ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStartPractice(category)}
            className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            تدريب
            <ArrowLeft className="w-3 h-3" />
          </Button>
        ) : (
          <Link href={practiceUrl}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              تدريب
              <ArrowLeft className="w-3 h-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function PracticeShortcutInline({
  area,
}: {
  area: string | WeakArea
}) {
  const category = typeof area === 'string' ? area : area.category
  const score = typeof area === 'string' ? undefined : area.score
  const practiceUrl = buildPracticeUrl(category)

  return (
    <Link href={practiceUrl}>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer">
        <Zap className="w-4 h-4" />
        <span className="text-sm flex-1">{getCategoryLabel(category)}</span>
        {score !== undefined && (
          <span className="text-xs font-medium">{score}%</span>
        )}
        <ArrowLeft className="w-3 h-3" />
      </div>
    </Link>
  )
}

/**
 * Quick practice shortcuts for weak areas
 */
export function PracticeShortcut({
  weakAreas,
  maxItems = 3,
  variant = 'card',
  onStartPractice,
  className,
}: PracticeShortcutProps) {
  const displayed = weakAreas.slice(0, maxItems)

  if (displayed.length === 0) {
    return null
  }

  if (variant === 'button-only') {
    const firstArea = displayed[0]
    const category = typeof firstArea === 'string' ? firstArea : firstArea.category
    const practiceUrl = buildPracticeUrl(category)

    return (
      <Link href={practiceUrl} className={className}>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Target className="w-4 h-4" />
          تدريب على {getCategoryLabel(category)}
        </Button>
      </Link>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-gray-900">تدريب مخصص لنقاط الضعف</h3>
      </div>
      {variant === 'card' ? (
        <div className="space-y-2">
          {displayed.map((area, i) => (
            <PracticeShortcutCard
              key={i}
              area={area}
              onStartPractice={onStartPractice}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((area, i) => (
            <PracticeShortcutInline key={i} area={area} />
          ))}
        </div>
      )}
      {weakAreas.length > maxItems && (
        <Link href="/practice/new">
          <Button variant="ghost" size="sm" className="w-full text-orange-600">
            عرض جميع المجالات ({weakAreas.length})
          </Button>
        </Link>
      )}
    </div>
  )
}

interface QuickPracticeButtonProps {
  category: string
  score?: number
  className?: string
}

/**
 * Single button for quick practice on a specific category
 */
export function QuickPracticeButton({
  category,
  score,
  className,
}: QuickPracticeButtonProps) {
  const practiceUrl = buildPracticeUrl(category)

  return (
    <Link href={practiceUrl} className={className}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
      >
        <Target className="w-3 h-3" />
        {getCategoryLabel(category)}
        {score !== undefined && <span className="text-xs">({score}%)</span>}
      </Button>
    </Link>
  )
}

interface AllWeakAreasLinkProps {
  count: number
  className?: string
}

/**
 * Link to practice page with all weak areas pre-selected
 */
export function AllWeakAreasLink({ count, className }: AllWeakAreasLinkProps) {
  return (
    <Link href="/practice/new" className={className}>
      <Button variant="outline" className="w-full gap-2">
        <Target className="w-4 h-4" />
        تدريب على جميع نقاط الضعف ({count})
      </Button>
    </Link>
  )
}

export default PracticeShortcut
