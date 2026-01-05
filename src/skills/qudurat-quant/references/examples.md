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

**Note**: Comparison questions MUST use the `comparisonValues` field with nested `value1` and `value2` objects. Each value must have `expression` and `label` fields. The four standard choices are ALWAYS the same for all comparison questions.

### Basic Comparison - Equal Values
```json
{
  "id": "exam_quant_comparison_01",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "comparisonValues": {
    "value1": {
      "expression": "3² + 4²",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "5²",
      "label": "القيمة الثانية"
    }
  },
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 2,
  "explanation": "القيمة الأولى = 9 + 16 = 25، القيمة الثانية = 25، إذن القيمتان متساويتان",
  "tags": ["comparison", "exponents", "equal-values"]
}
```

### Comparison with Variables - Insufficient Data
```json
{
  "id": "exam_quant_comparison_02",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "hard",
  "questionType": "comparison",
  "stem": "إذا كان س > 0، قارن بين:",
  "comparisonValues": {
    "value1": {
      "expression": "س²",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "س",
      "label": "القيمة الثانية"
    }
  },
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 3,
  "explanation": "إذا س=2: س²=4 > س=2. إذا س=0.5: س²=0.25 < س=0.5. تعتمد النتيجة على قيمة س، لذا المعطيات غير كافية للمقارنة",
  "tags": ["comparison", "variables", "insufficient-data"]
}
```

### Fraction Comparison - Value 1 Larger
```json
{
  "id": "exam_quant_comparison_03",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "fractions",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين:",
  "comparisonValues": {
    "value1": {
      "expression": "7/11",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "5/8",
      "label": "القيمة الثانية"
    }
  },
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 0,
  "explanation": "الضرب التبادلي: 7×8=56، 5×11=55. بما أن 56>55، فإن 7/11 > 5/8، لذا القيمة الأولى أكبر",
  "tags": ["comparison", "fractions", "value1-larger"]
}
```

