'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Question, QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'

export interface PracticeSessionConfig {
  section: QuestionSection
  categories: QuestionCategory[]
  difficulty: QuestionDifficulty
  questionCount: number
}

export interface PracticeSession {
  id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  section: QuestionSection
  categories: QuestionCategory[]
  difficulty: QuestionDifficulty
  questionCount: number
  startedAt: string
  completedAt?: string
  timeSpentSeconds: number
}

export interface PracticeAnswer {
  questionId: string
  questionIndex: number
  selectedAnswer: number | null
  isCorrect: boolean
  timeSpentSeconds: number
}

export interface PracticeState {
  session: PracticeSession | null
  questions: Question[]
  answers: Map<string, PracticeAnswer>
  currentQuestionIndex: number
  isLoading: boolean
  error: string | null
  elapsedTime: number
}

export interface UsePracticeSessionReturn extends PracticeState {
  // Session management
  createSession: (config: PracticeSessionConfig) => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  abandonSession: () => Promise<void>
  completeSession: () => Promise<void>

  // Question navigation
  goToQuestion: (index: number) => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void

  // Answer management
  submitAnswer: (selectedAnswer: number | null) => Promise<void>

  // Progress tracking
  getProgress: () => { answered: number; total: number; percentage: number }
  getCorrectCount: () => number

  // Time tracking
  startTimer: () => void
  stopTimer: () => void
}

export function usePracticeSession(): UsePracticeSessionReturn {
  const [state, setState] = useState<PracticeState>({
    session: null,
    questions: [],
    answers: new Map(),
    currentQuestionIndex: 0,
    isLoading: false,
    error: null,
    elapsedTime: 0,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTimeRef = useRef<number>(Date.now())
  const fullQuestionsRef = useRef<Question[]>([]) // Store full questions with answers

  // Start elapsed time timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
    }, 1000)
  }, [])

  // Stop elapsed time timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Create new practice session
  const createSession = useCallback(async (config: PracticeSessionConfig) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء جلسة التمرين')
      }

      // Store full questions with answers for answer checking
      fullQuestionsRef.current = data._questionsWithAnswers || []

      setState((prev) => ({
        ...prev,
        session: data.session,
        questions: data.questions,
        answers: new Map(),
        currentQuestionIndex: 0,
        isLoading: false,
        elapsedTime: 0,
        error: null,
      }))

      questionStartTimeRef.current = Date.now()
      startTimer()
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
      }))
    }
  }, [startTimer])

  // Load existing practice session
  const loadSession = useCallback(async (sessionId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch session details
      const sessionResponse = await fetch(`/api/practice/${sessionId}`)
      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'فشل في تحميل جلسة التمرين')
      }

      // Fetch answers
      const answersResponse = await fetch(`/api/practice/${sessionId}/answers`)
      const answersData = await answersResponse.json()

      // Build answers map
      const answersMap = new Map<string, PracticeAnswer>()
      for (const answer of answersData.answers || []) {
        answersMap.set(answer.questionId, answer)
      }

      setState((prev) => ({
        ...prev,
        session: sessionData.session,
        answers: answersMap,
        isLoading: false,
        elapsedTime: sessionData.session.timeSpentSeconds || 0,
        error: null,
      }))

      if (sessionData.session.status === 'in_progress') {
        questionStartTimeRef.current = Date.now()
        startTimer()
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
      }))
    }
  }, [startTimer])

  // Abandon session
  const abandonSession = useCallback(async () => {
    if (!state.session) return

    stopTimer()

    try {
      const response = await fetch(`/api/practice/${state.session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'abandoned',
          timeSpentSeconds: state.elapsedTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في إلغاء الجلسة')
      }

      setState((prev) => ({
        ...prev,
        session: prev.session ? { ...prev.session, status: 'abandoned' } : null,
      }))
    } catch (error) {
      console.error('Abandon session error:', error)
    }
  }, [state.session, state.elapsedTime, stopTimer])

  // Complete session
  const completeSession = useCallback(async () => {
    if (!state.session) return

    stopTimer()

    try {
      const response = await fetch(`/api/practice/${state.session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          timeSpentSeconds: state.elapsedTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في إكمال الجلسة')
      }

      const data = await response.json()

      setState((prev) => ({
        ...prev,
        session: data.session,
      }))
    } catch (error) {
      console.error('Complete session error:', error)
      throw error
    }
  }, [state.session, state.elapsedTime, stopTimer])

  // Navigate to specific question
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      questionStartTimeRef.current = Date.now()
      setState((prev) => ({ ...prev, currentQuestionIndex: index }))
    }
  }, [state.questions.length])

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    goToQuestion(state.currentQuestionIndex + 1)
  }, [state.currentQuestionIndex, goToQuestion])

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    goToQuestion(state.currentQuestionIndex - 1)
  }, [state.currentQuestionIndex, goToQuestion])

  // Submit answer for current question
  const submitAnswer = useCallback(async (selectedAnswer: number | null) => {
    if (!state.session || state.questions.length === 0) return

    const currentQuestion = state.questions[state.currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)

    try {
      const response = await fetch(`/api/practice/${state.session.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionIndex: state.currentQuestionIndex,
          selectedAnswer,
          timeSpentSeconds: timeSpent,
          questions: fullQuestionsRef.current, // Send full questions for answer verification
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في حفظ الإجابة')
      }

      // Update local answers map
      setState((prev) => {
        const newAnswers = new Map(prev.answers)
        newAnswers.set(currentQuestion.id, {
          questionId: currentQuestion.id,
          questionIndex: state.currentQuestionIndex,
          selectedAnswer,
          isCorrect: data.feedback.isCorrect,
          timeSpentSeconds: timeSpent,
        })
        return { ...prev, answers: newAnswers }
      })

      // Reset question timer
      questionStartTimeRef.current = Date.now()

      return data
    } catch (error) {
      console.error('Submit answer error:', error)
      throw error
    }
  }, [state.session, state.questions, state.currentQuestionIndex])

  // Get progress stats
  const getProgress = useCallback(() => {
    const answered = state.answers.size
    const total = state.questions.length
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0
    return { answered, total, percentage }
  }, [state.answers.size, state.questions.length])

  // Get correct answer count
  const getCorrectCount = useCallback(() => {
    let count = 0
    state.answers.forEach((answer) => {
      if (answer.isCorrect) count++
    })
    return count
  }, [state.answers])

  return {
    ...state,
    createSession,
    loadSession,
    abandonSession,
    completeSession,
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    submitAnswer,
    getProgress,
    getCorrectCount,
    startTimer,
    stopTimer,
  }
}

export default usePracticeSession
