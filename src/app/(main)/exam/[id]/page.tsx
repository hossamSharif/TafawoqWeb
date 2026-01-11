'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExamProvider, useExamContext } from '@/contexts/ExamContext'
import {
  QuestionCard,
  AnswerOptions,
  ExamTimer,
  CompactExplanation,
  GenerationError,
} from '@/components/exam'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { Button } from '@/components/ui/button'
import { PageLoadingSkeleton } from '@/components/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronRight,
  ChevronLeft,
  Flag,
  Pause,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function ExamContent() {
  const router = useRouter()
  const mainContentRef = useRef<HTMLDivElement>(null)
  const {
    session,
    questions,
    currentIndex,
    currentQuestion,
    answeredQuestions,
    answerResults,
    isLoading,
    error,
    elapsedTime,
    setElapsedTime,
    isTimerRunning,
    isOffline,
    autoSaveQueueSize,
    submitAnswerWithAutoSave,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    completeExam,
    abandonExam,
    batchError,
    isLoadingBatch,
    retryPrefetch,
    clearBatchError,
    pauseExamWithTime,
    remainingTime,
  } = useExamContext()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [showAbandonDialog, setShowAbandonDialog] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(true)

  // Get current answer result if exists
  const currentResult = answerResults.get(currentIndex)
  const isCurrentAnswered = answeredQuestions.has(currentIndex)

  // Reset state when navigating to new question
  useEffect(() => {
    if (isCurrentAnswered && currentResult) {
      setSelectedAnswer(currentResult.selectedAnswer)
      setShowResult(true)
    } else {
      setSelectedAnswer(null)
      setShowResult(false)
    }

    // Scroll to top of main content when changing questions
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentIndex, isCurrentAnswered, currentResult])

  // Handle answer selection
  const handleSelectAnswer = useCallback(
    async (answerIndex: number) => {
      if (isCurrentAnswered || isSubmitting) return

      setSelectedAnswer(answerIndex)
      setIsSubmitting(true)

      const result = await submitAnswerWithAutoSave(currentIndex, answerIndex)

      if (result) {
        setShowResult(true)
      }

      setIsSubmitting(false)
    },
    [currentIndex, isCurrentAnswered, isSubmitting, submitAnswerWithAutoSave]
  )

  // Handle finish exam
  const handleFinishExam = useCallback(async () => {
    setShowFinishDialog(false)
    await completeExam()
    router.push(`/exam/results/${session?.id}`)
  }, [completeExam, session?.id, router])

  // Handle abandon exam
  const handleAbandonExam = useCallback(async () => {
    setShowAbandonDialog(false)
    await abandonExam()
    router.push('/dashboard')
  }, [abandonExam, router])

  // Handle pause exam
  const handlePauseExam = useCallback(async () => {
    setIsPausing(true)
    try {
      await pauseExamWithTime(remainingTime)
      setShowPauseDialog(false)
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to pause exam:', err)
    } finally {
      setIsPausing(false)
    }
  }, [pauseExamWithTime, remainingTime, router])

  // Handle timer tick
  const handleTimerTick = useCallback(
    (elapsed: number) => {
      setElapsedTime(elapsed)
    },
    [setElapsedTime]
  )

  // Handle timer expiry
  const handleTimerExpire = useCallback(async () => {
    await completeExam()
    router.push(`/exam/results/${session?.id}`)
  }, [completeExam, session?.id, router])

  // Auto-advance to next question after showing result
  const handleContinue = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      nextQuestion()
    } else {
      setShowFinishDialog(true)
    }
  }, [currentIndex, questions.length, nextQuestion])

  // Handle question navigation
  const handleQuestionClick = useCallback(
    (index: number) => {
      goToQuestion(index)
    },
    [goToQuestion]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <PageLoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const unansweredCount = questions.length - answeredQuestions.size
  const isLastQuestion = session?.totalQuestions
    ? currentIndex === session.totalQuestions - 1
    : currentIndex === questions.length - 1

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-gray-100",
        isFullScreen && "fixed inset-0 z-[9999]"
      )}
      dir="rtl"
    >
      {/* Full-Screen Toggle Button - Top Left */}
      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className={cn(
          "fixed top-4 left-4 z-[10000] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg hover:bg-white transition-all",
          "flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary"
        )}
        title={isFullScreen ? "تصغير الشاشة" : "ملء الشاشة"}
      >
        {isFullScreen ? (
          <>
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">تصغير</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">ملء الشاشة</span>
          </>
        )}
      </button>

      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-white border-b shadow-sm z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Timer */}
            <ExamTimer
              totalSeconds={7200}
              initialElapsed={elapsedTime}
              onTick={handleTimerTick}
              onExpire={handleTimerExpire}
              warningThreshold={600}
              className="flex-shrink-0"
            />

            {/* Center: Action Buttons */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPauseDialog(true)}
                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <Pause className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">إيقاف مؤقت</span>
                <span className="sm:hidden">إيقاف</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAbandonDialog(true)}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Flag className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">إلغاء</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinishDialog(true)}
                className="text-primary border-primary/20 hover:bg-primary/10"
              >
                <span className="hidden sm:inline">إنهاء الاختبار</span>
                <span className="sm:hidden">إنهاء</span>
                {unansweredCount > 0 && (
                  <span className="mr-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    {unansweredCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Right: Status indicators */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isOffline && (
                <span className="flex items-center gap-1.5 text-yellow-600 text-sm bg-yellow-50 px-2 py-1 rounded-full">
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden sm:inline">غير متصل</span>
                </span>
              )}
              {autoSaveQueueSize > 0 && !isOffline && (
                <span className="flex items-center gap-1.5 text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">جاري الحفظ</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main
        ref={mainContentRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
          {/* Question Card */}
          <QuestionCard
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            stem={currentQuestion.stem}
            passage={currentQuestion.passage}
            section={currentQuestion.section}
            topic={currentQuestion.topic}
            difficulty={currentQuestion.difficulty}
            diagram={currentQuestion.diagram}
            questionType={currentQuestion.questionType}
            isLoadingBatch={isLoadingBatch}
            className="mb-6 shadow-md"
          />

          {/* Answer Options Card with Compact Explanation */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              {/* Left: Title */}
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                اختر الإجابة الصحيحة
              </h3>

              {/* Right: Compact Explanation (shown after answering) */}
              {showResult && currentResult && (
                <div className="flex-1 min-w-[280px]">
                  <CompactExplanation
                    explanation={currentResult.explanation || 'لا يوجد شرح متاح'}
                    solvingStrategy={currentResult.solvingStrategy}
                    tip={currentResult.tip}
                    isCorrect={currentResult.isCorrect}
                  />
                </div>
              )}
            </div>

            <AnswerOptions
              choices={currentQuestion.choices}
              selectedAnswer={selectedAnswer}
              correctAnswer={showResult ? currentResult?.correctAnswer : undefined}
              showResult={showResult}
              disabled={isCurrentAnswered || isSubmitting}
              isLoading={isSubmitting}
              onSelect={handleSelectAnswer}
            />

            {/* Answer Feedback */}
            {showResult && currentResult && (
              <div
                className={cn(
                  'mt-4 p-4 rounded-lg flex items-center gap-3',
                  currentResult.isCorrect
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                )}
              >
                {currentResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">إجابة صحيحة!</p>
                      <p className="text-sm text-green-600">أحسنت، استمر بهذا الأداء</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">إجابة خاطئة</p>
                      <p className="text-sm text-red-600">راجع الشرح أعلاه لفهم الحل الصحيح</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Batch Loading Indicator */}
          {isLoadingBatch && currentIndex >= questions.length - 3 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <p className="text-sm text-blue-800">جاري تحميل المزيد من الأسئلة...</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="flex-shrink-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 lg:hidden">
            {/* Top Row: Question Navigator */}
            <div className="w-full">
              <QuestionNavigator
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                answeredQuestions={answeredQuestions}
                onQuestionClick={handleQuestionClick}
              />
            </div>

            {/* Bottom Row: Navigation Buttons */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Previous */}
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                size="sm"
                className="gap-1 flex-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-xs">السابق</span>
              </Button>

              {/* Right: Next */}
              {showResult ? (
                <Button
                  onClick={handleContinue}
                  disabled={currentIndex >= questions.length - 1 && isLoadingBatch}
                  size="sm"
                  className="gap-1 flex-1 bg-primary hover:bg-primary/90"
                >
                  <span className="text-xs">{isLastQuestion ? 'النتائج' : 'التالي'}</span>
                  {!isLastQuestion && <ChevronLeft className="w-4 h-4" />}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={nextQuestion}
                  disabled={isLastQuestion}
                  size="sm"
                  className="gap-1 flex-1"
                >
                  <span className="text-xs">تخطي</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Layout - Single Row */}
          <div className="hidden lg:flex items-center gap-4 max-w-full">
            {/* Left: Previous Button */}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </Button>
            </div>

            {/* Center: Question Navigator */}
            <div className="flex-1 flex justify-center min-w-0 overflow-x-auto">
              <QuestionNavigator
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                answeredQuestions={answeredQuestions}
                onQuestionClick={handleQuestionClick}
              />
            </div>

            {/* Right: Next/Continue Button */}
            <div className="flex-shrink-0">
              {showResult ? (
                <Button
                  onClick={handleContinue}
                  disabled={currentIndex >= questions.length - 1 && isLoadingBatch}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <span>{isLastQuestion ? 'عرض النتائج' : 'التالي'}</span>
                  {!isLastQuestion && <ChevronLeft className="w-4 h-4" />}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={nextQuestion}
                  disabled={isLastQuestion}
                  className="gap-2"
                >
                  <span>تخطي</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">إنهاء الاختبار؟</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              هل أنت متأكد من إنهاء الاختبار؟
              {unansweredCount > 0 && (
                <span className="block mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  <strong>تنبيه:</strong> لديك {unansweredCount} سؤال لم تجب عليه
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="flex-1 sm:flex-none">متابعة الاختبار</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishExam}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
            >
              إنهاء وعرض النتائج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Confirmation Dialog */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-red-600">إلغاء الاختبار؟</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="block p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>تحذير:</strong> سيتم فقدان جميع الإجابات ولن تحصل على نتائج. هذا الإجراء لا يمكن التراجع عنه.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="flex-1 sm:flex-none">متابعة الاختبار</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAbandonExam}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              إلغاء الاختبار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-yellow-600">
              إيقاف الاختبار مؤقتاً؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-3">
                سيتم حفظ تقدمك والوقت المتبقي. يمكنك استئناف الاختبار لاحقاً من لوحة التحكم.
              </span>
              <span className="block text-sm text-gray-600">
                الوقت المتبقي: {Math.floor(remainingTime / 60)} دقيقة
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="flex-1 sm:flex-none" disabled={isPausing}>
              متابعة الاختبار
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePauseExam}
              className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600"
              disabled={isPausing}
            >
              {isPausing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'إيقاف مؤقت'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* T043: Generation Error Toast for 503 responses */}
      {batchError && (
        <GenerationError
          message={batchError}
          onRetry={retryPrefetch}
          onCancel={clearBatchError}
          isRetrying={isLoadingBatch}
          variant="toast"
        />
      )}
    </div>
  )
}

export default function ExamPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <ExamProvider sessionId={sessionId}>
      <ExamContent />
    </ExamProvider>
  )
}
