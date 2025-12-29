'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Clock, Pause, Play, AlertTriangle, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export interface ExamTimerProps {
  /** Total exam duration in seconds (default 7200 = 120 minutes) */
  totalSeconds?: number
  /** Initial elapsed time in seconds */
  initialElapsed?: number
  /** Initial remaining time in seconds (takes precedence over initialElapsed for resumed sessions) */
  initialRemaining?: number
  /** Whether timer is paused */
  isPaused?: boolean
  /** Called when timer updates (every second) */
  onTick?: (elapsedSeconds: number, remainingSeconds: number) => void
  /** Called when time runs out */
  onExpire?: () => void
  /** Called when pause state changes */
  onPauseChange?: (isPaused: boolean) => void
  /** Called when user clicks pause button (passes remaining seconds) */
  onPause?: (remainingSeconds: number) => void
  /** Allow pausing (some exams don't allow it) */
  allowPause?: boolean
  /** Show warning when time is low */
  warningThreshold?: number
  /** Pause timer on network disconnect */
  pauseOnDisconnect?: boolean
  /** Called when network status changes */
  onNetworkStatusChange?: (isOnline: boolean, disconnectedSeconds: number) => void
  className?: string
}

/**
 * ExamTimer - 120-minute countdown timer with pause support
 * Automatically pauses on network disconnect to preserve fairness
 */
export function ExamTimer({
  totalSeconds = 7200, // 120 minutes
  initialElapsed = 0,
  initialRemaining,
  isPaused: controlledPaused,
  onTick,
  onExpire,
  onPauseChange,
  onPause,
  allowPause = false,
  warningThreshold = 600, // 10 minutes
  pauseOnDisconnect = true,
  onNetworkStatusChange,
  className,
}: ExamTimerProps) {
  // Calculate initial elapsed from initialRemaining if provided (for resumed sessions)
  const computedInitialElapsed = initialRemaining !== undefined
    ? totalSeconds - initialRemaining
    : initialElapsed
  const [elapsed, setElapsed] = useState(computedInitialElapsed)
  const [internalPaused, setInternalPaused] = useState(false)
  const [networkPaused, setNetworkPaused] = useState(false)
  const lastTickRef = useRef<number>(Date.now())
  const expiredRef = useRef(false)

  // Network status detection
  const { isConnected, disconnectedSeconds, isOnline } = useNetworkStatus({
    enablePolling: pauseOnDisconnect,
    onDisconnect: () => {
      if (pauseOnDisconnect) {
        setNetworkPaused(true)
        onNetworkStatusChange?.(false, 0)
      }
    },
    onReconnect: (seconds) => {
      if (pauseOnDisconnect) {
        setNetworkPaused(false)
        onNetworkStatusChange?.(true, seconds)
      }
    },
  })

  const isPaused = controlledPaused ?? internalPaused ?? networkPaused
  const remaining = Math.max(0, totalSeconds - elapsed)
  const isWarning = remaining <= warningThreshold && remaining > 0
  const isExpired = remaining <= 0

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Timer logic - tick elapsed time
  useEffect(() => {
    if (isPaused || isExpired) return

    const interval = setInterval(() => {
      const now = Date.now()
      const delta = Math.floor((now - lastTickRef.current) / 1000)

      if (delta >= 1) {
        lastTickRef.current = now
        setElapsed((prev) => prev + 1)
      }
    }, 100) // Check more frequently for accuracy

    return () => clearInterval(interval)
  }, [isPaused, isExpired])

  // Call onTick and check expiry in separate effect to avoid setState during render
  useEffect(() => {
    const newRemaining = Math.max(0, totalSeconds - elapsed)

    // Call onTick callback
    onTick?.(elapsed, newRemaining)

    // Check expiry
    if (newRemaining <= 0 && !expiredRef.current) {
      expiredRef.current = true
      onExpire?.()
    }
  }, [elapsed, totalSeconds, onTick, onExpire])

  // Handle pause toggle
  const togglePause = useCallback(() => {
    if (!allowPause) return

    const newPaused = !isPaused
    setInternalPaused(newPaused)
    onPauseChange?.(newPaused)

    // If pausing (not resuming), call onPause with remaining seconds
    if (newPaused && onPause) {
      onPause(remaining)
    }
  }, [allowPause, isPaused, onPauseChange, onPause, remaining])

  // Progress percentage
  const progressPercent = Math.max(0, (remaining / totalSeconds) * 100)

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg',
        isExpired && 'bg-red-100 border border-red-300',
        isWarning && !isExpired && 'bg-yellow-100 border border-yellow-300',
        !isWarning && !isExpired && 'bg-gray-100 border border-gray-200',
        className
      )}
      dir="rtl"
    >
      {/* Timer Icon */}
      <div
        className={cn(
          'flex-shrink-0',
          isExpired && 'text-red-600',
          isWarning && !isExpired && 'text-yellow-600',
          !isWarning && !isExpired && 'text-gray-600'
        )}
      >
        {isExpired ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
      </div>

      {/* Time Display */}
      <div className="flex-1">
        <div
          className={cn(
            'font-mono text-xl font-bold tabular-nums',
            isExpired && 'text-red-700',
            isWarning && !isExpired && 'text-yellow-700 animate-pulse',
            !isWarning && !isExpired && 'text-gray-800'
          )}
        >
          {formatTime(remaining)}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear rounded-full',
              isExpired && 'bg-red-500',
              isWarning && !isExpired && 'bg-yellow-500',
              !isWarning && !isExpired && 'bg-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Pause Button */}
      {allowPause && !isExpired && (
        <button
          type="button"
          onClick={togglePause}
          className={cn(
            'flex-shrink-0 p-2 rounded-full transition-colors',
            isPaused
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          )}
          title={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
        >
          {isPaused ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Expired Label */}
      {isExpired && (
        <span className="text-sm font-medium text-red-700">
          انتهى الوقت!
        </span>
      )}

      {/* Network Disconnect Indicator */}
      {networkPaused && !isExpired && (
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            انقطع الاتصال - الوقت متوقف
          </span>
          {disconnectedSeconds > 0 && (
            <span className="text-xs text-orange-500">
              ({disconnectedSeconds} ث)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default ExamTimer
