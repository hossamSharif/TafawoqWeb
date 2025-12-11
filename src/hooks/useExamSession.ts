'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Question } from '@/types/question'

export interface ExamQuestion {
  id: string
  index: number
  section: 'verbal' | 'quantitative'
  topic?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  questionType: string
  stem: string
  choices: [string, string, string, string]
  passage?: string
  // Answer info (revealed after answering)
  answerIndex?: number
  selectedAnswer?: number | null
  isCorrect?: boolean
  explanation?: string
  solvingStrategy?: string
  tip?: string
}

export interface ExamSessionData {
  id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  track: 'scientific' | 'literary'
  totalQuestions: number
  questionsAnswered: number
  startTime: string
  endTime?: string
  timeSpentSeconds?: number
  timePausedSeconds?: number
  verbalScore?: number
  quantitativeScore?: number
  overallScore?: number
}

export interface AnswerResult {
  questionIndex: number
  selectedAnswer: number
  isCorrect: boolean
  correctAnswer: number
  explanation?: string
  tip?: string
  solvingStrategy?: string
}

export interface UseExamSessionOptions {
  /** Session ID (required if resuming) */
  sessionId?: string
  /** Called when session is loaded */
  onSessionLoad?: (session: ExamSessionData, questions: ExamQuestion[]) => void
  /** Called when answer is submitted */
  onAnswerSubmit?: (result: AnswerResult) => void
  /** Called when session is completed */
  onSessionComplete?: (session: ExamSessionData) => void
  /** Called on error */
  onError?: (error: string) => void
}

export interface UseExamSessionReturn {
  /** Current session data */
  session: ExamSessionData | null
  /** All questions */
  questions: ExamQuestion[]
  /** Current question index */
  currentIndex: number
  /** Current question */
  currentQuestion: ExamQuestion | null
  /** Set of answered question indexes */
  answeredQuestions: Set<number>
  /** Map of question index to answer result */
  answerResults: Map<number, AnswerResult>
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Start a new exam */
  startExam: () => Promise<void>
  /** Load existing session */
  loadSession: (sessionId: string) => Promise<void>
  /** Submit an answer */
  submitAnswer: (questionIndex: number, selectedAnswer: number, timeSpent?: number) => Promise<AnswerResult | null>
  /** Navigate to question */
  goToQuestion: (index: number) => void
  /** Go to next question */
  nextQuestion: () => void
  /** Go to previous question */
  prevQuestion: () => void
  /** Complete the exam */
  completeExam: (timeSpent?: number) => Promise<void>
  /** Abandon the exam */
  abandonExam: () => Promise<void>
  /** Sync timer with server */
  syncTimer: (timeSpent: number) => Promise<void>
}

/**
 * useExamSession - Hook for managing exam session state
 */
export function useExamSession(
  options: UseExamSessionOptions = {}
): UseExamSessionReturn {
  const { sessionId, onSessionLoad, onAnswerSubmit, onSessionComplete, onError } = options

  const [session, setSession] = useState<ExamSessionData | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [answerResults, setAnswerResults] = useState<Map<number, AnswerResult>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = questions[currentIndex] || null

  // Start a new exam
  const startExam = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء الاختبار')
      }

      setSession(data.session)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnsweredQuestions(new Set())
      setAnswerResults(new Map())

      onSessionLoad?.(data.session, data.questions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [onSessionLoad, onError])

  // Load existing session
  const loadSession = useCallback(async (sid: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exams/${sid}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في تحميل الاختبار')
      }

      setSession(data.session)
      setQuestions(data.questions)

      // Build answered questions set
      const answered = new Set<number>()
      const results = new Map<number, AnswerResult>()

      if (data.answers) {
        for (const ans of data.answers) {
          answered.add(ans.questionIndex)
          results.set(ans.questionIndex, {
            questionIndex: ans.questionIndex,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect,
            correctAnswer: data.questions[ans.questionIndex]?.answerIndex ?? 0,
          })
        }
      }

      setAnsweredQuestions(answered)
      setAnswerResults(results)

      // Find first unanswered question
      const firstUnanswered = data.questions.findIndex(
        (_: unknown, i: number) => !answered.has(i)
      )
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0)

      onSessionLoad?.(data.session, data.questions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [onSessionLoad, onError])

  // Submit answer
  const submitAnswer = useCallback(
    async (
      questionIndex: number,
      selectedAnswer: number,
      timeSpent?: number
    ): Promise<AnswerResult | null> => {
      if (!session) return null

      try {
        const response = await fetch(`/api/exams/${session.id}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIndex,
            selectedAnswer,
            timeSpentSeconds: timeSpent,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'فشل في حفظ الإجابة')
        }

        const result: AnswerResult = {
          questionIndex: data.questionIndex,
          selectedAnswer: data.selectedAnswer,
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          tip: data.tip,
          solvingStrategy: data.solvingStrategy,
        }

        // Update state
        setAnsweredQuestions((prev) => new Set(prev).add(questionIndex))
        setAnswerResults((prev) => new Map(prev).set(questionIndex, result))

        // Update question with answer info
        setQuestions((prev) =>
          prev.map((q, i) =>
            i === questionIndex
              ? {
                  ...q,
                  selectedAnswer,
                  isCorrect: result.isCorrect,
                  answerIndex: result.correctAnswer,
                  explanation: result.explanation,
                  tip: result.tip,
                  solvingStrategy: result.solvingStrategy,
                }
              : q
          )
        )

        onAnswerSubmit?.(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'حدث خطأ'
        setError(message)
        onError?.(message)
        return null
      }
    },
    [session, onAnswerSubmit, onError]
  )

  // Navigation
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }, [questions.length])

  const nextQuestion = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }, [questions.length])

  const prevQuestion = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Complete exam
  const completeExam = useCallback(async (timeSpent?: number) => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/exams/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          timeSpentSeconds: timeSpent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنهاء الاختبار')
      }

      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              endTime: data.session.endTime,
              verbalScore: data.session.verbalScore,
              quantitativeScore: data.session.quantitativeScore,
              overallScore: data.session.overallScore,
            }
          : null
      )

      onSessionComplete?.(data.session)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [session, onSessionComplete, onError])

  // Abandon exam
  const abandonExam = useCallback(async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/exams/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abandon' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إلغاء الاختبار')
      }

      setSession((prev) =>
        prev ? { ...prev, status: 'abandoned' } : null
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [session, onError])

  // Sync timer
  const syncTimer = useCallback(async (timeSpent: number) => {
    if (!session) return

    try {
      await fetch(`/api/exams/${session.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          currentTimeSpent: timeSpent,
        }),
      })
    } catch (err) {
      console.error('Timer sync failed:', err)
    }
  }, [session])

  // Auto-load session if ID provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId, loadSession])

  return {
    session,
    questions,
    currentIndex,
    currentQuestion,
    answeredQuestions,
    answerResults,
    isLoading,
    error,
    startExam,
    loadSession,
    submitAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    completeExam,
    abandonExam,
    syncTimer,
  }
}

export default useExamSession
