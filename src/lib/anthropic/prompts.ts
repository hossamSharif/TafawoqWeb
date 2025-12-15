/**
 * System prompts and question generation for Claude Sonnet 4.5
 * Uses prompt caching for 90% cost reduction on batches 2+
 */

import type { Question, QuestionCategory } from '@/types/question'
import type { BatchConfig, CachedTextBlock, GenerationContext } from './types'

/**
 * System rules prompt - cached across all batches
 * ~1,200+ tokens - exceeds 1,024 minimum for caching
 */
const SYSTEM_RULES_PROMPT = `أنت خبير متخصص في إعداد أسئلة اختبار القدرات العامة السعودي (GAT/Qudurat).
مهمتك هي إنشاء أسئلة عالية الجودة تتوافق مع معايير الاختبار الفعلي.

نبذة عن اختبار القدرات العامة:
اختبار القدرات العامة هو اختبار مقياسي موحد يقدمه المركز الوطني للقياس في المملكة العربية السعودية.
يهدف الاختبار إلى قياس القدرات التحليلية والاستدلالية للطلاب، وليس المعلومات المكتسبة من المقررات الدراسية.
ينقسم الاختبار إلى قسمين رئيسيين: القسم الكمي والقسم اللفظي.
يستخدم الاختبار في القبول الجامعي ويعتبر من أهم معايير المفاضلة بين المتقدمين.

القواعد الصارمة لإنشاء الأسئلة:
1. جميع الأسئلة والخيارات والشروحات يجب أن تكون باللغة العربية الفصحى السليمة
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط (أ، ب، ج، د)
3. الإجابة الصحيحة يجب أن تكون واحدة فقط من الخيارات الأربعة
4. الشرح يجب أن يكون مفصلاً ويوضح خطوات الحل بشكل واضح ومنهجي
5. تجنب الأسئلة المكررة أو المتشابهة مع الأسئلة السابقة في نفس الدفعة
6. راعي مستوى الصعوبة المطلوب (30% سهل، 50% متوسط، 20% صعب)
7. أنشئ معرف فريد لكل سؤال بالتنسيق: {section}_{batch}_{seq}
8. لا تستخدم أرقاماً عشوائية - اجعل الأسئلة واقعية ومنطقية
9. تأكد من صحة الإجابة قبل تقديم السؤال
10. استخدم أمثلة وسياقات من الحياة اليومية عند الإمكان

معايير الجودة العالية:
- الأسئلة يجب أن تختبر الفهم والتحليل وليس الحفظ والتلقين
- الخيارات الخاطئة (المشتتات) يجب أن تكون معقولة وليست واضحة الخطأ
- تجنب الأسئلة السلبية المعقدة مثل "أي مما يلي ليس صحيحاً"
- الشرح يجب أن يساعد الطالب على فهم المفهوم وتطبيقه في مواقف مشابهة
- تنوع في صياغة الأسئلة لتجنب الرتابة والتكرار
- الأسئلة يجب أن تكون محايدة ثقافياً وخالية من التحيز

إرشادات القسم الكمي:
- استخدم أرقاماً صحيحة أو كسور بسيطة قدر الإمكان
- تجنب الحسابات المعقدة التي تتطلب آلة حاسبة
- ركز على المفاهيم الرياضية الأساسية والتفكير المنطقي
- اجعل الأسئلة قابلة للحل في دقيقة إلى دقيقتين

إرشادات القسم اللفظي:
- استخدم لغة عربية فصحى سليمة وواضحة
- تجنب المصطلحات المتخصصة غير الشائعة
- في أسئلة استيعاب المقروء، اختر نصوصاً متنوعة ومثيرة للاهتمام
- في التناظر اللفظي، استخدم علاقات منطقية واضحة

تنسيق الإخراج:
أجب بتنسيق JSON فقط مع مصفوفة questions.
لا تضف أي نص قبل أو بعد كائن JSON.
تأكد من صحة تنسيق JSON قبل الإخراج.`

/**
 * Categories prompt - cached across all batches
 * ~800 tokens - contributes to cache minimum
 */
const CATEGORIES_PROMPT = `التصنيفات المتاحة لأسئلة اختبار القدرات:

القسم الكمي (quantitative):
يقيس هذا القسم القدرات الرياضية والتفكير المنطقي. يشمل التصنيفات التالية:

- algebra: الجبر
  المعادلات من الدرجة الأولى والثانية، المتباينات، تبسيط العبارات الجبرية، كثيرات الحدود، النسب الجبرية، العمليات على الجذور

- geometry: الهندسة
  مساحات ومحيطات الأشكال المستوية، الزوايا وأنواعها، الأشكال الثلاثية الأبعاد، التشابه والتطابق، المثلثات وخصائصها، الدائرة

- statistics: الإحصاء
  المتوسط الحسابي، الوسيط، المنوال، المدى، الانحراف المعياري، الربيعيات، تمثيل البيانات

- ratio-proportion: النسب والتناسب
  النسب المئوية، التناسب الطردي والعكسي، مسائل الخلطات، نسب التقسيم، التغير النسبي

- probability: الاحتمالات
  الاحتمال البسيط، الاحتمال المركب، الأحداث المستقلة والمتنافية، التباديل والتوافيق، قاعدة الجمع والضرب

- speed-time-distance: السرعة والمسافة والزمن
  مسائل الحركة المنتظمة، السرعة المتوسطة، مسائل اللحاق والتقاطع، القطارات والأنهار

القسم اللفظي (verbal):
يقيس هذا القسم الفهم القرائي والثروة اللغوية. يشمل التصنيفات التالية:

- reading-comprehension: استيعاب المقروء
  نصوص قراءة متنوعة مع أسئلة فهم مباشر واستنتاج وتحليل واستخلاص الأفكار الرئيسية

- sentence-completion: إكمال الجمل
  اختيار الكلمة أو العبارة المناسبة لإكمال الجملة بما يتوافق مع السياق والمعنى

- context-error: الخطأ السياقي
  تحديد الكلمة الخاطئة في سياق الجملة، والتي لا تتناسب مع المعنى العام للنص

- analogy: التناظر اللفظي
  إيجاد العلاقات المنطقية بين الكلمات، مثل: قلم:كتابة، مفتاح:باب، طبيب:مريض

- association-difference: الارتباط والاختلاف
  تحديد الكلمة المختلفة عن المجموعة، أو إيجاد العلاقة المشتركة بين الكلمات

- vocabulary: المفردات
  معاني الكلمات في سياقات مختلفة، المترادفات والأضداد، الدلالات اللغوية`

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
