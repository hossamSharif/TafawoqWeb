/**
 * Review feature types for exam and practice review functionality
 */

// Filter types
export type ReviewFilterStatus = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'bookmarked'
export type ReviewSortOrder = 'original' | 'performance' | 'difficulty' | 'time'
export type ReviewDifficulty = 'easy' | 'medium' | 'hard'

export interface ReviewFilters {
  status: ReviewFilterStatus
  categories: string[]
  difficulties: ReviewDifficulty[]
  sortOrder: ReviewSortOrder
}

// Bookmark types
export interface QuestionBookmark {
  id: string
  userId: string
  sessionId: string
  sessionType: 'exam' | 'practice'
  questionId: string
  questionIndex: number
  createdAt: string
}

export interface CreateBookmarkParams {
  sessionId: string
  sessionType: 'exam' | 'practice'
  questionId: string
  questionIndex: number
}

// Note types
export interface QuestionNote {
  id: string
  userId: string
  sessionId: string
  sessionType: 'exam' | 'practice'
  questionId: string
  questionIndex: number
  noteText: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteParams {
  sessionId: string
  sessionType: 'exam' | 'practice'
  questionId: string
  questionIndex: number
  noteText: string
}

export interface UpdateNoteParams {
  noteText: string
}

// Review state
export interface ReviewState {
  currentIndex: number
  filters: ReviewFilters
  bookmarks: Set<number>
  notes: Map<number, string>
  isFullScreen: boolean
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'json'
  filter: 'all' | 'incorrect' | 'bookmarked' | 'filtered'
  includeExplanations: boolean
  includeNotes: boolean
}

// Category and section labels
export const CATEGORY_LABELS: Record<string, string> = {
  // Quantitative categories
  algebra: 'الجبر',
  geometry: 'الهندسة',
  arithmetic: 'الحساب',
  statistics: 'الإحصاء',
  ratios: 'النسب والتناسب',
  probability: 'الاحتمالات',
  speed_distance_time: 'السرعة والمسافة',

  // Verbal categories (with both underscore and hyphen variants)
  reading_comprehension: 'استيعاب المقروء',
  'reading-comprehension': 'استيعاب المقروء',
  sentence_completion: 'إكمال الجمل',
  'sentence-completion': 'إكمال الجمل',
  contextual_error: 'الخطأ السياقي',
  'context-error': 'الخطأ السياقي',
  verbal_analogy: 'التناظر اللفظي',
  'verbal-analogy': 'التناظر اللفظي',
  analogy: 'القياس',
  analogies: 'القياس',
  association_difference: 'الارتباط والاختلاف',
  'association-difference': 'الارتباط والاختلاف',
  vocabulary: 'المفردات',
  critical_reasoning: 'الاستدلال المنطقي',
  'critical-reasoning': 'الاستدلال المنطقي',
  text_completion: 'إكمال النص',
  'text-completion': 'إكمال النص',
  sentence_equivalence: 'التكافؤ اللفظي',
  'sentence-equivalence': 'التكافؤ اللفظي',
  error_detection: 'كشف الخطأ',
  'error-detection': 'كشف الخطأ',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

export const SECTION_LABELS: Record<string, string> = {
  verbal: 'القسم اللفظي',
  quantitative: 'القسم الكمي',
}
