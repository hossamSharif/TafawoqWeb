'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatTimeArabic } from '@/lib/utils/scoring'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { AnswerOptions } from '@/components/exam/AnswerOptions'
import { ExplanationPanel } from '@/components/exam/ExplanationPanel'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { SwipeHandler } from '@/components/results/mobile/SwipeHandler'
import { ReviewFilters } from '@/components/results/ReviewFilters'
import { FilterBottomSheet } from '@/components/results/mobile/FilterBottomSheet'
import { ReviewBookmarkButton } from '@/components/results/ReviewBookmarkButton'
import { ReviewNotes } from '@/components/results/ReviewNotes'
import { ExportOptionsModal } from '@/components/results/ExportOptionsModal'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useReviewFilters } from '@/hooks/useReviewFilters'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useQuestionNotes } from '@/hooks/useQuestionNotes'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  BookOpen,
  Target,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Filter,
  RotateCcw,
  Download,
} from 'lucide-react'
import type {
  DiagramData,
  QuestionSection,
  QuestionDifficulty,
  QuestionCategory,
  QuestionType,
} from '@/types/question'

export interface ReviewQuestion {
  index: number
  questionId: string
  section: string
  topic: string
  difficulty: string
  questionType: string
  stem: string
  passage?: string
  diagram?: DiagramData
  choices: [string, string, string, string]
  selectedAnswer: number | null
  correctAnswer: number
  isCorrect: boolean
  timeSpentSeconds: number
  explanation: string
  solvingStrategy?: string
  tip?: string
}

export interface QuestionReviewProps {
  questions: ReviewQuestion[]
  sessionId: string
  sessionType: 'exam' | 'practice'
  className?: string
}

/**
 * QuestionReview - Focus mode review component (one question at a time)
 * Matches the exam-taking experience with navigation, keyboard shortcuts, and swipe gestures
 */
