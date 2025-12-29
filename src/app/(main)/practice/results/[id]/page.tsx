'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageLoadingSkeleton } from '@/components/shared'
import { Share2, BookOpen } from 'lucide-react'
import { ShareExamModal } from '@/components/forum/ShareExamModal'
import { QuestionReview } from '@/components/results/QuestionReview'

interface PracticeResults {
  sessionId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  answeredQuestions: number
  categoryBreakdown: Array<{
    category: string
    categoryLabel: string
    correct: number
    total: number
    accuracy: number
  }>
  strengths: Array<{ category: string; label: string; accuracy: number }>
  weaknesses: Array<{ category: string; label: string; accuracy: number }>
  improvementAdvice: string
  timeSpentSeconds: number
  section: string
  sectionLabel: string
  categories: Array<{ id: string; label: string }>
  difficulty: string
  difficultyLabel: string
  completedAt: string
  questions?: Array<{
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
    selectedAnswer: number | null
    correctAnswer: number
    isCorrect: boolean
    timeSpentSeconds: number
    explanation: string
    solvingStrategy?: string
    tip?: string
  }>
}

export default function PracticeResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PracticeResults | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/practice/${sessionId}/results`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'فشل في تحميل النتائج')
        }

        setResults(data.results)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'خطأ في تحميل النتائج')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [sessionId])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) {
      return secs > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${mins} دقيقة`
    }
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return remainingMins > 0 ? `${hours} ساعة و ${remainingMins} دقيقة` : `${hours} ساعة`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageLoadingSkeleton className="h-96" />
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error || 'لم يتم العثور على النتائج'}</p>
          <Button onClick={() => router.push('/dashboard')}>العودة للرئيسية</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">نتائج التمرين</h1>
            <p className="text-gray-600">أحسنت! لقد أكملت التمرين بنجاح</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const reviewSection = document.getElementById('questions-review')
                reviewSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              مراجعة الأسئلة
            </Button>
            <Button
              variant="default"
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              مشاركة في المنتدى
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>

      {/* Main Score Card */}
      <Card className={`p-8 text-center mb-6 ${getScoreBgColor(results.score)}`}>
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.score)}`}>
          {results.score}%
        </div>
        <div className="text-gray-700 text-lg">
          {results.correctAnswers} إجابة صحيحة من {results.totalQuestions}
        </div>
        <div className="text-gray-500 mt-2">
          الوقت المستغرق: {formatTime(results.timeSpentSeconds)}
        </div>
      </Card>

      {/* Session Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل التمرين</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500">القسم</div>
            <div className="font-medium">{results.sectionLabel}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500">الصعوبة</div>
            <div className="font-medium">{results.difficultyLabel}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <div className="text-sm text-gray-500">التصنيفات</div>
            <div className="font-medium flex flex-wrap gap-2 mt-1">
              {results.categories.map((cat) => (
                <span key={cat.id} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                  {cat.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      {results.categoryBreakdown.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الأداء حسب التصنيف</h2>
          <div className="space-y-4">
            {results.categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">{cat.categoryLabel}</span>
                  <span className={`font-medium ${getScoreColor(cat.accuracy)}`}>
                    {cat.accuracy}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.accuracy >= 80
                        ? 'bg-green-500'
                        : cat.accuracy >= 60
                          ? 'bg-yellow-500'
                          : cat.accuracy >= 40
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${cat.accuracy}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {cat.correct} / {cat.total} صحيح
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        {results.strengths.length > 0 && (
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              نقاط القوة
            </h3>
            <ul className="space-y-2">
              {results.strengths.map((s) => (
                <li key={s.category} className="flex items-center justify-between text-green-700">
                  <span>{s.label}</span>
                  <span className="font-medium">{s.accuracy}%</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Weaknesses */}
        {results.weaknesses.length > 0 && (
          <Card className="p-6 bg-orange-50 border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              نقاط التحسين
            </h3>
            <ul className="space-y-2">
              {results.weaknesses.map((w) => (
                <li key={w.category} className="flex items-center justify-between text-orange-700">
                  <span>{w.label}</span>
                  <span className="font-medium">{w.accuracy}%</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Improvement Advice */}
      {results.improvementAdvice && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            نصيحة للتحسين
          </h3>
          <p className="text-blue-700">{results.improvementAdvice}</p>
        </Card>
      )}

      {/* Questions Review */}
      {results.questions && results.questions.length > 0 && (
        <div id="questions-review" className="bg-white rounded-xl shadow-sm mb-6">
          <QuestionReview
            questions={results.questions}
            sessionId={results.sessionId}
            sessionType="practice"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push('/practice/new')} className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          تمرين جديد
        </Button>

        {results.weaknesses.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              // Navigate to practice with weak categories pre-selected
              const weakCategories = results.weaknesses.map((w) => w.category)
              sessionStorage.setItem('practice_preset', JSON.stringify({
                section: results.section,
                categories: weakCategories,
              }))
              router.push('/practice/new')
            }}
            className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            تمرن على نقاط الضعف
          </Button>
        )}
      </div>

      {/* Share Modal */}
      {results && (
        <ShareExamModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          practiceSession={{
            id: sessionId,
            section: results.section as 'verbal' | 'quantitative',
            difficulty: results.difficulty,
            total_questions: results.totalQuestions,
            correct_answers: results.correctAnswers,
            score: results.score,
            category: results.categories[0]?.label,
          }}
          onShare={async (data) => {
            const response = await fetch('/api/forum/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                post_type: 'exam_share',
                title: data.title,
                body: data.body,
                shared_practice_id: sessionId,
                is_library_visible: true, // Make practice available in library
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
