'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModerationQueue } from '@/components/admin/ModerationQueue'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportWithContent, ReportStatus, ModerationAction } from '@/lib/admin/types'

interface ModerationResponse {
  reports: ReportWithContent[]
  next_cursor: string | null
  has_more: boolean
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportWithContent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending')

  const fetchReports = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '20')
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/admin/moderation?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      return response.json() as Promise<ModerationResponse>
    },
    [statusFilter]
  )

  const loadInitialReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchReports()
      setReports(data.reports)
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('فشل في تحميل البلاغات')
    } finally {
      setIsLoading(false)
    }
  }, [fetchReports])

  const loadMoreReports = async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const data = await fetchReports(nextCursor)
      setReports((prev) => [...prev, ...data.reports])
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load more reports:', error)
      toast.error('فشل في تحميل المزيد')
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadInitialReports()
  }, [loadInitialReports])

  const handleResolve = async (
    reportId: string,
    action: ModerationAction,
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/admin/moderation/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to resolve report')
      }

      // Remove from local state if viewing pending
      if (statusFilter === 'pending') {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
      } else {
        // Update status
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' }
              : r
          )
        )
      }

      const actionMessages = {
        approve: 'تم الموافقة على المحتوى',
        delete_content: 'تم حذف المحتوى',
        dismiss: 'تم رفض البلاغ',
      }
      toast.success(actionMessages[action])
    } catch (error) {
      console.error('Failed to resolve report:', error)
      toast.error('فشل في معالجة البلاغ')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الإشراف</h1>
          <p className="text-muted-foreground">
            مراجعة البلاغات والمحتوى المخالف
          </p>
        </div>
        <Button variant="outline" onClick={loadInitialReports}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value: ReportStatus | 'all') => {
            setStatusFilter(value)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="حالة البلاغ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">معلقة</SelectItem>
            <SelectItem value="resolved">تم الحل</SelectItem>
            <SelectItem value="dismissed">مرفوضة</SelectItem>
            <SelectItem value="all">الكل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Moderation Queue */}
      <ModerationQueue
        reports={reports}
        onResolve={handleResolve}
        isLoading={isLoading}
      />

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMoreReports}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : null}
            تحميل المزيد
          </Button>
        </div>
      )}
    </div>
  )
}
