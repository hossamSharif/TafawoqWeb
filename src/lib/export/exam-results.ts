/**
 * Exam results export functionality
 * Supports exporting individual exam results as JSON or PDF (premium)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ExamExportData {
  exportDate: string
  exportVersion: string
  exam: {
    id: string
    track: string
    date: string
    timeSpentSeconds: number
    totalQuestions: number
    questionsAnswered: number
  }
  scores: {
    verbal: number
    quantitative: number
    overall: number
  }
  analysis: {
    categoryBreakdown: Array<{
      category: string
      correct: number
      total: number
      percentage: number
    }>
    difficultyBreakdown: Array<{
      difficulty: string
      correct: number
      total: number
      percentage: number
    }>
    strengths: string[]
    weaknesses: string[]
  }
  questions?: Array<{
    index: number
    section: string
    topic: string
    difficulty: string
    stem: string
    isCorrect: boolean
    selectedAnswer: number | null
    correctAnswer: number
  }>
}

/**
 * Fetch complete exam data for export
 */
export async function getExamDataForExport(
  supabase: SupabaseClient,
  examId: string,
  userId: string,
  includeQuestions: boolean = true
): Promise<ExamExportData | null> {
  // Fetch the exam session
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', examId)
    .eq('user_id', userId)
    .single()

  if (sessionError || !session) {
    console.error('Error fetching exam for export:', sessionError)
    return null
  }

  // Ensure exam is completed
  if (session.status !== 'completed') {
    console.error('Cannot export incomplete exam')
    return null
  }

  // Analyze questions for category and difficulty breakdown
  const questions = session.questions as Array<{
    index: number
    section: string
    topic?: string
    difficulty?: string
    stem: string
    answerIndex: number
    selectedAnswer?: number
  }>

  const categoryCount: Record<string, { correct: number; total: number }> = {}
  const difficultyCount: Record<string, { correct: number; total: number }> = {}
  const strengths: string[] = []
  const weaknesses: string[] = []

  questions.forEach((q) => {
    const category = q.topic || 'unknown'
    const difficulty = q.difficulty || 'unknown'
    const isCorrect = q.selectedAnswer === q.answerIndex

    // Count by category
    if (!categoryCount[category]) {
      categoryCount[category] = { correct: 0, total: 0 }
    }
    categoryCount[category].total++
    if (isCorrect) categoryCount[category].correct++

    // Count by difficulty
    if (!difficultyCount[difficulty]) {
      difficultyCount[difficulty] = { correct: 0, total: 0 }
    }
    difficultyCount[difficulty].total++
    if (isCorrect) difficultyCount[difficulty].correct++
  })

  // Determine strengths and weaknesses
  Object.entries(categoryCount).forEach(([category, { correct, total }]) => {
    const percentage = (correct / total) * 100
    if (percentage >= 75 && total >= 3) {
      strengths.push(category)
    } else if (percentage < 50 && total >= 3) {
      weaknesses.push(category)
    }
  })

  // Build category breakdown
  const categoryBreakdown = Object.entries(categoryCount).map(
    ([category, { correct, total }]) => ({
      category,
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    })
  )

  // Build difficulty breakdown
  const difficultyBreakdown = Object.entries(difficultyCount).map(
    ([difficulty, { correct, total }]) => ({
      difficulty,
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    })
  )

  // Build export data
  const exportData: ExamExportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    exam: {
      id: session.id,
      track: session.track,
      date: session.end_time || session.created_at,
      timeSpentSeconds: session.time_spent_seconds || 0,
      totalQuestions: session.total_questions || 96,
      questionsAnswered: session.questions_answered || 0,
    },
    scores: {
      verbal: session.verbal_score || 0,
      quantitative: session.quantitative_score || 0,
      overall: session.overall_score || 0,
    },
    analysis: {
      categoryBreakdown,
      difficultyBreakdown,
      strengths,
      weaknesses,
    },
  }

  // Optionally include full question details
  if (includeQuestions) {
    exportData.questions = questions.map((q) => ({
      index: q.index,
      section: q.section,
      topic: q.topic || 'unknown',
      difficulty: q.difficulty || 'unknown',
      stem: q.stem,
      isCorrect: q.selectedAnswer === q.answerIndex,
      selectedAnswer: q.selectedAnswer ?? null,
      correctAnswer: q.answerIndex,
    }))
  }

  return exportData
}

