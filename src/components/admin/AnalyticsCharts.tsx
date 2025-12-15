'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ChartData {
  date: string
  count?: number
  posts?: number
  comments?: number
}

interface AnalyticsChartsProps {
  userGrowth: ChartData[]
  examActivity: ChartData[]
  forumActivity: ChartData[]
  isLoading?: boolean
}

// Simple bar chart component
function SimpleBarChart({
  data,
  valueKey = 'count',
  title,
  color = 'bg-primary',
}: {
  data: ChartData[]
  valueKey?: string
  title: string
  color?: string
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            لا توجد بيانات
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => {
    const val = d[valueKey as keyof ChartData]
    return typeof val === 'number' ? val : 0
  }))

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(-7).map((item, index) => {
            const value = item[valueKey as keyof ChartData]
            const numValue = typeof value === 'number' ? value : 0
            const percentage = maxValue > 0 ? (numValue / maxValue) * 100 : 0

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(item.date)}</span>
                  <span className="font-medium">{numValue.toLocaleString('ar-SA')}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Combined chart for forum activity (posts + comments)
function ForumActivityChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">نشاط المنتدى</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            لا توجد بيانات
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.posts || 0, d.comments || 0))
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">نشاط المنتدى</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>منشورات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>تعليقات</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(-7).map((item, index) => {
            const postsPercentage = maxValue > 0 ? ((item.posts || 0) / maxValue) * 100 : 0
            const commentsPercentage = maxValue > 0 ? ((item.comments || 0) / maxValue) * 100 : 0

            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(item.date)}</span>
                  <span className="font-medium">
                    {(item.posts || 0).toLocaleString('ar-SA')} / {(item.comments || 0).toLocaleString('ar-SA')}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${postsPercentage}%` }}
                    />
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${commentsPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsCharts({
  userGrowth,
  examActivity,
  forumActivity,
  isLoading,
}: AnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <SimpleBarChart
        data={userGrowth}
        title="نمو المستخدمين"
        color="bg-green-500"
      />
      <SimpleBarChart
        data={examActivity}
        title="نشاط الاختبارات"
        color="bg-blue-500"
      />
      <ForumActivityChart data={forumActivity} />
    </div>
  )
}

// Summary stats component
interface StatsSummary {
  totalUsers: number
  totalExams: number
  totalPosts: number
  totalComments: number
}

export function AnalyticsSummary({ stats }: { stats: StatsSummary }) {
  const summaryItems = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, color: 'text-green-600' },
    { label: 'إجمالي الاختبارات', value: stats.totalExams, color: 'text-blue-600' },
    { label: 'إجمالي المنشورات', value: stats.totalPosts, color: 'text-primary' },
    { label: 'إجمالي التعليقات', value: stats.totalComments, color: 'text-amber-600' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{item.value.toLocaleString('ar-SA')}</div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
