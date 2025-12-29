'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useActiveSessions } from '@/hooks/useActiveSessions'
import type { ActiveSession } from '@/lib/sessions/limits'
import {
  PlayCircle,
  PauseCircle,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionItemProps {
  session: ActiveSession
  onResume: () => void
}

function SessionItem({ session, onResume }: SessionItemProps) {
  const isPaused = session.status === 'paused'

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}س ${minutes}د`
    }
    return `${minutes}د`
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer',
        isPaused
          ? 'bg-yellow-50 hover:bg-yellow-100'
          : 'bg-blue-50 hover:bg-blue-100'
      )}
      onClick={onResume}
      dir="rtl"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isPaused ? 'bg-yellow-100' : 'bg-blue-100'
        )}
      >
        {session.type === 'exam' ? (
          <GraduationCap
            className={cn(
              'w-4 h-4',
              isPaused ? 'text-yellow-600' : 'text-blue-600'
            )}
          />
        ) : (
          <BookOpen
            className={cn(
              'w-4 h-4',
              isPaused ? 'text-yellow-600' : 'text-blue-600'
            )}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 truncate">
            {session.title}
          </span>
          {isPaused && (
            <PauseCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{session.progress}%</span>
          {session.type === 'exam' && session.remainingTimeSeconds && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatRemainingTime(session.remainingTimeSeconds)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Resume Arrow */}
      <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  )
}

export interface ActiveSessionsWidgetProps {
  /** Compact mode for smaller spaces */
  compact?: boolean
  className?: string
}

/**
 * ActiveSessionsWidget - Navigation widget for quick access to active sessions
 */
export function ActiveSessionsWidget({
  compact = false,
  className,
}: ActiveSessionsWidgetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { sessions, counts, isLoading, error, refresh } = useActiveSessions()

  // Handle resume
  const handleResume = (session: ActiveSession) => {
    setOpen(false)
    if (session.type === 'exam') {
      router.push(`/exam/${session.id}`)
    } else {
      router.push(`/practice/${session.id}`)
    }
  }

  // Don't render if no sessions
  if (!isLoading && counts.total === 0) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span className="text-sm">جاري التحميل...</span>}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={cn(
            'relative',
            counts.paused > 0 && 'text-yellow-600 hover:text-yellow-700',
            className
          )}
        >
          <PlayCircle className="w-5 h-5" />
          {!compact && (
            <span className="mr-2">
              {counts.paused > 0 ? 'جلسات متوقفة' : 'جلسات نشطة'}
            </span>
          )}
          {/* Badge */}
          {counts.total > 0 && (
            <span
              className={cn(
                'absolute -top-1 -left-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center',
                counts.paused > 0
                  ? 'bg-yellow-500 text-white'
                  : 'bg-primary text-white'
              )}
            >
              {counts.total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-2"
        align="end"
        dir="rtl"
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between px-2 pb-2 border-b">
            <h4 className="font-semibold text-sm">جلساتي النشطة</h4>
            <span className="text-xs text-gray-500">
              {counts.inProgress > 0 && `${counts.inProgress} قيد التقدم`}
              {counts.inProgress > 0 && counts.paused > 0 && ' • '}
              {counts.paused > 0 && `${counts.paused} متوقف`}
            </span>
          </div>

          {/* Error state */}
          {error && (
            <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Sessions list */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {sessions.map((session) => (
              <SessionItem
                key={`${session.type}-${session.id}`}
                session={session}
                onResume={() => handleResume(session)}
              />
            ))}
          </div>

          {/* Empty state */}
          {sessions.length === 0 && !error && (
            <div className="text-center py-4 text-gray-500 text-sm">
              لا توجد جلسات نشطة
            </div>
          )}

          {/* Refresh button */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => refresh()}
            >
              تحديث القائمة
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ActiveSessionsWidget
