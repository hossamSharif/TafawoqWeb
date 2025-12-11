'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QuestionCard, AnswerOptions, ProgressIndicator, ExplanationPanel } from '@/components/exam'
import { PageLoadingSkeleton } from '@/components/shared'
import type { Question } from '@/types/question'
import { CATEGORY_LABELS } from '@/types/question'

interface PracticeData {
  questions: Omit<Question, 'answerIndex' | 'explanation'>[]
  _questionsWithAnswers: Question[]
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Load practice data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`practice_${sessionId}`)
    if (stored) {
      try {
        const data: PracticeData = JSON.parse(stored)
        setQuestions(data.questions)
        setFullQuestions(data._questionsWithAnswers || [])
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
      // Note: Questions won't be available from API after session creation
      // This is a fallback scenario
      if (data.session.status !== 'in_progress') {
        router.replace(`/practice/results/${sessionId}`)
        return
      }
      setError('تحتاج إلى بدء جلسة جديدة')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ في تحميل الجلسة')
    } finally {
      setIsLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentFullQuestion = fullQuestions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null

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
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)

    try {
      const response = await fetch(`/api/practice/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionIndex: currentQuestionIndex,
          selectedAnswer,
          timeSpentSeconds: timeSpent,
          questions: fullQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في حفظ الإجابة')
      }

      // Update local answers
      setAnswers((prev) => {
        const newMap = new Map(prev)
        newMap.set(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect: data.feedback.isCorrect,
          timeSpentSeconds: timeSpent,
        })
        return newMap
      })

      setShowExplanation(true)
    } catch (error) {
      console.error('Submit answer error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = {
    answered: answers.size,
    total: questions.length,
    percentage: questions.length > 0 ? Math.round((answers.size / questions.length) * 100) : 0,
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">تمرين مخصص</h1>
          <p className="text-gray-600 text-sm">
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Elapsed time */}
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-gray-600 text-sm ml-2">الوقت:</span>
            <span className="font-mono font-bold text-lg">{formatTime(elapsedTime)}</span>
          </div>

          {/* Abandon button */}
          <Button variant="outline" size="sm" onClick={handleAbandon}>
            إلغاء
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressIndicator
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          answeredQuestions={Array.from(answers.keys()).map((id) =>
            questions.findIndex(q => q.id === id)
          ).filter(i => i >= 0)}
          onQuestionClick={setCurrentQuestionIndex}
          compact
        />
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="p-6 mb-6">
          <QuestionCard
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            stem={currentQuestion.stem}
            passage={currentQuestion.passage}
            section={currentQuestion.section}
            topic={CATEGORY_LABELS[currentQuestion.topic]}
            difficulty={currentQuestion.difficulty}
          />

          <div className="mt-6">
            <AnswerOptions
              choices={currentQuestion.choices}
              selectedAnswer={selectedAnswer}
              onSelect={setSelectedAnswer}
              disabled={showExplanation}
              correctAnswer={showExplanation ? currentFullQuestion?.answerIndex : undefined}
              showResult={showExplanation}
            />
          </div>

          {/* Submit or feedback */}
          {!showExplanation ? (
            <div className="mt-6">
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الإجابة'}
              </Button>
            </div>
          ) : (
            currentFullQuestion && (
              <div className="mt-6">
                <ExplanationPanel
                  isCorrect={currentAnswer?.isCorrect || false}
                  explanation={currentFullQuestion.explanation}
                  solvingStrategy={currentFullQuestion.solvingStrategy}
                  tip={currentFullQuestion.tip}
                />
              </div>
            )
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          السؤال السابق
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            onClick={handleCompletePractice}
            disabled={isCompleting || answers.size < questions.length}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? 'جاري الإنهاء...' : 'إنهاء التمرين'}
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} disabled={!showExplanation}>
            السؤال التالي
          </Button>
        )}
      </div>

      {/* Question navigation grid */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">انتقال سريع</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => {
            const answer = answers.get(q.id)
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-10 w-10 rounded-lg font-medium text-sm transition-colors ${
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
              {questions.length - progress.answered}
            </div>
            <div className="text-sm text-gray-600">متبقية</div>
          </div>
        </div>
      </div>
    </div>
  )
}
