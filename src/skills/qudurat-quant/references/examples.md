# Quantitative Examples

## Table of Contents
1. [MCQ Examples](#mcq-examples)
2. [Comparison Examples](#comparison-examples)
3. [Diagram Examples](#diagram-examples)

---

## MCQ Examples

### Arithmetic - Fractions
```json
{
  "id": "exam_quant_arithmetic_fractions_01",
  "section": "quantitative",
  "topic": "arithmetic",
  "subtopic": "fractions",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "ما ناتج: 2/3 + 3/4 - 1/6 ؟",
  "choices": ["1 1/4", "1 1/2", "1 3/4", "2"],
  "answerIndex": 0,
  "explanation": "نوحد المقامات (م.م.أ = 12): 8/12 + 9/12 - 2/12 = 15/12 = 1 3/12 = 1 1/4",
  "tags": ["fractions", "addition", "subtraction"]
}
```

### Arithmetic - Percentages
```json
{
  "id": "exam_quant_arithmetic_percentages_01",
  "section": "quantitative",
  "topic": "arithmetic",
  "subtopic": "percentages",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "زاد راتب موظف بنسبة 20% ثم نقص بنسبة 20%. ما نسبة التغير الكلي؟",
  "choices": ["لا تغيير", "نقص 4%", "زيادة 4%", "نقص 2%"],
  "answerIndex": 1,
  "explanation": "لنفرض الراتب 100. بعد الزيادة: 120. بعد النقصان: 120 × 0.8 = 96. التغير = 100 - 96 = 4% نقص",
  "tags": ["percentages", "successive-change"]
}
```

### Algebra - Equations
```json
{
  "id": "exam_quant_algebra_linear_01",
  "section": "quantitative",
  "topic": "algebra",
  "subtopic": "linear-equations",
  "difficulty": "easy",
  "questionType": "mcq",
  "stem": "إذا كان 3س + 7 = 22، فما قيمة س؟",
  "choices": ["3", "5", "7", "9"],
  "answerIndex": 1,
  "explanation": "3س + 7 = 22 → 3س = 15 → س = 5",
  "tags": ["linear-equations", "one-variable"]
}
```

### Geometry - Triangle
```json
{
  "id": "exam_quant_geometry_triangles_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "triangles",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "مثلث قائم الزاوية، ضلعاه القائمان 6 سم و 8 سم. ما طول الوتر؟",
  "choices": ["10 سم", "12 سم", "14 سم", "7 سم"],
  "answerIndex": 0,
  "explanation": "فيثاغورس: الوتر² = 6² + 8² = 36 + 64 = 100، الوتر = 10 سم",
  "tags": ["triangles", "pythagorean"]
}
```

### Statistics - Mean
```json
{
  "id": "exam_quant_statistics_mean_01",
  "section": "quantitative",
  "topic": "statistics",
  "subtopic": "central-tendency",
  "difficulty": "easy",
  "questionType": "mcq",
  "stem": "المتوسط الحسابي للأعداد: 12، 15، 18، 21، 24 هو:",
  "choices": ["17", "18", "19", "20"],
  "answerIndex": 1,
  "explanation": "المتوسط = (12+15+18+21+24) ÷ 5 = 90 ÷ 5 = 18",
  "tags": ["mean", "average"]
}
```

---

## Comparison Examples

### Basic Comparison
```json
{
  "id": "exam_quant_comparison_01",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "value1": "3² + 4²",
  "value2": "5²",
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 2,
  "explanation": "القيمة الأولى = 9 + 16 = 25، القيمة الثانية = 25، إذن متساويتان",
  "tags": ["comparison", "exponents"]
}
```

### Comparison with Variables
```json
{
  "id": "exam_quant_comparison_02",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "hard",
  "questionType": "comparison",
  "stem": "إذا كان س > 0، قارن بين:",
  "value1": "س²",
  "value2": "س",
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 3,
  "explanation": "إذا س=2: س²=4 > س=2. إذا س=0.5: س²=0.25 < س=0.5. المعطيات غير كافية",
  "tags": ["comparison", "variables", "insufficient-data"]
}
```

### Fraction Comparison
```json
{
  "id": "exam_quant_comparison_03",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "fractions",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين:",
  "value1": "7/11",
  "value2": "5/8",
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 0,
  "explanation": "الضرب التبادلي: 7×8=56، 5×11=55. بما أن 56>55، فإن 7/11 > 5/8",
  "tags": ["comparison", "fractions"]
}
```

---

## Diagram Examples

### Simple Triangle
```json
{
  "id": "exam_quant_diagram_triangle_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "triangles",
  "difficulty": "medium",
  "questionType": "diagram",
  "stem": "في الشكل، ما قيمة الزاوية س؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "angles": [
        {"at": "أ", "value": 50, "label": "50°"},
        {"at": "ب", "value": 70, "label": "70°"},
        {"at": "ج", "value": "x", "label": "س"}
      ]
    },
    "renderHint": "SVG",
    "caption": "مثلث أ ب ج"
  },
  "choices": ["50°", "60°", "70°", "80°"],
  "answerIndex": 1,
  "explanation": "مجموع زوايا المثلث = 180°. س = 180 - 50 - 70 = 60°",
  "tags": ["triangle", "angles"]
}
```

### Circle with Sector
```json
{
  "id": "exam_quant_diagram_circle_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "circles",
  "difficulty": "medium",
  "questionType": "diagram",
  "stem": "ما مساحة القطاع المظلل إذا كان نصف القطر 6 سم؟",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 6,
      "center": "م",
      "sector": {
        "startAngle": 0,
        "endAngle": 60,
        "shaded": true
      },
      "centralAngle": {"value": 60, "label": "60°"}
    },
    "renderHint": "SVG",
    "caption": "قطاع دائري"
  },
  "choices": ["6π سم²", "12π سم²", "18π سم²", "36π سم²"],
  "answerIndex": 0,
  "explanation": "مساحة القطاع = (60/360) × π × 6² = (1/6) × 36π = 6π سم²",
  "tags": ["circle", "sector", "area"]
}
```

### Bar Chart
```json
{
  "id": "exam_quant_chart_bar_01",
  "section": "quantitative",
  "topic": "statistics",
  "subtopic": "charts",
  "difficulty": "easy",
  "questionType": "chart",
  "stem": "من الرسم، ما الفرق بين أعلى وأقل قيمة؟",
  "diagram": {
    "type": "bar-chart",
    "data": {
      "labels": ["أ", "ب", "ج", "د"],
      "values": [25, 40, 15, 30],
      "title": "المبيعات",
      "yAxisLabel": "القيمة"
    },
    "renderHint": "Chart.js",
    "caption": "مبيعات أربعة منتجات"
  },
  "choices": ["15", "20", "25", "30"],
  "answerIndex": 2,
  "explanation": "أعلى قيمة = 40 (ب)، أقل قيمة = 15 (ج). الفرق = 40 - 15 = 25",
  "tags": ["bar-chart", "range"]
}
```

### Word Problem
```json
{
  "id": "exam_quant_word_speed_01",
  "section": "quantitative",
  "topic": "word-problems",
  "subtopic": "speed-time-distance",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "speed-time-distance",
  "stem": "قطعت سيارة مسافة 240 كم في 3 ساعات. ما سرعتها المتوسطة؟",
  "choices": ["60 كم/س", "70 كم/س", "80 كم/س", "90 كم/س"],
  "answerIndex": 2,
  "explanation": "السرعة = المسافة ÷ الزمن = 240 ÷ 3 = 80 كم/س",
  "tags": ["speed", "distance", "time"]
}
```
