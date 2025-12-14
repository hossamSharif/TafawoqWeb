/**
 * System prompts and question generation for Claude Sonnet 4.5
 * Uses prompt caching for 90% cost reduction on batches 2+
 */

import type { Question, QuestionCategory } from '@/types/question'
import type { BatchConfig, CachedTextBlock, GenerationContext } from './types'

/**
 * System rules prompt - cached across all batches
 * ~800 tokens - exceeds 1,024 minimum for caching
 */
const SYSTEM_RULES_PROMPT = `أنت خبير متخصص في إعداد أسئلة اختبار القدرات العامة السعودي (GAT/Qudurat).
مهمتك هي إنشاء أسئلة عالية الجودة تتوافق مع معايير الاختبار الفعلي.

القواعد الصارمة:
1. جميع الأسئلة والخيارات والشروحات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط (أ، ب، ج، د)
3. الإجابة الصحيحة يجب أن تكون واحدة فقط من الخيارات الأربعة
4. الشرح يجب أن يكون مفصلاً ويوضح خطوات الحل
5. تجنب الأسئلة المكررة أو المتشابهة مع الأسئلة السابقة
6. راعي مستوى الصعوبة المطلوب (30% سهل، 50% متوسط، 20% صعب)
7. أنشئ معرف فريد لكل سؤال بالتنسيق: {section}_{batch}_{seq}
8. لا تستخدم أرقاماً عشوائية - اجعل الأسئلة واقعية ومنطقية

معايير الجودة:
- الأسئلة يجب أن تختبر الفهم وليس الحفظ
- الخيارات الخاطئة يجب أن تكون معقولة (ليست واضحة الخطأ)
- تجنب الأسئلة السلبية المعقدة ("أي مما يلي ليس...")
- الشرح يجب أن يساعد الطالب على فهم المفهوم

تنسيق الإخراج:
أجب بتنسيق JSON فقط مع مصفوفة questions.
لا تضف أي نص قبل أو بعد كائن JSON.`

/**
 * Categories prompt - cached across all batches
 * ~700 tokens - exceeds minimum when combined with rules
 */
const CATEGORIES_PROMPT = `التصنيفات المتاحة:

القسم الكمي (quantitative):
- algebra: الجبر - معادلات، متباينات، تبسيط عبارات جبرية، كثيرات الحدود
- geometry: الهندسة - مساحات، محيطات، زوايا، أشكال ثلاثية الأبعاد، التشابه والتطابق
- statistics: الإحصاء - المتوسط الحسابي، الوسيط، المنوال، الانحراف المعياري، الربيعيات
- ratio-proportion: النسب والتناسب - النسب المئوية، التناسب الطردي والعكسي، الخلطات
- probability: الاحتمالات - الاحتمال البسيط، الاحتمال المركب، التباديل والتوافيق
- speed-time-distance: السرعة والمسافة والزمن - مسائل الحركة، السرعة المتوسطة، اللحاق والتقاطع

القسم اللفظي (verbal):
- reading-comprehension: استيعاب المقروء - نصوص قراءة مع أسئلة فهم، استنتاج، تحليل
- sentence-completion: إكمال الجمل - اختيار الكلمة المناسبة لإكمال الجملة
- context-error: الخطأ السياقي - إيجاد الكلمة الخاطئة في سياق الجملة
- analogy: التناظر اللفظي - العلاقات بين الكلمات (مثل: قلم:كتابة::...)
- association-difference: الارتباط والاختلاف - إيجاد الكلمة المختلفة في مجموعة
- vocabulary: المفردات - معاني الكلمات، المترادفات، الأضداد`

/**
 * Build system message blocks with cache control
 */
