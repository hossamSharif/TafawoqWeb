'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/shared'
import {
  getScoreColor,
  getScoreLabel,
  getScoreBgClass,
  formatTimeArabic,
} from '@/lib/utils/scoring'
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreData {
  score: number
  correct: number
  total: number
  tier: string
  color: string
  label: string
}

interface CategoryData {
  category: string
  correct: number
  total: number
  percentage: number
  tier: string
  color: string
}

interface ExamResults {
  session: {
    id: string
    track: string
    startTime: string
    endTime: string
    totalQuestions: number
    questionsAnswered: number
    timeSpentSeconds: number
    timeFormatted: string
  }
  scores: {
    verbal: ScoreData
    quantitative: ScoreData
    overall: ScoreData
  }
  analysis: {
    strengths: string[]
    weaknesses: string[]
    categoryBreakdown: CategoryData[]
    difficultyBreakdown: {
      difficulty: string
      correct: number
      total: number
      percentage: number
    }[]
  }
  questions: {
    index: number
    questionId: string
    section: string
    topic: string
    difficulty: string
    stem: string
    isAnswered: boolean
    selectedAnswer: number | null
    correctAnswer: number
    isCorrect: boolean
  }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  algebra: 'الجبر',
  geometry: 'الهندسة',
  statistics: 'الإحصاء',
  ratios: 'النسب والتناسب',
  probability: 'الاحتمالات',
  speed_distance_time: 'السرعة والمسافة',
  reading_comprehension: 'استيعاب المقروء',
  sentence_completion: 'إكمال الجمل',
  contextual_error: 'الخطأ السياقي',
  verbal_analogy: 'التناظر اللفظي',
  association_difference: 'الارتباط والاختلاف',
  vocabulary: 'المفردات',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

function ScoreCircle({
  score,
  label,
  color,
  size = 'large',
}: {
  score: number
  label: string
  color: string
  size?: 'large' | 'small'
}) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('relative', size === 'large' ? 'w-40 h-40' : 'w-24 h-24')}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={size === 'large' ? '10' : '6'}
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke={color}
          strokeWidth={size === 'large' ? '10' : '6'}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-bold',
            size === 'large' ? 'text-4xl' : 'text-xl'
          )}
          style={{ color }}
        >
          {score}%
        </span>
        <span
          className={cn(
            'text-gray-600',
            size === 'large' ? 'text-sm' : 'text-xs'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export default function ExamResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [results, setResults] = useState<ExamResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/exams/${sessionId}/results`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'فشل في تحميل النتائج')
        }

        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <LoadingSkeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-3 gap-6 mb-8">
            <LoadingSkeleton className="h-48" />
            <LoadingSkeleton className="h-48" />
            <LoadingSkeleton className="h-48" />
          </div>
          <LoadingSkeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error || 'لم يتم العثور على النتائج'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  const { session, scores, analysis } = results
  const visibleCategories = showAllCategories
    ? analysis.categoryBreakdown
    : analysis.categoryBreakdown.slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">نتائج الاختبار</h1>
              <p className="text-gray-500 mt-1">
                المسار: {session.track === 'scientific' ? 'علمي' : 'أدبي'} •{' '}
                {new Date(session.endTime).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Main Scores */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold">النتيجة الإجمالية</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Overall Score */}
            <div className="text-center">
              <ScoreCircle
                score={scores.overall.score}
                label={scores.overall.label}
                color={scores.overall.color}
                size="large"
              />
              <p className="mt-4 text-gray-600">
                {scores.overall.correct} من {scores.overall.total} إجابة صحيحة
              </p>
            </div>

            {/* Section Scores */}
            <div className="flex gap-8">
              <div className="text-center">
                <ScoreCircle
                  score={scores.quantitative.score}
                  label="كمي"
                  color={scores.quantitative.color}
                  size="small"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {scores.quantitative.correct}/{scores.quantitative.total}
                </p>
              </div>
              <div className="text-center">
                <ScoreCircle
                  score={scores.verbal.score}
                  label="لفظي"
                  color={scores.verbal.color}
                  size="small"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {scores.verbal.correct}/{scores.verbal.total}
                </p>
              </div>
            </div>
          </div>

          {/* Time Spent */}
          <div className="flex items-center justify-center gap-2 mt-8 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>الوقت المستغرق: {session.timeFormatted}</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-gray-900">نقاط القوة</h3>
            </div>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analysis.strengths.map((strength, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {CATEGORY_LABELS[strength] || strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">لا توجد نقاط قوة واضحة بعد</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">نقاط تحتاج تحسين</h3>
            </div>
            {analysis.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg"
                  >
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    {CATEGORY_LABELS[weakness] || weakness}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">أداء متوازن في جميع المجالات</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">تفصيل حسب التصنيف</h3>
          </div>

          <div className="space-y-4">
            {visibleCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {CATEGORY_LABELS[cat.category] || cat.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {cat.correct}/{cat.total} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {analysis.categoryBreakdown.length > 6 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-4 flex items-center gap-1 text-primary text-sm hover:underline"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  عرض الكل ({analysis.categoryBreakdown.length})
                </>
              )}
            </button>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">الأداء حسب الصعوبة</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {analysis.difficultyBreakdown.map((diff) => (
              <div
                key={diff.difficulty}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <p className="font-medium text-gray-800 mb-1">
                  {DIFFICULTY_LABELS[diff.difficulty]}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {diff.percentage}%
                </p>
                <p className="text-xs text-gray-500">
                  {diff.correct}/{diff.total}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-gray-900">مراجعة الأسئلة</h3>
            </div>
            {showQuestions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showQuestions && (
            <div className="mt-6 space-y-3">
              {results.questions.map((q) => (
                <div
                  key={q.index}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg border',
                    q.isCorrect
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      q.isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {q.index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{q.stem}</p>
                    <p className="text-xs text-gray-500">
                      {q.section === 'quantitative' ? 'كمي' : 'لفظي'} •{' '}
                      {CATEGORY_LABELS[q.topic] || q.topic}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      q.isCorrect ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {q.isCorrect ? 'صحيح' : 'خطأ'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">العودة للوحة التحكم</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
