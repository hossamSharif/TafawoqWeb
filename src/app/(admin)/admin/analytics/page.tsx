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
import { AnalyticsCharts, AnalyticsSummary } from '@/components/admin/AnalyticsCharts'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>
  examActivity: Array<{ date: string; count: number }>
  forumActivity: Array<{ date: string; posts: number; comments: number }>
  summary: {
    totalUsers: number
    totalExams: number
    totalPosts: number
    totalComments: number
  }
}

type TimeRange = 'week' | 'month' | 'year'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('فشل في تحميل التحليلات')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التحليلات</h1>
          <p className="text-muted-foreground">
            إحصائيات مفصلة حول أداء المنصة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onValueChange={(value: TimeRange) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {data?.summary && <AnalyticsSummary stats={data.summary} />}

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">الإحصائيات اليومية</h2>
        <AnalyticsCharts
          userGrowth={data?.userGrowth || []}
          examActivity={data?.examActivity || []}
          forumActivity={data?.forumActivity || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