export function buildSystemBlocks(): CachedTextBlock[] {
  return [
    {
      type: 'text',
      text: SYSTEM_RULES_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: CATEGORIES_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

/**
 * Get categories for a given section and batch
 */
function getCategoriesForBatch(
  section: 'quantitative' | 'verbal',
  batchIndex: number
): string[] {
  const quantCategories = [
    'algebra',
    'geometry',
    'statistics',
    'ratio-proportion',
    'probability',
    'speed-time-distance',
  ]

  const verbalCategories = [
    'reading-comprehension',
    'sentence-completion',
    'context-error',
    'analogy',
    'association-difference',
    'vocabulary',
  ]

  const categories = section === 'quantitative' ? quantCategories : verbalCategories

  // Rotate through categories based on batch index for variety
  const startIdx = batchIndex % categories.length
  return [
    categories[startIdx],
    categories[(startIdx + 1) % categories.length],
    categories[(startIdx + 2) % categories.length],
  ]
}

/**
 * Build user prompt for batch generation
 */
export function buildUserPrompt(
  config: BatchConfig,
  context: GenerationContext
): string {
  const sectionName = config.section === 'quantitative' ? 'كمي' : 'لفظي'
  const categories = config.categories || getCategoriesForBatch(config.section, config.batchIndex)
  const categoryNames = categories.join('، ')

  const idPrefix = config.section === 'quantitative' ? 'quant' : 'verbal'

  // Build exclusion list for deduplication
  const exclusionNote = context.generatedIds.length > 0
    ? `\n\nتجنب إنشاء أسئلة مشابهة للأسئلة ذات المعرفات التالية:\n${context.generatedIds.slice(-20).join(', ')}`
    : ''

  return `قم بإنشاء ${config.batchSize} سؤال ${sectionName} لاختبار القدرات العامة.

الدفعة: ${config.batchIndex + 1}
المسار الأكاديمي: ${config.track === 'scientific' ? 'علمي' : 'أدبي'}
التصنيفات المطلوبة: ${categoryNames}

توزيع الصعوبة:
- سهل (easy): 3 أسئلة
- متوسط (medium): 5 أسئلة
- صعب (hard): 2 أسئلة

تنسيق معرف السؤال: ${idPrefix}_${config.batchIndex}_{رقم_تسلسلي}
مثال: ${idPrefix}_${config.batchIndex}_01, ${idPrefix}_${config.batchIndex}_02, ...${exclusionNote}

أجب بتنسيق JSON التالي فقط:
{
  "questions": [
    {
      "id": "${idPrefix}_${config.batchIndex}_01",
      "section": "${config.section}",
      "topic": "category_key",
      "difficulty": "easy" | "medium" | "hard",
      "questionType": "mcq",
      "stem": "نص السؤال باللغة العربية",
      "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "answerIndex": 0,
      "explanation": "شرح مفصل للإجابة الصحيحة",
      "tags": ["tag1", "tag2"]
    }
  ]
}`
}

/**
 * Parse and validate question response from Claude
 */
export function parseQuestionResponse(
  responseText: string,
  config: BatchConfig
): Question[] {
  // Extract JSON from response
  let json: string = responseText

  // Remove markdown code blocks if present
  json = json.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

  // Find JSON object
  const startIdx = json.indexOf('{')
  const endIdx = json.lastIndexOf('}')

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('No valid JSON object found in response')
  }

  json = json.slice(startIdx, endIdx + 1)

  // Fix common JSON issues
  json = json.replace(/,\s*([}\]])/g, '$1') // trailing commas
  json = json.replace(/}\s*{/g, '},{') // missing commas between objects

  // Parse JSON
  const parsed = JSON.parse(json) as { questions: Partial<Question>[] }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid response structure - missing questions array')
  }

  const idPrefix = config.section === 'quantitative' ? 'quant' : 'verbal'

  // Validate and normalize questions
  return parsed.questions.map((q, index) => {
    // Validate required fields
    if (!q.stem || typeof q.stem !== 'string') {
      throw new Error(`Question ${index} missing stem`)
    }

    if (!q.choices || !Array.isArray(q.choices) || q.choices.length !== 4) {
      throw new Error(`Question ${index} must have exactly 4 choices`)
    }

    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) {
      throw new Error(`Question ${index} has invalid answerIndex`)
    }

    return {
      id: q.id || `${idPrefix}_${config.batchIndex}_${String(index + 1).padStart(2, '0')}`,
      section: q.section || config.section,
      topic: (q.topic || 'general') as QuestionCategory,
      difficulty: q.difficulty || 'medium',
      questionType: q.questionType || 'mcq',
      stem: q.stem,
      choices: q.choices as [string, string, string, string],
      answerIndex: q.answerIndex as 0 | 1 | 2 | 3,
      explanation: q.explanation || '',
      solvingStrategy: q.solvingStrategy,
      tip: q.tip,
      passage: q.passage,
      tags: q.tags || [],
    }
  })
}
