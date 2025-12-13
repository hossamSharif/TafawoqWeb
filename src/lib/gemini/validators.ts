import type { Question, QuestionSection, QuestionDifficulty, QuestionCategory } from '@/types/question'

/**
 * Validates a single question object from AI response
 */
export function validateQuestion(q: unknown, index: number): Question | null {
  if (!q || typeof q !== 'object') {
    console.warn(`Question at index ${index} is not an object`)
    return null
  }

  const question = q as Record<string, unknown>

  // Required fields validation
  if (!question.stem || typeof question.stem !== 'string') {
    console.warn(`Question at index ${index} missing valid stem`)
    return null
  }

  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    console.warn(`Question at index ${index} missing valid choices array`)
    return null
  }

  if (typeof question.answerIndex !== 'number' || question.answerIndex < 0 || question.answerIndex > 3) {
    console.warn(`Question at index ${index} has invalid answerIndex`)
    return null
  }

  // Validate section
  const validSections: QuestionSection[] = ['quantitative', 'verbal']
  const section = validSections.includes(question.section as QuestionSection)
    ? (question.section as QuestionSection)
    : 'quantitative'

  // Validate difficulty
  const validDifficulties: QuestionDifficulty[] = ['easy', 'medium', 'hard']
  const difficulty = validDifficulties.includes(question.difficulty as QuestionDifficulty)
    ? (question.difficulty as QuestionDifficulty)
    : 'medium'

  return {
    id: (question.id as string) || `q_${Date.now()}_${index}`,
    section,
    topic: (question.topic as QuestionCategory) || (section === 'quantitative' ? 'algebra' : 'vocabulary'),
    difficulty,
    questionType: 'mcq',
    stem: question.stem as string,
    choices: question.choices as [string, string, string, string],
    answerIndex: question.answerIndex as 0 | 1 | 2 | 3,
    explanation: (question.explanation as string) || '',
    solvingStrategy: question.solvingStrategy as string | undefined,
    tip: question.tip as string | undefined,
    passage: question.passage as string | undefined,
    tags: Array.isArray(question.tags) ? (question.tags as string[]) : [],
  }
}

/**
 * Validates and extracts questions array from AI response text
 */
export function extractQuestionsFromResponse(text: string): Question[] {
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error(`Failed to parse JSON from AI response: ${e}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed response is not an object')
  }

  const response = parsed as Record<string, unknown>

  if (!Array.isArray(response.questions)) {
    throw new Error('Response missing questions array')
  }

  const questions: Question[] = []
  for (let i = 0; i < response.questions.length; i++) {
    const validated = validateQuestion(response.questions[i], i)
    if (validated) {
      questions.push(validated)
    }
  }

  return questions
}

/**
 * Validates feedback response structure
 */
export interface FeedbackResponse {
  strengths: string[]
  weaknesses: string[]
  advice: string
}

export function extractFeedbackFromResponse(text: string): FeedbackResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in feedback response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error(`Failed to parse feedback JSON: ${e}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed feedback is not an object')
  }

  const response = parsed as Record<string, unknown>

  return {
    strengths: Array.isArray(response.strengths)
      ? response.strengths.filter((s): s is string => typeof s === 'string')
      : ['استمر في الممارسة'],
    weaknesses: Array.isArray(response.weaknesses)
      ? response.weaknesses.filter((w): w is string => typeof w === 'string')
      : ['راجع المفاهيم الأساسية'],
    advice: typeof response.advice === 'string'
      ? response.advice
      : 'استمر في التدريب وركز على الأقسام التي تحتاج تحسيناً.',
  }
}

/**
 * Validates exam generation response meets minimum requirements
 */
export function validateExamResponse(
  questions: Question[],
  expectedTotal: number,
  track: 'scientific' | 'literary'
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check minimum question count (90% threshold)
  const minQuestions = Math.floor(expectedTotal * 0.9)
  if (questions.length < minQuestions) {
    errors.push(`Insufficient questions: ${questions.length}/${expectedTotal} (minimum ${minQuestions})`)
  }

  // Count questions by section
  const quantCount = questions.filter(q => q.section === 'quantitative').length
  const verbalCount = questions.filter(q => q.section === 'verbal').length

  // Expected distribution
  const expectedDist = track === 'scientific'
    ? { quant: 57, verbal: 39 }
    : { quant: 29, verbal: 67 }

  // Allow 20% variance in distribution
  const quantVariance = Math.abs(quantCount - expectedDist.quant) / expectedDist.quant
  const verbalVariance = Math.abs(verbalCount - expectedDist.verbal) / expectedDist.verbal

  if (quantVariance > 0.2) {
    errors.push(`Quantitative distribution off: ${quantCount} (expected ~${expectedDist.quant})`)
  }

  if (verbalVariance > 0.2) {
    errors.push(`Verbal distribution off: ${verbalCount} (expected ~${expectedDist.verbal})`)
  }

  // Check for duplicate IDs
  const ids = new Set<string>()
  for (const q of questions) {
    if (ids.has(q.id)) {
      errors.push(`Duplicate question ID: ${q.id}`)
    }
    ids.add(q.id)
  }

  // Check for empty stems
  const emptyStems = questions.filter(q => !q.stem.trim()).length
  if (emptyStems > 0) {
    errors.push(`${emptyStems} questions have empty stems`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
