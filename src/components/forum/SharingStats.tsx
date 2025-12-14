'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Share2,
  Users,
  Heart,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Loader2,
  Gift,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SharingStats as SharingStatsType } from '@/lib/forum/types'

interface SharingStatsProps {
  userId: string
  className?: string
}

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  trend?: number
  colorClass?: string
}

function StatsCard({ icon, label, value, trend, colorClass = 'text-primary' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg bg-gray-50', colorClass)}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {trend !== undefined && trend !== 0 && (
              <span
                className={cn(
                  'text-xs flex items-center gap-0.5',
                  trend > 0 ? 'text-green-600' : 'text-red-500'
                )}
              >
                <TrendingUp className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SharedPostItemProps {
  post: {
    id: string
    title: string
    completion_count: number
    like_count: number
    love_count: number
    created_at: string
  }
}

function SharedPostItem({ post }: SharedPostItemProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/forum/post/${post.id}`}
      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm">
        <span className="flex items-center gap-1 text-blue-600">
          <Users className="w-3.5 h-3.5" />
          {post.completion_count}
        </span>
        <span className="flex items-center gap-1 text-pink-500">
          <Heart className="w-3.5 h-3.5" />
          {post.like_count + post.love_count}
        </span>
      </div>
    </Link>
  )
}

export function SharingStats({ userId, className }: SharingStatsProps) {
  const [stats, setStats] = useState<SharingStatsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/rewards')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()

        // Also fetch sharing stats
        const sharingResponse = await fetch('/api/forum/posts?type=exam_share&author=' + userId)
        let posts: SharingStatsType['posts'] = []
        if (sharingResponse.ok) {
          const sharingData = await sharingResponse.json()
          posts = sharingData.posts?.map((p: {
            id: string
            title: string
            completion_count: number
            like_count: number
            love_count: number
            created_at: string
          }) => ({
            id: p.id,
            title: p.title,
            completion_count: p.completion_count,
            like_count: p.like_count,
            love_count: p.love_count,
            created_at: p.created_at,
          })) || []
        }

        setStats({
          total_shares: data.total_shares || posts.length,
          total_completions: data.total_completions || 0,
          total_likes: posts.reduce((sum: number, p: { like_count: number }) => sum + p.like_count, 0),
          total_loves: posts.reduce((sum: number, p: { love_count: number }) => sum + p.love_count, 0),
          posts,
        })
      } catch (err) {
        console.error('Error fetching sharing stats:', err)
        setError('فشل في جلب الإحصائيات')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchStats()
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  if (!stats || stats.total_shares === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">مشاركاتي</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>لم تشارك أي اختبارات بعد</p>
          <p className="text-sm mt-2">شارك اختباراتك المكتملة واكسب نقاط!</p>
          <Link href="/profile">
            <Button size="sm" className="mt-4 gap-2">
              <Gift className="w-4 h-4" />
              ابدأ المشاركة
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">إحصائيات المشاركة</h2>
          </div>
          <Link href="/forum?filter=my-shares">
            <Button variant="ghost" size="sm" className="gap-1">
              عرض الكل
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<Share2 className="w-5 h-5" />}
          label="إجمالي المشاركات"
          value={stats.total_shares}
          colorClass="text-primary"
        />
        <StatsCard
          icon={<Users className="w-5 h-5" />}
          label="مرات الإكمال"
          value={stats.total_completions}
          colorClass="text-blue-600"
        />
        <StatsCard
          icon={<Heart className="w-5 h-5" />}
          label="إجمالي الإعجابات"
          value={stats.total_likes}
          colorClass="text-pink-500"
        />
        <StatsCard
          icon={<Sparkles className="w-5 h-5" />}
          label="إجمالي الحب"
          value={stats.total_loves}
          colorClass="text-red-500"
        />
      </div>

      {/* Recent Shared Posts */}
      {stats.posts.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            أحدث المشاركات
          </h3>
          <div className="space-y-2">
            {stats.posts.slice(0, 5).map((post) => (
              <SharedPostItem key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Rewards Progress */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              التقدم نحو المكافأة التالية
            </span>
            <span className="text-sm text-primary font-bold">
              {stats.total_completions % 5}/5 إكمال
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
              style={{
                width: `${((stats.total_completions % 5) / 5) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            كل 5 إكمالات فريدة = 5 أرصدة اختبار + 5 أرصدة تدريب
          </p>
        </div>
      </div>
    </div>
  )
}
