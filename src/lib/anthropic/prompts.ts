/**
 * System prompts and question generation for Claude Sonnet 4.5
 * Uses prompt caching for 90% cost reduction on batches 2+
 *
 * Enhanced to support:
 * - Track differentiation (علمي vs أدبي)
 * - Diagram/chart questions with rendering metadata
 * - Official Qudurat exam specifications
 */

import type { Question, QuestionCategory, DiagramData } from '@/types/question'
import type { BatchConfig, CachedTextBlock, GenerationContext } from './types'

/**
 * System rules prompt - cached across all batches
 * Enhanced with official Qudurat specs and track differentiation
 */
const SYSTEM_RULES_PROMPT = `أنت خبير متخصص في إعداد أسئلة اختبار القدرات العامة السعودي (GAT/Qudurat).
مهمتك هي إنشاء أسئلة عالية الجودة تتوافق مع معايير الاختبار الفعلي.

═══════════════════════════════════════════════════════════════════
نبذة عن اختبار القدرات العامة
═══════════════════════════════════════════════════════════════════
اختبار القدرات العامة هو اختبار مقياسي موحد يقدمه المركز الوطني للقياس في المملكة العربية السعودية.
يهدف الاختبار إلى قياس القدرات التحليلية والاستدلالية للطلاب، وليس المعلومات المكتسبة من المقررات الدراسية.
ينقسم الاختبار إلى قسمين رئيسيين: القسم الكمي والقسم اللفظي.
يستخدم الاختبار في القبول الجامعي ويعتبر من أهم معايير المفاضلة بين المتقدمين.

═══════════════════════════════════════════════════════════════════
مواصفات الاختبار الرسمية
═══════════════════════════════════════════════════════════════════
- إجمالي عدد الأسئلة: 96 سؤالًا
- مدة الاختبار: 120 دقيقة
- نوع الأسئلة: اختيار من متعدد (4 خيارات لكل سؤال، إجابة واحدة صحيحة فقط)
- لا يُسمح باستخدام الآلة الحاسبة
- الأسئلة موزعة عشوائيًا من حيث الصعوبة (غير مرتبة تصاعديًا)
- جميع الأسئلة متساوية في الوزن، ولا تُخصم درجات على الإجابات الخاطئة

═══════════════════════════════════════════════════════════════════
توزيع الأسئلة حسب المسار
═══════════════════════════════════════════════════════════════════
المسار العلمي:
- القسم الكمي: 60% (حوالي 57 سؤالًا)
- القسم اللفظي: 40% (حوالي 39 سؤالًا)

المسار الأدبي:
- القسم الكمي: 30% (حوالي 29 سؤالًا)
- القسم اللفظي: 70% (حوالي 67 سؤالًا)

═══════════════════════════════════════════════════════════════════
القواعد الصارمة لإنشاء الأسئلة
═══════════════════════════════════════════════════════════════════
1. جميع الأسئلة والخيارات والشروحات يجب أن تكون باللغة العربية الفصحى السليمة
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط
3. الإجابة الصحيحة يجب أن تكون واحدة فقط من الخيارات الأربعة
4. الشرح يجب أن يكون مفصلاً ويوضح خطوات الحل بشكل واضح ومنهجي
5. تجنب الأسئلة المكررة أو المتشابهة مع الأسئلة السابقة في نفس الدفعة
6. راعي مستوى الصعوبة المطلوب (30% سهل، 50% متوسط، 20% صعب)
7. أنشئ معرف فريد لكل سؤال بالتنسيق المحدد
8. لا تتطلب الأسئلة استخدام آلة حاسبة - اجعل الأرقام قابلة للحساب الذهني
9. تأكد من صحة الإجابة قبل تقديم السؤال
10. استخدم أمثلة وسياقات من الحياة اليومية عند الإمكان

═══════════════════════════════════════════════════════════════════
معايير الجودة العالية
═══════════════════════════════════════════════════════════════════
- الأسئلة يجب أن تختبر الفهم والتحليل وليس الحفظ والتلقين
- الخيارات الخاطئة (المشتتات) يجب أن تكون معقولة وليست واضحة الخطأ
- تجنب الأسئلة السلبية المعقدة مثل "أي مما يلي ليس صحيحاً"
- الشرح يجب أن يساعد الطالب على فهم المفهوم وتطبيقه في مواقف مشابهة
- تنوع في صياغة الأسئلة لتجنب الرتابة والتكرار
- الأسئلة يجب أن تكون محايدة ثقافياً وخالية من التحيز
- لا تعتمد على مقررات دراسية محددة، بل استند إلى المهارات العامة

═══════════════════════════════════════════════════════════════════
تنسيق الإخراج
═══════════════════════════════════════════════════════════════════
أجب بتنسيق JSON فقط مع مصفوفة questions.
لا تضف أي نص قبل أو بعد كائن JSON.
تأكد من صحة تنسيق JSON قبل الإخراج.`

