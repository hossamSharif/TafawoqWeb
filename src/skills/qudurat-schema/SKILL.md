---
name: qudurat-schema
description: هيكل JSON المطلوب لأسئلة اختبار القدرات. يُستخدم لضمان صحة تنسيق الأسئلة المُولَّدة. يحدد: (1) الحقول المطلوبة والاختيارية لكل نوع سؤال، (2) القيم المسموحة لكل حقل، (3) قواعد التحقق والتوافق. يجب الرجوع إليه عند توليد أي سؤال للتأكد من صحة الهيكل.
---

# Qudurat JSON Schema

## Base Question Schema

```json
{
  "id": "string (required)",
  "section": "quantitative | verbal (required)",
  "topic": "string (required)",
  "subtopic": "string (required)",
  "difficulty": "easy | medium | hard (required)",
  "questionType": "string (required)",
  "stem": "string (required)",
  "choices": ["string", "string", "string", "string"] (required, exactly 4),
  "answerIndex": 0 | 1 | 2 | 3 (required),
  "explanation": "string (required)",
  "tags": ["string"] (optional)
}
```

## ID Format

```
{context}_{section}_{topic}_{subtopic}_{sequence}
```

**Examples:**
- `exam_scientific_quant_arithmetic_fractions_01`
- `practice_verbal_analogy_synonymy_03`

## Question Types

| questionType | Section | Use |
|--------------|---------|-----|
| `mcq` | both | اختيار من متعدد |
| `comparison` | quant | مقارنة كميتين |
| `diagram` | quant | رسم هندسي بسيط |
| `chart` | quant | رسم بياني |
| `overlapping-diagram` | quant | أشكال متداخلة |
| `reading-passage` | verbal | استيعاب المقروء |

## Comparison Schema

```json
{
  "questionType": "comparison",
  "stem": "قارن بين:",
  "value1": "string (required)",
  "value2": "string (required)",
  "choices": [
    "القيمة الأولى أكبر",
    "القيمة الثانية أكبر",
    "القيمتان متساويتان",
    "المعطيات غير كافية للمقارنة"
  ]
}
```

⚠️ **الخيارات ثابتة دائماً بهذا الترتيب**

## Diagram Schema

```json
{
  "questionType": "diagram | chart | overlapping-diagram",
  "diagram": {
    "type": "string (required)",
    "subtype": "string (for overlapping only)",
    "data": { },
    "renderHint": "SVG | Chart.js | JSXGraph | Mafs",
    "caption": "string",
    "shading": { },
    "formulaUsed": "string"
  }
}
```

## Reading Passage Schema

```json
{
  "questionType": "reading-passage",
  "passageId": "string (required)",
  "passage": "string (first question only)",
  "stem": "السؤال"
}
```

## Analogy Schema

```json
{
  "topic": "analogy",
  "subtopic": "string",
  "analogyType": "string (required)",
  "stem": "كلمة1 : كلمة2"
}
```

## Word Problems Schema

```json
{
  "topic": "word-problems",
  "subtopic": "string",
  "problemType": "speed-time-distance | work-problems | age-problems | profit-loss | mixture-problems"
}
```

## Allowed Values

### Quantitative Topics
| topic | subtopics |
|-------|-----------|
| arithmetic | basic-operations, number-properties, fractions, decimals, exponents-roots, ratio-proportion, percentages |
| algebra | linear-equations, quadratic-equations, inequalities, algebraic-expressions, sequences, functions |
| geometry | angles, triangles, circles, polygons, area-perimeter, 3d-shapes, coordinate-geometry, overlapping-shapes |
| statistics | central-tendency, dispersion, charts, probability, permutations |
| word-problems | speed-time-distance, work-problems, age-problems, profit-loss, mixture-problems |
| comparisons | numeric, algebraic, geometric |

### Verbal Topics
| topic | subtopics |
|-------|-----------|
| reading-comprehension | main-idea, inference, detail, vocabulary-in-context, suitable-title, author-purpose |
| analogy | 22 relations (see qudurat-verbal skill) |
| sentence-completion | single-blank, double-blank, contrast, cause-effect |
| context-error | semantic-error, contradiction |
| odd-word | category-based, semantic-based, function-based |

### Diagram Types
| type | renderHint |
|------|------------|
| circle, triangle, rectangle, square | SVG |
| bar-chart, line-graph, pie-chart | Chart.js |
| overlapping-shapes | JSXGraph |

### Overlapping Subtypes
```
square-with-corner-circles
square-vertex-at-circle-center
rose-pattern-in-square
three-tangent-circles
sector-minus-triangle
circles-in-rectangle
inscribed-circle-in-square
inscribed-square-in-circle
```

## Full Schema Reference

For complete validation rules: **[references/full-schema.md](references/full-schema.md)**

## Validation Rules

1. **4 choices exactly** - no more, no less
2. **answerIndex 0-3** - must match choices array
3. **Arabic text** - all strings in Arabic
4. **Unique ID** - no duplicates
5. **Valid topic/subtopic** - must be from allowed lists
6. **Required fields** - check by questionType
