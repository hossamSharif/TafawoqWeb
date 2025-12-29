'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageLoadingSkeleton } from '@/components/shared'
import {
  getScoreTier,
} from '@/lib/utils/scoring'
import { TrendChart, type TrendDataPoint } from '@/components/analytics'
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  BookOpen,
  Crown,
  Users,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShareExamModal } from '@/components/forum/ShareExamModal'
import { QuestionReview } from '@/components/results/QuestionReview'

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

interface PremiumAnalytics {
  previousExam: {
    overallScore: number
    verbalScore: number
    quantitativeScore: number
    date: string
    improvement: {
      overall: number
      verbal: number
      quantitative: number
    }
  } | null
  peerPercentile: number | null
  examHistory: TrendDataPoint[]
  totalExamsTaken: number
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
    questionType: string
    stem: string
    passage?: string
    diagram?: any
    choices: [string, string, string, string]
    isAnswered: boolean
    selectedAnswer: number | null
    correctAnswer: number
    isCorrect: boolean
    timeSpentSeconds: number
    explanation: string
    solvingStrategy?: string
    tip?: string
  }[]
  isPremium?: boolean
  premiumAnalytics?: PremiumAnalytics | null
}

const CATEGORY_LABELS: Record<string, string> = {
  // Quantitative categories
  algebra: 'الجبر',
  geometry: 'الهندسة',
  statistics: 'الإحصاء',
  arithmetic: 'الحساب',
  ratios: 'النسب والتناسب',
  probability: 'الاحتمالات',
  speed_distance_time: 'السرعة والمسافة',

  // Verbal categories (with both underscore and hyphen variants)
  reading_comprehension: 'استيعاب المقروء',
  'reading-comprehension': 'استيعاب المقروء',
  sentence_completion: 'إكمال الجمل',
  'sentence-completion': 'إكمال الجمل',
  contextual_error: 'الخطأ السياقي',
  'context-error': 'الخطأ السياقي',
  verbal_analogy: 'التناظر اللفظي',
  'verbal-analogy': 'التناظر اللفظي',
  analogy: 'القياس',
  analogies: 'القياس',
  association_difference: 'الارتباط والاختلاف',
  'association-difference': 'الارتباط والاختلاف',
  vocabulary: 'المفردات',
  critical_reasoning: 'الاستدلال المنطقي',
  'critical-reasoning': 'الاستدلال المنطقي',
  text_completion: 'إكمال النص',
  'text-completion': 'إكمال النص',
  sentence_equivalence: 'التكافؤ اللفظي',
  'sentence-equivalence': 'التكافؤ اللفظي',
  error_detection: 'كشف الخطأ',
  'error-detection': 'كشف الخطأ',
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
  const [shareModalOpen, setShareModalOpen] = useState(false)

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
          <PageLoadingSkeleton />
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

  const { session, scores, analysis, isPremium, premiumAnalytics } = results
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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const reviewSection = document.getElementById('questions-review')
                  reviewSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                مراجعة الأسئلة
              </Button>
              <Button
                variant="default"
                onClick={() => setShareModalOpen(true)}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                مشاركة في المنتدى
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  العودة للوحة التحكم
                </Button>
              </Link>
            </div>
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

        {/* Premium Analytics Section */}
        {isPremium && premiumAnalytics && (
          <div className="space-y-6 mb-8">
            {/* Peer Percentile & Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Peer Percentile */}
              {premiumAnalytics.peerPercentile !== null && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-gray-900">ترتيبك بين الطلاب</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary mb-2">
                      {premiumAnalytics.peerPercentile}%
                    </p>
                    <p className="text-gray-600">
                      تفوقت على {premiumAnalytics.peerPercentile}% من الطلاب
                    </p>
                  </div>
                </div>
              )}

              {/* Previous Exam Comparison */}
              {premiumAnalytics.previousExam && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-gray-900">مقارنة بالاختبار السابق</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'الإجمالي', value: premiumAnalytics.previousExam.improvement.overall },
                      { label: 'الكمي', value: premiumAnalytics.previousExam.improvement.quantitative },
                      { label: 'اللفظي', value: premiumAnalytics.previousExam.improvement.verbal },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.label}</span>
                        <span
                          className={cn(
                            'font-bold flex items-center gap-1',
                            item.value > 0 ? 'text-green-600' : item.value < 0 ? 'text-red-600' : 'text-gray-500'
                          )}
                        >
                          {item.value > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : item.value < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : null}
                          {item.value > 0 ? '+' : ''}{item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    مقارنة مع اختبار {new Date(premiumAnalytics.previousExam.date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              )}
            </div>

            {/* Trend Chart */}
            {premiumAnalytics.examHistory.length >= 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-gray-900">تطور الأداء</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    <span>مميز</span>
                  </div>
                </div>
                <TrendChart
                  data={premiumAnalytics.examHistory}
                  height={280}
                  showVerbal={true}
                  showQuantitative={true}
                  showOverall={true}
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  آخر {premiumAnalytics.totalExamsTaken} اختبارات
                </p>
              </div>
            )}
          </div>
        )}

        {/* Premium Upsell for non-premium users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 mb-8 border border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">احصل على تحليلات متقدمة</h3>
                <p className="text-sm text-gray-600">ترقية للاشتراك المميز للحصول على:</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                تطور أدائك عبر الزمن (رسم بياني)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                مقارنة مع اختباراتك السابقة
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                ترتيبك بين جميع الطلاب
              </li>
            </ul>
            <Link href="/settings#subscription">
              <Button size="sm" className="gap-1 bg-yellow-600 hover:bg-yellow-700">
                <Crown className="w-4 h-4" />
                ترقية الآن
              </Button>
            </Link>
          </div>
        )}

        {/* Full Questions Review */}
        <div id="questions-review" className="bg-white rounded-xl shadow-sm mb-8">
          <QuestionReview
            questions={results.questions}
            sessionId={results.session.id}
            sessionType="exam"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center">
          <Link href="/dashboard">
            <Button size="lg" variant="outline">العودة للوحة التحكم</Button>
          </Link>
        </div>
      </main>

      {/* Share Modal */}
      {results && (
        <ShareExamModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          examSession={{
            id: sessionId,
            track: results.session.track as 'scientific' | 'literary',
            total_questions: results.session.totalQuestions,
            verbal_score: results.scores.verbal.score,
            quantitative_score: results.scores.quantitative.score,
            overall_score: results.scores.overall.score,
            questions: results.questions.map((q) => ({
              section: q.section,
              difficulty: q.difficulty,
              topic: q.topic,
            })),
          }}
          onShare={async (data) => {
            const response = await fetch('/api/forum/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                post_type: 'exam_share',
                title: data.title,
                body: data.body,
                shared_exam_id: sessionId,
                is_library_visible: true, // Make exam available in library
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              // API returns { error: 'message' } or { error: 'CODE', message: 'Arabic message' }
              const errorMessage = errorData.message || errorData.error || 'فشل في المشاركة'
              throw new Error(errorMessage)
            }
          }}
        />
      )}
    </div>
  )
}
