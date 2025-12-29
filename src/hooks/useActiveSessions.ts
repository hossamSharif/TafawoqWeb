'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ActiveSession } from '@/lib/sessions/limits'

export interface PauseLimits {
  canPauseExam: boolean
  canPausePractice: boolean
  pausedExamCount: number
  pausedPracticeCount: number
  pausedExamId: string | null
  pausedPracticeId: string | null
}

export interface SessionCounts {
  total: number
  inProgress: number
  paused: number
  exams: number
  practices: number
}

export interface UseActiveSessionsReturn {
  /** All active sessions (in_progress + paused) */
  sessions: ActiveSession[]
  /** Sessions that are in_progress */
  inProgressSessions: ActiveSession[]
  /** Sessions that are paused */
  pausedSessions: ActiveSession[]
  /** Exam sessions only */
  examSessions: ActiveSession[]
  /** Practice sessions only */
  practiceSessions: ActiveSession[]
  /** Pause limits for the user */
  limits: PauseLimits
  /** Session counts */
  counts: SessionCounts
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Refresh the sessions list */
  refresh: () => Promise<void>
}

/**
 * useActiveSessions - Hook for fetching and managing active exam/practice sessions
 */
export function useActiveSessions(): UseActiveSessionsReturn {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [inProgressSessions, setInProgressSessions] = useState<ActiveSession[]>([])
  const [pausedSessions, setPausedSessions] = useState<ActiveSession[]>([])
  const [examSessions, setExamSessions] = useState<ActiveSession[]>([])
  const [practiceSessions, setPracticeSessions] = useState<ActiveSession[]>([])
  const [limits, setLimits] = useState<PauseLimits>({
    canPauseExam: true,
    canPausePractice: true,
    pausedExamCount: 0,
    pausedPracticeCount: 0,
    pausedExamId: null,
    pausedPracticeId: null,
  })
  const [counts, setCounts] = useState<SessionCounts>({
    total: 0,
    inProgress: 0,
    paused: 0,
    exams: 0,
    practices: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/active')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب الجلسات')
      }

      setSessions(data.sessions.all)
      setInProgressSessions(data.sessions.inProgress)
      setPausedSessions(data.sessions.paused)
      setExamSessions(data.sessions.exams)
      setPracticeSessions(data.sessions.practices)
      setLimits(data.limits)
      setCounts(data.counts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    inProgressSessions,
    pausedSessions,
    examSessions,
    practiceSessions,
    limits,
    counts,
    isLoading,
    error,
    refresh: fetchSessions,
  }
}

export default useActiveSessions
