/**
 * Question-related type definitions
 */

export type QuestionSection = 'quantitative' | 'verbal'

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export type QuestionType = 'mcq' | 'diagram' | 'chart' | 'overlapping-diagram' | 'text-only' | 'reading-passage'

// Quantitative categories
export type QuantitativeCategory =
  | 'algebra'
  | 'geometry'
  | 'statistics'
  | 'ratio-proportion'
  | 'probability'
  | 'speed-time-distance'

// Verbal categories
export type VerbalCategory =
  | 'reading-comprehension'
  | 'sentence-completion'
  | 'context-error'
  | 'analogy'
  | 'association-difference'
  | 'vocabulary'

export type QuestionCategory = QuantitativeCategory | VerbalCategory

export const QUANTITATIVE_CATEGORIES: QuantitativeCategory[] = [
  'algebra',
  'geometry',
  'statistics',
  'ratio-proportion',
  'probability',
  'speed-time-distance',
]

export const VERBAL_CATEGORIES: VerbalCategory[] = [
  'reading-comprehension',
  'sentence-completion',
  'context-error',
  'analogy',
  'association-difference',
  'vocabulary',
]

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  // Quantitative
  'algebra': 'الجبر',
  'geometry': 'الهندسة',
  'statistics': 'الإحصاء',
  'ratio-proportion': 'النسب والتناسب',
  'probability': 'الاحتمالات',
  'speed-time-distance': 'السرعة والمسافة والزمن',
  // Verbal
  'reading-comprehension': 'استيعاب المقروء',
  'sentence-completion': 'إكمال الجمل',
  'context-error': 'الخطأ السياقي',
  'analogy': 'التناظر اللفظي',
  'association-difference': 'الارتباط والاختلاف',
  'vocabulary': 'المفردات',
}

export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

export const SECTION_LABELS: Record<QuestionSection, string> = {
  quantitative: 'القسم الكمي',
  verbal: 'القسم اللفظي',
}

export type DiagramType =
  | 'circle'
  | 'triangle'
  | 'rectangle'
  | 'composite-shape'
  | 'overlapping-shapes'
  | 'bar-chart'
  | 'pie-chart'
  | 'line-graph'
  | 'custom'

export type RenderHint = 'SVG' | 'Canvas' | 'Chart.js' | 'JSXGraph'

export interface DiagramData {
  type: DiagramType
  data: Record<string, unknown>
  renderHint: RenderHint
  caption?: string
}

export interface Question {
  id: string
  section: QuestionSection
  topic: QuestionCategory
  difficulty: QuestionDifficulty
  questionType: QuestionType
  stem: string // Question text in Arabic
  choices: [string, string, string, string] // Exactly 4 choices
  answerIndex: 0 | 1 | 2 | 3 // Correct answer position
  explanation: string
  solvingStrategy?: string
  tip?: string
  passage?: string // Reading passage text
  passageId?: string // Reference to shared passage
  diagram?: DiagramData
  tags: string[]
}

export interface UserAnswer {
  id: string
  userId: string
  sessionId: string
  sessionType: 'exam' | 'practice'
  questionId: string
  questionIndex: number
  selectedAnswer: number | null
  isCorrect: boolean
  timeSpentSeconds: number
  explanationViewed: boolean
  explanationViewedAt?: string
  createdAt: string
  updatedAt: string
}
