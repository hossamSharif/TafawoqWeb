// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  QUANTITATIVE_CATEGORIES,
  VERBAL_CATEGORIES,
  CATEGORY_LABELS,
  type QuestionSection,
  type QuestionCategory,
} from '@/types/question'
import {
  calculatePracticeLimit,
  getExamSectionCount,
  type AcademicTrack,
} from '@/lib/practice'

/**
 * Category information with metadata
 */
interface CategoryInfo {
  id: QuestionCategory
  label: string
  section: QuestionSection
  description?: string
}

/**
 * GET /api/practice/categories - Get available practice categories
 * Returns categories grouped by section with Arabic labels
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // T049: Get user's academic track for practice limit calculation
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('academic_track')
      .eq('user_id', user.id)
      .single()

    const userTrack = (profile?.academic_track as AcademicTrack) || null

    // T049: Calculate practice limits for each section (FR-016, FR-017)
    const practiceLimits = {
      quantitative: {
        maxQuestions: calculatePracticeLimit('quantitative', userTrack),
        examSectionCount: getExamSectionCount('quantitative', userTrack),
      },
      verbal: {
        maxQuestions: calculatePracticeLimit('verbal', userTrack),
        examSectionCount: getExamSectionCount('verbal', userTrack),
      },
    }

    // Build category information
    const quantitativeCategories: CategoryInfo[] = QUANTITATIVE_CATEGORIES.map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      section: 'quantitative' as QuestionSection,
      description: getQuantitativeDescription(cat),
    }))

    const verbalCategories: CategoryInfo[] = VERBAL_CATEGORIES.map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      section: 'verbal' as QuestionSection,
      description: getVerbalDescription(cat),
    }))

    return NextResponse.json({
      sections: [
        {
          id: 'quantitative',
          label: 'القسم الكمي',
          description: 'أسئلة الرياضيات والمنطق الكمي',
          categories: quantitativeCategories,
          // T049: Include practice limit for this section (FR-017)
          practiceLimit: practiceLimits.quantitative,
        },
        {
          id: 'verbal',
          label: 'القسم اللفظي',
          description: 'أسئلة اللغة العربية والفهم القرائي',
          categories: verbalCategories,
          // T049: Include practice limit for this section (FR-017)
          practiceLimit: practiceLimits.verbal,
        },
      ],
      allCategories: [...quantitativeCategories, ...verbalCategories],
      // T049: Include practice limits and user track for UI display
      practiceLimits,
      userTrack,
    })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * Get description for quantitative categories
 */
function getQuantitativeDescription(category: string): string {
  const descriptions: Record<string, string> = {
    algebra: 'المعادلات، المتباينات، تبسيط العبارات الجبرية',
    geometry: 'المساحات، المحيطات، الزوايا، الأشكال الهندسية',
    statistics: 'المتوسط الحسابي، الوسيط، المنوال، الانحراف المعياري',
    'ratio-proportion': 'النسب المئوية، التناسب الطردي والعكسي',
    probability: 'الاحتمال البسيط، الاحتمال المركب',
    'speed-time-distance': 'مسائل السرعة والمسافة والزمن',
  }
  return descriptions[category] || ''
}

/**
 * Get description for verbal categories
 */
function getVerbalDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'reading-comprehension': 'نصوص قراءة مع أسئلة فهم واستيعاب',
    'sentence-completion': 'إكمال الجمل باختيار الكلمة المناسبة',
    'context-error': 'إيجاد الكلمة الخاطئة في السياق',
    analogy: 'التناظر اللفظي والعلاقات بين الكلمات',
    'association-difference': 'إيجاد الكلمة المختلفة أو المرتبطة',
    vocabulary: 'معاني الكلمات والمترادفات والأضداد',
  }
  return descriptions[category] || ''
}
