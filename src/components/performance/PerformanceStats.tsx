'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Trophy,
  Target,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceStatsProps {
  totalExams: number
  totalQuestions: number
  totalCorrect: number
  weeklyExamCount?: number
  averageScore: number
  bestScore: number
  className?: string
}

export function PerformanceStats({
  totalExams,
  totalQuestions,
  totalCorrect,
  weeklyExamCount,
  averageScore,
  bestScore,
  className,
}: PerformanceStatsProps) {
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

  const stats = [
    {
      icon: Trophy,
      label: 'إجمالي الاختبارات',
      value: totalExams.toString(),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'اختبارات مكتملة',
    },
    {
      icon: Target,
      label: 'متوسط الدرجات',
      value: `${Math.round(averageScore)}%`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'في جميع الاختبارات',
    },
    {
      icon: Award,
      label: 'أفضل درجة',
      value: `${Math.round(bestScore)}%`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'أعلى نتيجة حققتها',
    },
    {
      icon: CheckCircle,
      label: 'معدل الإجابات الصحيحة',
      value: `${Math.round(accuracy)}%`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: `${totalCorrect} من ${totalQuestions}`,
    },
    {
      icon: TrendingUp,
      label: 'إجمالي الأسئلة',
      value: totalQuestions.toString(),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'سؤال تم الإجابة عليه',
    },
    {
      icon: Clock,
      label: 'هذا الأسبوع',
      value: (weeklyExamCount || 0).toString(),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'اختبارات مكتملة',
    },
  ]

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.bgColor)}>
                  <Icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