export function QuestionReview({
  questions,
  sessionId,
  sessionType,
  className,
}: QuestionReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Bookmarks hook
  const { bookmarks, toggleBookmark, isLoading: bookmarksLoading } = useBookmarks({
    sessionId,
    sessionType,
    enabled: true,
  })

  // Notes hook
  const {
    notes,
    isSaving: notesSaving,
    getNote,
    setNote,
    deleteNote,
  } = useQuestionNotes({
    sessionId,
    sessionType,
    enabled: true,
    autoSaveDelay: 2000,
  })

  // Filter hook (with bookmarks support)
  const {
    filters,
    filteredQuestions,
    availableCategories,
    isFiltered,
    activeFilterCount,
    setStatusFilter,
    toggleCategory,
    toggleDifficulty,
    setSortOrder,
    resetFilters,
  } = useReviewFilters({
    questions,
    bookmarkedIndices: bookmarks,
    enableURLState: true,
  })

  // Calculate statistics (from ALL questions, not filtered)
  const totalQuestions = questions.length
  const answeredQuestions = questions.filter((q) => q.selectedAnswer !== null)
  const correctAnswers = questions.filter((q) => q.isCorrect).length
  const averageTime =
    answeredQuestions.length > 0
      ? Math.round(
          questions.reduce((sum, q) => sum + q.timeSpentSeconds, 0) /
            answeredQuestions.length
        )
      : 0

  // Filtered questions statistics
  const filteredTotal = filteredQuestions.length
  const filteredCorrect = filteredQuestions.filter((q) => q.isCorrect).length

  // Export counts
  const incorrectCount = questions.filter(
    (q) => !q.isCorrect && q.selectedAnswer !== null
  ).length
  const bookmarkedCount = questions.filter((q) => bookmarks.has(q.index)).length

  // Current question (from filtered list)
  const currentQuestion = filteredQuestions[currentIndex]
  const currentStatus = currentQuestion
    ? currentQuestion.selectedAnswer === null
      ? 'unanswered'
      : currentQuestion.isCorrect
      ? 'correct'
      : 'incorrect'
    : 'unanswered'

  // Navigation functions (work with filtered questions)
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < filteredTotal) {
      setCurrentIndex(index)
      // Scroll to top of main content
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const nextQuestion = () => {
    if (currentIndex < filteredTotal - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  // Reset current index when filters change
  useEffect(() => {
    if (currentIndex >= filteredTotal && filteredTotal > 0) {
      setCurrentIndex(0)
    }
  }, [filteredTotal, currentIndex])

  // Keyboard navigation
  useKeyboardNavigation({
    onNext: nextQuestion,
    onPrevious: prevQuestion,
    enabled: true,
  })

  // Question sets for navigator (use filtered questions)
  const answeredQuestionsSet = new Set(
    filteredQuestions
      .map((q, idx) => (q.selectedAnswer !== null ? idx : null))
      .filter((idx): idx is number => idx !== null)
  )

  const correctAnswersSet = new Set(
    filteredQuestions
      .map((q, idx) => (q.isCorrect ? idx : null))
      .filter((idx): idx is number => idx !== null)
  )

  const incorrectAnswersSet = new Set(
    filteredQuestions
      .map((q, idx) => (!q.isCorrect && q.selectedAnswer !== null ? idx : null))
      .filter((idx): idx is number => idx !== null)
  )

  // Bookmarked questions (map original indices to filtered indices)
  const bookmarkedIndicesSet = new Set(
    filteredQuestions
      .map((q, idx) => (bookmarks.has(q.index) ? idx : null))
      .filter((idx): idx is number => idx !== null)
  )

  // Noted questions (map original indices to filtered indices)
  const notedIndicesSet = new Set(
    filteredQuestions
      .map((q, idx) => (notes.has(q.index) ? idx : null))
      .filter((idx): idx is number => idx !== null)
  )

  // Scroll to #questions-review anchor if present
  useEffect(() => {
    if (window.location.hash === '#questions-review') {
      setTimeout(() => {
        const element = document.getElementById('questions-review')
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  // Get category label (with fallback to English if needed)
  const getCategoryLabel = (topic: string) => {
    const CATEGORY_LABELS: Record<string, string> = {
      // Quantitative categories
      algebra: 'الجبر',
      geometry: 'الهندسة',
      arithmetic: 'الحساب',
      statistics: 'الإحصاء',
      ratios: 'النسب والتناسب',
      probability: 'الاحتمالات',
      speed_distance_time: 'السرعة والمسافة',

      // Verbal categories (with both underscore and hyphen variants)
      reading_comprehension: 'استيعاب المقروء',
      'reading-comprehension': 'استيعاب المقروء',
      sentence_completion: 'إكمال الجمل',
      'sentence-completion': 'إكمال الجمل',
      contextual_error: 'الخطأ السياقي',
      'context-error': 'الخطأ السياقي',
      verbal_analogy: 'التناظر اللفظي',
      'verbal-analogy': 'التناظر اللفظي',
      analogy: 'القياس',
      analogies: 'القياس',
      association_difference: 'الارتباط والاختلاف',
      'association-difference': 'الارتباط والاختلاف',
      vocabulary: 'المفردات',
      critical_reasoning: 'الاستدلال المنطقي',
      'critical-reasoning': 'الاستدلال المنطقي',
      text_completion: 'إكمال النص',
      'text-completion': 'إكمال النص',
      sentence_equivalence: 'التكافؤ اللفظي',
      'sentence-equivalence': 'التكافؤ اللفظي',
      error_detection: 'كشف الخطأ',
      'error-detection': 'كشف الخطأ',
    }
    return CATEGORY_LABELS[topic] || topic
  }

  // Get difficulty label
  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
    }
    return labels[difficulty] || difficulty
  }

  // Get section label
  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      verbal: 'القسم اللفظي',
      quantitative: 'القسم الكمي',
    }
    return labels[section] || section
  }

  return (
    <div
      id="questions-review"
      className={cn(
        'w-full flex flex-col',
        isFullScreen && 'fixed inset-0 z-40 bg-white',
        className
      )}
      dir="rtl"
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                مراجعة الأسئلة
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                السؤال {currentIndex + 1} من {filteredTotal}
                {isFiltered && (
                  <span className="text-primary"> (من {totalQuestions} سؤال)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Statistics */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">
                  {correctAnswers}/{totalQuestions} صحيح
                </span>
              </div>
              {averageTime > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">
                    متوسط: {formatTimeArabic(averageTime)}
                  </span>
                </div>
              )}
            </div>

            {/* Export button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="flex-shrink-0"
              title="تصدير المراجعة"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Filter button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFilters(!showFilters)
                setShowMobileFilters(!showMobileFilters)
              }}
              className="flex-shrink-0 relative"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </div>
              )}
            </Button>

            {/* Full-screen toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex-shrink-0"
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Filter Panel */}
        {showFilters && (
          <div className="hidden sm:block p-4 border-t border-gray-200 bg-gray-50">
            <ReviewFilters
              filters={filters}
              availableCategories={availableCategories}
              activeFilterCount={activeFilterCount}
              onStatusChange={setStatusFilter}
              onCategoryToggle={toggleCategory}
              onDifficultyToggle={toggleDifficulty}
              onSortChange={setSortOrder}
              onReset={resetFilters}
            />
          </div>
        )}

        {/* Mobile statistics */}
        <div className="sm:hidden flex items-center justify-center gap-4 px-4 pb-3 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-gray-900">
              {correctAnswers}/{totalQuestions}
            </span>
          </div>
          {averageTime > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">{formatTimeArabic(averageTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <SwipeHandler
        onSwipeLeft={nextQuestion}
        onSwipeRight={prevQuestion}
        enabled={filteredTotal > 0}
        className="flex-1 overflow-y-auto"
      >
        <div ref={mainContentRef} className="h-full overflow-y-auto">
          {filteredTotal === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <XCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد أسئلة تطابق الفلتر المحدد
              </h3>
              <p className="text-gray-600 mb-6">
                جرب تغيير معايير التصفية لعرض المزيد من الأسئلة
              </p>
              <Button onClick={resetFilters} variant="outline">
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة تعيين الفلتر
              </Button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            {/* Question Header */}
            <div
              className={cn(
                'rounded-xl border-2 p-4 sm:p-6',
                currentStatus === 'correct' && 'border-green-200 bg-green-50',
                currentStatus === 'incorrect' && 'border-red-200 bg-red-50',
                currentStatus === 'unanswered' && 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  {currentStatus === 'correct' && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  )}
                  {currentStatus === 'incorrect' && (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  {currentStatus === 'unanswered' && (
                    <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}

                  {/* Question Metadata */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        السؤال {currentIndex + 1}
                      </div>
                      {/* Bookmark Button */}
                      <ReviewBookmarkButton
                        questionIndex={currentQuestion.index}
                        isBookmarked={bookmarks.has(currentQuestion.index)}
                        onToggle={toggleBookmark}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-0.5">
                      <span>{getSectionLabel(currentQuestion.section)}</span>
                      <span>•</span>
                      <span>{getCategoryLabel(currentQuestion.topic)}</span>
                      <span>•</span>
                      <span>{getDifficultyLabel(currentQuestion.difficulty)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Time */}
                <div className="flex flex-col items-end gap-2">
                  {currentQuestion.timeSpentSeconds > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatTimeArabic(currentQuestion.timeSpentSeconds)}
                      </span>
                    </div>
                  )}
                  {currentStatus === 'correct' && (
                    <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                      ✓ إجابة صحيحة
                    </div>
                  )}
                  {currentStatus === 'incorrect' && (
                    <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                      ✗ إجابة خاطئة
                    </div>
                  )}
                  {currentStatus === 'unanswered' && (
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      لم يتم الإجابة
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <QuestionCard
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              stem={currentQuestion.stem}
              passage={currentQuestion.passage}
              section={currentQuestion.section as QuestionSection}
              topic={currentQuestion.topic as QuestionCategory}
              difficulty={currentQuestion.difficulty as QuestionDifficulty}
              questionType={currentQuestion.questionType as QuestionType}
              diagram={currentQuestion.diagram}
              showCategory={false} // Already shown in header
            />

            {/* Answer Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                الخيارات:
              </h3>
              <AnswerOptions
                choices={currentQuestion.choices}
                selectedAnswer={currentQuestion.selectedAnswer}
                correctAnswer={currentQuestion.correctAnswer}
                showResult={true}
                disabled={true}
              />
            </div>

            {/* Explanation */}
            <ExplanationPanel
              explanation={currentQuestion.explanation}
              solvingStrategy={currentQuestion.solvingStrategy}
              tip={currentQuestion.tip}
              isCorrect={currentQuestion.isCorrect}
              defaultCollapsed={currentStatus === 'correct'} // Collapsed for correct, expanded for incorrect
            />

            {/* Personal Notes */}
            <ReviewNotes
              questionIndex={currentQuestion.index}
              noteText={getNote(currentQuestion.index) || ''}
              isSaving={notesSaving.get(currentQuestion.index) || false}
              onNoteChange={setNote}
              onDeleteNote={deleteNote}
              autoExpand={true}
            />
          </div>
          )}
        </div>
      </SwipeHandler>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Previous/Next Buttons (Mobile) */}
          <div className="sm:hidden flex items-center justify-between gap-4">
            <Button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <ChevronRight className="w-5 h-5 ml-2" />
              السابق
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={currentIndex === filteredTotal - 1}
              size="lg"
              className="flex-1"
            >
              التالي
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>

          {/* Question Navigator */}
          <QuestionNavigator
            currentIndex={currentIndex}
            totalQuestions={filteredTotal}
            answeredQuestions={answeredQuestionsSet}
            correctAnswers={correctAnswersSet}
            incorrectAnswers={incorrectAnswersSet}
            bookmarkedIndices={bookmarkedIndicesSet}
            notedIndices={notedIndicesSet}
            onQuestionClick={goToQuestion}
          />

          {/* Previous/Next Buttons (Desktop) */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <Button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              variant="outline"
              size="lg"
              className="px-6"
            >
              <ChevronRight className="w-5 h-5 ml-2" />
              السؤال السابق
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={currentIndex === filteredTotal - 1}
              size="lg"
              className="px-6"
            >
              السؤال التالي
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={showMobileFilters}
        onOpenChange={setShowMobileFilters}
        filters={filters}
        availableCategories={availableCategories}
        activeFilterCount={activeFilterCount}
        onStatusChange={setStatusFilter}
        onCategoryToggle={toggleCategory}
        onDifficultyToggle={toggleDifficulty}
        onSortChange={setSortOrder}
        onReset={resetFilters}
      />

      {/* Export Modal */}
      <ExportOptionsModal
        isOpen={showExportModal}
        onOpenChange={setShowExportModal}
        sessionId={sessionId}
        sessionType={sessionType}
        totalQuestions={totalQuestions}
        incorrectCount={incorrectCount}
        bookmarkedCount={bookmarkedCount}
        filteredCount={filteredTotal}
        isFiltered={isFiltered}
      />
    </div>
  )
}

export default QuestionReview
