---
name: qudurat-quant
description: توليد أسئلة القسم الكمي لاختبار القدرات السعودي (GAT/Qudurat). يُستخدم عند طلب إنشاء أسئلة كمية تشمل: (1) الحساب - العمليات، الكسور، الأسس، النسب، (2) الجبر - المعادلات، المتباينات، المتتابعات، (3) الهندسة - المثلثات، الدوائر، الأشكال المتداخلة، (4) الإحصاء - المتوسط، الاحتمالات، الرسوم البيانية، (5) المسائل التطبيقية - السرعة، العمل، الأعمار. يدعم أنواع: mcq, comparison, diagram, overlapping-diagram.
---

# Qudurat Quantitative Questions Generator

## Quick Reference

### التوزيع المطلوب (المسار العلمي)
| الموضوع | النسبة | الأسئلة/20 |
|---------|--------|-----------|
| arithmetic | 40% | 8 |
| geometry | 24% | 5 |
| algebra | 23% | 4-5 |
| statistics | 13% | 2-3 |

### أنواع الأسئلة
| النوع | الاستخدام |
|-------|-----------|
| `mcq` | اختيار من متعدد عادي |
| `comparison` | مقارنة كميتين (خيارات ثابتة) |
| `diagram` | رسم هندسي بسيط (SVG) |
| `overlapping-diagram` | أشكال متداخلة (JSXGraph) |

### خيارات المقارنة (ثابتة دائماً)
```json
["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"]
```

## Generation Rules

### قواعد صارمة
1. **4 خيارات بالضبط** - إجابة واحدة صحيحة
2. **بدون آلة حاسبة** - أرقام قابلة للحساب الذهني
3. **عربية فصحى** - جميع النصوص
4. **شرح مفصل** - خطوات الحل واضحة
5. **مشتتات معقولة** - مبنية على أخطاء شائعة

### توزيع الصعوبة
- سهل: 30% (أرقام صغيرة، خطوة واحدة)
- متوسط: 50% (خطوتان، تطبيق مباشر)
- صعب: 20% (متعدد الخطوات، تفكير)

### تنسيق المعرّف
```
{context}_{section}_{topic}_{subtopic}_{seq}
```
مثال: `exam_scientific_quant_arithmetic_fractions_01`

## Topic Details

للموضوعات التفصيلية والصيغ: **[references/topics.md](references/topics.md)**

للأمثلة الكاملة بتنسيق JSON: **[references/examples.md](references/examples.md)**

## Output Format

```json
{
  "id": "exam_scientific_quant_arithmetic_fractions_01",
  "section": "quantitative",
  "topic": "arithmetic",
  "subtopic": "fractions",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "نص السؤال",
  "choices": ["أ", "ب", "ج", "د"],
  "answerIndex": 0,
  "explanation": "الشرح مع الخطوات",
  "tags": ["fractions", "operations"]
}
```

## Comparison Questions

**Format Rules**:
- `questionType` MUST be `"comparison"`
- `comparisonValues` MUST contain nested `value1` and `value2` objects
- Each value object MUST have `expression` and `label` fields
- `choices` array MUST contain exactly these four options in this exact order
- Use "المعطيات غير كافية للمقارنة" when the relationship depends on unknown variables or conditions

**When to use "المعطيات غير كافية للمقارنة"**:
- Comparing س² vs س without constraints on س (depends on whether 0<س<1 or س>1)
- Comparing expressions with unknown variables where the relationship varies
- When additional conditions are needed but not provided

```json
{
  "questionType": "comparison",
  "stem": "قارن بين:",
  "comparisonValues": {
    "value1": {
      "expression": "التعبير الرياضي الأول",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "التعبير الرياضي الثاني",
      "label": "القيمة الثانية"
    }
  },
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 0
}
```

**Examples from references/examples.md**:
- Equal values: 3² + 4² vs 5² (both equal 25)
- Value 1 larger: 7/11 vs 5/8
- Value 2 larger: 25% من 80 vs 40% من 60
- Insufficient data: س² vs س when س > 0