### Percentage Comparison - Value 2 Larger
```json
{
  "id": "exam_quant_comparison_04",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "percentages",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "comparisonValues": {
    "value1": {
      "expression": "25% من 80",
      "label": "القيمة الأولى"
    },
    "value2": {
      "expression": "40% من 60",
      "label": "القيمة الثانية"
    }
  },
  "choices": ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"],
  "answerIndex": 1,
  "explanation": "القيمة الأولى = 0.25 × 80 = 20، القيمة الثانية = 0.40 × 60 = 24، لذا القيمة الثانية أكبر",
  "tags": ["comparison", "percentages", "value2-larger"]
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

---

## Word Problem Examples

### Category 1: Speed-Time-Distance (السرعة والمسافة والزمن)

#### Example 1: Simple Travel
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

#### Example 2: Meeting Problem
```json
{
  "id": "exam_quant_word_speed_02",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "speed-time-distance",
  "difficulty": "hard",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "speed-time-distance",
  "stem": "خرجت فاطمة من مكة المكرمة وخالد من المدينة المنورة في نفس الوقت متجهين للقاء بعضهما. إذا كانت سرعة فاطمة 60 كم/ساعة، وسرعة خالد 90 كم/ساعة، والمسافة بين المدينتين 450 كم، فبعد كم ساعة يلتقيان؟",
  "choices": ["2 ساعة", "2.5 ساعة", "3 ساعات", "3.5 ساعة"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- سرعة فاطمة = 60 كم/ساعة\n- سرعة خالد = 90 كم/ساعة\n- المسافة الكلية = 450 كم\n\n**المطلوب:** زمن اللقاء\n\n**الحل:**\n**الخطوة 1:** السرعة النسبية (التقارب) = 60 + 90 = 150 كم/ساعة\n\n**الخطوة 2:** نستخدم القانون: الزمن = المسافة ÷ السرعة النسبية\n\n**الخطوة 3:** نعوض:\nالزمن = 450 ÷ 150 = 3 ساعات\n\n**الإجابة النهائية:** 3 ساعات",
  "stepByStep": true,
  "arabicNames": ["فاطمة", "خالد"],
  "saudiContext": ["مكة المكرمة", "المدينة المنورة"],
  "tags": ["word-problem", "relative-speed", "meeting-problem", "realistic-context"]
}
```

### Category 2: Work Problems (مسائل العمل)

#### Example 1: Joint Work
```json
{
  "id": "exam_quant_word_work_01",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "work-problems",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "work",
  "stem": "يستطيع محمد إنجاز عمل معين في 6 أيام، بينما يستطيع علي إنجاز نفس العمل في 12 يوماً. إذا عملا معاً، فكم يوماً يحتاجان لإنجاز العمل؟",
  "choices": ["3 أيام", "4 أيام", "5 أيام", "8 أيام"],
  "answerIndex": 1,
  "explanation": "**المعطيات:**\n- محمد ينجز العمل في 6 أيام\n- علي ينجز العمل في 12 يوماً\n\n**المطلوب:** الزمن اللازم للعمل المشترك\n\n**الحل:**\n**الخطوة 1:** معدل عمل محمد = 1/6 من العمل في اليوم\nمعدل عمل علي = 1/12 من العمل في اليوم\n\n**الخطوة 2:** معدل العمل المشترك = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4\n\n**الخطوة 3:** الزمن = 1 ÷ (1/4) = 4 أيام\n\n**الإجابة النهائية:** 4 أيام",
  "stepByStep": true,
  "arabicNames": ["محمد", "علي"],
  "tags": ["word-problem", "work-rate", "joint-work", "realistic-context"]
}
```

#### Example 2: Pipes and Tanks
```json
{
  "id": "exam_quant_word_work_02",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "work-problems",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "work",
  "stem": "يمكن لصنبور ملء خزان في 4 ساعات، بينما يمكن لصنبور آخر ملء نفس الخزان في 6 ساعات. إذا فُتح الصنبوران معاً، فكم ساعة يستغرق ملء الخزان؟",
  "choices": ["2 ساعة", "2.4 ساعة", "2.5 ساعة", "3 ساعات"],
  "answerIndex": 1,
  "explanation": "**المعطيات:**\n- الصنبور الأول يملأ الخزان في 4 ساعات\n- الصنبور الثاني يملأ الخزان في 6 ساعات\n\n**المطلوب:** زمن ملء الخزان بالصنبورين معاً\n\n**الحل:**\n**الخطوة 1:** معدل الصنبور الأول = 1/4 من الخزان في الساعة\nمعدل الصنبور الثاني = 1/6 من الخزان في الساعة\n\n**الخطوة 2:** المعدل المشترك = 1/4 + 1/6 = 3/12 + 2/12 = 5/12\n\n**الخطوة 3:** الزمن = 1 ÷ (5/12) = 12/5 = 2.4 ساعة\n\n**الإجابة النهائية:** 2.4 ساعة",
  "stepByStep": true,
  "tags": ["word-problem", "pipes-tanks", "work-rate", "realistic-context"]
}
```

### Category 3: Age Problems (مسائل الأعمار)

#### Example 1: Age Ratio
```json
{
  "id": "exam_quant_word_age_01",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "age-problems",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "age",
  "stem": "عمر عبدالله الآن يساوي 3 أمثال عمر ابنه. إذا كان مجموع عمريهما 48 سنة، فما عمر عبدالله؟",
  "choices": ["32 سنة", "36 سنة", "40 سنة", "42 سنة"],
  "answerIndex": 1,
  "explanation": "**المعطيات:**\n- عمر عبدالله = 3 أمثال عمر ابنه\n- مجموع العمرين = 48 سنة\n\n**المطلوب:** عمر عبدالله\n\n**الحل:**\n**الخطوة 1:** لنفرض عمر الابن = س\nإذاً عمر عبدالله = 3س\n\n**الخطوة 2:** نكون المعادلة:\nس + 3س = 48\n4س = 48\n\n**الخطوة 3:** نحل:\nس = 12 سنة (عمر الابن)\n\n**الخطوة 4:** عمر عبدالله = 3 × 12 = 36 سنة\n\n**الإجابة النهائية:** 36 سنة",
  "stepByStep": true,
  "arabicNames": ["عبدالله"],
  "tags": ["word-problem", "age-ratio", "algebra", "realistic-context"]
}
```

#### Example 2: Age Over Time
```json
{
  "id": "exam_quant_word_age_02",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "age-problems",
  "difficulty": "hard",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "age",
  "stem": "عمر سعود الآن 40 سنة، وعمر ابنته نورة الآن 10 سنوات. بعد كم سنة سيكون عمر سعود ضعف عمر نورة؟",
  "choices": ["15 سنة", "18 سنة", "20 سنة", "25 سنة"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- عمر سعود الآن = 40 سنة\n- عمر نورة الآن = 10 سنوات\n\n**المطلوب:** عدد السنوات حتى يصبح عمر سعود ضعف عمر نورة\n\n**الحل:**\n**الخطوة 1:** لنفرض عدد السنوات = س\nعمر سعود بعد س سنة = 40 + س\nعمر نورة بعد س سنة = 10 + س\n\n**الخطوة 2:** نكون المعادلة:\n40 + س = 2(10 + س)\n\n**الخطوة 3:** نحل:\n40 + س = 20 + 2س\n40 - 20 = 2س - س\n20 = س\n\n**الإجابة النهائية:** 20 سنة",
  "stepByStep": true,
  "arabicNames": ["سعود", "نورة"],
  "tags": ["word-problem", "age-over-time", "algebra", "realistic-context"]
}
```

### Category 4: Profit and Loss (الربح والخسارة)

#### Example 1: Simple Profit Percentage
```json
{
  "id": "exam_quant_word_profit_01",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "profit-loss",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "profit-loss",
  "stem": "اشترى فهد هاتفاً بمبلغ 800 ريال، ثم باعه بربح 25%. ما سعر بيع الهاتف؟",
  "choices": ["900 ريال", "950 ريال", "1000 ريال", "1050 ريال"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- سعر الشراء = 800 ريال\n- نسبة الربح = 25%\n\n**المطلوب:** سعر البيع\n\n**الحل:**\n**الخطوة 1:** الربح = 800 × 25% = 800 × 0.25 = 200 ريال\n\n**الخطوة 2:** سعر البيع = سعر الشراء + الربح\n\n**الخطوة 3:** سعر البيع = 800 + 200 = 1000 ريال\n\nأو باستخدام: سعر البيع = 800 × 1.25 = 1000 ريال\n\n**الإجابة النهائية:** 1000 ريال",
  "stepByStep": true,
  "arabicNames": ["فهد"],
  "saudiContext": ["ريال"],
  "tags": ["word-problem", "profit-percentage", "realistic-context"]
}
```

#### Example 2: Successive Discounts
```json
{
  "id": "exam_quant_word_profit_02",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "profit-loss",
  "difficulty": "hard",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "profit-loss",
  "stem": "كان سعر ساعة معلنة بـ 500 ريال. خُفّض السعر بنسبة 20%، ثم خُفّض مرة أخرى بنسبة 10% من السعر الجديد. ما السعر النهائي للساعة؟",
  "choices": ["340 ريال", "350 ريال", "360 ريال", "370 ريال"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- السعر الأصلي = 500 ريال\n- الخصم الأول = 20%\n- الخصم الثاني = 10%\n\n**المطلوب:** السعر النهائي\n\n**الحل:**\n**الخطوة 1:** بعد الخصم الأول (20%):\nالسعر الجديد = 500 × (1 - 0.20) = 500 × 0.80 = 400 ريال\n\n**الخطوة 2:** بعد الخصم الثاني (10%):\nالسعر النهائي = 400 × (1 - 0.10) = 400 × 0.90 = 360 ريال\n\n**ملاحظة:** الخصمان معاً ≠ 30%\nالخصم الكلي الفعلي = 28% (من 500 إلى 360)\n\n**الإجابة النهائية:** 360 ريال",
  "stepByStep": true,
  "saudiContext": ["ريال"],
  "tags": ["word-problem", "successive-discounts", "percentage", "realistic-context"]
}
```

### Category 5: Mixture Problems (مسائل الخلط والمزج)

#### Example 1: Mixing by Price
```json
{
  "id": "exam_quant_word_mixture_01",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "mixture",
  "difficulty": "medium",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "mixture",
  "stem": "خلط تاجر 6 كيلوغرامات من القهوة سعر الكيلو منها 40 ريالاً مع 4 كيلوغرامات من القهوة سعر الكيلو منها 60 ريالاً. ما متوسط سعر الكيلوغرام الواحد من الخليط؟",
  "choices": ["45 ريال", "48 ريال", "50 ريال", "52 ريال"],
  "answerIndex": 1,
  "explanation": "**المعطيات:**\n- النوع الأول: 6 كجم بسعر 40 ريال/كجم\n- النوع الثاني: 4 كجم بسعر 60 ريال/كجم\n\n**المطلوب:** متوسط سعر الكيلوغرام\n\n**الحل:**\n**الخطوة 1:** إجمالي قيمة النوع الأول = 6 × 40 = 240 ريال\nإجمالي قيمة النوع الثاني = 4 × 60 = 240 ريال\n\n**الخطوة 2:** إجمالي القيمة = 240 + 240 = 480 ريال\nإجمالي الكمية = 6 + 4 = 10 كجم\n\n**الخطوة 3:** متوسط السعر = 480 ÷ 10 = 48 ريال/كجم\n\n**الإجابة النهائية:** 48 ريال",
  "stepByStep": true,
  "saudiContext": ["ريال", "القهوة"],
  "tags": ["word-problem", "mixture-price", "weighted-average", "realistic-context"]
}
```

#### Example 2: Concentration Mixture
```json
{
  "id": "exam_quant_word_mixture_02",
  "section": "quantitative",
  "topic": "applied-math",
  "subtopic": "mixture",
  "difficulty": "hard",
  "questionType": "mcq",
  "problemType": "word-problem",
  "wordProblemCategory": "mixture",
  "stem": "خُلطت 3 لترات من محلول تركيزه 20% مع 2 لتر من محلول تركيزه 50%. ما تركيز المحلول الناتج؟",
  "choices": ["28%", "30%", "32%", "35%"],
  "answerIndex": 2,
  "explanation": "**المعطيات:**\n- المحلول الأول: 3 لتر بتركيز 20%\n- المحلول الثاني: 2 لتر بتركيز 50%\n\n**المطلوب:** تركيز المحلول الناتج\n\n**الحل:**\n**الخطوة 1:** كمية المادة النقية في المحلول الأول = 3 × 0.20 = 0.6 لتر\nكمية المادة النقية في المحلول الثاني = 2 × 0.50 = 1.0 لتر\n\n**الخطوة 2:** إجمالي المادة النقية = 0.6 + 1.0 = 1.6 لتر\nإجمالي حجم المحلول = 3 + 2 = 5 لتر\n\n**الخطوة 3:** التركيز = (1.6 ÷ 5) × 100% = 0.32 × 100% = 32%\n\n**الإجابة النهائية:** 32%",
  "stepByStep": true,
  "tags": ["word-problem", "concentration", "mixture", "realistic-context"]
}
```
