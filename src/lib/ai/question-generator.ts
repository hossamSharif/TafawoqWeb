import { getQuestionGenerationModel, getAnalysisModel } from './client'
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
 * Generate questions using Gemini AI
 */
export async function generateQuestions(config: QuestionGenerationConfig): Promise<Question[]> {
  const model = getQuestionGenerationModel()

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

  try {
    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    const questions: Question[] = parsed.questions.map((q: Partial<Question>, index: number) => ({
      id: `gen_${Date.now()}_${index}`,
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
    console.error('Error generating questions:', error)
    throw new Error('فشل في إنشاء الأسئلة. يرجى المحاولة مرة أخرى.')
  }
}

/**
 * Generate a balanced exam with questions from both sections
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
 * Generate practice questions for a specific category
 */
export async function generatePracticeQuestions(
  section: QuestionSection,
  category: QuestionCategory,
  difficulty: QuestionDifficulty,
  count: number = 10
): Promise<Question[]> {
  return generateQuestions({
    section,
    categories: [category],
    difficulty,
    count,
  })
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
  const model = getAnalysisModel()

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
    const result = await model.generateContent(prompt)
    const text = result.response.text()

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
