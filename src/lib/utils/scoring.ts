import type { Question } from '@/types/question'

/**
 * Score tier thresholds and colors
 */
export const SCORE_TIERS = {
  GOLD: { min: 90, color: '#FFD700', label: 'ممتاز', bgClass: 'bg-yellow-500' },
  GREEN: { min: 75, color: '#22C55E', label: 'جيد جداً', bgClass: 'bg-green-500' },
  GREY: { min: 50, color: '#6B7280', label: 'مقبول', bgClass: 'bg-gray-500' },
  WARM: { min: 0, color: '#F97316', label: 'يحتاج تحسين', bgClass: 'bg-orange-500' },
} as const

/**
 * Expected question distribution per track
 * Scientific: 57 quantitative + 39 verbal = 96 total
 * Literary: 29 quantitative + 67 verbal = 96 total
 */
export const TRACK_DISTRIBUTION = {
  scientific: { quantitative: 57, verbal: 39, total: 96 },
  literary: { quantitative: 29, verbal: 67, total: 96 },
} as const

export type AcademicTrack = keyof typeof TRACK_DISTRIBUTION

export type ScoreTier = keyof typeof SCORE_TIERS

/**
 * Get score tier based on percentage
 */
export function getScoreTier(percentage: number): ScoreTier {
  if (percentage >= SCORE_TIERS.GOLD.min) return 'GOLD'
  if (percentage >= SCORE_TIERS.GREEN.min) return 'GREEN'
  if (percentage >= SCORE_TIERS.GREY.min) return 'GREY'
  return 'WARM'
}

/**
 * Get score color based on percentage
 */
export function getScoreColor(percentage: number): string {
  return SCORE_TIERS[getScoreTier(percentage)].color
}

/**
 * Get score label based on percentage
 */
export function getScoreLabel(percentage: number): string {
  return SCORE_TIERS[getScoreTier(percentage)].label
}

/**
 * Get Tailwind background class based on percentage
 */
export function getScoreBgClass(percentage: number): string {
  return SCORE_TIERS[getScoreTier(percentage)].bgClass
}

/**
 * Answer data for score calculation
 */
export interface AnswerData {
  questionId: string
  questionIndex: number
  selectedAnswer: number | null
  isCorrect: boolean
  section: 'quantitative' | 'verbal'
  category?: string
}

/**
 * Calculate section scores from answers and questions
 */
export interface SectionScores {
  verbalScore: number
  quantitativeScore: number
  overallScore: number
  verbalCorrect: number
  verbalTotal: number
  quantitativeCorrect: number
  quantitativeTotal: number
}

export function calculateSectionScores(
  answers: AnswerData[],
  questions: Question[],
  targetTotalQuestions?: number,
  track?: AcademicTrack
): SectionScores {
  // Count correct answers from answered questions
  let verbalCorrect = 0
  let quantitativeCorrect = 0

  // Build a set of answered question indices for quick lookup
  const answeredMap = new Map<number, boolean>()
  for (const answer of answers) {
    answeredMap.set(answer.questionIndex, answer.isCorrect)
  }

  // Count correct answers based on generated questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const isCorrect = answeredMap.get(i) === true // Only true if answered AND correct

    if (q.section === 'verbal' && isCorrect) {
      verbalCorrect++
    } else if (q.section === 'quantitative' && isCorrect) {
      quantitativeCorrect++
    }
  }

  // Determine totals: use expected distribution if provided, otherwise count from questions
  let verbalTotal: number
  let quantitativeTotal: number

  if (targetTotalQuestions && track && TRACK_DISTRIBUTION[track]) {
    // Use expected distribution for the track (handles partially-generated exams)
    verbalTotal = TRACK_DISTRIBUTION[track].verbal
    quantitativeTotal = TRACK_DISTRIBUTION[track].quantitative
  } else {
    // Count from actual questions (for library exams or when track not provided)
    verbalTotal = 0
    quantitativeTotal = 0
    for (const q of questions) {
      if (q.section === 'verbal') {
        verbalTotal++
      } else if (q.section === 'quantitative') {
        quantitativeTotal++
      }
    }
  }

  // Calculate scores based on TOTAL questions in each section (unanswered = wrong)
  const verbalScore = verbalTotal > 0 ? Math.round((verbalCorrect / verbalTotal) * 100) : 0
  const quantitativeScore = quantitativeTotal > 0 ? Math.round((quantitativeCorrect / quantitativeTotal) * 100) : 0

  // Overall score based on total questions in exam
  const totalCorrect = verbalCorrect + quantitativeCorrect
  const totalQuestions = verbalTotal + quantitativeTotal
  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  return {
    verbalScore,
    quantitativeScore,
    overallScore,
    verbalCorrect,
    verbalTotal,
    quantitativeCorrect,
    quantitativeTotal,
  }
}

/**
 * Calculate category breakdown from answers
 */
export interface CategoryBreakdown {
  category: string
  correct: number
  total: number
  percentage: number
}

export function calculateCategoryBreakdown(
  answers: AnswerData[],
  questions: Question[]
): CategoryBreakdown[] {
  // Build question category map
  const questionCategoryMap = new Map<string, string>()
  questions.forEach(q => {
    questionCategoryMap.set(q.id, q.topic)
  })

  const categoryStats = new Map<string, { correct: number; total: number }>()

  for (const answer of answers) {
    const category = answer.category || questionCategoryMap.get(answer.questionId)
    if (!category) continue

    const stats = categoryStats.get(category) || { correct: 0, total: 0 }
    stats.total++
    if (answer.isCorrect) stats.correct++
    categoryStats.set(category, stats)
  }

  const breakdown: CategoryBreakdown[] = []
  for (const [category, stats] of categoryStats) {
    breakdown.push({
      category,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100),
    })
  }

  // Sort by total questions descending
  return breakdown.sort((a, b) => b.total - a.total)
}

