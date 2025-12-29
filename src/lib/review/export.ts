import type { ReviewQuestion } from '@/components/results/QuestionReview'
import type { ReviewFilters } from '@/types/review'

export type ExportFormat = 'json' | 'pdf'

export type ExportFilterType = 'all' | 'incorrect' | 'bookmarked' | 'current-filter'

export interface ExportOptions {
  format: ExportFormat
  filterType: ExportFilterType
  includeExplanations: boolean
  includeNotes: boolean
}

export interface ExportData {
  sessionId: string
  sessionType: 'exam' | 'practice'
  exportedAt: string
  totalQuestions: number
  exportedQuestions: number
  options: ExportOptions
  questions: ExportedQuestion[]
}

export interface ExportedQuestion {
  questionNumber: number
  section: string
  topic: string
  difficulty: string
  stem: string
  passage?: string
  choices: [string, string, string, string]
  selectedAnswer: number | null
  correctAnswer: number
  isCorrect: boolean
  timeSpentSeconds: number
  explanation?: string
  solvingStrategy?: string
  tip?: string
  personalNote?: string
}

/**
 * Prepare questions for export based on filter options
 */
export function prepareExportData(
  sessionId: string,
  sessionType: 'exam' | 'practice',
  allQuestions: ReviewQuestion[],
  filteredQuestions: ReviewQuestion[],
  options: ExportOptions,
  bookmarks: Set<number>,
  notes: Map<number, string>
): ExportData {
  // Select questions based on filter type
  let questionsToExport: ReviewQuestion[] = []

  switch (options.filterType) {
    case 'all':
      questionsToExport = allQuestions
      break
    case 'incorrect':
      questionsToExport = allQuestions.filter(
        (q) => !q.isCorrect && q.selectedAnswer !== null
      )
      break
    case 'bookmarked':
      questionsToExport = allQuestions.filter((q) => bookmarks.has(q.index))
      break
    case 'current-filter':
      questionsToExport = filteredQuestions
      break
  }

  // Map to exported format
  const exportedQuestions: ExportedQuestion[] = questionsToExport.map((q) => {
    const baseQuestion: ExportedQuestion = {
      questionNumber: q.index + 1,
      section: q.section,
      topic: q.topic,
      difficulty: q.difficulty,
      stem: q.stem,
      passage: q.passage,
      choices: q.choices,
      selectedAnswer: q.selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: q.isCorrect,
      timeSpentSeconds: q.timeSpentSeconds,
    }

    // Add explanations if requested
    if (options.includeExplanations) {
      baseQuestion.explanation = q.explanation
      baseQuestion.solvingStrategy = q.solvingStrategy
      baseQuestion.tip = q.tip
    }

    // Add personal notes if requested
    if (options.includeNotes) {
      const note = notes.get(q.index)
      if (note) {
        baseQuestion.personalNote = note
      }
    }

    return baseQuestion
  })

  return {
    sessionId,
    sessionType,
    exportedAt: new Date().toISOString(),
    totalQuestions: allQuestions.length,
    exportedQuestions: exportedQuestions.length,
    options,
    questions: exportedQuestions,
  }
}

/**
 * Download JSON file
 */
export function downloadJSON(data: ExportData, filename: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generate PDF filename based on session type and timestamp
 */
export function generateFilename(
  sessionType: 'exam' | 'practice',
  format: ExportFormat,
  filterType: ExportFilterType
): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const typeLabel = sessionType === 'exam' ? 'exam' : 'practice'
  const filterLabel =
    filterType === 'all'
      ? 'all'
      : filterType === 'incorrect'
      ? 'incorrect'
      : filterType === 'bookmarked'
      ? 'bookmarked'
      : 'filtered'

  return `tafawqoq-${typeLabel}-review-${filterLabel}-${timestamp}.${format}`
}

/**
 * Build export API URL with query parameters
 */
export function buildExportURL(
  sessionId: string,
  sessionType: 'exam' | 'practice',
  options: ExportOptions
): string {
  const baseURL =
    sessionType === 'exam'
      ? `/api/exams/${sessionId}/export`
      : `/api/practice/${sessionId}/export`

  const params = new URLSearchParams()
  params.set('format', options.format)
  params.set('filter', options.filterType)
  params.set('includeExplanations', String(options.includeExplanations))
  params.set('includeNotes', String(options.includeNotes))

  return `${baseURL}?${params.toString()}`
}

/**
 * Get export preview text
 */
export function getExportPreviewText(
  questionCount: number,
  options: ExportOptions
): string {
  const formatText = options.format === 'pdf' ? 'PDF' : 'JSON'
  const filterText =
    options.filterType === 'all'
      ? 'جميع الأسئلة'
      : options.filterType === 'incorrect'
      ? 'الأسئلة الخاطئة فقط'
      : options.filterType === 'bookmarked'
      ? 'الأسئلة المُؤشرة فقط'
      : 'الأسئلة المُفلترة الحالية'

  const includesText = []
  if (options.includeExplanations) includesText.push('التفسيرات')
  if (options.includeNotes) includesText.push('الملاحظات الشخصية')

  let text = `سيتم تصدير ${questionCount} سؤال (${filterText}) بتنسيق ${formatText}`

  if (includesText.length > 0) {
    text += ` مع ${includesText.join(' و ')}`
  }

  return text
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  filterType: 'all',
  includeExplanations: true,
  includeNotes: true,
}
