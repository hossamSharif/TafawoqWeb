'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useActiveSessions } from '@/hooks/useActiveSessions'
import type { ActiveSession } from '@/lib/sessions/limits'
import {
  PlayCircle,
  PauseCircle,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionCardProps {
  session: ActiveSession
  onResume: () => void
  onAbandon: () => void
  isResuming: boolean
}

function SessionCard({ session, onResume, onAbandon, isResuming }: SessionCardProps) {
  const isPaused = session.status === 'paused'

  // Format remaining time for exams
  const formatRemainingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`
    }
    return `${minutes} دقيقة`
  }

  // Format paused duration
  const formatPausedDuration = (pausedAt: string) => {
    const pausedDate = new Date(pausedAt)
    const now = new Date()
    const diffMs = now.getTime() - pausedDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `متوقف منذ ${diffDays} يوم`
    }
    if (diffHours > 0) {
      return `متوقف منذ ${diffHours} ساعة`
    }
    return 'متوقف مؤخراً'
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
        isPaused
          ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      )}
      dir="rtl"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
          isPaused ? 'bg-yellow-100' : 'bg-blue-100'
        )}
      >
        {session.type === 'exam' ? (
          <GraduationCap
            className={cn(
              'w-6 h-6',
              isPaused ? 'text-yellow-600' : 'text-blue-600'
            )}
          />
        ) : (
          <BookOpen
            className={cn(
              'w-6 h-6',
              isPaused ? 'text-yellow-600' : 'text-blue-600'
            )}
          />
        )}
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 truncate">
            {session.title}
          </h4>
          {isPaused && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
              متوقف
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{session.description}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          {/* Progress */}
          <span className="flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />
            {session.progress}% مكتمل
          </span>
          {/* Remaining time for exams */}
          {session.type === 'exam' && session.remainingTimeSeconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRemainingTime(session.remainingTimeSeconds)} متبقي
            </span>
          )}
          {/* Paused duration */}
          {isPaused && session.pausedAt && (
            <span className="flex items-center gap-1 text-yellow-600">
              <PauseCircle className="w-3 h-3" />
              {formatPausedDuration(session.pausedAt)}
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isPaused ? 'bg-yellow-500' : 'bg-blue-500'
            )}
            style={{ width: `${session.progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onResume}
          disabled={isResuming}
          className="gap-1"
        >
          {isResuming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الاستئناف...
            </>
          ) : (
            <>
              {isPaused ? 'استئناف' : 'متابعة'}
              <ChevronLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export function MySessionsSection() {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isResuming, setIsResuming] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const {
    sessions,
    inProgressSessions,
    pausedSessions,
    counts,
    isLoading,
    error,
  } = useActiveSessions()

  // Handle resume/continue session with debouncing
  const handleResume = async (session: ActiveSession) => {
    // Prevent double-click or concurrent resume attempts
    if (isResuming) return

    setResumeError(null)
    setIsResuming(session.id)

    if (session.type === 'exam') {
      // Exams handle resume automatically in their page/context
      // Just navigate - the useExamSession hook will handle resume
      router.push(`/exam/${session.id}`)
    } else {
      // Practice sessions need explicit resume if paused
      if (session.status === 'paused') {
        try {
          const response = await fetch(`/api/practice/${session.id}/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'فشل في استئناف التمرين')
          }

          // Successfully resumed, now navigate
          router.push(`/practice/${session.id}`)
        } catch (error) {
          const errorMessage =
            error instanceof TypeError
              ? 'تحقق من اتصال الإنترنت وحاول مرة أخرى'
              : error instanceof Error
                ? error.message
                : 'حدث خطأ أثناء الاستئناف'
          setResumeError(errorMessage)
          setIsResuming(null)
        }
      } else {
        // Session is already in_progress, direct navigation
        router.push(`/practice/${session.id}`)
      }
    }
  }

  // Handle abandon session (optional - could show confirmation dialog)
  const handleAbandon = (session: ActiveSession) => {
    // This would show a confirmation dialog
    console.log('Abandon session:', session.id)
  }

  // Don't render if no sessions
  if (!isLoading && sessions.length === 0) {
    return null
  }

  return (
    <Card className="mb-6" dir="rtl">
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlayCircle className="w-5 h-5 text-primary" />
            جلساتي النشطة
            {counts.total > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {counts.total}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          // Error state
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          // Sessions list
          <>
            {/* In Progress Sessions */}
            {inProgressSessions.map((session) => (
              <SessionCard
                key={`${session.type}-${session.id}`}
                session={session}
                onResume={() => handleResume(session)}
                onAbandon={() => handleAbandon(session)}
                isResuming={isResuming === session.id}
              />
            ))}

            {/* Paused Sessions */}
            {pausedSessions.map((session) => (
              <SessionCard
                key={`${session.type}-${session.id}`}
                session={session}
                onResume={() => handleResume(session)}
                onAbandon={() => handleAbandon(session)}
                isResuming={isResuming === session.id}
              />
            ))}

            {/* Resume Error Alert */}
            {resumeError && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>فشل الاستئناف</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{resumeError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResumeError(null)}
                    className="self-start"
                  >
                    حسناً
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        </CardContent>
      )}
    </Card>
  )
}

export default MySessionsSection
