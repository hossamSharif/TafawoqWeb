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
