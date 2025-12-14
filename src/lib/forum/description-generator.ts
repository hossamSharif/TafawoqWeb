// Auto-description generator utility for exam metadata
// Generates user-friendly Arabic descriptions based on exam/practice session data

interface ExamSession {
  id: string
  track: 'scientific' | 'literary'
  total_questions: number
  verbal_score?: number
  quantitative_score?: number
  overall_score?: number
  questions?: Array<{
    section?: string
    difficulty?: string
    topic?: string
  }>
}

interface PracticeSession {
  id: string
  section: 'verbal' | 'quantitative'
  category?: string
  difficulty?: string
  total_questions: number
  correct_answers?: number
  score?: number
}

interface GeneratedDescription {
  title: string
  body: string
}

/**
 * Generate auto-description for an exam session
 */
export function generateExamDescription(
  session: ExamSession
): GeneratedDescription {
  const { track, total_questions, questions } = session

  // Count sections and difficulties
  const sections = { verbal: 0, quantitative: 0 }
  const difficulties = { easy: 0, medium: 0, hard: 0 }
  const topics = new Set<string>()

  questions?.forEach((q) => {
    if (q.section === 'verbal') sections.verbal++
    else if (q.section === 'quantitative') sections.quantitative++

    if (q.difficulty === 'easy') difficulties.easy++
    else if (q.difficulty === 'medium') difficulties.medium++
    else if (q.difficulty === 'hard') difficulties.hard++

    if (q.topic) topics.add(q.topic)
  })

  const trackName = track === 'scientific' ? 'علمي' : 'أدبي'

  // Generate title
  let title = `اختبار قدرات ${trackName}`
  if (total_questions) {
    title += ` - ${total_questions} سؤال`
  }

  // Generate body
  const bodyParts: string[] = []

  // Intro
  bodyParts.push(
    `اختبار قدرات شامل للمسار ال${trackName} يحتوي على ${total_questions} سؤال.`
  )

  // Section breakdown
  if (sections.verbal > 0 || sections.quantitative > 0) {
    const sectionParts: string[] = []
    if (sections.verbal > 0) {
      sectionParts.push(`${sections.verbal} سؤال لفظي`)
    }
    if (sections.quantitative > 0) {
      sectionParts.push(`${sections.quantitative} سؤال كمي`)
    }
    bodyParts.push(`يتضمن ${sectionParts.join(' و ')}.`)
  }

  // Difficulty breakdown
  const difficultyParts: string[] = []
  if (difficulties.easy > 0) {
    difficultyParts.push(`${difficulties.easy} سهل`)
  }
  if (difficulties.medium > 0) {
    difficultyParts.push(`${difficulties.medium} متوسط`)
  }
  if (difficulties.hard > 0) {
    difficultyParts.push(`${difficulties.hard} صعب`)
  }

  if (difficultyParts.length > 0) {
    bodyParts.push(`توزيع الصعوبة: ${difficultyParts.join('، ')}.`)
  }

  // Topics covered (if we have them)
  if (topics.size > 0 && topics.size <= 5) {
    const topicsList = Array.from(topics).slice(0, 5)
    bodyParts.push(`المواضيع: ${topicsList.join('، ')}.`)
  }

  return {
    title,
    body: bodyParts.join(' '),
  }
}

/**
 * Generate auto-description for a practice session
 */
export function generatePracticeDescription(
  session: PracticeSession
): GeneratedDescription {
  const { section, category, difficulty, total_questions } = session

  const sectionName = section === 'verbal' ? 'لفظي' : 'كمي'
  const difficultyName =
    {
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
    }[difficulty || 'medium'] || 'متوسط'

  // Generate title
  let title = `تدريب ${sectionName}`
  if (category) {
    title += ` - ${category}`
  }
  title += ` (${total_questions} سؤال)`

  // Generate body
  const bodyParts: string[] = []

  bodyParts.push(
    `تدريب على القسم ال${sectionName} يحتوي على ${total_questions} سؤال بمستوى ${difficultyName}.`
  )

  if (category) {
    bodyParts.push(`التصنيف: ${category}.`)
  }

  bodyParts.push('مناسب للتحضير والمراجعة.')

  return {
    title,
    body: bodyParts.join(' '),
  }
}

/**
 * Get difficulty distribution percentages
 */
export function getDifficultyPercentages(questions: Array<{ difficulty?: string }>): {
  easy: number
  medium: number
  hard: number
} {
  if (!questions || questions.length === 0) {
    return { easy: 0, medium: 0, hard: 0 }
  }

  const total = questions.length
  let easy = 0
  let medium = 0
  let hard = 0

  questions.forEach((q) => {
    if (q.difficulty === 'easy') easy++
    else if (q.difficulty === 'medium') medium++
    else if (q.difficulty === 'hard') hard++
  })

  return {
    easy: Math.round((easy / total) * 100),
    medium: Math.round((medium / total) * 100),
    hard: Math.round((hard / total) * 100),
  }
}

/**
 * Get section distribution percentages
 */
export function getSectionPercentages(questions: Array<{ section?: string }>): {
  verbal: number
  quantitative: number
} {
  if (!questions || questions.length === 0) {
    return { verbal: 0, quantitative: 0 }
  }

  const total = questions.length
  let verbal = 0
  let quantitative = 0

  questions.forEach((q) => {
    if (q.section === 'verbal') verbal++
    else if (q.section === 'quantitative') quantitative++
  })

  return {
    verbal: Math.round((verbal / total) * 100),
    quantitative: Math.round((quantitative / total) * 100),
  }
}

/**
 * Format exam metadata for display
 */
export function formatExamMetadata(session: ExamSession): string {
  const { track, total_questions, questions } = session

  const trackLabel = track === 'scientific' ? 'علمي' : 'أدبي'
  const sections = { verbal: 0, quantitative: 0 }

  questions?.forEach((q) => {
    if (q.section === 'verbal') sections.verbal++
    else if (q.section === 'quantitative') sections.quantitative++
  })

  return `${trackLabel} | ${total_questions} سؤال | لفظي ${sections.verbal} | كمي ${sections.quantitative}`
}