/**
 * Track-specific prompt - differentiates topic depth between علمي and أدبي
 * Cached across all batches
 */
const TRACK_SPECIFIC_PROMPT = `═══════════════════════════════════════════════════════════════════
الموضوعات المطلوب تغطيتها حسب المسار
═══════════════════════════════════════════════════════════════════

【القسم الكمي - المسار العلمي】(مستوى متقدم)

الجبر (algebra):
- المعادلات الخطية والتربيعية
- تبسيط التعابير الجبرية المعقدة
- تحليل المتباينات والمتتاليات
- كثيرات الحدود والعمليات عليها
- النسب الجبرية والعمليات على الجذور

الهندسة (geometry):
- الزوايا وخصائصها المتقدمة
- مساحات وحجوم الأشكال المركبة
- التشابه والتطابق
- المثلثات وخصائصها (فيثاغورس، القائم الزاوية)
- الدائرة ومماساتها وأوتارها
- الأشكال ثلاثية الأبعاد (المنشور، الأسطوانة، المخروط)

الإحصاء (statistics):
- قراءة وتحليل الجداول المعقدة
- الرسوم البيانية المتعددة (أعمدة، خطية، دائرية)
- المتوسط الحسابي والوسيط والمنوال
- الانحراف المعياري والتباين
- الربيعيات وتمثيل البيانات

الاحتمالات (probability):
- حساب الاحتمالات باستخدام مبادئ العد
- الأحداث المستقلة والمتنافية
- التباديل والتوافيق
- قاعدة الجمع والضرب

---

【القسم الكمي - المسار الأدبي】(مستوى أساسي)

الجبر (algebra):
- المعادلات البسيطة من الدرجة الأولى
- العمليات الحسابية الأساسية
- تبسيط التعابير الجبرية البسيطة

الهندسة (geometry):
- مفاهيم هندسية أولية (المحيط، المساحة)
- الأشكال الأساسية (المربع، المستطيل، المثلث، الدائرة)
- قياس الزوايا الأساسية

الإحصاء (statistics):
- المتوسط الحسابي والمنوال
- قراءة رسوم بيانية بسيطة (أعمدة فقط)
- تفسير الجداول البسيطة

الاحتمالات (probability):
- مفاهيم أساسية في الاحتمال
- الاحتمال البسيط (نتيجة واحدة)

---

【موضوعات مشتركة للمسارين】

النسبة والتناسب (ratio-proportion):
- النسب المئوية والكسور
- التناسب الطردي والعكسي
- مسائل تطبيقية في الحياة اليومية
- نسب التقسيم

السرعة والمسافة والزمن (speed-time-distance):
- مسائل الحركة المنتظمة
- السرعة المتوسطة
- العلاقات الرياضية البسيطة

---

【القسم اللفظي - موحد للمسارين】

استيعاب المقروء (reading-comprehension):
- نصوص متنوعة (أدبية، علمية، اجتماعية)
- أسئلة فهم مباشر واستنتاج
- تحليل واستخلاص الأفكار الرئيسية

إكمال الجمل (sentence-completion):
- اختيار الكلمة الأنسب لغويًا وسياقيًا
- فهم السياق والمعنى

الخطأ السياقي (context-error):
- تحديد الكلمة غير المناسبة في الجملة
- فهم التناسق اللغوي

التناظر اللفظي (analogy):
- إيجاد علاقة مماثلة بين زوجين من الكلمات
- أنواع العلاقات: سببية، جزئية، تضاد، ترادف

الارتباط والاختلاف (association-difference):
- تحديد الكلمة المختلفة عن المجموعة
- إيجاد العلاقة المشتركة بين الكلمات

المفردات (vocabulary):
- معاني الكلمات في سياقات مختلفة
- المترادفات والأضداد
- الدلالات اللغوية`

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
 * Diagram generation prompt - instructions for generating visual questions
 * Includes diagram metadata structure for rendering
 */
