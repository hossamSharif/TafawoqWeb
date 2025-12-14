'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExamProvider, useExamContext } from '@/contexts/ExamContext'
import {
  QuestionCard,
  AnswerOptions,
  ExamTimer,
  ProgressIndicator,
  ExplanationPanel,
  GenerationError,
} from '@/components/exam'
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
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'

function ExamContent() {
  const router = useRouter()
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
  } = useExamContext()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [showAbandonDialog, setShowAbandonDialog] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Timer */}
            <ExamTimer
              totalSeconds={7200}
              initialElapsed={elapsedTime}
              onTick={handleTimerTick}
              onExpire={handleTimerExpire}
              warningThreshold={600}
              className="flex-shrink-0"
            />

            {/* Progress (compact) */}
            <ProgressIndicator
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              answeredQuestions={answeredQuestions}
              compact
              allowNavigation={false}
              className="flex-1 max-w-md"
            />

            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {isOffline && (
                <span className="flex items-center gap-1 text-yellow-600 text-sm">
                  <WifiOff className="w-4 h-4" />
                  غير متصل
                </span>
              )}
              {autoSaveQueueSize > 0 && !isOffline && (
                <span className="flex items-center gap-1 text-blue-600 text-sm">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري الحفظ
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAbandonDialog(true)}
                className="text-gray-500"
              >
                <Flag className="w-4 h-4 ml-1" />
                إنهاء
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Question Card */}
        <QuestionCard
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          stem={currentQuestion.stem}
          passage={currentQuestion.passage}
          section={currentQuestion.section}
          topic={currentQuestion.topic}
          difficulty={currentQuestion.difficulty}
          className="mb-6"
        />

        {/* Answer Options */}
        <AnswerOptions
          choices={currentQuestion.choices}
          selectedAnswer={selectedAnswer}
          correctAnswer={showResult ? currentResult?.correctAnswer : undefined}
          showResult={showResult}
          disabled={isCurrentAnswered || isSubmitting}
          onSelect={handleSelectAnswer}
          className="mb-6"
        />

        {/* Explanation (shown after answering) */}
        {showResult && currentResult && (
          <ExplanationPanel
            explanation={currentResult.explanation || 'لا يوجد شرح متاح'}
            solvingStrategy={currentResult.solvingStrategy}
            tip={currentResult.tip}
            isCorrect={currentResult.isCorrect}
            className="mb-6"
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>

          {showResult ? (
            <Button onClick={handleContinue} className="gap-2">
              {currentIndex < questions.length - 1 ? (
                <>
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </>
              ) : (
                'إنهاء الاختبار'
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1}
              className="gap-2"
            >
              تخطي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>

      {/* Question Navigator (bottom sheet) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <ProgressIndicator
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          answeredQuestions={answeredQuestions}
          onQuestionClick={goToQuestion}
          allowNavigation
        />
      </div>

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء الاختبار؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إنهاء الاختبار؟
              {questions.length - answeredQuestions.size > 0 && (
                <span className="block mt-2 text-yellow-600">
                  لديك {questions.length - answeredQuestions.size} سؤال لم تجب عليه
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>متابعة الاختبار</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishExam}>
              إنهاء وعرض النتائج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Confirmation Dialog */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الاختبار؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الاختبار؟ سيتم فقدان جميع الإجابات ولن تحصل
              على نتائج.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>متابعة الاختبار</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAbandonExam}
              className="bg-red-600 hover:bg-red-700"
            >
              إلغاء الاختبار
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