## Common Patterns

### الأخطاء الشائعة للمشتتات
| الموضوع | الخطأ الشائع |
|---------|-------------|
| الكسور | نسيان توحيد المقامات |
| الأسس | جمع الأسس بدل ضربها |
| النسبة المئوية | حساب من العدد الخطأ |
| فيثاغورس | جمع بدل الجذر |
| المساحة | نسيان ÷2 للمثلث |

### صيغ أساسية
```
محيط الدائرة = 2πr
مساحة الدائرة = πr²
فيثاغورس: a² + b² = c²
النسبة المئوية: (الجزء/الكل) × 100
```

## Word Problems (المسائل اللفظية)

**Purpose**: Generate realistic word problems in Arabic contexts that test applied mathematics skills.

### Categories and Distribution

Word problems MUST be distributed across these 5 categories:
- **Speed-Time-Distance** (السرعة والمسافة والزمن): 25%
- **Work Problems** (مسائل العمل): 20%
- **Age Problems** (مسائل الأعمار): 20%
- **Profit/Loss** (الربح والخسارة): 20%
- **Mixture** (مسائل الخلط والمزج): 15%

### Cultural Appropriateness Rules

**REQUIRED - Use Realistic Arabic Names**:
- **Male names**: أحمد، محمد، خالد، عبدالله، سعود، فهد، ناصر، علي، عمر، يوسف
- **Female names**: فاطمة، نورة، سارة، مريم، عائشة، هدى، ريم، منى، لمى، شهد

**REQUIRED - Use Saudi/Gulf Contexts**:
- **Cities**: الرياض، جدة، مكة المكرمة، المدينة المنورة، الدمام، الطائف، تبوك، أبها
- **Currency**: ريال (not dollars or other currencies)
- **Common products**: كتاب، هاتف، ساعة، حقيبة، قهوة، شاي، أرز

**FORBIDDEN - Avoid These**:
- ❌ Interest/riba (الربا) - use profit/loss instead
- ❌ Alcohol in mixture problems - use medical alcohol (كحول طبي), juice, or other substances
- ❌ Non-Arabic names or foreign contexts
- ❌ Culturally inappropriate scenarios

### Mental Math Number Ranges

**Speed-Time-Distance**:
- Speeds: 40, 50, 60, 80, 100, 120 km/h (cars); 500-900 km/h (planes)
- Distances: 100, 120, 150, 200, 240, 300, 400, 600, 800, 960 km
- Times: 1, 1.5, 2, 2.5, 3, 4, 5, 6 hours

**Work Problems**:
- Days to complete: 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30
- Work rates: 1/2, 1/3, 1/4, 1/5, 1/6, 1/8, 1/10, 1/12 (use fractions that allow mental calculation)

**Age Problems**:
- Current ages: 5, 8, 10, 12, 15, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60 years
- Years ago/from now: 2, 3, 4, 5, 8, 10, 12, 15, 20
- Ratios: 2:1, 3:1, 3:2, 4:1, 5:2, 2:3, 3:4

**Profit/Loss**:
- Cost prices: 100, 120, 150, 200, 240, 300, 400, 500, 600, 800, 1000 ريال
- Profit percentages: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%
- Loss percentages: 5%, 10%, 15%, 20%, 25%
- Discounts: 10%, 15%, 20%, 25%, 30%, 40%, 50%

**Mixture**:
- Quantities: 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30 kg or liters
- Concentrations: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%, 60%, 75%, 80%, 100%
- Prices per kg: 10, 12, 15, 20, 24, 25, 30, 40, 50 ريال

### Word Problem JSON Format