const DIAGRAM_GENERATION_PROMPT = `═══════════════════════════════════════════════════════════════════
تعليمات توليد الأسئلة المصورة (الرسوم والمخططات)
═══════════════════════════════════════════════════════════════════

【متطلبات الأسئلة المصورة】

يجب أن تتضمن كل دفعة أسئلة كمية ما لا يقل عن:
- 2 سؤال هندسي مع رسم توضيحي (دائرة، مثلث، مستطيل، شكل مركب)
- 1 سؤال إحصائي مع رسم بياني (أعمدة، خطي، دائري)

【أنواع الأسئلة المدعومة】

- mcq: سؤال نصي بدون رسم
- diagram: سؤال هندسي مع رسم توضيحي
- chart: سؤال إحصائي مع رسم بياني
- reading-passage: نص قراءة مع أسئلة

【بنية كائن الرسم (diagram)】

لكل سؤال من نوع diagram أو chart، يجب تضمين كائن diagram بالبنية التالية:

{
  "type": "نوع الرسم",
  "data": { بيانات الرسم حسب النوع },
  "renderHint": "تقنية العرض",
  "caption": "وصف مختصر للرسم"
}

【أنواع الرسوم الهندسية (renderHint: "SVG")】

1. الدائرة (circle):
{
  "type": "circle",
  "data": {
    "radius": 7,
    "center": [150, 150],
    "label": "نق = 7 سم",
    "showRadius": true,
    "showDiameter": false
  },
  "renderHint": "SVG",
  "caption": "دائرة نصف قطرها 7 سم"
}

2. المثلث (triangle):
{
  "type": "triangle",
  "data": {
    "vertices": [[50, 200], [250, 200], [150, 50]],
    "labels": ["أ", "ب", "ج"],
    "sides": ["5 سم", "5 سم", "6 سم"],
    "angles": [null, null, "90°"],
    "showRightAngle": true
  },
  "renderHint": "SVG",
  "caption": "مثلث قائم الزاوية"
}

3. المستطيل (rectangle):
{
  "type": "rectangle",
  "data": {
    "width": 8,
    "height": 5,
    "labels": ["أ", "ب", "ج", "د"],
    "showDimensions": true,
    "showDiagonal": false
  },
  "renderHint": "SVG",
  "caption": "مستطيل أبعاده 8×5"
}

4. شكل مركب (composite-shape):
{
  "type": "composite-shape",
  "data": {
    "shapes": [
      { "type": "rectangle", "x": 0, "y": 0, "width": 10, "height": 6 },
      { "type": "circle", "cx": 10, "cy": 3, "radius": 3, "half": true }
    ],
    "labels": ["10 سم", "6 سم", "نق = 3 سم"]
  },
  "renderHint": "SVG",
  "caption": "مستطيل متصل بنصف دائرة"
}

【أشكال متداخلة - Overlapping Shapes (renderHint: "JSXGraph")】

أسئلة المناطق المظللة في الأشكال المتداخلة تتطلب استخدام JSXGraph للعرض التفاعلي.
هذه الأسئلة شائعة جداً في اختبار القدرات وتتطلب حساب مساحة المنطقة المظللة.

الأنماط المدعومة (8 أنماط):

أ) دائرة داخل مربع (inscribed-circle-in-square) - سهل:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "inscribed-circle-in-square",
    "dimensions": { "side": 10 },
    "shading": { "region": "outer", "color": "#3B82F6", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "دائرة مماسة لأضلاع مربع من الداخل - المنطقة المظللة خارج الدائرة"
}

ب) مربع داخل دائرة (inscribed-square-in-circle) - سهل:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "inscribed-square-in-circle",
    "dimensions": { "radius": 7 },
    "shading": { "region": "outer", "color": "#10B981", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "مربع رؤوسه على الدائرة - المنطقة المظللة خارج المربع"
}

ج) مربع مع أرباع دوائر في الزوايا (square-with-corner-circles) - متوسط:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "square-with-corner-circles",
    "dimensions": { "side": 8 },
    "shading": { "region": "petals", "color": "#8B5CF6", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "مربع مع أرباع دوائر مركزها في الزوايا - المنطقة المظللة هي البتلات"
}

د) مربع رأسه على مركز دائرة (square-vertex-at-circle-center) - متوسط:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "square-vertex-at-circle-center",
    "dimensions": { "side": 6, "radius": 6 },
    "shading": { "region": "intersection", "color": "#F59E0B", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "أحد رؤوس المربع هو مركز الدائرة - المنطقة المظللة هي التقاطع"
}

هـ) نمط الوردة داخل مربع (rose-pattern-in-square) - صعب:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "rose-pattern-in-square",
    "dimensions": { "side": 10 },
    "shading": { "region": "petals", "color": "#EC4899", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "نمط وردة مكون من 4 أنصاف دوائر متقاطعة - المنطقة المظللة هي البتلات الأربع"
}

و) ثلاث دوائر متماسة (three-tangent-circles) - صعب:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "three-tangent-circles",
    "dimensions": { "radius": 5 },
    "shading": { "region": "intersection", "color": "#06B6D4", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "ثلاث دوائر متماسة خارجياً - المنطقة المظللة هي المثلث المتكون بينها"
}

ز) نصفا دائرة متداخلان (overlapping-semicircles) - صعب:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "overlapping-semicircles",
    "dimensions": { "diameter": 12 },
    "shading": { "region": "lens", "color": "#EF4444", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "نصفا دائرة متداخلان - المنطقة المظللة هي العدسة المشتركة"
}

ح) أرباع دوائر في مربع (quarter-circles-in-square) - صعب:
{
  "type": "overlapping-shapes",
  "data": {
    "subtype": "quarter-circles-in-square",
    "dimensions": { "side": 10 },
    "shading": { "region": "intersection", "color": "#84CC16", "opacity": 0.4 }
  },
  "renderHint": "JSXGraph",
  "caption": "أربعة أرباع دوائر مراكزها في زوايا المربع - المنطقة المظللة هي التقاطع"
}

【متطلبات أسئلة الأشكال المتداخلة】
- يجب أن يكون النوع type = "overlapping-shapes"
- يجب أن يكون renderHint = "JSXGraph" (مهم جداً للعرض)
- يجب تحديد subtype من الأنماط الثمانية المذكورة أعلاه
- يجب تضمين dimensions مع القياسات المناسبة
- يجب تضمين shading مع المنطقة واللون والشفافية
- يجب أن يسأل السؤال عن مساحة المنطقة المظللة أو محيطها
- يجب تضمين الصيغة المستخدمة في الشرح (formulaUsed)

【أنواع الرسوم البيانية (renderHint: "Chart.js")】

1. رسم بياني بالأعمدة (bar-chart):
{
  "type": "bar-chart",
  "data": {
    "labels": ["أحمد", "سارة", "ليلى", "خالد"],
    "values": [8, 12, 7, 9],
    "xAxisLabel": "الطلاب",
    "yAxisLabel": "عدد الكتب",
    "title": "عدد الكتب المقروءة"
  },
  "renderHint": "Chart.js",
  "caption": "عدد الكتب المقروءة من قبل كل طالب"
}

2. رسم بياني خطي (line-graph):
{
  "type": "line-graph",
  "data": {
    "labels": ["يناير", "فبراير", "مارس", "أبريل"],
    "values": [20, 35, 25, 40],
    "xAxisLabel": "الشهر",
    "yAxisLabel": "المبيعات",
    "title": "مبيعات الربع الأول"
  },
  "renderHint": "Chart.js",
  "caption": "تطور المبيعات خلال الربع الأول"
}

3. رسم بياني دائري (pie-chart):
{
  "type": "pie-chart",
  "data": {
    "labels": ["رياضيات", "علوم", "لغة عربية", "إنجليزي"],
    "values": [30, 25, 25, 20],
    "title": "توزيع الدرجات"
  },
  "renderHint": "Chart.js",
  "caption": "توزيع درجات الطالب على المواد"
}

【إرشادات إضافية للرسوم】

- استخدم أرقامًا صحيحة أو كسورًا بسيطة قابلة للحساب الذهني
- تأكد من أن بيانات الرسم متوافقة مع نص السؤال
- اجعل الرسم واضحًا وقابلاً للفهم بدون شرح إضافي
- لا تستخدم قيمًا تتطلب آلة حاسبة للتحقق منها`

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
      text: TRACK_SPECIFIC_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: CATEGORIES_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: DIAGRAM_GENERATION_PROMPT,
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
 * Enhanced with track-specific instructions and diagram requirements
 */
