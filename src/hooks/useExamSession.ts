'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Question, QuestionCategory, DiagramData, QuestionType } from '@/types/question'
import { useInvalidateLimits } from './useSubscriptionLimits'

/**
 * Batch generation configuration
 */
const BATCH_SIZE = 10
const PREFETCH_THRESHOLD = 0.7 // Prefetch at 70% through current batch
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

export interface ExamQuestion {
  id: string
  index: number
  section: 'verbal' | 'quantitative'
  topic?: QuestionCategory
  difficulty?: 'easy' | 'medium' | 'hard'
  questionType?: QuestionType
  stem: string
  choices: [string, string, string, string]
  passage?: string
  diagram?: DiagramData
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
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused'
  track: 'scientific' | 'literary'
  totalQuestions: number
  questionsAnswered: number
  startTime: string
  endTime?: string
  timeSpentSeconds?: number
  timePausedSeconds?: number
  /** Timestamp when session was paused */
  pausedAt?: string
  /** Remaining exam time in seconds when paused */
  remainingTimeSeconds?: number
  verbalScore?: number
  quantitativeScore?: number
  overallScore?: number
  /** Number of batches generated so far */
  generatedBatches?: number
  /** Whether more questions need to be generated */
  needsMoreQuestions?: boolean
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
  /** Whether batch is currently being prefetched */
  isPrefetching: boolean
  /** Prefetch error (if any) */
  prefetchError: string | null
  /** Number of generated batches */
  generatedBatches: number
  /** Whether the exam is currently paused */
  isPaused: boolean
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
  /** Pause the exam */
  pauseExam: (remainingTimeSeconds: number, currentTimeSpent: number) => Promise<void>
  /** Resume a paused exam */
  resumeExam: (sessionId: string) => Promise<void>
  /** Complete the exam */
  completeExam: (timeSpent?: number) => Promise<void>
  /** Abandon the exam */
  abandonExam: () => Promise<void>
  /** Sync timer with server */
  syncTimer: (timeSpent: number) => Promise<void>
  /** Manually trigger prefetch for next batch */
  prefetchNextBatch: () => Promise<void>
}

/**
 * useExamSession - Hook for managing exam session state
 */