```json
{
  "id": "exam_quant_word_speed_01",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "speed-time-distance",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "speed-time-distance",
  "stem": "انطلق أحمد من الرياض متجهاً إلى جدة بسرعة 80 كم/ساعة. إذا قطع مسافة 960 كم، فكم ساعة استغرقت الرحلة؟",
  "choices": ["10 ساعات", "11 ساعة", "12 ساعة", "13 ساعة"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- السرعة = 80 كم/ساعة\n- المسافة = 960 كم\n\n**المطلوب:** إيجاد الزمن\n\n**الحل:**\n**الخطوة 1:** نستخدم القانون: الزمن = المسافة ÷ السرعة\n\n**الخطوة 2:** نعوض القيم:\nالزمن = 960 ÷ 80\n\n**الخطوة 3:** نحسب:\nالزمن = 12 ساعة\n\n**الإجابة النهائية:** 12 ساعة",
  "stepByStep": true,
  "arabicNames": ["أحمد"],
  "saudiContext": ["الرياض", "جدة"],
  "tags": ["word-problem", "speed", "distance", "time", "realistic-context"]
}
```

### Required Fields for Word Problems

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `problemType` | string | ✓ | MUST be `"word-problem"` |
| `wordProblemCategory` | string | ✓ | One of: `"speed-time-distance"`, `"work"`, `"age"`, `"profit-loss"`, `"mixture"` |
| `stepByStep` | boolean | ✓ | MUST be `true` - all word problems require detailed steps |
| `arabicNames` | array | ✓ if names used | List of Arabic names used in problem |
| `saudiContext` | array | optional | Saudi-specific context elements (cities, products) |

### Step-by-Step Solution Format (MANDATORY)

**Every word problem explanation MUST follow this exact structure**:

```markdown
**المعطيات:**
- [list all given information with clear labels]

**المطلوب:** [clearly state what needs to be found]

**الحل:**
**الخطوة 1:** [identify formula or approach]

**الخطوة 2:** [substitute values]

**الخطوة 3:** [perform calculation]

**الخطوة 4 (if needed):** [additional steps or verification]

**الإجابة النهائية:** [final answer with units]
```

### Template Selection Guide

For complete templates and examples, refer to:
- **Templates**: [references/word-problems.md](references/word-problems.md)
- **Examples**: [references/examples.md](references/examples.md) (Word Problem Examples section)

**Category-Specific Templates**:

1. **Speed-Time-Distance**:
   - Simple travel (one direction)
   - Meeting problems (two objects approaching)
   - Catching up problems (one object chasing another)
   - Relative speed scenarios

2. **Work Problems**:
   - Joint work (two workers/machines together)
   - Pipes and tanks (filling/emptying)
   - Partial work then joint work
   - Work with different rates

3. **Age Problems**:
   - Age ratios (now)
   - Age relationships over time (past/future)
   - Sum of ages
   - Age differences

4. **Profit/Loss**:
   - Simple profit/loss percentage
   - Finding cost given selling price and profit
   - Successive discounts
   - Break-even analysis

5. **Mixture**:
   - Mixing by price (weighted average)
   - Mixing by concentration
   - Dilution problems
   - Alligation (mixing to achieve target average)

### Distractor Generation for Word Problems

For each correct answer, generate 3 distractors based on these common errors:

1. **Formula Error**: Using wrong formula
   - Example: Adding instead of multiplying for distance
   - Example: Using simple average instead of weighted average

2. **Calculation Error**: Arithmetic mistake
   - Example: 960 ÷ 80 = 10 instead of 12
   - Example: 6 + 4 = 9 instead of 10

3. **Unit/Conversion Error**: Partial calculation or wrong units
   - Example: Forgetting to add both parts in mixture
   - Example: Using hours when answer should be in days

4. **Conceptual Error**: Misunderstanding problem setup
   - Example: Using sum instead of difference for age problems
   - Example: Treating successive discounts as additive

### Quality Checklist for Word Problems

Before finalizing, verify:
- [x] Uses realistic Arabic name(s) from approved list
- [x] Context is culturally appropriate (no riba, alcohol, etc.)
- [x] Numbers allow mental calculation
- [x] Answer is whole number or simple fraction
- [x] All 4 answer choices are plausible
- [x] Step-by-step solution follows required format
- [x] Solution uses proper Arabic mathematical terminology
- [x] Units are consistent and clearly stated
- [x] Problem statement is unambiguous
- [x] Difficulty appropriate for GAT (high school level)
