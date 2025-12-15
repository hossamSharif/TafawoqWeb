/**
 * Test first batch latency for question generation
 * Run: npx tsx scripts/test-batch-latency.ts
 *
 * Success criteria: First batch latency should be <5s
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import Anthropic from '@anthropic-ai/sdk'

// System prompts that match production (from prompts.ts)
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

تنسيق الإخراج:
أجب بتنسيق JSON فقط مع مصفوفة questions.
لا تضف أي نص قبل أو بعد كائن JSON.`

const CATEGORIES_PROMPT = `التصنيفات المتاحة لأسئلة اختبار القدرات:

القسم الكمي (quantitative):
- algebra: الجبر
- geometry: الهندسة
- statistics: الإحصاء
- ratio-proportion: النسب والتناسب
- probability: الاحتمالات
- speed-time-distance: السرعة والمسافة والزمن

القسم اللفظي (verbal):
- reading-comprehension: استيعاب المقروء
- sentence-completion: إكمال الجمل
- context-error: الخطأ السياقي
- analogy: التناظر اللفظي
- association-difference: الارتباط والاختلاف
- vocabulary: المفردات`

async function testBatchLatency() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set')
    process.exit(1)
  }

  console.log('Testing first batch latency for question generation...')
  console.log('Target: <5 seconds\n')

  const anthropic = new Anthropic({ apiKey })

  const systemBlocks = [
    {
      type: 'text' as const,
      text: SYSTEM_RULES_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    },
    {
      type: 'text' as const,
      text: CATEGORIES_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    },
  ]

  // Simplified prompt requesting just 2 questions for latency testing
  const userPrompt = `قم بإنشاء 2 سؤال كمي بسيط لاختبار القدرات العامة.

التصنيف: algebra
الصعوبة: easy

أجب بتنسيق JSON التالي فقط:
{
  "questions": [
    {
      "id": "test_0_01",
      "section": "quantitative",
      "topic": "algebra",
      "difficulty": "easy",
      "stem": "نص السؤال",
      "choices": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "answerIndex": 0,
      "explanation": "شرح"
    }
  ]
}`

  try {
    console.log('--- First Batch (Cold Start) ---')
    const start = Date.now()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemBlocks,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const duration = Date.now() - start
    const durationSec = (duration / 1000).toFixed(2)

    console.log('Duration:', duration, 'ms', `(${durationSec}s)`)
    console.log('Input tokens:', response.usage.input_tokens)
    console.log('Output tokens:', response.usage.output_tokens)
    console.log('Cache creation tokens:', response.usage.cache_creation_input_tokens ?? 0)
    console.log('Cache read tokens:', response.usage.cache_read_input_tokens ?? 0)

    // Validate latency target
    console.log('\n--- Results ---')
    if (duration < 5000) {
      console.log(`✅ PASS: First batch latency ${durationSec}s < 5s target`)
    } else {
      console.log(`❌ FAIL: First batch latency ${durationSec}s exceeds 5s target`)
      process.exit(1)
    }

    // Show response preview
    const textContent = response.content.find((block) => block.type === 'text')
    if (textContent && textContent.type === 'text') {
      try {
        const parsed = JSON.parse(textContent.text.replace(/```json\s*/gi, '').replace(/```\s*/g, ''))
        console.log(`✅ Valid JSON response with ${parsed.questions?.length ?? 0} questions`)
      } catch {
        console.log('⚠️ Response preview (may not be valid JSON):', textContent.text.substring(0, 200))
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testBatchLatency()
