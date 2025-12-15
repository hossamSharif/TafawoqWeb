/**
 * Brand Configuration for Qudratak - قدراتك
 *
 * Centralized branding constants for the Platform Upgrade V2 feature.
 * Use these values throughout the application instead of hardcoding brand-specific strings.
 */

export const brand = {
  // App Name
  name: {
    full: 'Qudratak - قدراتك',
    english: 'Qudratak',
    arabic: 'قدراتك',
    meaning: 'Your Abilities', // Translation meaning
  },

  // Taglines
  tagline: {
    primary: 'اكتشف قدراتك الحقيقية',
    primaryEnglish: 'Discover Your True Abilities',
    secondary: 'منصة التحضير للقدرات الذكية',
    secondaryEnglish: 'Smart Qudrat Preparation Platform',
  },

  // SEO & Meta
  meta: {
    title: 'قدراتك - منصة التحضير للقدرات',
    titleEnglish: 'Qudratak - Qudrat Preparation Platform',
    description: 'منصة ذكية للتحضير لاختبار القدرات العامة مع اختبارات تفاعلية ومكتبة محتوى مشترك',
    descriptionEnglish: 'Smart platform for Qudrat exam preparation with interactive exams and shared content library',
    keywords: ['قدرات', 'اختبار القدرات', 'تحضير', 'قدراتك', 'تمارين', 'اختبارات'],
  },

  // Colors (semantic brand colors)
  colors: {
    primary: '#3B82F6', // Blue-500
    primaryDark: '#1D4ED8', // Blue-700
    secondary: '#10B981', // Emerald-500
    accent: '#F59E0B', // Amber-500
    background: '#F8FAFC', // Slate-50
    text: '#1E293B', // Slate-800
  },

  // Subscription Plans
  subscription: {
    free: {
      name: 'مجاني',
      nameEnglish: 'Free',
      price: 0,
      currency: 'SAR',
      limits: {
        examsPerMonth: 2,
        practicesPerMonth: 3,
        examSharesPerMonth: 2,
        practiceSharesPerMonth: 3,
        libraryAccessCount: 1, // Free users can access only 1 library exam ever
      },
    },
    premium: {
      name: 'مميز',
      nameEnglish: 'Premium',
      price: 49,
      originalPrice: 100, // For strikethrough display
      currency: 'SAR',
      limits: {
        examsPerMonth: 10,
        practicesPerMonth: 15,
        examSharesPerMonth: 10,
        practiceSharesPerMonth: 15,
        libraryAccessCount: null, // Unlimited
      },
    },
  },

  // Features for landing page
  features: [
    {
      id: 'ai-exams',
      titleAr: 'اختبارات ذكية',
      titleEn: 'AI-Powered Exams',
      descriptionAr: 'اختبارات مولدة بالذكاء الاصطناعي تتكيف مع مستواك',
      descriptionEn: 'AI-generated exams that adapt to your level',
      icon: 'Brain',
    },
    {
      id: 'library',
      titleAr: 'مكتبة المحتوى',
      titleEn: 'Content Library',
      descriptionAr: 'استفد من اختبارات الآخرين واكسب نقاط عند مشاركة محتواك',
      descriptionEn: 'Access shared exams and earn credits when others use yours',
      icon: 'Library',
    },
    {
      id: 'forum',
      titleAr: 'منتدى الطلاب',
      titleEn: 'Student Forum',
      descriptionAr: 'تواصل مع طلاب آخرين وشارك خبراتك',
      descriptionEn: 'Connect with other students and share experiences',
      icon: 'Users',
    },
    {
      id: 'practice',
      titleAr: 'تمارين متنوعة',
      titleEn: 'Diverse Practice',
      descriptionAr: 'تمارين في جميع أقسام اختبار القدرات',
      descriptionEn: 'Practice exercises for all Qudrat exam sections',
      icon: 'Target',
    },
    {
      id: 'rewards',
      titleAr: 'نظام المكافآت',
      titleEn: 'Reward System',
      descriptionAr: 'اكسب نقاط إضافية عندما يستفيد الآخرون من محتواك',
      descriptionEn: 'Earn extra credits when others benefit from your content',
      icon: 'Gift',
    },
    {
      id: 'analytics',
      titleAr: 'تحليل الأداء',
      titleEn: 'Performance Analytics',
      descriptionAr: 'تتبع تقدمك وحدد نقاط القوة والضعف',
      descriptionEn: 'Track your progress and identify strengths and weaknesses',
      icon: 'BarChart',
    },
  ],

  // Social links (placeholders - update with actual URLs)
  social: {
    twitter: '',
    instagram: '',
    email: 'support@qudratak.app',
  },

  // Legal
  legal: {
    companyName: 'Qudratak',
    copyrightYear: new Date().getFullYear(),
  },
} as const

// Type exports for type-safe usage
export type BrandConfig = typeof brand
export type SubscriptionTier = keyof typeof brand.subscription
export type Feature = (typeof brand.features)[number]

// Helper functions
export function formatPrice(tier: SubscriptionTier): string {
  const plan = brand.subscription[tier]
  if (plan.price === 0) {
    return 'مجاناً'
  }
  return `${plan.price} ${plan.currency}`
}

export function formatPriceWithOriginal(tier: SubscriptionTier): {
  current: string
  original: string | null
} {
  if (tier === 'free') {
    return { current: 'مجاناً', original: null }
  }
  const plan = brand.subscription.premium
  return {
    current: `${plan.price} ${plan.currency}`,
    original: plan.originalPrice ? `${plan.originalPrice} ${plan.currency}` : null,
  }
}

export function getLimitText(
  tier: SubscriptionTier,
  limitKey: keyof (typeof brand.subscription.free.limits)
): string {
  const limit = brand.subscription[tier].limits[limitKey]
  if (limit === null) {
    return 'غير محدود'
  }
  return String(limit)
}
