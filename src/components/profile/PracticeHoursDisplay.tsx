'use client'

import { Clock, CheckCircle2, BookOpen, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PracticeStats {
  totalPracticeHours: number
  totalExams: number
  totalQuestions: number
  totalCorrect: number
  weeklyExamCount?: number
}

interface PracticeHoursDisplayProps {
  stats: PracticeStats
  className?: string
}

function StatCard({
  icon: Icon,
  value,
  label,
  suffix = '',
  highlight = false,
}: {
  icon: React.ElementType
  value: number | string
  label: string
  suffix?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'text-center p-4 rounded-lg',
        highlight ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'
      )}
    >
      <div className="flex justify-center mb-2">
        <Icon
          className={cn(
            'w-5 h-5',
            highlight ? 'text-primary' : 'text-gray-400'
          )}
        />
      </div>
      <p
        className={cn(
          'text-2xl font-bold',
          highlight ? 'text-primary' : 'text-gray-800'
        )}
      >
        {value}
        {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export function PracticeHoursDisplay({ stats, className }: PracticeHoursDisplayProps) {
  const accuracyRate = stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0

  // Format practice hours nicely
  const formatHours = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return { value: minutes, suffix: ' د' }
    }
    return { value: hours.toFixed(1), suffix: ' س' }
  }

  const practiceHoursFormatted = formatHours(stats.totalPracticeHours)

  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900">إحصائيات التدريب</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          value={practiceHoursFormatted.value}
          suffix={practiceHoursFormatted.suffix}
          label="ساعات التدريب"
          highlight={true}
        />

        <StatCard
          icon={BookOpen}
          value={stats.totalExams}
          label="اختبارات مكتملة"
        />

        <StatCard
          icon={CheckCircle2}
          value={stats.totalQuestions}
          label="أسئلة مجابة"
        />

        <StatCard
          icon={Target}
          value={accuracyRate}
          suffix="%"
          label="معدل الصحة"
        />
      </div>

      {/* Weekly Progress Bar */}
      {stats.weeklyExamCount !== undefined && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">اختبارات هذا الأسبوع</span>
            <span className="font-medium">{stats.weeklyExamCount} / 3</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                stats.weeklyExamCount >= 3 ? 'bg-yellow-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min((stats.weeklyExamCount / 3) * 100, 100)}%` }}
            />
          </div>
          {stats.weeklyExamCount >= 3 && (
            <p className="text-xs text-yellow-600 mt-1">
              وصلت للحد الأسبوعي - ترقية للمميز للحصول على اختبارات غير محدودة
            </p>
          )}
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg">
        <p className="text-sm text-gray-600">
          {stats.totalPracticeHours < 1 && 'ابدأ رحلة التدريب الآن!'}
          {stats.totalPracticeHours >= 1 && stats.totalPracticeHours < 5 && 'بداية رائعة! استمر في التدريب.'}
          {stats.totalPracticeHours >= 5 && stats.totalPracticeHours < 10 && 'أداء ممتاز! أنت في الطريق الصحيح.'}
          {stats.totalPracticeHours >= 10 && stats.totalPracticeHours < 20 && 'مجهود مميز! تقدمك واضح.'}
          {stats.totalPracticeHours >= 20 && 'أنت نجم! استمر في التألق.'}
        </p>
      </div>
    </div>
  )
}
