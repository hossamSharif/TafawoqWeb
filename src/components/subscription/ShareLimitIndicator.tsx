'use client'

import { Share2, AlertCircle, CheckCircle, Crown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SharingQuota } from '@/types/subscription'

interface ShareLimitIndicatorProps {
  quota: SharingQuota
  contentType: 'exam' | 'practice'
  onUpgradeClick?: () => void
  showUpgradeButton?: boolean
  variant?: 'default' | 'compact' | 'inline'
  className?: string
}

export function ShareLimitIndicator({
  quota,
  contentType,
  onUpgradeClick,
  showUpgradeButton = true,
  variant = 'default',
  className,
}: ShareLimitIndicatorProps) {
  const data = contentType === 'exam' ? quota.exams : quota.practices
  const { shared, limit, remaining } = data

  const percentage = (shared / limit) * 100
  const isAtLimit = remaining === 0
  const isLow = remaining > 0 && remaining <= 1

  const label = contentType === 'exam' ? 'اختبار' : 'تمرين'
  const pluralLabel = contentType === 'exam' ? 'اختبارات' : 'تمارين'

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                isAtLimit && 'bg-red-100 text-red-700',
                isLow && !isAtLimit && 'bg-amber-100 text-amber-700',
                !isAtLimit && !isLow && 'bg-gray-100 text-gray-700',
                className
              )}
              dir="rtl"
            >
              <Share2 className="w-3 h-3" />
              <span>{remaining}/{limit}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent dir="rtl">
            <p>متبقي {remaining} مشاركة {label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border',
          isAtLimit && 'bg-red-50 border-red-200',
          isLow && !isAtLimit && 'bg-amber-50 border-amber-200',
          !isAtLimit && !isLow && 'bg-gray-50 border-gray-200',
          className
        )}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <Share2 className={cn(
            'w-4 h-4',
            isAtLimit && 'text-red-600',
            isLow && !isAtLimit && 'text-amber-600',
            !isAtLimit && !isLow && 'text-gray-600'
          )} />
          <span className="text-sm">
            مشاركة {pluralLabel}
          </span>
        </div>
        <span className={cn(
          'text-sm font-medium',
          isAtLimit && 'text-red-600',
          isLow && !isAtLimit && 'text-amber-600',
          !isAtLimit && !isLow && 'text-gray-700'
        )}>
          {remaining}/{limit}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isAtLimit && 'bg-red-50 border-red-200',
        isLow && !isAtLimit && 'bg-amber-50 border-amber-200',
        !isAtLimit && !isLow && 'bg-white border-gray-200',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-2 rounded-lg',
            isAtLimit && 'bg-red-100',
            isLow && !isAtLimit && 'bg-amber-100',
            !isAtLimit && !isLow && 'bg-gray-100'
          )}>
            <Share2 className={cn(
              'w-4 h-4',
              isAtLimit && 'text-red-600',
              isLow && !isAtLimit && 'text-amber-600',
              !isAtLimit && !isLow && 'text-gray-600'
            )} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              مشاركة {pluralLabel}
            </h4>
            <p className="text-xs text-gray-500">
              شهرياً
            </p>
          </div>
        </div>

        {isAtLimit ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : !isLow ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : null}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">تم استخدام</span>
          <span className={cn(
            'font-medium',
            isAtLimit && 'text-red-600',
            isLow && !isAtLimit && 'text-amber-600',
            !isAtLimit && !isLow && 'text-gray-900'
          )}>
            {shared} من {limit}
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isAtLimit && '[&>div]:bg-red-500',
            isLow && !isAtLimit && '[&>div]:bg-amber-500',
            !isAtLimit && !isLow && '[&>div]:bg-green-500'
          )}
        />
      </div>

      {isAtLimit && showUpgradeButton && (
        <div className="pt-2 border-t border-red-200">
          <p className="text-xs text-red-600 mb-2">
            لقد وصلت للحد الأقصى من المشاركات هذا الشهر
          </p>
          <Button
            size="sm"
            onClick={onUpgradeClick}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Crown className="w-4 h-4 ml-2" />
            ترقية للمزيد من المشاركات
          </Button>
        </div>
      )}

      {!isAtLimit && remaining <= 2 && (
        <p className="text-xs text-amber-600 pt-2 border-t border-amber-200">
          متبقي لك {remaining} مشاركة {label} هذا الشهر
        </p>
      )}
    </div>
  )
}

// Badge version for showing in share dialogs
interface ShareQuotaBadgeProps {
  remaining: number
  limit: number
  contentType: 'exam' | 'practice'
  className?: string
}

export function ShareQuotaBadge({
  remaining,
  limit,
  contentType,
  className,
}: ShareQuotaBadgeProps) {
  const isAtLimit = remaining === 0
  const label = contentType === 'exam' ? 'اختبار' : 'تمرين'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
        isAtLimit ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
        className
      )}
      dir="rtl"
    >
      <Share2 className="w-4 h-4" />
      {isAtLimit ? (
        <span>لا يمكنك المشاركة - وصلت للحد الأقصى</span>
      ) : (
        <span>متبقي {remaining} مشاركة {label}</span>
      )}
    </div>
  )
}
