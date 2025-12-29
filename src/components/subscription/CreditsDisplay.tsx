'use client'

import {
  GraduationCap,
  BookOpen,
  Share2,
  Loader2,
  TrendingUp,
  Infinity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserLimits } from '@/types/subscription'

interface CreditsDisplayProps {
  limits: UserLimits
  isLoading?: boolean
  showShareCredits?: boolean
  className?: string
}

interface CompactCreditItemProps {
  icon: React.ReactNode
  label: string
  used: number
  limit: number | null
  iconBgClass: string
  iconTextClass: string
}

function CompactCreditItem({ icon, label, used, limit, iconBgClass, iconTextClass }: CompactCreditItemProps) {
  const remaining = limit !== null ? limit - used : null
  const isUnlimited = limit === null
  const isLow = !isUnlimited && remaining !== null && remaining <= 1
  const isEmpty = !isUnlimited && remaining === 0

  return (
    <div className="flex items-center gap-2">
      <div className={cn('p-1.5 rounded-lg shrink-0', iconBgClass, iconTextClass)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-1">
          {isUnlimited ? (
            <div className="flex items-center gap-1 text-green-600">
              <Infinity className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">غير محدود</span>
            </div>
          ) : (
            <span className={cn(
              'text-sm font-bold',
              isEmpty ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-foreground'
            )}>
              {remaining}
              <span className="text-xs font-normal text-muted-foreground">/{limit}</span>
            </span>
          )}
        </div>
      </div>
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
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const { generation, sharing, rewards } = limits
  const hasRewards = rewards.examCredits > 0 || rewards.practiceCredits > 0

  return (
    <Card className={cn('', className)} dir="rtl">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          الأرصدة والحدود
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {/* Compact Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Generation Section */}
          <CompactCreditItem
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            label="الاختبارات"
            used={generation.exams.used}
            limit={generation.exams.limit}
            iconBgClass="bg-blue-50"
            iconTextClass="text-blue-600"
          />
          <CompactCreditItem
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="التمارين"
            used={generation.practices.used}
            limit={generation.practices.limit}
            iconBgClass="bg-green-50"
            iconTextClass="text-green-600"
          />

          {/* Sharing Section */}
          {showShareCredits && (
            <>
              <CompactCreditItem
                icon={<Share2 className="w-3.5 h-3.5" />}
                label="مشاركة الاختبارات"
                used={sharing.examSharesUsed}
                limit={sharing.examSharesPerMonth}
                iconBgClass="bg-purple-50"
                iconTextClass="text-purple-600"
              />
              <CompactCreditItem
                icon={<Share2 className="w-3.5 h-3.5" />}
                label="مشاركة التمارين"
                used={sharing.practiceSharesUsed}
                limit={sharing.practiceSharesPerMonth}
                iconBgClass="bg-indigo-50"
                iconTextClass="text-indigo-600"
              />
            </>
          )}
        </div>

        {/* Compact Reward Credits */}
        {hasRewards && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              مكافآت
            </span>
            <div className="flex items-center gap-3">
              {rewards.examCredits > 0 && (
                <span className="text-xs">
                  <span className="font-bold text-blue-600">{rewards.examCredits}</span>
                  <span className="text-muted-foreground mr-1">اختبار</span>
                </span>
              )}
              {rewards.practiceCredits > 0 && (
                <span className="text-xs">
                  <span className="font-bold text-green-600">{rewards.practiceCredits}</span>
                  <span className="text-muted-foreground mr-1">تمرين</span>
                </span>
              )}
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

// Stunning centered single-line credits bar
interface CreditsBadgeProps {
  limits: UserLimits
  isLoading?: boolean
  showShareCredits?: boolean
  className?: string
}

interface BadgeItemProps {
  icon: React.ReactNode
  label: string
  remaining: number | null
  limit: number | null
  colorClass: string
  bgClass: string
}

function BadgeItem({ icon, label, remaining, limit, colorClass, bgClass }: BadgeItemProps) {
  const isUnlimited = limit === null
  const isLow = !isUnlimited && remaining !== null && remaining <= 1
  const isEmpty = !isUnlimited && remaining === 0

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className={cn('p-1 rounded-md', bgClass)}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
      {isUnlimited ? (
        <div className="flex items-center gap-0.5">
          <Infinity className={cn('w-3.5 h-3.5', colorClass)} />
        </div>
      ) : (
        <span className={cn(
          'text-sm font-bold tabular-nums',
          isEmpty ? 'text-red-500' : isLow ? 'text-amber-600' : colorClass
        )}>
          {remaining}<span className="text-xs font-normal text-muted-foreground">/{limit}</span>
        </span>
      )}
    </div>
  )
}

function SkeletonBadgeItem() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
      <div className="w-6 h-6 rounded-md bg-muted/60"></div>
      <div className="hidden sm:block w-12 h-3 rounded bg-muted/40"></div>
      <div className="w-8 h-4 rounded bg-muted/50"></div>
    </div>
  )
}

export function CreditsBadge({
  limits,
  isLoading,
  showShareCredits = true,
  className,
}: CreditsBadgeProps) {
  if (isLoading) {
    return (
      <div className={cn('flex justify-center', className)} dir="rtl">
        <div className="inline-flex items-center rounded-full bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-border/60 shadow-sm backdrop-blur-sm divide-x divide-border/40 rtl:divide-x-reverse overflow-hidden">
          <SkeletonBadgeItem />
          <SkeletonBadgeItem />
          {showShareCredits && (
            <>
              <SkeletonBadgeItem />
              <SkeletonBadgeItem />
            </>
          )}
        </div>
      </div>
    )
  }

  const { generation, sharing } = limits

  return (
    <div className={cn('flex justify-center', className)} dir="rtl">
      <div className="inline-flex items-center rounded-full bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-border/60 shadow-sm backdrop-blur-sm divide-x divide-border/40 rtl:divide-x-reverse">
        {/* Exams */}
        <BadgeItem
          icon={<GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
          label="اختبارات"
          remaining={generation.exams.limit !== null ? generation.exams.limit - generation.exams.used : null}
          limit={generation.exams.limit}
          colorClass="text-blue-600"
          bgClass="bg-blue-100/80 dark:bg-blue-900/30"
        />

        {/* Practices */}
        <BadgeItem
          icon={<BookOpen className="w-3.5 h-3.5 text-green-600" />}
          label="تمارين"
          remaining={generation.practices.limit !== null ? generation.practices.limit - generation.practices.used : null}
          limit={generation.practices.limit}
          colorClass="text-green-600"
          bgClass="bg-green-100/80 dark:bg-green-900/30"
        />

        {/* Sharing Section */}
        {showShareCredits && (
          <>
            <BadgeItem
              icon={<Share2 className="w-3.5 h-3.5 text-purple-600" />}
              label="مشاركة اختبار"
              remaining={sharing.examSharesPerMonth !== null ? sharing.examSharesPerMonth - sharing.examSharesUsed : null}
              limit={sharing.examSharesPerMonth}
              colorClass="text-purple-600"
              bgClass="bg-purple-100/80 dark:bg-purple-900/30"
            />
            <BadgeItem
              icon={<Share2 className="w-3.5 h-3.5 text-indigo-600" />}
              label="مشاركة تمرين"
              remaining={sharing.practiceSharesPerMonth !== null ? sharing.practiceSharesPerMonth - sharing.practiceSharesUsed : null}
              limit={sharing.practiceSharesPerMonth}
              colorClass="text-indigo-600"
              bgClass="bg-indigo-100/80 dark:bg-indigo-900/30"
            />
          </>
        )}
      </div>
    </div>
  )
}
