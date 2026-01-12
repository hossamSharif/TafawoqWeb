'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  SectionSelector,
  CategorySelector,
  DifficultySelector,
  QuestionCountSelector,
} from '@/components/practice'
import { PageLoadingSkeleton } from '@/components/shared'
import { MaintenanceBlock } from '@/components/shared/MaintenanceBanner'
import type { QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'

type WizardStep = 'section' | 'categories' | 'difficulty' | 'questionCount' | 'confirm'

const STEPS: WizardStep[] = ['section', 'categories', 'difficulty', 'questionCount', 'confirm']

// T049: Practice limit info from API
interface PracticeLimit {
  maxQuestions: number
  examSectionCount: number
}

interface PracticeLimits {
  quantitative: PracticeLimit
  verbal: PracticeLimit
}

interface MaintenanceStatus {
  enabled: boolean
  message: string | null
}

export default function NewPracticePage() {
  const router = useRouter()

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('section')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)

  // Form state
  const [section, setSection] = useState<QuestionSection | null>(null)
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | null>(null)
  const [questionCount, setQuestionCount] = useState(5)

  // T049: Practice limits state (FR-016, FR-017)
  const [practiceLimits, setPracticeLimits] = useState<PracticeLimits | null>(null)

  // T081: Maintenance status state
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null)

  // Check subscription status, maintenance status, and fetch practice limits
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch subscription, maintenance status, and practice limits in parallel
        const [subResponse, categoriesResponse, maintenanceResponse] = await Promise.all([
          fetch('/api/subscription'),
          fetch('/api/practice/categories'),
          fetch('/api/admin/maintenance'),
        ])

        if (subResponse.ok) {
          const subData = await subResponse.json()
          setIsPremium(subData.subscription?.tier === 'premium' && subData.subscription?.status === 'active')
        }

        // T049: Get practice limits from categories API
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          if (categoriesData.practiceLimits) {
            setPracticeLimits(categoriesData.practiceLimits)
          }
        }

        // T081: Get maintenance status
        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json()
          setMaintenanceStatus(maintenanceData)
        }
      } catch (error) {
        console.error('Initial data fetch error:', error)
      } finally {
        setCheckingSubscription(false)
      }
    }
    fetchInitialData()
  }, [])

  // Reset categories and adjust question count when section changes
  useEffect(() => {
    setCategories([])
    // T049: Reset question count to respect new section's practice limit
    if (section && practiceLimits) {
      const newLimit = practiceLimits[section].maxQuestions
      // Use functional update to avoid dependency on questionCount
      setQuestionCount(prevCount => Math.min(prevCount, newLimit))
    }
  }, [section, practiceLimits])

  // T049: Get current section's practice limit (FR-016, FR-017)
  const currentPracticeLimit = section && practiceLimits
    ? practiceLimits[section].maxQuestions
    : 100 // Default to 100 if no limits available

  const currentExamSectionCount = section && practiceLimits
    ? practiceLimits[section].examSectionCount
    : null

  const currentStepIndex = STEPS.indexOf(currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'section':
        return section !== null
      case 'categories':
        return categories.length > 0
      case 'difficulty':
        return difficulty !== null
      case 'questionCount':
        return questionCount >= 5
      case 'confirm':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceed()) return
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }

  const handleStartPractice = async () => {
    if (!section || categories.length === 0 || !difficulty) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          categories,
          difficulty,
          questionCount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for API configuration error
        if (data.errorCode === 'API_KEY_INVALID') {
          throw new Error('⚠️ خطأ في إعدادات النظام. يرجى التواصل مع الدعم الفني لإصلاح تكوين API.')
        }
        throw new Error(data.error || 'فشل في إنشاء جلسة التمرين')
      }

      // Store questions and session metadata in sessionStorage for the practice page
      sessionStorage.setItem(`practice_${data.session.id}`, JSON.stringify({
        questions: data.questions,
        _questionsWithAnswers: data._questionsWithAnswers,
        targetQuestionCount: data.session.targetQuestionCount || data.questions.length,
        generatedBatches: 1, // First batch (batch 0) was generated on session creation
      }))

      // Navigate to practice session
      router.push(`/practice/${data.session.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ غير متوقع')
      setIsLoading(false)
    }
  }

  if (checkingSubscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageLoadingSkeleton className="h-96" />
      </div>
    )
  }

  // T081: Show maintenance block if maintenance mode is active
  if (maintenanceStatus?.enabled) {
    return (
      <MaintenanceBlock
        message={maintenanceStatus.message}
        operation="practice_creation"
        onGoBack={() => router.push('/dashboard')}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تمرين مخصص جديد</h1>
        <p className="text-gray-600">اختر إعدادات التمرين الخاصة بك</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                  index < currentStepIndex
                    ? 'border-primary bg-primary text-white'
                    : index === currentStepIndex
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {index < currentStepIndex ? (
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 md:w-16 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>القسم</span>
          <span>التصنيفات</span>
          <span>الصعوبة</span>
          <span>العدد</span>
          <span>التأكيد</span>
        </div>
      </div>

      {/* Step content */}
      <Card className="p-6 mb-6">
        {currentStep === 'section' && (
          <SectionSelector value={section} onChange={setSection} />
        )}

        {currentStep === 'categories' && (
          <CategorySelector
            section={section}
            value={categories}
            onChange={setCategories}
            maxCategories={isPremium ? undefined : 2}
          />
        )}

        {currentStep === 'difficulty' && (
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        )}

        {currentStep === 'questionCount' && (
          <QuestionCountSelector
            value={questionCount}
            onChange={setQuestionCount}
            isPremium={isPremium}
            // T049: Pass practice limit based on selected section (FR-016, FR-017)
            max={currentPracticeLimit}
            examSectionCount={currentExamSectionCount}
            section={section}
          />
        )}

        {currentStep === 'confirm' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">مراجعة الإعدادات</h3>

            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-gray-600">القسم:</span>
                <span className="font-medium">
                  {section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">التصنيفات:</span>
                <span className="font-medium text-left" dir="ltr">
                  {categories.length} تصنيف
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">الصعوبة:</span>
                <span className="font-medium">
                  {difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">عدد الأسئلة:</span>
                <span className="font-medium">{questionCount} سؤال</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">الوقت المتوقع:</span>
                <span className="font-medium">~{Math.ceil(questionCount * 1.5)} دقيقة</span>
              </div>
            </div>

            {!isPremium && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>ملاحظة:</strong> كمستخدم مجاني، تم تطبيق القيود التالية:
                </p>
                <ul className="text-amber-700 text-sm mt-2 list-disc list-inside">
                  <li>عدد الأسئلة: 5 (بدلاً من {questionCount})</li>
                  <li>التصنيفات: {Math.min(categories.length, 2)} (بدلاً من {categories.length})</li>
                </ul>
                <Button
                  variant="link"
                  className="text-amber-800 p-0 h-auto mt-2"
                  onClick={() => router.push('/subscription')}
                >
                  ترقية للحساب المميز للحصول على المزيد
                </Button>
              </div>
            )}

            {/* T049: Show practice limit info for premium users */}
            {isPremium && currentExamSectionCount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>ملاحظة:</strong> الحد الأقصى للتمرين هو {currentPracticeLimit} سؤال
                  ({section === 'quantitative' ? 'القسم الكمي' : 'القسم اللفظي'} يحتوي على {currentExamSectionCount} سؤال في الاختبار)
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? () => router.back() : handleBack}
          disabled={isLoading}
        >
          {currentStepIndex === 0 ? 'إلغاء' : 'السابق'}
        </Button>

        {currentStep === 'confirm' ? (
          <Button
            onClick={handleStartPractice}
            disabled={isLoading || !canProceed()}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -mr-1 ml-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                جاري الإنشاء...
              </>
            ) : (
              'ابدأ التمرين'
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            التالي
          </Button>
        )}
      </div>
    </div>
  )
}
