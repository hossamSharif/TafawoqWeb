'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  History, ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown,
  Share2, CheckCircle, RotateCcw, Download, Eye, Target, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ShareExamModal } from '@/components/forum/ShareExamModal'

interface PracticeHistoryItem {
  id: string
  date: string
  section: 'verbal' | 'quantitative'
  sectionLabel: string
  categories: string[]
  categoryLabels: string[]
  difficulty: string
  difficultyLabel: string
  questionCount: number
  score: number
  timeSpentSeconds?: number
  timeSpentFormatted?: string
  isShared?: boolean
}

interface PracticeHistoryProps {
  history: PracticeHistoryItem[]
  maxItems?: number
  className?: string
  variant?: 'compact' | 'full'
  showActions?: boolean
  onShare?: (practiceId: string, data: { title: string; body: string }) => Promise<void>
  onRetake?: (practiceId: string) => void
}

function ScoreBadge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700'
    if (score >= 40) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-sm font-medium',
        getScoreColor(score)
      )}
    >
      {Math.round(score)}%
    </span>
  )
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const absDiff = Math.abs(Math.round(diff))

  if (absDiff === 0) {
    return <span className="text-gray-400 text-xs">--</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs gap-0.5',
        diff > 0 ? 'text-green-600' : 'text-red-500'
      )}
    >
      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {absDiff}%
    </span>
  )
}

