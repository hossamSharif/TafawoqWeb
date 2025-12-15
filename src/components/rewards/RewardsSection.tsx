'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gift, Loader2 } from 'lucide-react'
import { CreditBalance } from './CreditBalance'
import { RewardProgress } from './RewardProgress'

interface RewardsData {
  exam_credits: number
  practice_credits: number
  total_completions: number
  next_milestone: number
  progress_to_next: number
  total_shares: number
}

interface RewardsSectionProps {
  className?: string
}

export function RewardsSection({ className }: RewardsSectionProps) {
  const [rewards, setRewards] = useState<RewardsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRewards = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/rewards')
      if (!response.ok) {
        throw new Error('Failed to fetch rewards')
      }
      const data = await response.json()
      setRewards(data)
    } catch (err) {
      console.error('Error fetching rewards:', err)
      setError('فشل في تحميل بيانات المكافآت')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  const handleRedeemCredit = async (creditType: 'exam' | 'practice') => {
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credit_type: creditType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل استخدام الرصيد')
      }

      // Update local state
      setRewards(prev => prev ? {
        ...prev,
        exam_credits: data.exam_credits,
        practice_credits: data.practice_credits,
      } : null)

      alert(creditType === 'exam' ? 'تم استخدام رصيد الاختبار بنجاح' : 'تم استخدام رصيد التدريب بنجاح')
    } catch (err) {
      console.error('Redeem error:', err)
      alert(err instanceof Error ? err.message : 'فشل استخدام الرصيد')
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">المكافآت والأرصدة</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !rewards) {
    return null // Silently fail - rewards section is optional
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">المكافآت والأرصدة</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CreditBalance
          examCredits={rewards.exam_credits}
          practiceCredits={rewards.practice_credits}
          onRedeem={handleRedeemCredit}
          showRedeemButtons={true}
        />
        <RewardProgress
          totalCompletions={rewards.total_completions}
          nextMilestone={rewards.next_milestone}
          progressToNext={rewards.progress_to_next}
          variant="card"
        />
      </div>
    </div>
  )
}
