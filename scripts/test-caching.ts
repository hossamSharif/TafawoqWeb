/**
 * Test Claude prompt caching functionality
 * Run: npx tsx scripts/test-caching.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import Anthropic from '@anthropic-ai/sdk'

// Large system prompt that exceeds 1,024 token minimum for caching
const SYSTEM_PROMPT = `أنت خبير متخصص في إعداد أسئلة اختبار القدرات العامة السعودي (GAT/Qudurat).
مهمتك هي إنشاء أسئلة عالية الجودة تتوافق مع معايير الاختبار الفعلي.

نبذة عن اختبار القدرات العامة:
اختبار القدرات العامة هو اختبار مقياسي موحد يقدمه المركز الوطني للقياس في المملكة العربية السعودية.
يهدف الاختبار إلى قياس القدرات التحليلية والاستدلالية للطلاب، وليس المعلومات المكتسبة من المقررات الدراسية.
ينقسم الاختبار إلى قسمين رئيسيين: القسم الكمي والقسم اللفظي.
يستخدم الاختبار في القبول الجامعي ويعتبر من أهم معايير المفاضلة بين المتقدمين.

القواعد الصارمة لإنشاء الأسئلة:
1. جميع الأسئلة والخيارات والشروحات يجب أن تكون باللغة العربية الفصحى السليمة
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط
3. الإجابة الصحيحة يجب أن تكون واحدة فقط من الخيارات الأربعة
4. الشرح يجب أن يكون مفصلاً ويوضح خطوات الحل بشكل واضح ومنهجي
5. تجنب الأسئلة المكررة أو المتشابهة مع الأسئلة السابقة
6. راعي مستوى الصعوبة المطلوب
7. أنشئ معرف فريد لكل سؤال
8. لا تستخدم أرقاماً عشوائية - اجعل الأسئلة واقعية ومنطقية
9. تأكد من صحة الإجابة قبل تقديم السؤال
10. استخدم أمثلة وسياقات من الحياة اليومية عند الإمكان

معايير الجودة العالية:
- الأسئلة يجب أن تختبر الفهم والتحليل وليس الحفظ والتلقين
- الخيارات الخاطئة (المشتتات) يجب أن تكون معقولة وليست واضحة الخطأ
- تجنب الأسئلة السلبية المعقدة
- الشرح يجب أن يساعد الطالب على فهم المفهوم
- تنوع في صياغة الأسئلة لتجنب الرتابة والتكرار
- الأسئلة يجب أن تكون محايدة ثقافياً وخالية من التحيز

تنسيق الإخراج:
أجب بتنسيق JSON فقط مع مصفوفة questions.
لا تضف أي نص قبل أو بعد كائن JSON.
تأكد من صحة تنسيق JSON قبل الإخراج.

التصنيفات المتاحة لأسئلة اختبار القدرات:
القسم الكمي: الجبر، الهندسة، الإحصاء، النسب والتناسب، الاحتمالات، السرعة والمسافة والزمن
القسم اللفظي: استيعاب المقروء، إكمال الجمل، الخطأ السياقي، التناظر اللفظي، الارتباط والاختلاف، المفردات`

async function testCaching() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set')
    process.exit(1)
  }

  console.log('Testing Claude prompt caching...')
  console.log('System prompt length:', SYSTEM_PROMPT.length, 'characters')
  console.log('Estimated tokens:', Math.ceil(SYSTEM_PROMPT.length * 0.4))
  console.log('')

  const anthropic = new Anthropic({ apiKey })

  const systemBlocks = [
    {
      type: 'text' as const,
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    },
  ]

  try {
    // First request - should create cache
    console.log('--- Request 1: Creating cache ---')
    const start1 = Date.now()
    const response1 = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemBlocks,
      messages: [{ role: 'user', content: 'ما هو 2+2؟ اجب بجملة واحدة.' }],
    })
    const duration1 = Date.now() - start1

    console.log('Cache creation tokens:', response1.usage.cache_creation_input_tokens ?? 0)
    console.log('Cache read tokens:', response1.usage.cache_read_input_tokens ?? 0)
    console.log('Duration:', duration1, 'ms')

    // Wait a moment before second request
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Second request - should hit cache
    console.log('\n--- Request 2: Reading from cache ---')
    const start2 = Date.now()
    const response2 = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemBlocks,
      messages: [{ role: 'user', content: 'ما هو 3+3؟ اجب بجملة واحدة.' }],
    })
    const duration2 = Date.now() - start2

    console.log('Cache creation tokens:', response2.usage.cache_creation_input_tokens ?? 0)
    console.log('Cache read tokens:', response2.usage.cache_read_input_tokens ?? 0)
    console.log('Duration:', duration2, 'ms')

    // Summary
    console.log('\n--- Summary ---')
    const cacheHit = (response2.usage.cache_read_input_tokens ?? 0) > 0
    if (cacheHit) {
      console.log('✅ Cache hit on second request!')
      console.log('Cost savings: ~90% on cached input tokens')
    } else {
      console.log('⚠️ No cache hit detected')
      console.log('This could mean the prompt is below 1,024 tokens minimum')
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testCaching()