/**
 * Identify strengths and weaknesses from category breakdown
 */
export interface StrengthWeakness {
  strengths: string[]
  weaknesses: string[]
}

export function identifyStrengthsWeaknesses(
  breakdown: CategoryBreakdown[],
  strengthThreshold: number = 75,
  weaknessThreshold: number = 50
): StrengthWeakness {
  const strengths: string[] = []
  const weaknesses: string[] = []

  for (const cat of breakdown) {
    // Only consider categories with enough data
    if (cat.total < 3) continue

    if (cat.percentage >= strengthThreshold) {
      strengths.push(cat.category)
    } else if (cat.percentage < weaknessThreshold) {
      weaknesses.push(cat.category)
    }
  }

  return { strengths, weaknesses }
}

/**
 * Format time in minutes:seconds
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format time in Arabic (e.g., "ساعة و 30 دقيقة")
 */
export function formatTimeArabic(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts: string[] = []

  if (hours > 0) {
    parts.push(hours === 1 ? 'ساعة' : `${hours} ساعات`)
  }

  if (minutes > 0) {
    parts.push(minutes === 1 ? 'دقيقة' : `${minutes} دقيقة`)
  }

  if (parts.length === 0) {
    return 'أقل من دقيقة'
  }

  return parts.join(' و ')
}

/**
 * Calculate estimated score based on current progress
 */
export function estimateScore(
  correctSoFar: number,
  answeredSoFar: number,
  totalQuestions: number
): number {
  if (answeredSoFar === 0) return 0

  const currentRate = correctSoFar / answeredSoFar
  const estimatedCorrect = Math.round(currentRate * totalQuestions)
  return Math.round((estimatedCorrect / totalQuestions) * 100)
}

/**
 * Detailed strength/weakness item with score
 */
export interface DetailedStrengthWeakness {
  category: string
  score: number
  correct: number
  total: number
}

/**
 * Get top N strengths sorted by score
 */
export function getTopStrengths(
  breakdown: CategoryBreakdown[],
  limit: number = 3,
  minQuestions: number = 3,
  minScore: number = 75
): DetailedStrengthWeakness[] {
  return breakdown
    .filter(cat => cat.total >= minQuestions && cat.percentage >= minScore)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit)
    .map(cat => ({
      category: cat.category,
      score: cat.percentage,
      correct: cat.correct,
      total: cat.total,
    }))
}

/**
 * Get top N weaknesses sorted by score (lowest first)
 */
export function getTopWeaknesses(
  breakdown: CategoryBreakdown[],
  limit: number = 3,
  minQuestions: number = 3,
  maxScore: number = 50
): DetailedStrengthWeakness[] {
  return breakdown
    .filter(cat => cat.total >= minQuestions && cat.percentage < maxScore)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, limit)
    .map(cat => ({
      category: cat.category,
      score: cat.percentage,
      correct: cat.correct,
      total: cat.total,
    }))
}

/**
 * Calculate comprehensive performance analysis
 */
export interface PerformanceAnalysis {
  strengths: DetailedStrengthWeakness[]
  weaknesses: DetailedStrengthWeakness[]
  categoryBreakdown: CategoryBreakdown[]
  averageScore: number
  strongCategoriesCount: number
  weakCategoriesCount: number
}

export function analyzePerformance(
  breakdown: CategoryBreakdown[],
  strengthLimit: number = 3,
  weaknessLimit: number = 3
): PerformanceAnalysis {
  const strengths = getTopStrengths(breakdown, strengthLimit)
  const weaknesses = getTopWeaknesses(breakdown, weaknessLimit)

  const totalScore = breakdown.reduce((sum, cat) => sum + cat.percentage * cat.total, 0)
  const totalQuestions = breakdown.reduce((sum, cat) => sum + cat.total, 0)
  const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0

  const strongCategoriesCount = breakdown.filter(cat => cat.percentage >= 75).length
  const weakCategoriesCount = breakdown.filter(cat => cat.percentage < 50).length

  return {
    strengths,
    weaknesses,
    categoryBreakdown: breakdown,
    averageScore,
    strongCategoriesCount,
    weakCategoriesCount,
  }
}

/**
 * Calculate score change from previous exam
 */
export interface ScoreComparisonResult {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export function compareScores(current: number, previous: number): ScoreComparisonResult {
  const change = current - previous
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0
  const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable'

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  }
}

/**
 * Calculate difficulty performance breakdown
 */
export interface DifficultyPerformance {
  difficulty: 'easy' | 'medium' | 'hard'
  correct: number
  total: number
  percentage: number
}

export function calculateDifficultyBreakdown(
  answers: AnswerData[],
  questions: Question[]
): DifficultyPerformance[] {
  const questionDifficultyMap = new Map<string, 'easy' | 'medium' | 'hard'>()
  questions.forEach(q => {
    questionDifficultyMap.set(q.id, q.difficulty)
  })

  const stats: Record<string, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  }

  for (const answer of answers) {
    const difficulty = questionDifficultyMap.get(answer.questionId) || 'medium'
    stats[difficulty].total++
    if (answer.isCorrect) stats[difficulty].correct++
  }

  return (['easy', 'medium', 'hard'] as const).map(difficulty => ({
    difficulty,
    correct: stats[difficulty].correct,
    total: stats[difficulty].total,
    percentage: stats[difficulty].total > 0
      ? Math.round((stats[difficulty].correct / stats[difficulty].total) * 100)
      : 0,
  }))
}