export function buildUserPrompt(
  config: BatchConfig,
  context: GenerationContext
): string {
  const sectionName = config.section === 'quantitative' ? 'كمي' : 'لفظي'
  const categories = config.categories || getCategoriesForBatch(config.section, config.batchIndex)
  const categoryNames = categories.join('، ')

  const idPrefix = config.section === 'quantitative' ? 'quant' : 'verbal'
  const trackName = config.track === 'scientific' ? 'علمي' : 'أدبي'
  const trackLevel = config.track === 'scientific' ? 'مستوى متقدم' : 'مستوى أساسي'

  // Build exclusion list for deduplication
  const exclusionNote = context.generatedIds.length > 0
    ? `\n\nتجنب إنشاء أسئلة مشابهة للأسئلة ذات المعرفات التالية:\n${context.generatedIds.slice(-20).join(', ')}`
    : ''

  // Track-specific instructions for quantitative section
  const trackInstructions = config.section === 'quantitative'
    ? config.track === 'scientific'
      ? `
【تعليمات المسار العلمي - مستوى متقدم】
- استخدم معادلات خطية وتربيعية
- يمكن تضمين متباينات وتحليل
- أسئلة الهندسة تشمل الأشكال المركبة والحجوم
- أسئلة الإحصاء تشمل الانحراف المعياري والتباين
- أسئلة الاحتمالات تشمل التباديل والتوافيق`
      : `
【تعليمات المسار الأدبي - مستوى أساسي】
- استخدم معادلات بسيطة من الدرجة الأولى فقط
- ركز على العمليات الحسابية الأساسية
- أسئلة الهندسة تشمل المحيط والمساحة فقط
- أسئلة الإحصاء تشمل المتوسط والمنوال فقط
- أسئلة الاحتمالات تكون بسيطة (نتيجة واحدة)`
    : ''

  // Diagram requirements for quantitative batches
  const diagramRequirements = config.section === 'quantitative'
    ? `
【متطلبات الأسئلة المصورة لهذه الدفعة】
- يجب أن تتضمن هذه الدفعة 2 سؤال على الأقل من نوع "diagram" (أسئلة هندسية مع رسم)
- يجب أن تتضمن هذه الدفعة 1 سؤال على الأقل من نوع "chart" (أسئلة إحصائية مع رسم بياني)
- يجب أن تتضمن هذه الدفعة 1 سؤال على الأقل من نوع "overlapping-diagram" (أشكال متداخلة مع منطقة مظللة)
  * استخدم type = "overlapping-shapes" و renderHint = "JSXGraph"
  * اختر subtype من الأنماط الثمانية حسب الصعوبة المطلوبة
- تأكد من تضمين كائن diagram مع بيانات الرسم الكاملة لكل سؤال مصور`
    : ''

  return `قم بإنشاء ${config.batchSize} سؤال ${sectionName} لاختبار القدرات العامة.

الدفعة: ${config.batchIndex + 1}
المسار الأكاديمي: ${trackName} (${trackLevel})
التصنيفات المطلوبة: ${categoryNames}
${trackInstructions}
${diagramRequirements}

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
      "questionType": "mcq" | "diagram" | "chart" | "overlapping-diagram",
      "stem": "نص السؤال باللغة العربية",
      "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "answerIndex": 0,
      "explanation": "شرح مفصل للإجابة الصحيحة مع خطوات الحل",
      "diagram": {
        "type": "circle" | "triangle" | "rectangle" | "composite-shape" | "overlapping-shapes" | "bar-chart" | "line-graph" | "pie-chart",
        "data": { ... بيانات الرسم حسب النوع ... },
        "renderHint": "SVG" | "Chart.js" | "JSXGraph",
        "caption": "وصف مختصر للرسم"
      },
      "tags": ["tag1", "tag2"]
    }
  ]
}

ملاحظة: كائن diagram مطلوب فقط للأسئلة من نوع "diagram" أو "chart" أو "overlapping-diagram".`
}

