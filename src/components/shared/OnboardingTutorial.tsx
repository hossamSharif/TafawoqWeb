'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileText,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Zap,
  Settings2,
  Award,
  BarChart3,
  Dumbbell,
  Library,
  MessageSquare,
  Gift,
  Share2,
  Users,
} from 'lucide-react'

interface OnboardingTutorialProps {
  onComplete: () => void
  /** If true, shows close button and different styling for replay mode */
  isReplay?: boolean
}

interface TutorialScreen {
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  primaryFeatures: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
  tips: string[]
}

const tutorialScreens: TutorialScreen[] = [
  // Screen 1: Full Exams vs. Customized Practice
  {
    title: 'نوعان من التدريب',
    subtitle: 'الاختبارات الكاملة vs التدريب المخصص',
    description: 'اختر الطريقة التي تناسب أسلوبك في التحضير',
    icon: <FileText className="h-16 w-16" />,
    primaryFeatures: [
      {
        icon: <Clock className="h-5 w-5" />,
        title: 'الاختبار الكامل',
        description: '96 سؤال في 120 دقيقة - محاكاة حقيقية لاختبار القدرات مع نتائج شاملة',
      },
      {
        icon: <Settings2 className="h-5 w-5" />,
        title: 'التدريب المخصص',
        description: 'اختر القسم والفئة والصعوبة وعدد الأسئلة - تمرن على نقاط ضعفك',
      },
      {
        icon: <Zap className="h-5 w-5" />,
        title: 'تغذية راجعة فورية',
        description: 'شرح مفصل بعد كل سؤال لتفهم الحل الصحيح',
      },
    ],
    tips: [
      'ابدأ باختبار كامل لمعرفة مستواك الحالي',
      'استخدم التدريب المخصص لتقوية نقاط الضعف',
      'المستخدم المجاني: اختبارين شهرياً و 3 تمارين',
    ],
  },
  // Screen 2: Academic Track explanation
  {
    title: 'المسار الأكاديمي',
    subtitle: 'أسئلة مخصصة حسب تخصصك',
    description: 'توزيع الأسئلة يختلف حسب المسار العلمي أو الأدبي',
    icon: <Target className="h-16 w-16" />,
    primaryFeatures: [
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'المسار العلمي',
        description: '~60% أسئلة كمية (رياضيات) و ~40% أسئلة لفظية (لغة عربية)',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'المسار الأدبي',
        description: '~30% أسئلة كمية (رياضيات) و ~70% أسئلة لفظية (لغة عربية)',
      },
      {
        icon: <Settings2 className="h-5 w-5" />,
        title: 'تغيير المسار',
        description: 'يمكنك تغيير مسارك في أي وقت من الملف الشخصي أو الإعدادات',
      },
    ],
    tips: [
      'اختر المسار المناسب لتخصصك في الثانوية',
      'التوزيع يعكس اختبار القدرات الفعلي',
      'التغيير يؤثر على الاختبارات الجديدة فقط',
    ],
  },
  // Screen 3: Library and Forum
  {
    title: 'المكتبة والمنتدى',
    subtitle: 'استفد من مجتمع الطلاب',
    description: 'تصفح اختبارات الآخرين وشارك في النقاشات',
    icon: <Library className="h-16 w-16" />,
    primaryFeatures: [
      {
        icon: <Library className="h-5 w-5" />,
        title: 'مكتبة الاختبارات',
        description: 'تصفح اختبارات وتمارين شاركها طلاب آخرون واستفد منها',
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        title: 'منتدى الطلاب',
        description: 'اطرح أسئلتك وناقش مع طلاب آخرين وشارك تجربتك',
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: 'مجتمع داعم',
        description: 'تواصل مع طلاب يشاركونك نفس الهدف وتبادلوا الخبرات',
      },
    ],
    tips: [
      'المستخدم المجاني يمكنه الوصول لاختبار واحد من المكتبة',
      'المشترك المميز لديه وصول غير محدود للمكتبة',
      'شارك في المنتدى لتستفيد من خبرات الآخرين',
    ],
  },
  // Screen 4: Rewards System
  {
    title: 'نظام المكافآت',
    subtitle: 'شارك واكسب',
    description: 'احصل على مكافآت عندما يستفيد الآخرون من محتواك',
    icon: <Gift className="h-16 w-16" />,
    primaryFeatures: [
      {
        icon: <Share2 className="h-5 w-5" />,
        title: 'شارك اختباراتك',
        description: 'شارك الاختبارات والتمارين التي أنشأتها مع المجتمع',
      },
      {
        icon: <Gift className="h-5 w-5" />,
        title: 'اكسب مكافآت',
        description: 'عندما يحل طالب آخر اختبارك تحصل على رصيد إضافي',
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: 'استخدم رصيدك',
        description: 'استخدم المكافآت لإنشاء المزيد من الاختبارات والتمارين',
      },
    ],
    tips: [
      'كلما شاركت أكثر، كسبت أكثر',
      'المحتوى عالي الجودة يجذب المزيد من المستخدمين',
      'تابع إشعاراتك لمعرفة متى تحصل على مكافأة',
    ],
  },
  // Screen 5: Three-score system and practice hours
  {
    title: 'نظام التقييم',
    subtitle: 'ثلاث درجات لمتابعة تقدمك',
    description: 'تتبع أداءك في القسمين الكمي واللفظي بشكل منفصل',
    icon: <TrendingUp className="h-16 w-16" />,
    primaryFeatures: [
      {
        icon: <Award className="h-5 w-5" />,
        title: 'درجة القسم الكمي',
        description: 'نسبتك في أسئلة الرياضيات والحساب والهندسة والإحصاء',
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: 'درجة القسم اللفظي',
        description: 'نسبتك في القراءة والتناظر وإكمال الجمل والخطأ السياقي',
      },
      {
        icon: <Dumbbell className="h-5 w-5" />,
        title: 'ساعات التمرين',
        description: 'إجمالي وقت تدريبك في التمارين المخصصة (لا تحتسب الاختبارات)',
      },
    ],
    tips: [
      '80%+ ذهبي | 60-79% أخضر | 40-59% رمادي | <40% برتقالي',
      'ركز على القسم الأضعف لتحسين المعدل العام',
      'المشتركون المميزون يرون رسوم بيانية للتقدم',
    ],
  },
]

