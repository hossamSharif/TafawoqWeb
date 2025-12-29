'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  History, ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown,
  Share2, CheckCircle, Library, RotateCcw, Download, Eye, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getScoreColor } from '@/lib/utils/scoring'
import { ShareExamModal } from '@/components/forum/ShareExamModal'

interface ExamHistoryItem {
  id: string
  date: string
  verbal: number
  quantitative: number
  overall: number
  timeSpentMinutes?: number
  track?: 'scientific' | 'literary'
  total_questions?: number
  questions?: Array<{
    section?: string
    difficulty?: string
    topic?: string
  }>
  isShared?: boolean
  isLibraryExam?: boolean // T035: Flag to indicate library exam
}

interface ExamHistoryProps {
  history: ExamHistoryItem[]
  maxItems?: number
  className?: string
  variant?: 'compact' | 'full' // New: display variant
  showActions?: boolean // New: show action buttons
  onShare?: (examId: string, data: { title: string; body: string }) => Promise<void>
  onRetake?: (examId: string) => void // New: retake handler
  onExport?: (examId: string) => void // New: export handler
}

function ScoreBadge({ score }: { score: number }) {
  const colorClass = getScoreColor(score)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-sm font-medium',
        colorClass === 'gold' && 'bg-yellow-100 text-yellow-700',
        colorClass === 'green' && 'bg-green-100 text-green-700',
        colorClass === 'grey' && 'bg-gray-100 text-gray-700',
        colorClass === 'warm' && 'bg-orange-100 text-orange-700'
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

export function ExamHistory({
  history,
  maxItems = 5,
  className,
  variant = 'full',
  showActions = true,
  onShare,
  onRetake,
  onExport
}: ExamHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamHistoryItem | null>(null)
  const [sharedExams, setSharedExams] = useState<Set<string>>(
    new Set(history.filter(h => h.isShared).map(h => h.id))
  )

  const handleShareClick = (e: React.MouseEvent, exam: ExamHistoryItem) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedExam(exam)
    setShareModalOpen(true)
  }

  const handleShare = async (data: { title: string; body: string }) => {
    if (!selectedExam || !onShare) return

    await onShare(selectedExam.id, data)
    setSharedExams(prev => new Set([...prev, selectedExam.id]))
  }

  const handleRetake = (e: React.MouseEvent, examId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRetake) {
      onRetake(examId)
    }
  }

  const handleExport = (e: React.MouseEvent, examId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (onExport) {
      onExport(examId)
    }
  }

  if (history.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">سجل الاختبارات</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>لا يوجد سجل اختبارات بعد</p>
          <Link href="/dashboard">
            <Button size="sm" className="mt-4">
              ابدأ اختبارك الأول
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
    const avgRecent = recent.reduce((sum, h) => sum + h.overall, 0) / recent.length
    const avgOlder = history.slice(-Math.min(3, history.length)).reduce((sum, h) => sum + h.overall, 0) / Math.min(3, history.length)
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
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900">آخر الاختبارات</h3>
              </div>
              <Link href="/performance">
                <Button variant="ghost" size="sm" className="text-primary">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y">
            {displayedHistory.map((exam, index) => {
              const prevExam = history[index + 1]
              const formattedDate = new Date(exam.date).toLocaleDateString('ar-SA', {
                month: 'short',
                day: 'numeric',
              })
              const isAlreadyShared = sharedExams.has(exam.id)
              const canShare = onShare && !exam.isLibraryExam && !isAlreadyShared

              return (
                <div key={exam.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Score circle */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                        <span className="text-sm font-bold text-primary">{Math.round(exam.overall)}%</span>
                      </div>
                    </div>

                    {/* Exam info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/exam/results/${exam.id}`} className="hover:text-primary">
                          <span className="text-sm font-medium text-gray-900">اختبار {index + 1}</span>
                        </Link>
                        {exam.isLibraryExam && (
                          <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 text-xs">
                            <Library className="w-3 h-3" />
                            مكتبة
                          </Badge>
                        )}
                        {prevExam && (
                          <TrendIndicator current={exam.overall} previous={prevExam.overall} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                        {exam.timeSpentMinutes && (
                          <>
                            <span>•</span>
                            <span>{exam.timeSpentMinutes} د</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/exam/results/${exam.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="عرض النتائج">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/exam/results/${exam.id}#questions-review`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="مراجعة الأسئلة">
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canShare && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleShareClick(e, exam)}
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
                        {!exam.isLibraryExam && onRetake && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleRetake(e, exam.id)}
                            className="h-8 w-8 p-0"
                            title="إعادة الاختبار"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {onExport && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleExport(e, exam.id)}
                            className="h-8 w-8 p-0"
                            title="تصدير النتائج"
                          >
                            <Download className="h-4 w-4" />
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

        {selectedExam && (
          <ShareExamModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            examSession={{
              id: selectedExam.id,
              track: selectedExam.track || 'scientific',
              total_questions: selectedExam.total_questions || 96,
              verbal_score: selectedExam.verbal,
              quantitative_score: selectedExam.quantitative,
              overall_score: selectedExam.overall,
              questions: selectedExam.questions,
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
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">سجل الاختبارات</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{history.length} اختبار</span>
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
        <div className="hidden md:grid grid-cols-9 gap-4 px-6 py-3 bg-gray-50 text-sm text-gray-500 font-medium">
          <div>التاريخ</div>
          <div className="text-center">النوع</div>
          <div className="text-center">لفظي</div>
          <div className="text-center">كمي</div>
          <div className="text-center">الإجمالي</div>
          <div className="text-center">التغيير</div>
          <div className="text-center">المدة</div>
          <div className="text-center">مشاركة</div>
          {showActions && <div className="text-center">إجراءات</div>}
        </div>

        {/* History Items */}
        <div className="divide-y">
          {displayedHistory.map((exam, index) => {
            const prevExam = history[index + 1]
            const formattedDate = new Date(exam.date).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            const isAlreadyShared = sharedExams.has(exam.id)
            // T035: Library exams cannot be shared (they came from shared content)
            const canShare = onShare && !exam.isLibraryExam && !isAlreadyShared

            return (
              <div key={exam.id} className="hover:bg-gray-50 transition-colors">
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-9 gap-4 px-6 py-4 items-center">
                  <Link href={`/exam/results/${exam.id}`} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 hover:text-primary">{formattedDate}</span>
                  </Link>
                  {/* T035: Exam type indicator */}
                  <div className="text-center">
                    {exam.isLibraryExam ? (
                      <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 text-xs">
                        <Library className="w-3 h-3" />
                        مكتبة
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        ذاتي
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <ScoreBadge score={exam.verbal} />
                  </div>
                  <div className="text-center">
                    <ScoreBadge score={exam.quantitative} />
                  </div>
                  <div className="text-center">
                    <ScoreBadge score={exam.overall} />
                  </div>
                  <div className="text-center">
                    {prevExam ? (
                      <TrendIndicator current={exam.overall} previous={prevExam.overall} />
                    ) : (
                      <span className="text-gray-400 text-xs">أول اختبار</span>
                    )}
                  </div>
                  <div className="text-center text-gray-500 text-sm">
                    {exam.timeSpentMinutes
                      ? `${exam.timeSpentMinutes} د`
                      : '--'
                    }
                  </div>
                  <div className="text-center">
                    {exam.isLibraryExam ? (
                      <span className="text-xs text-gray-400">--</span>
                    ) : isAlreadyShared ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        تمت المشاركة
                      </span>
                    ) : canShare ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleShareClick(e, exam)}
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
                      {!exam.isLibraryExam && onRetake && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleRetake(e, exam.id)}
                          className="h-8 w-8 p-0"
                          title="إعادة الاختبار"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {onExport && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleExport(e, exam.id)}
                          className="h-8 w-8 p-0"
                          title="تصدير النتائج"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile View */}
                <Link href={`/exam/results/${exam.id}`} className="block md:hidden p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formattedDate}
                      {/* T035: Library exam indicator on mobile */}
                      {exam.isLibraryExam && (
                        <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 text-xs mr-2">
                          <Library className="w-3 h-3" />
                          مكتبة
                        </Badge>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {prevExam && (
                        <TrendIndicator current={exam.overall} previous={prevExam.overall} />
                      )}
                      {!exam.isLibraryExam && (
                        isAlreadyShared ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : canShare ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleShareClick(e, exam)}
                            className="p-1 h-auto"
                          >
                            <Share2 className="w-4 h-4 text-primary" />
                          </Button>
                        ) : null
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-500">لفظي:</span>
                      <ScoreBadge score={exam.verbal} />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-500">كمي:</span>
                      <ScoreBadge score={exam.quantitative} />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-500">إجمالي:</span>
                      <ScoreBadge score={exam.overall} />
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
      {selectedExam && (
        <ShareExamModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          examSession={{
            id: selectedExam.id,
            track: selectedExam.track || 'scientific',
            total_questions: selectedExam.total_questions || 96,
            verbal_score: selectedExam.verbal,
            quantitative_score: selectedExam.quantitative,
            overall_score: selectedExam.overall,
            questions: selectedExam.questions,
          }}
          onShare={handleShare}
        />
      )}
    </>
  )
}