/**
 * Parse and validate question response from Claude
 * Enhanced to handle diagram/chart questions with rendering metadata
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

  // Valid diagram types for validation
  const validDiagramTypes = [
    'circle', 'triangle', 'rectangle', 'composite-shape', 'overlapping-shapes',
    'bar-chart', 'pie-chart', 'line-graph', 'custom'
  ]
  const validRenderHints = ['SVG', 'Canvas', 'Chart.js', 'JSXGraph']

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

    // Determine question type
    const questionType = q.questionType || 'mcq'

    // Validate and normalize diagram for visual questions
    let diagram: DiagramData | undefined = undefined
    if ((questionType === 'diagram' || questionType === 'chart' || questionType === 'overlapping-diagram') && q.diagram) {
      const d = q.diagram as Partial<DiagramData>

      // Validate diagram structure
      if (!d.type || !validDiagramTypes.includes(d.type)) {
        console.warn(`Question ${index} has invalid diagram type: ${d.type}, defaulting to 'custom'`)
        d.type = 'custom'
      }

      if (!d.renderHint || !validRenderHints.includes(d.renderHint)) {
        // Auto-assign renderHint based on diagram type
        if (['bar-chart', 'pie-chart', 'line-graph'].includes(d.type)) {
          d.renderHint = 'Chart.js'
        } else if (d.type === 'overlapping-shapes') {
          d.renderHint = 'JSXGraph'
        } else {
          d.renderHint = 'SVG'
        }
      }

      diagram = {
        type: d.type,
        data: d.data || {},
        renderHint: d.renderHint,
        caption: d.caption,
      }
    }

    return {
      id: q.id || `${idPrefix}_${config.batchIndex}_${String(index + 1).padStart(2, '0')}`,
      section: q.section || config.section,
      topic: (q.topic || 'general') as QuestionCategory,
      difficulty: q.difficulty || 'medium',
      questionType: questionType,
      stem: q.stem,
      choices: q.choices as [string, string, string, string],
      answerIndex: q.answerIndex as 0 | 1 | 2 | 3,
      explanation: q.explanation || '',
      solvingStrategy: q.solvingStrategy,
      tip: q.tip,
      passage: q.passage,
      diagram: diagram,
      tags: q.tags || [],
    }
  })
}
