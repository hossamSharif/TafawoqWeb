'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Target, TrendingUp, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface OnboardingTutorialProps {
  onComplete: () => void
}

interface TutorialScreen {
  title: string
  description: string
  icon: React.ReactNode
  details: string[]
}

const tutorialScreens: TutorialScreen[] = [
  {
    title: 'الاختبارات التجريبية',
    description: 'اختبارات كاملة تحاكي اختبار القدرات الحقيقي',
    icon: <FileText className="h-16 w-16" />,
    details: [
      '96 سؤال (كمي ولفظي) في 120 دقيقة',
      'توزيع الأسئلة حسب مسارك الأكاديمي',
      'تغذية راجعة فورية بعد كل سؤال',
      'نتائج شاملة مع نقاط القوة والضعف',
    ],
  },
  {
    title: 'المسار الأكاديمي',
    description: 'أسئلة مخصصة حسب تخصصك',
    icon: <Target className="h-16 w-16" />,
    details: [
      'المسار العلمي: ~60% كمي، ~40% لفظي',
      'المسار الأدبي: ~30% كمي، ~70% لفظي',
      'يمكنك تغيير المسار من الإعدادات',
      'تمارين مخصصة لتقوية نقاط الضعف',
    ],
  },
  {
    title: 'نظام الدرجات',
    description: 'تتبع تقدمك بثلاث درجات منفصلة',
    icon: <TrendingUp className="h-16 w-16" />,
    details: [
      'درجة القسم الكمي (الرياضيات)',
      'درجة القسم اللفظي (اللغة العربية)',
      'المعدل العام (متوسط القسمين)',
      'ساعات التمرين لتتبع وقت التدريب',
    ],
  },
]

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentScreen, setCurrentScreen] = useState(0)

  const handleNext = () => {
    if (currentScreen < tutorialScreens.length - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const screen = tutorialScreens[currentScreen]
  const isLastScreen = currentScreen === tutorialScreens.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm text-muted-foreground">
            {currentScreen + 1} من {tutorialScreens.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {screen.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">{screen.title}</h2>
          <p className="text-muted-foreground mb-6">{screen.description}</p>

          {/* Details */}
          <ul className="text-right space-y-3 mb-8">
            {screen.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm">{detail}</span>
              </li>
            ))}
          </ul>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {tutorialScreens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentScreen
                    ? 'w-6 bg-primary'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentScreen === 0}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>

          <Button onClick={handleNext} className="gap-2">
            {isLastScreen ? 'ابدأ التحضير' : 'التالي'}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
