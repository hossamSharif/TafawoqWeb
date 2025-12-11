/**
 * Subscription and payment-related type definitions
 */

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

export interface Subscription {
  id: string
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status: SubscriptionStatus
  priceId?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  priceMonthly: number
  currency: string
  features: PlanFeature[]
  trialDays: number
  stripePriceId: string
}

export interface PlanFeature {
  key: string
  labelAr: string
  included: boolean
  limit?: number | string
}

export const FREE_PLAN: SubscriptionPlan = {
  id: 'free',
  name: 'Free Plan',
  nameAr: 'الخطة المجانية',
  description: 'Basic access to exam preparation',
  descriptionAr: 'وصول أساسي للتحضير للاختبار',
  priceMonthly: 0,
  currency: 'SAR',
  features: [
    { key: 'exams', labelAr: '3 اختبارات في الأسبوع', included: true, limit: 3 },
    { key: 'practice', labelAr: '5 أسئلة لكل تمرين', included: true, limit: 5 },
    { key: 'categories', labelAr: 'فئتين لكل تمرين', included: true, limit: 2 },
    { key: 'explanations', labelAr: 'الشروحات بعد 24 ساعة', included: true },
    { key: 'analytics', labelAr: 'تحليلات متقدمة', included: false },
    { key: 'export', labelAr: 'تصدير البيانات', included: false },
  ],
  trialDays: 0,
  stripePriceId: '',
}

export const PREMIUM_PLAN: SubscriptionPlan = {
  id: 'premium',
  name: 'Premium Plan',
  nameAr: 'الخطة المميزة',
  description: 'Full access to all features',
  descriptionAr: 'وصول كامل لجميع المميزات',
  priceMonthly: 49,
  currency: 'SAR',
  features: [
    { key: 'exams', labelAr: 'اختبارات غير محدودة', included: true },
    { key: 'practice', labelAr: 'حتى 100 سؤال لكل تمرين', included: true, limit: 100 },
    { key: 'categories', labelAr: 'جميع الفئات متاحة', included: true },
    { key: 'explanations', labelAr: 'شروحات فورية', included: true },
    { key: 'analytics', labelAr: 'تحليلات متقدمة', included: true },
    { key: 'export', labelAr: 'تصدير البيانات', included: true },
  ],
  trialDays: 3,
  stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
}

export interface CheckoutSession {
  sessionId: string
  url: string
}

export interface Invoice {
  id: string
  number: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  amountDue: number
  amountPaid: number
  currency: string
  createdAt: string
  paidAt?: string
  hostedInvoiceUrl?: string
  pdfUrl?: string
}

export interface UsageStats {
  weeklyExamCount: number
  weeklyExamLimit: number | null
  weekStartDate: string
  canTakeExam: boolean
  remainingExams: number | null
}
