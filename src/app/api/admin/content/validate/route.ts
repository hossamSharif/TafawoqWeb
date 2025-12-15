// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import type { Question, QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'
import { QUANTITATIVE_CATEGORIES, VERBAL_CATEGORIES } from '@/types/question'

interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
  stats?: {
    totalQuestions: number
    byDifficulty: Record<string, number>
    byCategory: Record<string, number>
  }
}

const VALID_SECTIONS: QuestionSection[] = ['quantitative', 'verbal']
const VALID_DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']
const VALID_CATEGORIES: QuestionCategory[] = [...QUANTITATIVE_CATEGORIES, ...VERBAL_CATEGORIES]

function validateQuestion(question: unknown, index: number): string[] {
  const errors: string[] = []
  const q = question as Partial<Question>
  const qNum = (index + 1).toString()

  // Required fields
  if (!q.id || typeof q.id !== 'string') {
    errors.push(`سؤال ${qNum}: يجب أن يحتوي على معرف (id) من نوع نص`)
  }

  if (!q.section || !VALID_SECTIONS.includes(q.section)) {
    errors.push(`سؤال ${qNum}: القسم (section) يجب أن يكون "quantitative" أو "verbal"`)
  }

  if (!q.topic || !VALID_CATEGORIES.includes(q.topic)) {
    errors.push(`سؤال ${qNum}: التصنيف (topic) غير صالح`)
  }

  if (!q.difficulty || !VALID_DIFFICULTIES.includes(q.difficulty)) {
    errors.push(`سؤال ${qNum}: الصعوبة (difficulty) يجب أن تكون "easy" أو "medium" أو "hard"`)
  }

  if (!q.stem || typeof q.stem !== 'string' || q.stem.trim().length === 0) {
    errors.push(`سؤال ${qNum}: يجب أن يحتوي على نص السؤال (stem)`)
  }

  // Choices validation
  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    errors.push(`سؤال ${qNum}: يجب أن يحتوي على 4 خيارات بالضبط`)
  } else {
    const emptyChoices = q.choices.filter(c => !c || typeof c !== 'string' || c.trim().length === 0)
    if (emptyChoices.length > 0) {
      errors.push(`سؤال ${qNum}: جميع الخيارات يجب أن تكون نصوصاً غير فارغة`)
    }
  }

  // Answer index validation
  if (q.answerIndex === undefined || ![0, 1, 2, 3].includes(q.answerIndex as number)) {
    errors.push(`سؤال ${qNum}: فهرس الإجابة (answerIndex) يجب أن يكون 0 أو 1 أو 2 أو 3`)
  }

  if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
    errors.push(`سؤال ${qNum}: يجب أن يحتوي على شرح (explanation)`)
  }

  // Section-category consistency check
  if (q.section && q.topic) {
    const isQuantitative = QUANTITATIVE_CATEGORIES.includes(q.topic as typeof QUANTITATIVE_CATEGORIES[number])
    const isVerbal = VERBAL_CATEGORIES.includes(q.topic as typeof VERBAL_CATEGORIES[number])

    if (q.section === 'quantitative' && !isQuantitative) {
      errors.push(`سؤال ${qNum}: التصنيف "${q.topic}" لا ينتمي للقسم الكمي`)
    }
    if (q.section === 'verbal' && !isVerbal) {
      errors.push(`سؤال ${qNum}: التصنيف "${q.topic}" لا ينتمي للقسم اللفظي`)
    }
  }

  return errors
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, section, questions } = body

    const errors: string[] = []
    const warnings: string[] = []

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push('العنوان يجب أن يكون 3 أحرف على الأقل')
    }

    // Validate section
    if (!section || !VALID_SECTIONS.includes(section)) {
      errors.push('القسم يجب أن يكون "quantitative" أو "verbal"')
    }

    // Validate questions array
    if (!Array.isArray(questions)) {
      errors.push('الأسئلة يجب أن تكون مصفوفة')
      return NextResponse.json({ valid: false, errors })
    }

    if (questions.length === 0) {
      errors.push('يجب أن يحتوي المحتوى على سؤال واحد على الأقل')
      return NextResponse.json({ valid: false, errors })
    }

    if (questions.length > 100) {
      warnings.push(`عدد الأسئلة كبير (${questions.length}). قد يؤثر على الأداء.`)
    }

    // Validate each question
    questions.forEach((question, index) => {
      const questionErrors = validateQuestion(question, index)
      errors.push(...questionErrors)
    })

    // Check for duplicate IDs
    const ids = questions.map((q: Partial<Question>) => q.id).filter(Boolean)
    const duplicateIds = ids.filter((id: string, index: number) => ids.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      errors.push(`توجد معرفات مكررة: ${[...new Set(duplicateIds)].join(', ')}`)
    }

    // Check section consistency
    const sectionsInQuestions = [...new Set(questions.map((q: Partial<Question>) => q.section))]
    if (sectionsInQuestions.length > 1) {
      warnings.push('الأسئلة تنتمي لأقسام مختلفة. تأكد من أن هذا مقصود.')
    }

    // Calculate statistics if valid
    const stats = errors.length === 0 ? {
      totalQuestions: questions.length,
      byDifficulty: questions.reduce((acc: Record<string, number>, q: Partial<Question>) => {
        acc[q.difficulty || 'unknown'] = (acc[q.difficulty || 'unknown'] || 0) + 1
        return acc
      }, {}),
      byCategory: questions.reduce((acc: Record<string, number>, q: Partial<Question>) => {
        acc[q.topic || 'unknown'] = (acc[q.topic || 'unknown'] || 0) + 1
        return acc
      }, {}),
    } : undefined

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Limit errors shown
      warnings: warnings.length > 0 ? warnings : undefined,
      stats,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Content validation error:', error)
    return NextResponse.json(
      { valid: false, errors: ['حدث خطأ أثناء التحقق من المحتوى'] },
      { status: 500 }
    )
  }
}