export function OnboardingTutorial({ onComplete, isReplay = false }: OnboardingTutorialProps) {
  const [currentScreen, setCurrentScreen] = useState(0)

  const handleNext = useCallback(() => {
    if (currentScreen < tutorialScreens.length - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      onComplete()
    }
  }, [currentScreen, onComplete])

  const handlePrevious = useCallback(() => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1)
    }
  }, [currentScreen])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  const handleDotClick = useCallback((index: number) => {
    setCurrentScreen(index)
  }, [])

  const screen = tutorialScreens[currentScreen]
  const isLastScreen = currentScreen === tutorialScreens.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {currentScreen + 1} من {tutorialScreens.length}
            </span>
            {isReplay && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                إعادة المشاهدة
              </span>
            )}
          </div>
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="تخطي"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
              {screen.icon}
            </div>
            <h2 className="text-2xl font-bold mb-1">{screen.title}</h2>
            <p className="text-sm font-medium text-primary mb-2">{screen.subtitle}</p>
            <p className="text-muted-foreground">{screen.description}</p>
          </div>

          {/* Primary Features */}
          <div className="space-y-4 mb-6">
            {screen.primaryFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              نصائح
            </h4>
            <ul className="space-y-2">
              {screen.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {tutorialScreens.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === currentScreen
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`الانتقال للشاشة ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentScreen === 0}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>

          <Button
            onClick={handleNext}
            className={cn(
              'gap-2 min-w-[140px]',
              isLastScreen && 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80'
            )}
          >
            {isLastScreen ? (
              <>
                <Award className="h-4 w-4" />
                ابدأ التحضير
              </>
            ) : (
              <>
                التالي
                <ChevronLeft className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
