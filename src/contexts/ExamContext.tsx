'use client'

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import {
  useExamSession,
  type UseExamSessionReturn,
  type ExamSessionData,
  type ExamQuestion,
  type AnswerResult,
} from '@/hooks/useExamSession'
import { useAutoSave } from '@/hooks/useAutoSave'

export interface ExamContextValue extends UseExamSessionReturn {
  /** Elapsed time in seconds */
  elapsedTime: number
  /** Update elapsed time */
  setElapsedTime: (time: number) => void
  /** Whether timer is running */
  isTimerRunning: boolean
  /** Start/stop timer */
  setTimerRunning: (running: boolean) => void
  /** Auto-save queue size */
  autoSaveQueueSize: number
  /** Whether auto-save is working */
  isAutoSaving: boolean
  /** Whether offline */
  isOffline: boolean
  /** Submit answer with auto-save */
  submitAnswerWithAutoSave: (
    questionIndex: number,
    selectedAnswer: number
  ) => Promise<AnswerResult | null>
  /** Whether batch is currently loading (prefetching) */
  isLoadingBatch: boolean
  /** Error from batch loading */
  batchError: string | null
  /** Number of generated batches */
  generatedBatches: number
  /** Manually retry prefetch */
  retryPrefetch: () => Promise<void>
  /** Clear batch error */
  clearBatchError: () => void
}

const ExamContext = createContext<ExamContextValue | null>(null)

export interface ExamProviderProps {
  children: ReactNode
  /** Initial session ID for resuming */
  sessionId?: string
  /** Called when exam is completed */
  onComplete?: (session: ExamSessionData) => void
  /** Called on error */
  onError?: (error: string) => void
}

/**
 * ExamProvider - Provides exam state throughout the app
 */
export function ExamProvider({
  children,
  sessionId,
  onComplete,
  onError,
}: ExamProviderProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setTimerRunning] = useState(false)
  const questionStartTimeRef = useRef<number>(Date.now())

  // Batch loading state - synced from examSession hook
  const [batchErrorDismissed, setBatchErrorDismissed] = useState(false)

  // Core exam session hook
  const examSession = useExamSession({
    sessionId,
    onSessionLoad: (session) => {
      setElapsedTime(session.timeSpentSeconds || 0)
      setTimerRunning(session.status === 'in_progress')
      setBatchErrorDismissed(false)
    },
    onSessionComplete: (session) => {
      setTimerRunning(false)
      onComplete?.(session)
    },
    onError,
  })

  // Auto-save hook
  const autoSave = useAutoSave({
    sessionId: examSession.session?.id || '',
    enabled: !!examSession.session && examSession.session.status === 'in_progress',
    onSaveError: (error) => {
      console.warn('Auto-save failed:', error)
    },
  })

  // Submit answer with auto-save integration
  const submitAnswerWithAutoSave = useCallback(
    async (
      questionIndex: number,
      selectedAnswer: number
    ): Promise<AnswerResult | null> => {
      // Calculate time spent on this question
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)

      // Queue for auto-save (backup)
      autoSave.queueAnswer({
        questionIndex,
        selectedAnswer,
        timeSpentSeconds: timeSpent,
      })

      // Submit immediately
      const result = await examSession.submitAnswer(
        questionIndex,
        selectedAnswer,
        timeSpent
      )

      // Reset question timer
      questionStartTimeRef.current = Date.now()

      return result
    },
    [examSession, autoSave]
  )

  // Reset question timer when navigating
  const goToQuestion = useCallback(
    (index: number) => {
      questionStartTimeRef.current = Date.now()
      examSession.goToQuestion(index)
    },
    [examSession]
  )

  const nextQuestion = useCallback(() => {
    questionStartTimeRef.current = Date.now()
    examSession.nextQuestion()
  }, [examSession])

  const prevQuestion = useCallback(() => {
    questionStartTimeRef.current = Date.now()
    examSession.prevQuestion()
  }, [examSession])

  // Complete exam with final time sync
  const completeExam = useCallback(async () => {
    // Flush any pending auto-saves
    await autoSave.flushQueue()
    // Sync final time
    await examSession.syncTimer(elapsedTime)
    // Complete
    await examSession.completeExam(elapsedTime)
  }, [autoSave, examSession, elapsedTime])

  // Retry prefetch callback
  const retryPrefetch = useCallback(async () => {
    setBatchErrorDismissed(false)
    await examSession.prefetchNextBatch()
  }, [examSession])

  // Clear batch error
  const clearBatchError = useCallback(() => {
    setBatchErrorDismissed(true)
  }, [])

  const value: ExamContextValue = {
    ...examSession,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    completeExam,
    elapsedTime,
    setElapsedTime,
    isTimerRunning,
    setTimerRunning,
    autoSaveQueueSize: autoSave.queueSize,
    isAutoSaving: autoSave.isSaving,
    isOffline: autoSave.isOffline,
    submitAnswerWithAutoSave,
    // Batch loading state from hook
    isLoadingBatch: examSession.isPrefetching,
    batchError: batchErrorDismissed ? null : examSession.prefetchError,
    generatedBatches: examSession.generatedBatches,
    retryPrefetch,
    clearBatchError,
  }

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}

/**
 * useExamContext - Access exam context
 */
export function useExamContext(): ExamContextValue {
  const context = useContext(ExamContext)
  if (!context) {
    throw new Error('useExamContext must be used within an ExamProvider')
  }
  return context
}

export default ExamContext
