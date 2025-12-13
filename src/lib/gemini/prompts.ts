import { callOpenRouter, GenerationPresets } from './client'
import type {
  Question,
  QuestionSection,
  QuestionDifficulty,
  QuestionCategory,
  QuantitativeCategory,
  VerbalCategory,
} from '@/types/question'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, SECTION_LABELS } from '@/types/question'

/**
 * Configuration for question generation
 */
export interface QuestionGenerationConfig {
  section: QuestionSection
  categories: QuestionCategory[]
  difficulty: QuestionDifficulty
  count: number
  excludeIds?: string[]
}

/**
 * Track-based exam configuration
 */
export type AcademicTrack = 'scientific' | 'literary'

export interface ExamConfig {
  track: AcademicTrack
  totalQuestions?: number // defaults to 96
}

/**
 * Question distribution by track
 * Scientific: ~57 quantitative, ~39 verbal
 * Literary: ~29 quantitative, ~67 verbal
 */
export const TRACK_DISTRIBUTION = {
  scientific: {
    quantitative: 57,
    verbal: 39,
  },
  literary: {
    quantitative: 29,
    verbal: 67,
  },
} as const

/**
 * System prompt for generating quantitative questions
 */
const QUANTITATIVE_SYSTEM_PROMPT = `أنت خبير في إعداد أسئلة اختبار القدرات العامة السعودي (القسم الكمي).
قم بإنشاء أسئلة تتوافق مع معايير اختبار القدرات الفعلي.

القواعد:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط (أ، ب، ج، د)
3. الشرح يجب أن يكون مفصلاً وواضحاً
4. تجنب الأسئلة المكررة أو المتشابهة جداً
5. راعي مستوى الصعوبة المطلوب

التصنيفات المتاحة:
- الجبر: معادلات، متباينات، تبسيط عبارات
- الهندسة: مساحات، محيطات، زوايا، أشكال ثلاثية الأبعاد
- الإحصاء: المتوسط، الوسيط، المنوال، الانحراف
- النسب والتناسب: النسب المئوية، التناسب الطردي والعكسي
- الاحتمالات: احتمال بسيط، احتمال مركب
- السرعة والمسافة والزمن: مسائل الحركة

أجب بتنسيق JSON فقط.`

/**
 * System prompt for generating verbal questions
 */
const VERBAL_SYSTEM_PROMPT = `أنت خبير في إعداد أسئلة اختبار القدرات العامة السعودي (القسم اللفظي).
قم بإنشاء أسئلة تتوافق مع معايير اختبار القدرات الفعلي.

القواعد:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط (أ، ب، ج، د)
3. الشرح يجب أن يكون مفصلاً وواضحاً
4. تجنب الأسئلة المكررة أو المتشابهة جداً
5. راعي مستوى الصعوبة المطلوب

التصنيفات المتاحة:
- استيعاب المقروء: نصوص قراءة مع أسئلة فهم
- إكمال الجمل: اختيار الكلمة المناسبة
- الخطأ السياقي: إيجاد الكلمة الخاطئة في السياق
- التناظر اللفظي: العلاقات بين الكلمات
- الارتباط والاختلاف: إيجاد الكلمة المختلفة
- المفردات: معاني الكلمات والمترادفات

أجب بتنسيق JSON فقط.`

/**
 * Full exam generation system prompt
 */
const EXAM_SYSTEM_PROMPT = `أنت خبير في إعداد أسئلة اختبار القدرات العامة السعودي.
قم بإنشاء اختبار كامل يتوافق مع معايير اختبار القدرات الفعلي.

القواعد الأساسية:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط
3. الشرح يجب أن يكون مفصلاً وواضحاً
4. تجنب الأسئلة المكررة أو المتشابهة
5. توزيع الصعوبة: 30% سهل، 50% متوسط، 20% صعب
6. أنشئ معرف فريد لكل سؤال

أجب بتنسيق JSON فقط مع مصفوفة questions.`

/**
 * Exponential backoff delay helper
 */
async function delay(attempt: number): Promise<void> {
  const baseDelay = 1000
  const maxDelay = 10000
  const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  await new Promise(resolve => setTimeout(resolve, delayMs))
}

/**
 * Attempt to repair common JSON issues from AI responses
 */
function repairJSON(text: string): string {
  let json = text

  // Remove any markdown code blocks
  json = json.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

  // Try to find JSON object
  const startIdx = json.indexOf('{')
  const endIdx = json.lastIndexOf('}')

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('No valid JSON object found')
  }

  json = json.slice(startIdx, endIdx + 1)

  // Fix common issues:
  // 1. Trailing commas before closing brackets
  json = json.replace(/,\s*([}\]])/g, '$1')

  // 2. Missing commas between array elements (common with large arrays)
  json = json.replace(/}\s*{/g, '},{')

  // 3. Unescaped quotes in strings (basic fix)
  // This is tricky, so we only fix obvious cases

  // 4. Remove any control characters
  json = json.replace(/[\x00-\x1F\x7F]/g, (match) => {
    if (match === '\n' || match === '\r' || match === '\t') return match
    return ''
  })

  return json
}

