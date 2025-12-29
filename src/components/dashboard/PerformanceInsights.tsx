'use client'

import { TrendingUp, TrendingDown, Trophy, Target, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamHistoryItem {
  id: string
  date: string
  overall: number
}

interface PerformanceInsightsProps {
  examHistory: ExamHistoryItem[]
  className?: string
}

export function PerformanceInsights({ examHistory, className }: PerformanceInsightsProps) {
  if (examHistory.length === 0) {
    return null
  }

  // Calculate insights
  const totalExams = examHistory.length
  const latestScore = examHistory[0]?.overall || 0
  const averageScore =
    examHistory.reduce((sum, exam) => sum + exam.overall, 0) / totalExams

  // Calculate trend (last 3 vs previous 3)
  let trend = 0
  if (examHistory.length >= 2) {
    const recent = examHistory.slice(0, Math.min(3, examHistory.length))
    const older = examHistory.slice(Math.min(3, examHistory.length), Math.min(6, examHistory.length))

    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, e) => sum + e.overall, 0) / recent.length
      const olderAvg = older.reduce((sum, e) => sum + e.overall, 0) / older.length
      trend = recentAvg - olderAvg
    }
  }

  // Calculate streak (consecutive days/weeks with exams)
  const streak = calculateStreak(examHistory)

  // Get motivational message
  const message = getMotivationalMessage(latestScore, trend, totalExams)

  return (
    <div className={cn('bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6', className)}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {trend > 5 ? (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          ) : trend < -5 ? (
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        {/* Message & Stats */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">{message.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{message.body}</p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-500">متوسط الدرجات</p>
                <p className="font-bold text-primary">{Math.round(averageScore)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-500">آخر اختبار</p>
                <p className="font-bold text-yellow-600">{Math.round(latestScore)}%</p>
              </div>
            </div>

            {streak > 0 && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500">سلسلة النجاح</p>
                  <p className="font-bold text-orange-600">{streak} {streak === 1 ? 'يوم' : 'أيام'}</p>
                </div>
              </div>
            )}

            {trend !== 0 && (
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <div>
                  <p className="text-xs text-gray-500">الاتجاه</p>
                  <p
                    className={cn(
                      'font-bold',
                      trend > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend > 0 ? '+' : ''}{Math.round(trend)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateStreak(examHistory: ExamHistoryItem[]): number {
  if (examHistory.length === 0) return 0

  // Sort by date (most recent first)
  const sorted = [...examHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let streak = 0
  let currentDate = new Date()

  for (const exam of sorted) {
    const examDate = new Date(exam.date)
    const daysDiff = Math.floor(
      (currentDate.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // If exam is within last 7 days, count it
    if (daysDiff <= 7) {
      streak++
      currentDate = examDate
    } else {
      break
    }
  }

  return streak
}

function getMotivationalMessage(
  latestScore: number,
  trend: number,
  totalExams: number
): { title: string; body: string } {
  // First exam
  if (totalExams === 1) {
    return {
      title: 'بداية رائعة!',
      body: 'لقد أكملت أول اختبار. استمر في التدريب لتحسين أدائك.',
    }
  }

  // Strong improvement
  if (trend > 10) {
    return {
      title: 'تحسن ممتاز! 🎉',
      body: `لقد تحسن أداؤك بنسبة ${Math.round(trend)}%. استمر على هذا المنوال!`,
    }
  }

  // Moderate improvement
  if (trend > 5) {
    return {
      title: 'تقدم جيد! 👍',
      body: 'أداؤك في تحسن مستمر. واصل التدريب لتحقيق المزيد من التقدم.',
    }
  }

  // Declining performance
  if (trend < -5) {
    return {
      title: 'لا تستسلم! 💪',
      body: 'أداؤك يحتاج إلى بعض التحسين. راجع نقاط ضعفك وتدرب عليها.',
    }
  }

  // High score
  if (latestScore >= 85) {
    return {
      title: 'أداء رائع! ⭐',
      body: `درجتك ${Math.round(latestScore)}% ممتازة. حافظ على هذا المستوى العالي!`,
    }
  }

  // Good score
  if (latestScore >= 70) {
    return {
      title: 'أداء جيد! 👏',
      body: 'أنت تسير في الاتجاه الصحيح. استمر في التدريب للوصول إلى التميز.',
    }
  }

  // Needs improvement
  if (latestScore < 60) {
    return {
      title: 'استمر في المحاولة! 📚',
      body: 'كل تدريب يقربك من هدفك. راجع المواضيع الصعبة وتدرب عليها.',
    }
  }

  // Default
  return {
    title: 'واصل التقدم! 🎯',
    body: `لقد أكملت ${totalExams} اختبارات. كل تدريب يحسن من أدائك.`,
  }
}
