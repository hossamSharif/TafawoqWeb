'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { QuestionCard, AnswerOptions, ProgressIndicator, CompactExplanation } from '@/components/exam'
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
import { Pause, Loader2, AlertTriangle, Minimize2, Maximize2, ChevronRight, ChevronLeft, Flag, CheckCircle2, XCircle } from 'lucide-react'
import type { Question } from '@/types/question'
import { cn } from '@/lib/utils'

interface PracticeData {
  questions: Omit<Question, 'answerIndex' | 'explanation'>[]
  _questionsWithAnswers: Question[]
  targetQuestionCount?: number // Total questions the user requested
  generatedBatches?: number // Number of batches already generated
}

interface Answer {
  questionId: string
  selectedAnswer: number | null
  isCorrect: boolean
  timeSpentSeconds: number
}

export default function PracticeSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Omit<Question, 'answerIndex' | 'explanation'>[]>([])
  const [fullQuestions, setFullQuestions] = useState<Question[]>([])
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(0) // Total questions requested
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(true)
  const [isLoadingNextBatch, setIsLoadingNextBatch] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(1) // Start at batch 1 (batch 0 is initial)

  // Load practice data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`practice_${sessionId}`)
    if (stored) {
      try {
        const data: PracticeData = JSON.parse(stored)
        setQuestions(data.questions)
        setFullQuestions(data._questionsWithAnswers || [])
        // Set target question count (use stored value or fallback to loaded questions length)
        setTargetQuestionCount(data.targetQuestionCount || data.questions.length)
        // Sync currentBatch from stored generatedBatches
        if (data.generatedBatches !== undefined) {
          setCurrentBatch(data.generatedBatches)
        }
        setIsLoading(false)
      } catch {
        setError('فشل في تحميل بيانات التمرين')
        setIsLoading(false)
      }
    } else {
      // Try to load from API
      loadSessionFromAPI()
    }
  }, [sessionId])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadSessionFromAPI = async () => {
    try {
      const response = await fetch(`/api/practice/${sessionId}`)
      if (!response.ok) {
        throw new Error('لم يتم العثور على جلسة التمرين')
      }
      const data = await response.json()

      // Handle different session states
      if (data.session.status === 'paused') {
        console.log('[Practice] Session is paused, attempting auto-resume...')

        // Attempt to resume the paused session
        const resumeResponse = await fetch(`/api/practice/${sessionId}/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!resumeResponse.ok) {
          const resumeData = await resumeResponse.json()
          throw new Error(resumeData.error || 'فشل في استئناف التمرين')
        }

        const resumeData = await resumeResponse.json()

        // Update state with resumed session data
        if (resumeData.questions && resumeData.questions.length > 0) {
          setQuestions(resumeData.questions)
          setFullQuestions(resumeData._questionsWithAnswers || resumeData.questions)

          // Restore answers
          const answersMap = new Map<string, Answer>()
          if (resumeData.answers) {
            resumeData.answers.forEach((ans: any) => {
              const question = resumeData.questions[ans.questionIndex]
              if (question) {
                answersMap.set(question.id, {
                  questionId: question.id,
                  selectedAnswer: ans.selectedAnswer,
                  isCorrect: ans.isCorrect,
                  timeSpentSeconds: ans.timeSpentSeconds || 0,
                })
              }
            })
          }
          setAnswers(answersMap)

          // Set elapsed time
          setElapsedTime(resumeData.session.timeSpentSeconds || 0)

          // Sync currentBatch from session's generatedBatches
          const generatedBatches = resumeData.session.generatedBatches || 1
          setCurrentBatch(generatedBatches)

          // Update sessionStorage with resumed data
          const practiceData: PracticeData = {
            questions: resumeData.questions,
            _questionsWithAnswers: resumeData._questionsWithAnswers || resumeData.questions,
            targetQuestionCount: resumeData.session.targetQuestionCount,
            generatedBatches,
          }
          sessionStorage.setItem(`practice_${sessionId}`, JSON.stringify(practiceData))

          // Navigate to first unanswered question
          const firstUnanswered = resumeData.questions.findIndex(
            (_: any, i: number) => !answersMap.has(resumeData.questions[i]?.id)
          )
          if (firstUnanswered >= 0) {
            setCurrentQuestionIndex(firstUnanswered)
          }

          setIsLoading(false)
          return
        }
      } else if (data.session.status === 'completed') {
        router.replace(`/practice/results/${sessionId}`)
        return
      } else if (data.session.status === 'abandoned') {
        setError('تم إلغاء هذه الجلسة')
        setIsLoading(false)
        return
      } else if (data.session.status !== 'in_progress') {
        router.replace(`/practice/results/${sessionId}`)
        return
      }

      // If we reach here, session is in_progress but no questions available
      setError('تحتاج إلى بدء جلسة جديدة')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ في تحميل الجلسة')
    } finally {
      setIsLoading(false)
    }
  }

  // Load next batch of questions when needed
  const loadNextBatch = async (retryWithBatchIndex?: number): Promise<boolean> => {
    // Check if we need more questions
    if (questions.length >= targetQuestionCount) {
      console.log('[Practice] All questions already loaded')
      return false
    }

    setIsLoadingNextBatch(true)
    const batchToLoad = retryWithBatchIndex ?? currentBatch

    try {
      // First, trigger batch generation
      const response = await fetch(`/api/practice/${sessionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchIndex: batchToLoad }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[Practice] Failed to load next batch:', data.error)

        // Handle batch index mismatch error - sync with server's expected batch and retry once
        if (data.expectedBatchIndex !== undefined && retryWithBatchIndex === undefined) {
          console.log('[Practice] Syncing batch index and retrying:', data.expectedBatchIndex)
          setCurrentBatch(data.expectedBatchIndex)
          // Update sessionStorage with corrected batch count
          const stored = sessionStorage.getItem(`practice_${sessionId}`)
          if (stored) {
            try {
              const storedData = JSON.parse(stored)
              storedData.generatedBatches = data.expectedBatchIndex
              sessionStorage.setItem(`practice_${sessionId}`, JSON.stringify(storedData))
            } catch { /* ignore parse errors */ }
          }
          // Retry with the corrected batch index (only once)
          setIsLoadingNextBatch(false)
          return loadNextBatch(data.expectedBatchIndex)
        }
        return false
      }

      // Then fetch the updated session to get all questions with answers
      const sessionResponse = await fetch(`/api/practice/${sessionId}`)
      if (!sessionResponse.ok) {
        console.error('[Practice] Failed to fetch updated session')
        return false
      }

      const sessionData = await sessionResponse.json()

      // Update state with all questions from session
      if (sessionData.questions && sessionData.questions.length > 0) {
        setQuestions(sessionData.questions)
      }

      if (sessionData._questionsWithAnswers && sessionData._questionsWithAnswers.length > 0) {
        setFullQuestions(sessionData._questionsWithAnswers)
      }

      // Update batch counter (use the actual batch that was loaded)
      const newBatchCount = batchToLoad + 1
      setCurrentBatch(newBatchCount)

      // Update sessionStorage with all questions and batch count
      const updatedPracticeData: PracticeData = {
        questions: sessionData.questions || questions,
        _questionsWithAnswers: sessionData._questionsWithAnswers || fullQuestions,
        targetQuestionCount,
        generatedBatches: newBatchCount,
      }
      sessionStorage.setItem(`practice_${sessionId}`, JSON.stringify(updatedPracticeData))

      console.log('[Practice] Loaded batch', batchToLoad, '- New total:', sessionData.questions?.length || 0)
      return true
    } catch (error) {
      console.error('[Practice] Error loading next batch:', error)
      return false
    } finally {
      setIsLoadingNextBatch(false)
    }
  }

  // Check if more questions need to be loaded
  const needsMoreQuestions = targetQuestionCount > questions.length
  const isOnLastLoadedQuestion = currentQuestionIndex === questions.length - 1
  const isOnLastTargetQuestion = currentQuestionIndex === targetQuestionCount - 1

  const currentQuestion = questions[currentQuestionIndex]
  const currentFullQuestion = fullQuestions[currentQuestionIndex]
  // Use fallback ID pattern for consistent answer lookup
  const currentQuestionId = currentQuestion?.id || `practice_${sessionId}_q${currentQuestionIndex}`
  const currentAnswer = currentQuestion ? answers.get(currentQuestionId) : null

  // Update selected answer when navigating to a question with an existing answer
  useEffect(() => {
    if (currentAnswer) {
      setSelectedAnswer(currentAnswer.selectedAnswer)
      setShowExplanation(true)
    } else {
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
    setQuestionStartTime(Date.now())
  }, [currentQuestionIndex, currentAnswer])

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null) // Clear previous errors
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)

    try {
      const response = await fetch(`/api/practice/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestionId, // Use the computed ID with fallback
          questionIndex: currentQuestionIndex,
          selectedAnswer,
          timeSpentSeconds: timeSpent,
          questions: fullQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Special handling for session status errors
        if (response.status === 400 && data.error.includes('منتهية')) {
          setSubmitError(
            'انتهت صلاحية الجلسة. يرجى العودة إلى لوحة التحكم وإعادة المحاولة.'
          )
        } else {
          setSubmitError(data.error || 'فشل في حفظ الإجابة')
        }
        throw new Error(data.error || 'فشل في حفظ الإجابة')
      }

      // Update local answers
      setAnswers((prev) => {
        const newMap = new Map(prev)
        newMap.set(currentQuestionId, {
          questionId: currentQuestionId,
          selectedAnswer,
          isCorrect: data.feedback.isCorrect,
          timeSpentSeconds: timeSpent,
        })
        return newMap
      })

      setShowExplanation(true)
      setSubmitError(null) // Clear error on success
    } catch (error) {
      console.error('Submit answer error:', error)
      // Error already set in state above
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = async () => {
    // If we're on the last loaded question and need more, load them first
    if (isOnLastLoadedQuestion && needsMoreQuestions) {
      const loaded = await loadNextBatch()
      if (loaded) {
        // Navigate to the next question after loading
        setCurrentQuestionIndex((prev) => prev + 1)
      }
      return
    }

    // Normal navigation within loaded questions
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleCompletePractice = async () => {
    setIsCompleting(true)
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          timeSpentSeconds: elapsedTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في إكمال التمرين')
      }

      // Clear stored data
      sessionStorage.removeItem(`practice_${sessionId}`)

      // Navigate to results
      router.push(`/practice/results/${sessionId}`)
    } catch (error) {
      console.error('Complete practice error:', error)
      setIsCompleting(false)
    }
  }

  const handleAbandon = async () => {
    if (!confirm('هل أنت متأكد من إلغاء التمرين؟')) return

    try {
      await fetch(`/api/practice/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'abandoned',
          timeSpentSeconds: elapsedTime,
        }),
      })

      sessionStorage.removeItem(`practice_${sessionId}`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Abandon error:', error)
    }
  }

  const handlePause = async () => {
    setIsPausing(true)
    try {
      const response = await fetch(`/api/practice/${sessionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: elapsedTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في إيقاف التمرين')
      }

      // Keep session data in sessionStorage for resume
      setShowPauseDialog(false)
      router.push('/dashboard')
    } catch (error) {
      console.error('Pause error:', error)
    } finally {
      setIsPausing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Use targetQuestionCount for progress calculation (shows progress towards full target)
  const totalForProgress = targetQuestionCount || questions.length
  const progress = {
    answered: answers.size,
    total: totalForProgress,
    percentage: totalForProgress > 0 ? Math.round((answers.size / totalForProgress) * 100) : 0,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageLoadingSkeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/practice/new')}>إنشاء تمرين جديد</Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50",
        isFullScreen && "fixed inset-0 z-[9999] overflow-y-auto"
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

      <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">تمرين مخصص</h1>
            <p className="text-gray-600 text-sm">
              السؤال {currentQuestionIndex + 1} من {targetQuestionCount || questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Elapsed time */}
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <span className="text-gray-600 text-sm ml-2">الوقت:</span>
              <span className="font-mono font-bold text-lg">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressIndicator
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            answeredQuestions={Array.from(answers.keys()).map((id) =>
              questions.findIndex((q, idx) => (q.id || `practice_${sessionId}_q${idx}`) === id)
            ).filter(i => i >= 0)}
            onQuestionClick={setCurrentQuestionIndex}
            compact
          />
        </div>

      {/* Question Card */}
      {currentQuestion && (
        <>
          <QuestionCard
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={targetQuestionCount || questions.length}
            stem={currentQuestion.stem}
            passage={currentQuestion.passage}
            section={currentQuestion.section}
            topic={currentQuestion.topic}
            difficulty={currentQuestion.difficulty}
            diagram={currentQuestion.diagram}
            questionType={currentQuestion.questionType}
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
              {showExplanation && currentFullQuestion && (
                <div className="flex-1 min-w-[280px]">
                  <CompactExplanation
                    explanation={currentFullQuestion.explanation || 'لا يوجد شرح متاح'}
                    solvingStrategy={currentFullQuestion.solvingStrategy}
                    tip={currentFullQuestion.tip}
                    isCorrect={currentAnswer?.isCorrect}
                  />
                </div>
              )}
            </div>

            <AnswerOptions
              choices={currentQuestion.choices}
              selectedAnswer={selectedAnswer}
              onSelect={setSelectedAnswer}
              disabled={showExplanation}
              isLoading={isSubmitting}
              correctAnswer={showExplanation ? currentFullQuestion?.answerIndex : undefined}
              showResult={showExplanation}
            />

            {/* Error Display */}
            {submitError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>خطأ في الإجابة</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{submitError}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/dashboard')}
                    >
                      العودة للوحة التحكم
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSubmitError(null)}
                    >
                      إغلاق
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Answer Feedback */}
            {showExplanation && currentAnswer && (
              <div
                className={cn(
                  'mt-4 p-4 rounded-lg flex items-center gap-3',
                  currentAnswer.isCorrect
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                )}
              >
                {currentAnswer.isCorrect ? (
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

            {/* Submit Button (before answering) */}
            {!showExplanation && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الإجابة'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

        {/* Stats */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{progress.answered}</div>
              <div className="text-sm text-gray-600">تم الإجابة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Array.from(answers.values()).filter((a) => a.isCorrect).length}
              </div>
              <div className="text-sm text-gray-600">صحيحة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Array.from(answers.values()).filter((a) => !a.isCorrect).length}
              </div>
              <div className="text-sm text-gray-600">خاطئة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {totalForProgress - progress.answered}
              </div>
              <div className="text-sm text-gray-600">متبقية</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 lg:hidden">
            {/* Top Row: Question Navigator Grid */}
            <div className="w-full">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {questions.map((q, index) => {
                  const questionId = q.id || `q_${index}`
                  const answer = answers.get(questionId)
                  return (
                    <button
                      key={questionId}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`h-8 w-8 rounded-lg font-medium text-xs transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-primary text-white'
                          : answer
                            ? answer.isCorrect
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Previous */}
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                size="sm"
                className="gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-xs">السابق</span>
              </Button>

              {/* Center: Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPauseDialog(true)}
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 text-xs"
                >
                  <Pause className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAbandon}
                  className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>

              {/* Right: Next/Complete */}
              {isOnLastLoadedQuestion && !needsMoreQuestions && questions.length >= targetQuestionCount ? (
                <Button
                  onClick={handleCompletePractice}
                  disabled={isCompleting || answers.size < questions.length}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  {isCompleting ? 'جاري...' : 'إنهاء'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!showExplanation || isLoadingNextBatch}
                  size="sm"
                  className="gap-1"
                >
                  {isLoadingNextBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">تحميل...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs">التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Layout - Single Row */}
          <div className="hidden lg:flex items-center gap-3 max-w-full">
            {/* Left: Previous Button */}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </Button>
            </div>

            {/* Center: Question Navigator Grid */}
            <div className="flex-1 flex justify-center min-w-0 overflow-x-auto">
              <div className="flex flex-wrap gap-2 max-w-3xl">
                {questions.map((q, index) => {
                  const questionId = q.id || `q_${index}`
                  const answer = answers.get(questionId)
                  return (
                    <button
                      key={questionId}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`h-10 w-10 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${
                        index === currentQuestionIndex
                          ? 'bg-primary text-white'
                          : answer
                            ? answer.isCorrect
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPauseDialog(true)}
                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
              >
                <Pause className="w-4 h-4 ml-1" />
                <span className="hidden xl:inline">إيقاف مؤقت</span>
                <span className="xl:hidden">إيقاف</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAbandon}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Flag className="w-4 h-4 ml-1" />
                <span className="hidden xl:inline">إلغاء</span>
              </Button>

              {/* Next/Complete Button */}
              {isOnLastLoadedQuestion && !needsMoreQuestions && questions.length >= targetQuestionCount ? (
                <Button
                  onClick={handleCompletePractice}
                  disabled={isCompleting || answers.size < questions.length}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompleting ? 'جاري...' : 'إنهاء'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!showExplanation || isLoadingNextBatch}
                  className="gap-2"
                >
                  {isLoadingNextBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>تحميل...</span>
                    </>
                  ) : (
                    <>
                      <span>التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-yellow-600">
              إيقاف التمرين مؤقتاً؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-3">
                سيتم حفظ تقدمك. يمكنك استئناف التمرين لاحقاً من لوحة التحكم.
              </span>
              <span className="block text-sm text-gray-600">
                التقدم: {progress.answered} من {questions.length} سؤال ({progress.percentage}%)
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="flex-1 sm:flex-none" disabled={isPausing}>
              متابعة التمرين
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePause}
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
    </div>
  )
}
