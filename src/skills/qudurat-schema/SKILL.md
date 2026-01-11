---
name: qudurat-schema
description: هيكل JSON المطلوب لأسئلة اختبار القدرات (الإصدار 3.0). يُستخدم لضمان صحة تنسيق الأسئلة المُولَّدة. يحدد: (1) الحقول المطلوبة والاختيارية لكل نوع سؤال، (2) القيم المسموحة لكل حقل، (3) قواعد التحقق والتوافق. يجب الرجوع إليه عند توليد أي سؤال للتأكد من صحة الهيكل.
---

# Qudurat JSON Schema v3.0

## Base Question Schema

**CRITICAL: Use these exact field names (v3.0 format):**

```json
{
  "id": "string (optional - will be auto-generated if not provided)",
  "version": "3.0 (default)",
  "language": "ar (default)",
  "section": "quantitative | verbal (required)",
  "track": "scientific | literary (required)",
  "question_type": "mcq | comparison | diagram | reading | analogy | completion | error | odd-word (required)",
  "topic": "string (required)",
  "subtopic": "string (required)",
  "difficulty": "easy | medium | hard (required)",
  "question_text": "string (required - the actual question in Arabic)",
  "choices": ["string", "string", "string", "string"] (required for MCQ, exactly 4),
  "correct_answer": "string (required - the text of the correct answer)",
  "explanation": "string (required - detailed explanation in Arabic)"
}
```

**⚠️ IMPORTANT FIELD CHANGES FROM v2.0:**
- `stem` → `question_text` (use `question_text`, NOT `stem`)
- `questionType` → `question_type` (use `question_type`, NOT `questionType`)
- `answerIndex` → `correct_answer` (provide the actual answer text, NOT the index)
- **NEW:** `track` field is now REQUIRED (scientific or literary)
- **NEW:** `version` and `language` fields (will default if not provided)

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
  "question_type": "comparison",
  "question_text": "قارن بين القيمة الأولى والقيمة الثانية:",
  "comparison_values": {
    "value1": {
      "expression": "mathematical expression or value",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "mathematical expression or value",
      "label": "القيمة الثانية"
    }
  },
  "choices": [
    "القيمة الأولى أكبر",
    "القيمة الثانية أكبر",
    "القيمتان متساويتان",
    "المعطيات غير كافية للمقارنة"
  ],
  "correct_answer": "one of the choices above (exact text)"
}
```

⚠️ **الخيارات ثابتة دائماً بهذا الترتيب**

## Diagram Schema

```json
{
  "question_type": "diagram",
  "question_text": "السؤال عن الرسم",
  "diagram": {
    "type": "string (required)",
    "subtype": "string (for overlapping only)",
    "data": { },
    "renderHint": "SVG | Chart.js | JSXGraph | Mafs",
    "caption": "string",
    "shading": { },
    "formulaUsed": "string"
  },
  "choices": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
  "correct_answer": "خيار [the correct one]"
}
```

## Reading Passage Schema

```json
{
  "question_type": "reading",
  "question_text": "السؤال عن النص",
  "passage": "النص المقروء (if applicable)",
  "choices": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
  "correct_answer": "خيار [the correct one]"
}
```

## Analogy Schema

```json
{
  "question_type": "analogy",
  "topic": "analogy",
  "subtopic": "relationship type",
  "relationship_type": "string (required)",
  "question_text": "كلمة1 : كلمة2",
  "choices": ["خيار أ : خيار أ", "خيار ب : خيار ب", "خيار ج : خيار ج", "خيار د : خيار د"],
  "correct_answer": "خيار [the correct pair]"
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

1. **4 choices exactly** - no more, no less (for MCQ questions)
2. **correct_answer as text** - must be the EXACT text from one of the choices
3. **Arabic text** - all strings in Arabic (formal MSA)
4. **Required fields** - check by question_type:
   - All: section, track, question_type, topic, subtopic, difficulty, question_text, correct_answer, explanation
   - MCQ: also requires choices array
   - Comparison: also requires comparison_values
   - Diagram: also requires diagram object
   - Analogy: also requires relationship_type
5. **Valid topic/subtopic** - must be from allowed lists
6. **Track consistency** - scientific/literary must match section requirements

## Example Complete Question (MCQ)

```json
{
  "version": "3.0",
  "language": "ar",
  "section": "quantitative",
  "track": "scientific",
  "question_type": "mcq",
  "topic": "algebra",
  "subtopic": "linear-equations",
  "difficulty": "easy",
  "question_text": "إذا كان 2س + 5 = 13، فما قيمة س؟",
  "choices": ["2", "4", "6", "8"],
  "correct_answer": "4",
  "explanation": "نطرح 5 من الطرفين: 2س = 8، ثم نقسم على 2: س = 4"
}
```