/**
 * Safely parse JSON with repair attempts
 */
function safeParseJSON(text: string): { questions: Partial<Question>[] } {
  // First try direct parse
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // Continue to repair attempt
  }

  // Try with repair
  const repaired = repairJSON(text)
  return JSON.parse(repaired)
}

/**
 * Check if error is retryable (network issues, rate limits, JSON parse errors, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    // Retryable errors: network issues, rate limits, server errors, JSON parse errors
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('fetch failed') ||
      message.includes('econnreset') ||
      message.includes('socket') ||
      message.includes('json') ||
      message.includes('unexpected token') ||
      message.includes('expected')
    )
  }
  return false
}

/**
 * Generate questions using OpenRouter AI with retry logic
 */
export async function generateQuestions(config: QuestionGenerationConfig): Promise<Question[]> {
  const systemPrompt =
    config.section === 'quantitative' ? QUANTITATIVE_SYSTEM_PROMPT : VERBAL_SYSTEM_PROMPT

  const categoryNames = config.categories
    .map((cat) => CATEGORY_LABELS[cat as QuestionCategory])
    .join('، ')

  const userPrompt = `قم بإنشاء ${config.count} سؤال من نوع ${SECTION_LABELS[config.section]} في التصنيفات التالية: ${categoryNames}

مستوى الصعوبة: ${DIFFICULTY_LABELS[config.difficulty]}

أجب بتنسيق JSON التالي:
{
  "questions": [
    {
      "id": "q_unique_id",
      "section": "${config.section}",
      "topic": "category_key",
      "difficulty": "${config.difficulty}",
      "questionType": "mcq",
      "stem": "نص السؤال",
      "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "answerIndex": 0,
      "explanation": "شرح مفصل للإجابة الصحيحة",
      "solvingStrategy": "استراتيجية الحل (اختياري)",
      "tip": "نصيحة للطالب (اختياري)",
      "tags": ["tag1", "tag2"]
    }
  ]
}

${config.excludeIds?.length ? `تجنب إنشاء أسئلة مشابهة للأسئلة ذات المعرفات: ${config.excludeIds.join(', ')}` : ''}`

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const text = await callOpenRouter({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        ...GenerationPresets.questions,
      })

      // Parse JSON with repair attempts
      const parsed = safeParseJSON(text)

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure - missing questions array')
      }

      const questions: Question[] = parsed.questions.map((q: Partial<Question>, index: number) => ({
        id: q.id || `gen_${Date.now()}_${index}`,
        section: q.section || config.section,
        topic: q.topic as QuestionCategory,
        difficulty: q.difficulty || config.difficulty,
        questionType: q.questionType || 'mcq',
        stem: q.stem || '',
        choices: q.choices as [string, string, string, string],
        answerIndex: q.answerIndex as 0 | 1 | 2 | 3,
        explanation: q.explanation || '',
        solvingStrategy: q.solvingStrategy,
        tip: q.tip,
        passage: q.passage,
        tags: q.tags || [],
      }))

      return questions
    } catch (error) {
      console.error(`Question generation attempt ${attempt + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Only retry on retryable errors
      if (attempt < maxRetries - 1 && isRetryableError(error)) {
        await delay(attempt)
        continue
      }

      // For non-retryable errors, throw immediately
      if (!isRetryableError(error)) {
        break
      }
    }
  }

  throw lastError || new Error('فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.')
}

/**
 * Generate a batch of questions for exam
 */
async function generateExamBatch(
  section: 'quantitative' | 'verbal',
  count: number,
  batchIndex: number
): Promise<Question[]> {
  const sectionName = section === 'quantitative' ? 'كمي' : 'لفظي'
  const categories = section === 'quantitative'
    ? 'الجبر، الهندسة، الإحصاء، النسب والتناسب، الاحتمالات، السرعة والمسافة'
    : 'استيعاب المقروء، إكمال الجمل، الخطأ السياقي، التناظر اللفظي، الارتباط والاختلاف، المفردات'

  const userPrompt = `قم بإنشاء ${count} سؤال ${sectionName} لاختبار القدرات:

توزيع الصعوبة:
- سهل: 30%
- متوسط: 50%
- صعب: 20%

التصنيفات: ${categories}

أجب بتنسيق JSON فقط:
{
  "questions": [
    {
      "id": "batch${batchIndex}_q1",
      "section": "${section}",
      "topic": "category_key",
      "difficulty": "easy" أو "medium" أو "hard",
      "questionType": "mcq",
      "stem": "نص السؤال",
      "choices": ["أ", "ب", "ج", "د"],
      "answerIndex": 0,
      "explanation": "شرح مفصل"
    }
  ]
}`

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const text = await callOpenRouter({
        messages: [
          { role: 'system', content: EXAM_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        ...GenerationPresets.exam,
      })

      const parsed = safeParseJSON(text)

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure - missing questions array')
      }

      return parsed.questions.map((q: Partial<Question>, index: number) => ({
        id: q.id || `batch${batchIndex}_${Date.now()}_${index}`,
        section: q.section || section,
        topic: q.topic as QuestionCategory,
        difficulty: q.difficulty || 'medium',
        questionType: q.questionType || 'mcq',
        stem: q.stem || '',
        choices: q.choices as [string, string, string, string],
        answerIndex: typeof q.answerIndex === 'number' ? q.answerIndex as 0 | 1 | 2 | 3 : 0,
        explanation: q.explanation || '',
        solvingStrategy: q.solvingStrategy,
        tip: q.tip,
        passage: q.passage,
        tags: q.tags || [],
      }))
    } catch (error) {
      console.error(`Batch ${batchIndex} generation attempt ${attempt + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries - 1 && isRetryableError(error)) {
        await delay(attempt)
        continue
      }

      if (!isRetryableError(error)) {
        break
      }
    }
  }

  throw lastError || new Error(`فشل في إنشاء الدفعة ${batchIndex}`)
}