export function useExamSession(
  options: UseExamSessionOptions = {}
): UseExamSessionReturn {
  const { sessionId, onSessionLoad, onAnswerSubmit, onSessionComplete, onError } = options
  const invalidateLimits = useInvalidateLimits()

  const [session, setSession] = useState<ExamSessionData | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [answerResults, setAnswerResults] = useState<Map<number, AnswerResult>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefetch state
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [prefetchError, setPrefetchError] = useState<string | null>(null)
  const [generatedBatches, setGeneratedBatches] = useState(0)

  // Track which batches have been requested to prevent duplicate requests
  const prefetchedBatchesRef = useRef<Set<number>>(new Set())

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
      setGeneratedBatches(data.session.generatedBatches || 1)
      prefetchedBatchesRef.current = new Set([0])

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

      // If exam is paused, automatically resume it
      let sessionData = data
      let shouldUseResumedData = false

      if (data.session.status === 'paused') {
        console.log('[LoadSession] Exam is paused, automatically resuming...')
        const resumeResponse = await fetch(`/api/exams/${sid}/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const resumeData = await resumeResponse.json()

        if (!resumeResponse.ok) {
          // GRACEFUL FALLBACK: If error is "not paused", session might already be in progress
          // This handles race conditions where resume was called concurrently
          if (resumeResponse.status === 400 && resumeData.error?.includes('ليست متوقفة')) {
            console.warn('[LoadSession] Resume failed - session not paused. Falling back to original session data.')
            // Use original data from GET request
            sessionData = data
          } else {
            throw new Error(resumeData.error || 'فشل في استئناف الاختبار')
          }
        } else {
          // Resume succeeded, use resumed data
          sessionData = resumeData
          shouldUseResumedData = true
        }
      }

      // Unified load logic - use sessionData (either from resume or original GET)
      setSession(sessionData.session)
      setQuestions(sessionData.questions)

      // Build answered questions set
      const answered = new Set<number>()
      const results = new Map<number, AnswerResult>()

      if (sessionData.answers) {
        for (const ans of sessionData.answers) {
          answered.add(ans.questionIndex)
          results.set(ans.questionIndex, {
            questionIndex: ans.questionIndex,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect,
            correctAnswer: sessionData.questions[ans.questionIndex]?.answerIndex ?? 0,
          })
        }
      }

      setAnsweredQuestions(answered)
      setAnswerResults(results)

      // Set generated batches from session
      const loadedBatches = sessionData.session.generatedBatches || Math.ceil(sessionData.questions.length / BATCH_SIZE)
      setGeneratedBatches(loadedBatches)
      // Mark all loaded batches as already fetched
      prefetchedBatchesRef.current = new Set(
        Array.from({ length: loadedBatches }, (_, i) => i)
      )

      // Find first unanswered question
      const firstUnanswered = sessionData.questions.findIndex(
        (_: unknown, i: number) => !answered.has(i)
      )
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0)

      onSessionLoad?.(sessionData.session, sessionData.questions)
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

  // Pause exam
  const pauseExam = useCallback(async (remainingTimeSeconds: number, currentTimeSpent: number) => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/exams/${session.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remainingTimeSeconds,
          currentTimeSpent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إيقاف الاختبار')
      }

      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'paused',
              pausedAt: data.session.pausedAt,
              remainingTimeSeconds: data.session.remainingTimeSeconds,
              timeSpentSeconds: data.session.timeSpentSeconds,
            }
          : null
      )

      // Invalidate subscription limits cache to update counters immediately
      if (data.invalidateLimitsCache) {
        invalidateLimits()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [session, onError])

  // Resume a paused exam
  const resumeExam = useCallback(async (sid: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exams/${sid}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في استئناف الاختبار')
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

      // Set generated batches from session response
      const loadedBatches = data.session.generatedBatches || Math.ceil(data.questions.length / BATCH_SIZE)
      setGeneratedBatches(loadedBatches)
      // Mark all loaded batches as already fetched
      prefetchedBatchesRef.current = new Set(
        Array.from({ length: loadedBatches }, (_, i) => i)
      )

      // Find first unanswered question
      const firstUnanswered = data.questions.findIndex(
        (_: unknown, i: number) => !answered.has(i)
      )
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0)

      onSessionLoad?.(data.session, data.questions)

      // Invalidate subscription limits cache to update counters immediately
      if (data.invalidateLimitsCache) {
        invalidateLimits()
      }

      // If more questions need to be generated, trigger prefetch
      if (data.session.needsMoreQuestions) {
        console.log('[Resume] Session needs more questions, triggering prefetch')
        // Will be triggered by the effect when session is loaded
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [onSessionLoad, onError])

  // Computed: is the exam paused
  const isPaused = session?.status === 'paused'

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

  // T029: Prefetch next batch of questions
  const prefetchNextBatch = useCallback(async () => {
    if (!session) return

    const nextBatchIndex = generatedBatches

    // Check if already prefetching or already have this batch
    if (isPrefetching || prefetchedBatchesRef.current.has(nextBatchIndex)) {
      return
    }

    // Max 10 batches for exams
    if (nextBatchIndex >= 10) {
      return
    }

    // Mark this batch as being fetched
    prefetchedBatchesRef.current.add(nextBatchIndex)
    setIsPrefetching(true)
    setPrefetchError(null)

    // T030: Retry with exponential backoff
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`/api/exams/${session.id}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchIndex: nextBatchIndex }),
        })

        // Handle 409 Conflict (generation already in progress)
        if (response.status === 409) {
          console.log(`[Prefetch] Batch ${nextBatchIndex}: Generation in progress, retrying...`)
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
            continue
          }
          throw new Error('جاري توليد الأسئلة بالفعل')
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'فشل في تحميل الأسئلة')
        }

        // T031: Merge prefetched questions into local state without UI disruption
        setQuestions((prev) => {
          // Avoid duplicates by checking existing question IDs
          const existingIds = new Set(prev.map((q) => q.id))
          const newQuestions = data.questions.filter(
            (q: ExamQuestion) => !existingIds.has(q.id)
          )
          return [...prev, ...newQuestions]
        })

        setGeneratedBatches(data.meta.batchIndex + 1)

        console.log(`[Prefetch] Batch ${nextBatchIndex} loaded:`, {
          totalLoaded: data.meta.totalLoaded,
          cacheHit: data.meta.cacheHit,
        })

        setIsPrefetching(false)
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(`[Prefetch] Attempt ${attempt + 1} failed:`, err)

        // Wait before retry (except on last attempt)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
        }
      }
    }

    // All retries failed
    setIsPrefetching(false)
    setPrefetchError(lastError?.message || 'فشل في تحميل الأسئلة')
    // Remove from prefetched set so it can be retried
    prefetchedBatchesRef.current.delete(nextBatchIndex)
  }, [session, generatedBatches, isPrefetching])

  // T028: Auto-prefetch when reaching 70% threshold of current batch
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    if (isPrefetching || generatedBatches >= 10) return

    // Calculate position within current batch
    const currentBatch = Math.floor(currentIndex / BATCH_SIZE)
    const positionInBatch = currentIndex % BATCH_SIZE
    const threshold = Math.floor(BATCH_SIZE * PREFETCH_THRESHOLD) // 7 for batch size 10

    // Check if we've reached the threshold (e.g., question 7 of current batch)
    // AND we don't have the next batch yet
    if (positionInBatch >= threshold && generatedBatches <= currentBatch + 1) {
      console.log(`[Prefetch] Triggering prefetch at question ${currentIndex} (position ${positionInBatch} in batch ${currentBatch})`)
      prefetchNextBatch()
    }
  }, [currentIndex, session, generatedBatches, isPrefetching, prefetchNextBatch])

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
    isPrefetching,
    prefetchError,
    generatedBatches,
    isPaused,
    startExam,
    loadSession,
    submitAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    pauseExam,
    resumeExam,
    completeExam,
    abandonExam,
    syncTimer,
    prefetchNextBatch,
  }
}

export default useExamSession
