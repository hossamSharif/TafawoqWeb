'use client'

import { useState } from 'react'
import {
  Coins,
  BookOpen,
  GraduationCap,
  Loader2,
  Gift,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CreditBalanceProps {
  examCredits: number
  practiceCredits: number
  onRedeem?: (creditType: 'exam' | 'practice') => Promise<void>
  isLoading?: boolean
  showRedeemButtons?: boolean
  className?: string
}

interface CreditCardProps {
  icon: React.ReactNode
  label: string
  credits: number
  colorClass: string
  bgClass: string
  onRedeem?: () => void
  isRedeeming?: boolean
  showRedeemButton?: boolean
}

function CreditCard({
  icon,
  label,
  credits,
  colorClass,
  bgClass,
  onRedeem,
  isRedeeming,
  showRedeemButton,
}: CreditCardProps) {
  return (
    <div className={cn('rounded-xl p-4 border', bgClass)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg bg-white/80', colorClass)}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-3xl font-bold', colorClass)}>{credits}</span>
          <span className="text-sm text-gray-500">رصيد</span>
        </div>
        {showRedeemButton && credits > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRedeem}
            disabled={isRedeeming || credits === 0}
            className={cn('gap-1', colorClass)}
          >
            {isRedeeming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Gift className="w-4 h-4" />
                استخدم
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export function CreditBalance({
  examCredits,
  practiceCredits,
  onRedeem,
  isLoading,
  showRedeemButtons = false,
  className,
}: CreditBalanceProps) {
  const [redeemingType, setRedeemingType] = useState<'exam' | 'practice' | null>(null)

  const handleRedeem = async (creditType: 'exam' | 'practice') => {
    if (!onRedeem) return
    setRedeemingType(creditType)
    try {
      await onRedeem(creditType)
    } finally {
      setRedeemingType(null)
    }
  }

  const totalCredits = examCredits + practiceCredits

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <Coins className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">رصيد المكافآت</h2>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
            <span className="text-sm text-gray-600">الإجمالي:</span>
            <span className="text-lg font-bold text-amber-600">{totalCredits}</span>
          </div>
        </div>
      </div>

      {/* Credit Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CreditCard
          icon={<GraduationCap className="w-5 h-5" />}
          label="أرصدة الاختبارات"
          credits={examCredits}
          colorClass="text-blue-600"
          bgClass="bg-blue-50/50 border-blue-100"
          onRedeem={() => handleRedeem('exam')}
          isRedeeming={redeemingType === 'exam'}
          showRedeemButton={showRedeemButtons}
        />
        <CreditCard
          icon={<BookOpen className="w-5 h-5" />}
          label="أرصدة التدريب"
          credits={practiceCredits}
          colorClass="text-green-600"
          bgClass="bg-green-50/50 border-green-100"
          onRedeem={() => handleRedeem('practice')}
          isRedeeming={redeemingType === 'practice'}
          showRedeemButton={showRedeemButtons}
        />
      </div>

      {/* Info Text */}
      <div className="px-6 pb-6">
        <p className="text-xs text-gray-500 text-center">
          استخدم أرصدتك للحصول على اختبارات أو تدريبات مجانية
        </p>
      </div>
    </div>
  )
}

// Compact version for inline display
interface CreditBadgeProps {
  examCredits: number
  practiceCredits: number
  className?: string
}

export function CreditBadge({ examCredits, practiceCredits, className }: CreditBadgeProps) {
  const total = examCredits + practiceCredits

  if (total === 0) return null

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50', className)}>
      <Coins className="w-4 h-4 text-amber-500" />
      <span className="text-sm font-medium text-amber-700">{total}</span>
    </div>
  )
}