/**
 * Generate a full 96-question exam based on academic track
 * Uses batch generation for reliability
 */
export async function generateFullExam(config: ExamConfig): Promise<Question[]> {
  const distribution = TRACK_DISTRIBUTION[config.track]
  const totalQuestions = config.totalQuestions || 96

  // Scale distribution to total questions if not 96
  const scale = totalQuestions / 96
  const quantCount = Math.round(distribution.quantitative * scale)
  const verbalCount = totalQuestions - quantCount

  // Generate in batches of ~20 questions for reliability
  const BATCH_SIZE = 20
  const allQuestions: Question[] = []

  // Calculate batches for quantitative
  const quantBatches = Math.ceil(quantCount / BATCH_SIZE)
  const verbalBatches = Math.ceil(verbalCount / BATCH_SIZE)

  console.log(`Generating exam: ${quantCount} quantitative in ${quantBatches} batches, ${verbalCount} verbal in ${verbalBatches} batches`)

  let batchIndex = 0

  // Generate quantitative questions in batches
  for (let i = 0; i < quantBatches; i++) {
    const remaining = quantCount - (i * BATCH_SIZE)
    const batchCount = Math.min(BATCH_SIZE, remaining)

    console.log(`Generating quantitative batch ${i + 1}/${quantBatches} (${batchCount} questions)`)

    const questions = await generateExamBatch('quantitative', batchCount, batchIndex++)
    allQuestions.push(...questions)

    // Longer delay between batches to avoid rate limits (5 seconds)
    if (i < quantBatches - 1) {
      console.log('Waiting 5 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  // Delay before switching to verbal section
  console.log('Waiting 5 seconds before verbal section...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Generate verbal questions in batches
  for (let i = 0; i < verbalBatches; i++) {
    const remaining = verbalCount - (i * BATCH_SIZE)
    const batchCount = Math.min(BATCH_SIZE, remaining)

    console.log(`Generating verbal batch ${i + 1}/${verbalBatches} (${batchCount} questions)`)

    const questions = await generateExamBatch('verbal', batchCount, batchIndex++)
    allQuestions.push(...questions)

    // Longer delay between batches (5 seconds)
    if (i < verbalBatches - 1) {
      console.log('Waiting 5 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  // Validate minimum question count (allow 80% threshold for batch generation)
  const minQuestions = Math.floor(totalQuestions * 0.8)
  if (allQuestions.length < minQuestions) {
    throw new Error(`Generated only ${allQuestions.length} questions, minimum ${minQuestions} required`)
  }

  console.log(`Exam generation complete: ${allQuestions.length} questions`)

  // Shuffle questions
  return allQuestions.sort(() => Math.random() - 0.5)
}

/**
 * Generate a balanced exam with questions from both sections (legacy function)
 */
export async function generateExam(
  quantitativeCategories: QuantitativeCategory[],
  verbalCategories: VerbalCategory[],
  questionsPerSection: number = 65
): Promise<{ quantitative: Question[]; verbal: Question[] }> {
  // Distribution: 30% easy, 50% medium, 20% hard
  const easyCount = Math.round(questionsPerSection * 0.3)
  const mediumCount = Math.round(questionsPerSection * 0.5)
  const hardCount = questionsPerSection - easyCount - mediumCount

  const generateSectionQuestions = async (
    section: QuestionSection,
    categories: QuestionCategory[]
  ): Promise<Question[]> => {
    const allQuestions: Question[] = []

    // Generate questions for each difficulty level
    const difficultyConfigs: { difficulty: QuestionDifficulty; count: number }[] = [
      { difficulty: 'easy', count: easyCount },
      { difficulty: 'medium', count: mediumCount },
      { difficulty: 'hard', count: hardCount },
    ]

    for (const { difficulty, count } of difficultyConfigs) {
      const questions = await generateQuestions({
        section,
        categories,
        difficulty,
        count,
        excludeIds: allQuestions.map((q) => q.id),
      })
      allQuestions.push(...questions)
    }

    // Shuffle questions
    return allQuestions.sort(() => Math.random() - 0.5)
  }

  const [quantitative, verbal] = await Promise.all([
    generateSectionQuestions('quantitative', quantitativeCategories),
    generateSectionQuestions('verbal', verbalCategories),
  ])

  return { quantitative, verbal }
}

/**
 * Generate practice questions for one or more categories
 */
export async function generatePracticeQuestions(
  section: QuestionSection,
  categoriesOrCategory: QuestionCategory | QuestionCategory[],
  difficulty: QuestionDifficulty,
  count: number = 10
): Promise<Question[]> {
  const categories = Array.isArray(categoriesOrCategory)
    ? categoriesOrCategory
    : [categoriesOrCategory]

  return generateQuestions({
    section,
    categories,
    difficulty,
    count,
  })
}

/**
 * Practice-specific prompt configuration
 */
export interface PracticeConfig {
  section: QuestionSection
  categories: QuestionCategory[]
  difficulty: QuestionDifficulty
  questionCount: number
}

/**
 * Generate a complete practice session with balanced category distribution
 */
export async function generatePracticeSession(config: PracticeConfig): Promise<Question[]> {
  const { section, categories, difficulty, questionCount } = config

  // If single category, generate all questions from it
  if (categories.length === 1) {
    return generateQuestions({
      section,
      categories,
      difficulty,
      count: questionCount,
    })
  }

  // For multiple categories, distribute questions evenly
  const questionsPerCategory = Math.floor(questionCount / categories.length)
  const remainder = questionCount % categories.length

  const allQuestions: Question[] = []

  for (let i = 0; i < categories.length; i++) {
    const categoryCount = questionsPerCategory + (i < remainder ? 1 : 0)

    if (categoryCount > 0) {
      const questions = await generateQuestions({
        section,
        categories: [categories[i]],
        difficulty,
        count: categoryCount,
        excludeIds: allQuestions.map(q => q.id),
      })
      allQuestions.push(...questions)
    }
  }

  // Shuffle questions to mix categories
  return allQuestions.sort(() => Math.random() - 0.5)
}

/**
 * Analyze user performance and generate feedback
 */
export async function generatePerformanceFeedback(
  correctCount: number,
  totalCount: number,
  categoryBreakdown: Record<string, { correct: number; total: number }>,
  section: QuestionSection
): Promise<{
  strengths: string[]
  weaknesses: string[]
  advice: string
}> {
  const overallScore = Math.round((correctCount / totalCount) * 100)
  const categoryScores = Object.entries(categoryBreakdown)
    .map(([cat, { correct, total }]) => {
      const label = CATEGORY_LABELS[cat as QuestionCategory]
      const score = Math.round((correct / total) * 100)
      return `${label}: ${score}% (${correct}/${total})`
    })
    .join('\n')

  const prompt = `بناءً على أداء الطالب في ${SECTION_LABELS[section]}:

النتيجة الإجمالية: ${overallScore}% (${correctCount}/${totalCount})

التفصيل حسب التصنيف:
${categoryScores}

قدم تحليلاً موجزاً يتضمن:
1. نقاط القوة (قائمة من 2-3 نقاط)
2. نقاط الضعف التي تحتاج تحسين (قائمة من 2-3 نقاط)
3. نصيحة مخصصة للتحسين (فقرة واحدة)

أجب بتنسيق JSON:
{
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "advice": "نصيحة مفصلة..."
}`

  try {
    const text = await callOpenRouter({
      messages: [
        { role: 'user', content: prompt },
      ],
      ...GenerationPresets.analysis,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error generating feedback:', error)
    // Return default feedback on error
    return {
      strengths: ['استمر في الممارسة'],
      weaknesses: ['راجع المفاهيم الأساسية'],
      advice: 'استمر في التدريب وركز على الأقسام التي تحتاج تحسيناً.',
    }
  }
}
