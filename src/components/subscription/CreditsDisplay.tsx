'use client'

import {
  GraduationCap,
  BookOpen,
  Share2,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { UserLimits } from '@/types/subscription'

interface CreditsDisplayProps {
  limits: UserLimits
  isLoading?: boolean
  showShareCredits?: boolean
  className?: string
}

interface CreditRowProps {
  icon: React.ReactNode
  label: string
  used: number
  limit: number | null
  colorClass: string
}

function CreditRow({ icon, label, used, limit, colorClass }: CreditRowProps) {
  const remaining = limit !== null ? limit - used : null
  const percentage = limit !== null ? (used / limit) * 100 : 0
  const isUnlimited = limit === null
  const isLow = !isUnlimited && remaining !== null && remaining <= 1

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('p-1.5 rounded-lg', colorClass)}>{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-left">
          {isUnlimited ? (
            <span className="text-sm font-medium text-green-600">غير محدود</span>
          ) : (
            <span className={cn(
              'text-sm font-medium',
              isLow ? 'text-red-600' : 'text-gray-600'
            )}>
              {remaining} / {limit} متبقي
            </span>
          )}
        </div>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            percentage >= 100 && 'bg-red-100',
            percentage >= 80 && percentage < 100 && 'bg-amber-100'
          )}
        />
      )}
    </div>
  )
}

export function CreditsDisplay({
  limits,
  isLoading,
  showShareCredits = true,
  className,
}: CreditsDisplayProps) {
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const { generation, sharing, rewards } = limits

  return (
    <Card className={cn('', className)} dir="rtl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          الأرصدة والحدود
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Credits */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            الإنشاء
          </h3>
          <CreditRow
            icon={<GraduationCap className="w-4 h-4 text-blue-600" />}
            label="الاختبارات"
            used={generation.exams.used}
            limit={generation.exams.limit}
            colorClass="bg-blue-50"
          />
          <CreditRow
            icon={<BookOpen className="w-4 h-4 text-green-600" />}
            label="التمارين"
            used={generation.practices.used}
            limit={generation.practices.limit}
            colorClass="bg-green-50"
          />
        </div>

        {/* Sharing Credits */}
        {showShareCredits && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              المشاركة
            </h3>
            <CreditRow
              icon={<Share2 className="w-4 h-4 text-purple-600" />}
              label="مشاركة الاختبارات"
              used={sharing.examSharesUsed}
              limit={sharing.examSharesPerMonth}
              colorClass="bg-purple-50"
            />
            <CreditRow
              icon={<Share2 className="w-4 h-4 text-indigo-600" />}
              label="مشاركة التمارين"
              used={sharing.practiceSharesUsed}
              limit={sharing.practiceSharesPerMonth}
              colorClass="bg-indigo-50"
            />
          </div>
        )}

        {/* Reward Credits Summary */}
        {(rewards.examCredits > 0 || rewards.practiceCredits > 0) && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-3">
              أرصدة المكافآت
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-600">
                  {rewards.examCredits}
                </span>
                <p className="text-xs text-gray-600 mt-1">اختبارات</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-green-600">
                  {rewards.practiceCredits}
                </span>
                <p className="text-xs text-gray-600 mt-1">تمارين</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact inline version for dashboard widgets
interface CreditsInlineProps {
  examCreditsUsed: number
  examCreditsLimit: number
  practiceCreditsUsed: number
  practiceCreditsLimit: number
  className?: string
}

export function CreditsInline({
  examCreditsUsed,
  examCreditsLimit,
  practiceCreditsUsed,
  practiceCreditsLimit,
  className,
}: CreditsInlineProps) {
  const examRemaining = examCreditsLimit - examCreditsUsed
  const practiceRemaining = practiceCreditsLimit - practiceCreditsUsed

  return (
    <div className={cn('flex items-center gap-4', className)} dir="rtl">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-blue-600" />
        <span className={cn(
          'text-sm',
          examRemaining <= 1 ? 'text-red-600 font-medium' : 'text-gray-600'
        )}>
          {examRemaining} اختبار
        </span>
      </div>
      <div className="h-4 w-px bg-gray-200" />
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-green-600" />
        <span className={cn(
          'text-sm',
          practiceRemaining <= 1 ? 'text-red-600 font-medium' : 'text-gray-600'
        )}>
          {practiceRemaining} تمرين
        </span>
      </div>
    </div>
  )
}
