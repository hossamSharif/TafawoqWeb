'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export interface QueuedAnswer {
  questionIndex: number
  selectedAnswer: number
  timeSpentSeconds?: number
  timestamp: number
}

export interface UseAutoSaveOptions {
  /** Session ID */
  sessionId: string
  /** Debounce interval in ms (default 2000) */
  debounceMs?: number
  /** Max queue size before force flush (default 5) */
  maxQueueSize?: number
  /** Called when save succeeds */
  onSaveSuccess?: (saved: QueuedAnswer[]) => void
  /** Called when save fails */
  onSaveError?: (error: string, failed: QueuedAnswer[]) => void
  /** Whether auto-save is enabled */
  enabled?: boolean
}

export interface UseAutoSaveReturn {
  /** Queue an answer for saving */
  queueAnswer: (answer: Omit<QueuedAnswer, 'timestamp'>) => void
  /** Force flush the queue */
  flushQueue: () => Promise<void>
  /** Current queue size */
  queueSize: number
  /** Whether currently saving */
  isSaving: boolean
  /** Last save timestamp */
  lastSaved: Date | null
  /** Offline mode indicator */
  isOffline: boolean
}

/**
 * useAutoSave - Auto-saves answers with offline queue support
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    sessionId,
    debounceMs = 2000,
    maxQueueSize = 5,
    onSaveSuccess,
    onSaveError,
    enabled = true,
  } = options

  const [queue, setQueue] = useState<QueuedAnswer[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const queueRef = useRef<QueuedAnswer[]>([])

  // Keep ref in sync with state
  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Flush queue to server
  const flushQueue = useCallback(async () => {
    const currentQueue = queueRef.current
    if (currentQueue.length === 0 || isSaving) return

    // Don't try to save when offline
    if (isOffline) {
      console.log('Offline - answers queued for later')
      return
    }

    setIsSaving(true)

    try {
      // Process queue items one by one (or batch if API supports)
      const savedAnswers: QueuedAnswer[] = []
      const failedAnswers: QueuedAnswer[] = []

      for (const answer of currentQueue) {
        try {
          const response = await fetch(`/api/exams/${sessionId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionIndex: answer.questionIndex,
              selectedAnswer: answer.selectedAnswer,
              timeSpentSeconds: answer.timeSpentSeconds,
            }),
          })

          if (response.ok) {
            savedAnswers.push(answer)
          } else {
            failedAnswers.push(answer)
          }
        } catch {
          failedAnswers.push(answer)
        }
      }

      // Remove saved items from queue
      if (savedAnswers.length > 0) {
        setQueue((prev) =>
          prev.filter(
            (q) =>
              !savedAnswers.some(
                (s) =>
                  s.questionIndex === q.questionIndex &&
                  s.timestamp === q.timestamp
              )
          )
        )
        setLastSaved(new Date())
        onSaveSuccess?.(savedAnswers)
      }

      // Report failures
      if (failedAnswers.length > 0) {
        onSaveError?.('بعض الإجابات لم تُحفظ', failedAnswers)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ في الحفظ'
      onSaveError?.(message, currentQueue)
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, isSaving, isOffline, onSaveSuccess, onSaveError])

  // Queue an answer
  const queueAnswer = useCallback(
    (answer: Omit<QueuedAnswer, 'timestamp'>) => {
      if (!enabled) return

      const newAnswer: QueuedAnswer = {
        ...answer,
        timestamp: Date.now(),
      }

      setQueue((prev) => {
        // Replace existing answer for same question
        const filtered = prev.filter(
          (q) => q.questionIndex !== answer.questionIndex
        )
        return [...filtered, newAnswer]
      })

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Check if queue is full
      if (queueRef.current.length + 1 >= maxQueueSize) {
        // Flush immediately
        flushQueue()
      } else {
        // Debounce flush
        timeoutRef.current = setTimeout(() => {
          flushQueue()
        }, debounceMs)
      }
    },
    [enabled, maxQueueSize, debounceMs, flushQueue]
  )

  // Flush when coming back online
  useEffect(() => {
    if (!isOffline && queue.length > 0) {
      flushQueue()
    }
  }, [isOffline, queue.length, flushQueue])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Final flush
      if (queueRef.current.length > 0 && !isOffline) {
        // Can't await in cleanup, but we try
        fetch(`/api/exams/${sessionId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queueRef.current[0]),
          keepalive: true, // Allow request to complete after page unload
        }).catch(() => {})
      }
    }
  }, [sessionId, isOffline])

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (queueRef.current.length > 0) {
        // Use sendBeacon for guaranteed delivery
        const data = JSON.stringify({
          answers: queueRef.current,
        })
        navigator.sendBeacon?.(`/api/exams/${sessionId}/answers/batch`, data)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId])

  return {
    queueAnswer,
    flushQueue,
    queueSize: queue.length,
    isSaving,
    lastSaved,
    isOffline,
  }
}

export default useAutoSave