export function PracticeHistory({
  history,
  maxItems = 5,
  className,
  variant = 'full',
  showActions = true,
  onShare,
  onRetake
}: PracticeHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedPractice, setSelectedPractice] = useState<PracticeHistoryItem | null>(null)
  const [sharedPractices, setSharedPractices] = useState<Set<string>>(
    new Set(history.filter(h => h.isShared).map(h => h.id))
  )

  const handleShareClick = (e: React.MouseEvent, practice: PracticeHistoryItem) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedPractice(practice)
    setShareModalOpen(true)
  }

  const handleShare = async (data: { title: string; body: string }) => {
    if (!selectedPractice || !onShare) return

    await onShare(selectedPractice.id, data)
    setSharedPractices(prev => new Set([...prev, selectedPractice.id]))
  }

  const handleRetake = (e: React.MouseEvent, practiceId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRetake) {
      onRetake(practiceId)
    }
  }

  if (history.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">سجل التمارين</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>لا يوجد سجل تمارين بعد</p>
          <Link href="/practice/new">
            <Button size="sm" className="mt-4">
              ابدأ تمرينك الأول
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const displayedHistory = isExpanded ? history : history.slice(0, maxItems)
  const hasMore = history.length > maxItems

  // Calculate average trend
  const calculateAverageTrend = () => {
    if (history.length < 2) return 0
    const recent = history.slice(0, Math.min(3, history.length))
    const avgRecent = recent.reduce((sum, h) => sum + h.score, 0) / recent.length
    const avgOlder = history.slice(-Math.min(3, history.length)).reduce((sum, h) => sum + h.score, 0) / Math.min(3, history.length)
    return avgRecent - avgOlder
  }

  const avgTrend = calculateAverageTrend()

  // Compact variant for dashboard
  if (variant === 'compact') {
    return (
      <>
        <div className={cn('bg-white rounded-xl shadow-sm', className)}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900">آخر التمارين</h3>
              </div>
              <Link href="/performance">
                <Button variant="ghost" size="sm" className="text-primary">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y">
            {displayedHistory.map((practice, index) => {
              const prevPractice = history[index + 1]
              const formattedDate = new Date(practice.date).toLocaleDateString('ar-SA', {
                month: 'short',
                day: 'numeric',
              })
              const isAlreadyShared = sharedPractices.has(practice.id)
              const canShare = onShare && !isAlreadyShared

              return (
                <div key={practice.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Score circle */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                        <span className="text-sm font-bold text-primary">{Math.round(practice.score)}%</span>
                      </div>
                    </div>

                    {/* Practice info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/practice/results/${practice.id}`} className="hover:text-primary">
                          <span className="text-sm font-medium text-gray-900">
                            {practice.sectionLabel} - {practice.difficultyLabel}
                          </span>
                        </Link>
                        {prevPractice && (
                          <TrendIndicator current={practice.score} previous={prevPractice.score} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                        {practice.timeSpentFormatted && (
                          <>
                            <span>•</span>
                            <span>{practice.timeSpentFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/practice/results/${practice.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="عرض النتائج">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/practice/results/${practice.id}#questions-review`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="مراجعة الأسئلة">
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canShare && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleShareClick(e, practice)}
                            className="h-8 w-8 p-0"
                            title="مشاركة في المنتدى"
                          >
                            <Share2 className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {isAlreadyShared && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 cursor-not-allowed"
                            disabled
                            title="تمت المشاركة"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {onRetake && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleRetake(e, practice.id)}
                            className="h-8 w-8 p-0"
                            title="إعادة التمرين"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedPractice && (
          <ShareExamModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            practiceSession={{
              id: selectedPractice.id,
              section: selectedPractice.section,
              difficulty: selectedPractice.difficulty,
              total_questions: selectedPractice.questionCount,
              correct_answers: Math.round((selectedPractice.score / 100) * selectedPractice.questionCount),
              score: selectedPractice.score,
              category: selectedPractice.categoryLabels[0],
            }}
            onShare={handleShare}
          />
        )}
      </>
    )
  }

  // Full variant for profile/performance page
  return (
    <>
      <div className={cn('bg-white rounded-xl shadow-sm', className)}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">سجل التمارين</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{history.length} تمرين</span>
              {avgTrend !== 0 && (
                <span
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full',
                    avgTrend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  )}
                >
                  {avgTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {avgTrend > 0 ? 'تحسن' : 'تراجع'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-8 gap-4 px-6 py-3 bg-gray-50 text-sm text-gray-500 font-medium">
          <div>التاريخ</div>
          <div className="text-center">القسم</div>
          <div className="text-center">الصعوبة</div>
          <div className="text-center">النتيجة</div>
          <div className="text-center">التغيير</div>
          <div className="text-center">المدة</div>
          <div className="text-center">مشاركة</div>
          {showActions && <div className="text-center">إجراءات</div>}
        </div>

        {/* History Items */}
        <div className="divide-y">
          {displayedHistory.map((practice, index) => {
            const prevPractice = history[index + 1]
            const formattedDate = new Date(practice.date).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            const isAlreadyShared = sharedPractices.has(practice.id)
            const canShare = onShare && !isAlreadyShared

            return (
              <div key={practice.id} className="hover:bg-gray-50 transition-colors">
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-8 gap-4 px-6 py-4 items-center">
                  <Link href={`/practice/results/${practice.id}`} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 hover:text-primary">{formattedDate}</span>
                  </Link>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {practice.sectionLabel}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {practice.difficultyLabel}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <ScoreBadge score={practice.score} />
                  </div>
                  <div className="text-center">
                    {prevPractice ? (
                      <TrendIndicator current={practice.score} previous={prevPractice.score} />
                    ) : (
                      <span className="text-gray-400 text-xs">أول تمرين</span>
                    )}
                  </div>
                  <div className="text-center text-gray-500 text-sm">
                    {practice.timeSpentFormatted || '--'}
                  </div>
                  <div className="text-center">
                    {isAlreadyShared ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        تمت المشاركة
                      </span>
                    ) : canShare ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleShareClick(e, practice)}
                        className="gap-1 text-primary hover:text-primary/80"
                      >
                        <Share2 className="w-4 h-4" />
                        شارك
                      </Button>
                    ) : null}
                  </div>
                  {/* Actions Column */}
                  {showActions && (
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/practice/results/${practice.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="عرض النتائج"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/practice/results/${practice.id}#questions-review`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="مراجعة الأسئلة"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </Link>
                      {onRetake && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleRetake(e, practice.id)}
                          className="h-8 w-8 p-0"
                          title="إعادة التمرين"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile View */}
                <Link href={`/practice/results/${practice.id}`} className="block md:hidden p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      {prevPractice && (
                        <TrendIndicator current={practice.score} previous={prevPractice.score} />
                      )}
                      {isAlreadyShared ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : canShare ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleShareClick(e, practice)}
                          className="p-1 h-auto"
                        >
                          <Share2 className="w-4 h-4 text-primary" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <Badge variant="secondary">{practice.sectionLabel}</Badge>
                    <Badge variant="outline">{practice.difficultyLabel}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-500">النتيجة:</span>
                      <ScoreBadge score={practice.score} />
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Show More/Less Button */}
        {hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  عرض الكل ({history.length - maxItems} إضافية)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedPractice && (
        <ShareExamModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          practiceSession={{
            id: selectedPractice.id,
            section: selectedPractice.section,
            difficulty: selectedPractice.difficulty,
            total_questions: selectedPractice.questionCount,
            correct_answers: Math.round((selectedPractice.score / 100) * selectedPractice.questionCount),
            score: selectedPractice.score,
            category: selectedPractice.categoryLabels[0],
          }}
          onShare={handleShare}
        />
      )}
    </>
  )
}