/**
 * Format exam data as JSON string
 */
export function formatExamAsJSON(data: ExamExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Generate filename for exam export
 */
export function generateExamExportFilename(
  examId: string,
  format: 'json' | 'pdf' = 'json'
): string {
  const date = new Date().toISOString().split('T')[0]
  const examIdShort = examId.slice(0, 8)
  return `tafawoq-exam-${examIdShort}-${date}.${format}`
}

/**
 * Convert exam data to a user-friendly text summary
 */
export function formatExamSummaryText(data: ExamExportData): string {
  const lines: string[] = []

  lines.push('='.repeat(50))
  lines.push('تقرير نتائج الاختبار - تفوق')
  lines.push('='.repeat(50))
  lines.push('')

  // Exam info
  lines.push('معلومات الاختبار:')
  lines.push(`  التاريخ: ${new Date(data.exam.date).toLocaleDateString('ar-SA')}`)
  lines.push(`  المسار: ${data.exam.track === 'scientific' ? 'علمي' : 'أدبي'}`)
  lines.push(
    `  عدد الأسئلة: ${data.exam.questionsAnswered} / ${data.exam.totalQuestions}`
  )
  lines.push(
    `  الوقت المستغرق: ${Math.floor(data.exam.timeSpentSeconds / 60)} دقيقة`
  )
  lines.push('')

  // Scores
  lines.push('الدرجات:')
  lines.push(`  اللفظي: ${data.scores.verbal}%`)
  lines.push(`  الكمي: ${data.scores.quantitative}%`)
  lines.push(`  الإجمالي: ${data.scores.overall}%`)
  lines.push('')

  // Strengths
  if (data.analysis.strengths.length > 0) {
    lines.push('نقاط القوة:')
    data.analysis.strengths.forEach((s) => {
      lines.push(`  - ${s}`)
    })
    lines.push('')
  }

  // Weaknesses
  if (data.analysis.weaknesses.length > 0) {
    lines.push('نقاط تحتاج تحسين:')
    data.analysis.weaknesses.forEach((w) => {
      lines.push(`  - ${w}`)
    })
    lines.push('')
  }

  // Category breakdown
  lines.push('الأداء حسب الفئة:')
  data.analysis.categoryBreakdown
    .sort((a, b) => b.percentage - a.percentage)
    .forEach((cat) => {
      lines.push(`  ${cat.category}: ${cat.percentage}% (${cat.correct}/${cat.total})`)
    })
  lines.push('')

  // Difficulty breakdown
  lines.push('الأداء حسب الصعوبة:')
  data.analysis.difficultyBreakdown
    .sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2 }
      return (
        (order[a.difficulty as keyof typeof order] ?? 3) -
        (order[b.difficulty as keyof typeof order] ?? 3)
      )
    })
    .forEach((diff) => {
      const diffName =
        diff.difficulty === 'easy'
          ? 'سهل'
          : diff.difficulty === 'medium'
          ? 'متوسط'
          : 'صعب'
      lines.push(`  ${diffName}: ${diff.percentage}% (${diff.correct}/${diff.total})`)
    })
  lines.push('')

  lines.push('='.repeat(50))
  lines.push(`تم التصدير في: ${new Date().toLocaleString('ar-SA')}`)
  lines.push('='.repeat(50))

  return lines.join('\n')
}

/**
 * Check if user has permission to export exam (premium feature for PDF)
 */
export async function canExportExam(
  supabase: SupabaseClient,
  userId: string,
  format: 'json' | 'pdf' = 'json'
): Promise<{ canExport: boolean; reason?: string }> {
  // JSON export is free for all users
  if (format === 'json') {
    return { canExport: true }
  }

  // PDF export requires premium subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .single()

  const hasPremium =
    subscription?.tier === 'premium' &&
    ['active', 'trialing'].includes(subscription?.status || '')

  if (!hasPremium) {
    return {
      canExport: false,
      reason: 'تصدير PDF متاح فقط للمشتركين المميزين',
    }
  }

  return { canExport: true }
}
