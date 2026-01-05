# 📋 JSON Schema Changelog
## توثيق تغييرات هيكل JSON بين إصدارات البرومبت

هذا الملف يوثق جميع التغييرات التي طرأت على هيكل JSON المتوقع من توليد الأسئلة عبر الإصدارات المختلفة.

---

## 📊 ملخص سريع للتغييرات

| الإصدار | الحقول الجديدة | القيم الجديدة | التأثير |
|---------|---------------|--------------|---------|
| v1.0 → v2.0 | 5 حقول | 15+ قيمة | القسم الكمي |
| v2.0 → v2.1 | 2 حقل | 22+ قيمة | القسم اللفظي |
| v2.1 → v3.0 | 4 حقول | 14+ قيمة | الأشكال المتداخلة ⭐ |
| **الإجمالي** | **11 حقل** | **51+ قيمة** | **كلا القسمين** |

---

## 🔄 v1.0 → v2.0: تحديثات القسم الكمي

### 1️⃣ حقول جديدة مُضافة

#### `version` - إصدار البرومبت
```json
// ❌ v1.0 - غير موجود
{}

// ✅ v2.0+
{
  "version": "2.0"
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | مطلوب |
| القيم الممكنة | `"1.0"`, `"2.0"`, `"2.1"` |
| الموقع | مستوى الجذر (root level) |

---

#### `subtopic` - التصنيف الفرعي
```json
// ❌ v1.0 - تصنيف مسطح فقط
{
  "topic": "arithmetic"
}

// ✅ v2.0+ - تصنيف هرمي
{
  "topic": "arithmetic",
  "subtopic": "number-properties"
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | مطلوب |
| الموقع | داخل كائن السؤال |
| الهدف | تحديد الموضوع الفرعي بدقة |

---

#### `value1` و `value2` - لأسئلة المقارنة
```json
// ❌ v1.0 - أسئلة المقارنة غير مدعومة

// ✅ v2.0+
{
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "value1": "3² + 4²",
  "value2": "5²",
  "choices": [
    "القيمة الأولى أكبر",
    "القيمة الثانية أكبر",
    "القيمتان متساويتان",
    "المعطيات غير كافية للمقارنة"
  ]
}
```
| الخاصية | `value1` | `value2` |
|---------|----------|----------|
| النوع | `string` | `string` |
| الإلزامية | مطلوب لـ comparison | مطلوب لـ comparison |
| الوصف | التعبير/القيمة الأولى | التعبير/القيمة الثانية |

---

#### `problemType` - نوع المسألة التطبيقية
```json
// ❌ v1.0 - المسائل التطبيقية غير مصنفة

// ✅ v2.0+
{
  "topic": "word-problems",
  "subtopic": "speed-time-distance",
  "problemType": "speed-time-distance"
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | مطلوب عندما `topic = "word-problems"` |
| القيم الممكنة | انظر الجدول أدناه |

**قيم `problemType` الممكنة:**
| القيمة | الوصف |
|--------|-------|
| `speed-time-distance` | السرعة والمسافة والزمن |
| `work-problems` | العمل المشترك |
| `age-problems` | مسائل الأعمار |
| `profit-loss` | الربح والخسارة |
| `mixture-problems` | المزج والخلط |

---

#### `diagram` - كائن الرسم التوضيحي
```json
// ❌ v1.0 - الرسوم غير مدعومة

// ✅ v2.0+
{
  "questionType": "diagram",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["A", "B", "C"],
      "sides": [3, 4, 5],
      "angles": [90, 53, 37],
      "showRightAngle": true
    },
    "renderHint": "SVG",
    "caption": "مثلث قائم الزاوية"
  }
}
```
| الخاصية | النوع | الوصف |
|---------|-------|-------|
| `type` | `string` | نوع الرسم |
| `data` | `object` | بيانات الرسم (تختلف حسب النوع) |
| `renderHint` | `string` | طريقة العرض (`"SVG"` أو `"Chart.js"`) |
| `caption` | `string` | وصف مختصر للرسم |

---

### 2️⃣ قيم جديدة للحقول الموجودة

#### `questionType` - أنواع الأسئلة
```json
// v1.0
"questionType": "mcq"

// v2.0+ (قيم إضافية)
"questionType": "mcq" | "comparison" | "diagram" | "chart" | "reading-passage"
```

| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `mcq` | v1.0+ | اختيار من متعدد عادي |
| `comparison` | v2.0+ ⭐ | مقارنة بين كميتين |
| `diagram` | v2.0+ ⭐ | سؤال مع رسم هندسي |
| `chart` | v2.0+ ⭐ | سؤال مع رسم بياني |
| `reading-passage` | v1.0+ | سؤال مرتبط بنص قراءة |

---

#### `topic` - الموضوعات الرئيسية (الكمي)
```json
// v1.0 - 4 موضوعات فقط
"topic": "arithmetic" | "algebra" | "geometry" | "statistics"

// v2.0+ - 6 موضوعات
"topic": "arithmetic" | "algebra" | "geometry" | "statistics" | "word-problems" | "comparisons"
```

| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `arithmetic` | v1.0+ | الحساب |
| `algebra` | v1.0+ | الجبر |
| `geometry` | v1.0+ | الهندسة |
| `statistics` | v1.0+ | الإحصاء |
| `word-problems` | v2.0+ ⭐ | المسائل التطبيقية |
| `comparisons` | v2.0+ ⭐ | أسئلة المقارنة |

---

#### `subtopic` - التصنيفات الفرعية (الكمي)

**arithmetic:**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `basic-operations` | v2.0+ | العمليات الأساسية |
| `number-properties` | v2.0+ ⭐ | خصائص الأعداد |
| `fractions` | v2.0+ | الكسور |
| `decimals` | v2.0+ | الأعداد العشرية |
| `exponents-roots` | v2.0+ ⭐ | الأسس والجذور |
| `ratio-proportion` | v2.0+ | النسبة والتناسب |
| `percentages` | v2.0+ | النسبة المئوية |

**algebra:**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `linear-equations` | v2.0+ | المعادلات الخطية |
| `quadratic-equations` | v2.0+ | المعادلات التربيعية |
| `inequalities` | v2.0+ | المتباينات |
| `algebraic-expressions` | v2.0+ | التعابير الجبرية |
| `sequences` | v2.0+ ⭐ | المتتابعات |
| `functions` | v2.0+ | الدوال |

**geometry:**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `angles` | v2.0+ | الزوايا |
| `triangles` | v2.0+ | المثلثات |
| `circles` | v2.0+ | الدوائر |
| `polygons` | v2.0+ | المضلعات |
| `area-perimeter` | v2.0+ | المساحة والمحيط |
| `3d-shapes` | v2.0+ | الأشكال ثلاثية الأبعاد |
| `coordinate-geometry` | v2.0+ | الهندسة الإحداثية |

**statistics:**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `central-tendency` | v2.0+ | مقاييس النزعة المركزية |
| `dispersion` | v2.0+ | مقاييس التشتت |
| `charts` | v2.0+ | الرسوم البيانية |
| `probability` | v2.0+ | الاحتمالات |
| `permutations` | v2.0+ | التباديل والتوافيق |

---

## 🔄 v2.0 → v2.1: تحديثات القسم اللفظي

### 1️⃣ حقول جديدة مُضافة

#### `analogyType` - نوع علاقة التناظر
```json
// ❌ v2.0 - بدون تحديد نوع العلاقة
{
  "topic": "analogy",
  "subtopic": "synonymy"
}

// ✅ v2.1
{
  "topic": "analogy",
  "subtopic": "synonymy",
  "analogyType": "synonymy"
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | مطلوب عندما `topic = "analogy"` |
| القيم الممكنة | 22 قيمة (انظر الجدول الكامل) |

---

### 2️⃣ قيم جديدة للحقول الموجودة

#### `topic` - الموضوعات الرئيسية (اللفظي)
```json
// v2.0 - 5 موضوعات
"topic": "reading-comprehension" | "sentence-completion" | "context-error" | "analogy" | "association-difference"

// v2.1 - 7 موضوعات
"topic": "reading-comprehension" | "sentence-completion" | "context-error" | "analogy" | "association-difference" | "odd-word" | "vocabulary"
```

| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `reading-comprehension` | v1.0+ | استيعاب المقروء |
| `sentence-completion` | v1.0+ | إكمال الجمل |
| `context-error` | v1.0+ | الخطأ السياقي |
| `analogy` | v1.0+ | التناظر اللفظي |
| `association-difference` | v1.0+ | الارتباط والاختلاف |
| `odd-word` | v2.1+ ⭐ | المفردة الشاذة |
| `vocabulary` | v2.1+ ⭐ | معاني المفردات |

---

#### `subtopic` - التصنيفات الفرعية (اللفظي)

**reading-comprehension:**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `main-idea` | v1.0+ | الفكرة الرئيسية |
| `inference` | v1.0+ | الاستنتاج |
| `detail` | v1.0+ | التفاصيل المباشرة |
| `vocabulary-in-context` | v1.0+ | معنى كلمة في السياق |
| `author-purpose` | v1.0+ | غرض الكاتب |
| `text-structure` | v1.0+ | بنية النص |
| `suitable-title` | v2.1+ ⭐ | العنوان المناسب |
| `pronoun-reference` | v2.1+ ⭐ | الضمائر |
| `paragraph-relation` | v2.1+ ⭐ | العلاقة بين الفقرات |
| `deletable-word` | v2.1+ ⭐ | الكلمة القابلة للحذف |
| `text-type` | v2.1+ ⭐ | نوع النص |
| `idea-sequence` | v2.1+ ⭐ | ترتيب الأفكار |

**analogy (التناظر اللفظي):**
| القيمة | الإصدار | الوصف | مثال |
|--------|---------|-------|------|
| `synonymy` | v1.0+ | الترادف | غني : ثري |
| `antonymy` | v1.0+ | التضاد | علم : جهل |
| `part-of-whole` | v1.0+ | جزء من كل | فصل : مدرسة |
| `whole-to-part` | v2.1+ ⭐ | كل إلى جزء | كتاب : ورقة |
| `cause-effect` | v1.0+ | السبب والنتيجة | جراثيم : مرض |
| `effect-cause` | v2.1+ ⭐ | النتيجة والسبب | معافى : دواء |
| `succession` | v2.1+ ⭐ | التعاقب/التتابع | ليل : نهار |
| `temporal` | v2.1+ ⭐ | الاقتران الزماني | ظلام : ليل |
| `spatial` | v2.1+ ⭐ | الاقتران المكاني | عرين : أسد |
| `tool-usage` | v1.0+ | الآلة والاستخدام | مقص : قماش |
| `profession-tool` | v2.1+ ⭐ | المهنة والأداة | جراح : مشرط |
| `profession-action` | v2.1+ ⭐ | المهنة والعمل | فلاح : زراعة |
| `origin-branch` | v2.1+ ⭐ | الأصل والفرع | شجرة : غصن |
| `type-of` | v2.1+ ⭐ | النوع | ياسمين : زهور |
| `category` | v2.1+ ⭐ | الفئة | دجاج : أوز |
| `degree` | v1.0+ | الدرجة | جبل : تل |
| `gradation` | v2.1+ ⭐ | التدرج | ابتسامة : ضحكة |
| `transformation` | v2.1+ ⭐ | التحويل/المرحلية | عجين : خبز |
| `made-of` | v2.1+ ⭐ | مصنوع من | خشب : باب |
| `condition` | v2.1+ ⭐ | الشرط | شهادة : توظيف |
| `conjugation` | v1.0+ | التصريف اللغوي | مسافر : وصل |
| `attribute` | v1.0+ | الصفة | طعم : حلو |

**odd-word (جديد في v2.1):**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `category-based` | v2.1+ ⭐ | بناءً على الفئة |
| `semantic-based` | v2.1+ ⭐ | بناءً على المعنى |
| `function-based` | v2.1+ ⭐ | بناءً على الوظيفة |

**vocabulary (جديد في v2.1):**
| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `word-meaning` | v2.1+ ⭐ | معاني الكلمات |
| `synonyms` | v2.1+ ⭐ | المترادفات |
| `antonyms` | v2.1+ ⭐ | الأضداد |
| `contextual-meaning` | v2.1+ ⭐ | المعنى حسب السياق |

---

## 📐 هيكل JSON الكامل (v2.1)

### هيكل الاستجابة الرئيسي
```json
{
  "examType": "full | practice",
  "track": "scientific | literary",
  "version": "2.1",
  "totalQuestions": 96,
  "sections": {
    "quantitative": 44,
    "verbal": 52
  },
  "questions": [...]
}
```

### هيكل السؤال الأساسي
```json
{
  "id": "string",
  "section": "quantitative | verbal",
  "topic": "string",
  "subtopic": "string",
  "difficulty": "easy | medium | hard",
  "questionType": "mcq | comparison | diagram | chart | reading-passage",
  "stem": "string",
  "choices": ["string", "string", "string", "string"],
  "answerIndex": 0 | 1 | 2 | 3,
  "explanation": "string",
  "tags": ["string"]
}
```

### هيكل سؤال المقارنة (comparison)
```json
{
  "id": "exam_scientific_quant_comparisons_01",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "value1": "2³ × 3",
  "value2": "4² + 8",
  "choices": [
    "القيمة الأولى أكبر",
    "القيمة الثانية أكبر",
    "القيمتان متساويتان",
    "المعطيات غير كافية للمقارنة"
  ],
  "answerIndex": 2,
  "explanation": "القيمة الأولى = 8 × 3 = 24، القيمة الثانية = 16 + 8 = 24، إذن القيمتان متساويتان",
  "tags": ["exponents", "comparison"]
}
```

### هيكل سؤال الرسم الهندسي (diagram)
```json
{
  "id": "exam_scientific_quant_geometry_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "triangles",
  "difficulty": "medium",
  "questionType": "diagram",
  "stem": "في الشكل المجاور، ما قيمة الزاوية س؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "angles": [60, 80, "س"],
      "labels": true
    },
    "renderHint": "SVG",
    "caption": "مثلث أ ب ج"
  },
  "choices": ["40°", "50°", "60°", "80°"],
  "answerIndex": 0,
  "explanation": "مجموع زوايا المثلث = 180°، إذن س = 180 - 60 - 80 = 40°",
  "tags": ["triangle", "angles"]
}
```

### هيكل سؤال الرسم البياني (chart)
```json
{
  "id": "exam_scientific_quant_statistics_01",
  "section": "quantitative",
  "topic": "statistics",
  "subtopic": "charts",
  "difficulty": "easy",
  "questionType": "chart",
  "stem": "من الرسم البياني، ما مجموع المبيعات في الربعين الأول والثاني؟",
  "diagram": {
    "type": "bar-chart",
    "data": {
      "labels": ["الربع 1", "الربع 2", "الربع 3", "الربع 4"],
      "values": [150, 200, 180, 220],
      "xAxisLabel": "الفترة",
      "yAxisLabel": "المبيعات (ألف ريال)",
      "title": "المبيعات الفصلية"
    },
    "renderHint": "Chart.js",
    "caption": "المبيعات الفصلية للشركة"
  },
  "choices": ["300 ألف", "350 ألف", "380 ألف", "400 ألف"],
  "answerIndex": 1,
  "explanation": "مجموع المبيعات = 150 + 200 = 350 ألف ريال",
  "tags": ["bar-chart", "reading-data"]
}
```

### هيكل سؤال التناظر اللفظي (analogy)
```json
{
  "id": "exam_scientific_verbal_analogy_01",
  "section": "verbal",
  "topic": "analogy",
  "subtopic": "succession",
  "difficulty": "medium",
  "questionType": "mcq",
  "analogyType": "succession",
  "stem": "ليل : نهار",
  "choices": [
    "شمس : قمر",
    "ماء : ثلج",
    "صيف : شتاء",
    "علم : جهل"
  ],
  "answerIndex": 0,
  "explanation": "العلاقة تعاقب زمني: الليل يعقبه النهار كما الشمس تعقبها القمر (أو العكس)، بينما صيف : شتاء علاقة فصول وليست تعاقب مباشر",
  "tags": ["succession", "temporal"]
}
```

### هيكل سؤال استيعاب المقروء (reading-passage)
```json
{
  "id": "exam_scientific_verbal_reading_01",
  "section": "verbal",
  "topic": "reading-comprehension",
  "subtopic": "suitable-title",
  "difficulty": "medium",
  "questionType": "reading-passage",
  "passageId": "passage_01",
  "passage": "النص الكامل هنا... (يُذكر في السؤال الأول فقط)",
  "stem": "ما العنوان الأنسب لهذا النص؟",
  "choices": [
    "التقدم التكنولوجي",
    "مخاطر الذكاء الاصطناعي",
    "مستقبل البشرية",
    "الثورة الصناعية الرابعة"
  ],
  "answerIndex": 3,
  "explanation": "النص يتحدث عن الثورة الصناعية الرابعة وتأثيراتها على مختلف جوانب الحياة",
  "tags": ["title", "main-idea"]
}
```

### هيكل سؤال المفردة الشاذة (odd-word) - جديد v2.1
```json
{
  "id": "exam_scientific_verbal_oddword_01",
  "section": "verbal",
  "topic": "odd-word",
  "subtopic": "category-based",
  "difficulty": "easy",
  "questionType": "mcq",
  "stem": "حدد الكلمة الشاذة التي لا تنتمي للمجموعة:",
  "choices": [
    "تفاح",
    "برتقال",
    "جزر",
    "عنب"
  ],
  "answerIndex": 2,
  "explanation": "جميع الكلمات فواكه ما عدا 'جزر' فهو من الخضروات",
  "tags": ["category", "odd-one-out"]
}
```

### هيكل سؤال معاني المفردات (vocabulary) - جديد v2.1
```json
{
  "id": "exam_scientific_verbal_vocabulary_01",
  "section": "verbal",
  "topic": "vocabulary",
  "subtopic": "word-meaning",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "ما معنى كلمة 'الصَّبا'؟",
  "choices": [
    "الشيخوخة",
    "مرحلة الشباب الأولى",
    "الحنين للوطن",
    "نسيم الصباح"
  ],
  "answerIndex": 1,
  "explanation": "الصَّبا: مرحلة الشباب الأولى والحداثة، وقد تعني أيضاً ريح الصبا لكن المعنى الأساسي هو الشباب",
  "tags": ["meaning", "arabic-vocabulary"]
}
```

---

## 🔄 v2.1 → v3.0: الأشكال المتداخلة والمساحات المظللة ⭐ جديد

### 1️⃣ حقول جديدة مُضافة

#### `subtype` - النوع الفرعي للرسم المتداخل
```json
// ❌ v2.1 - بدون تحديد النوع الفرعي
{
  "diagram": {
    "type": "overlapping-shapes"
  }
}

// ✅ v3.0
{
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "three-tangent-circles"
  }
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | مطلوب عندما `type = "overlapping-shapes"` |
| القيم الممكنة | 8 قيم (انظر الجدول أدناه) |

**قيم `subtype` الممكنة:**
| القيمة | الوصف | الصعوبة |
|--------|-------|---------|
| `square-with-corner-circles` | مربع مع أرباع دوائر | صعب |
| `square-vertex-at-circle-center` | رأس المربع في مركز الدائرة | صعب |
| `rose-pattern-in-square` | وردة داخل مربع | صعب جداً |
| `three-tangent-circles` | ثلاث دوائر متماسة | صعب |
| `sector-minus-triangle` | قطاع ناقص مثلث | متوسط |
| `circles-in-rectangle` | دوائر في مستطيل | متوسط |
| `inscribed-circle-in-square` | دائرة محاطة بمربع | متوسط |
| `inscribed-square-in-circle` | مربع محاط بدائرة | متوسط |

---

#### `shading` - كائن التظليل
```json
// ❌ v2.1 - غير موجود

// ✅ v3.0
{
  "diagram": {
    "shading": {
      "type": "difference",
      "operation": "square - circles",
      "shadedRegion": "inside_square_outside_circles",
      "fillColor": "#e74c3c",
      "fillOpacity": 0.5
    }
  }
}
```
| الخاصية | النوع | الوصف | مطلوب |
|---------|-------|-------|-------|
| `type` | `string` | نوع العملية (`difference`, `intersection`, `union`) | ✅ |
| `operation` | `string` | وصف العملية الرياضية | ✅ |
| `shadedRegion` | `string` | وصف المنطقة المظللة | ❌ |
| `fillColor` | `string` | لون التظليل (hex) | ❌ |
| `fillOpacity` | `number` | شفافية التظليل (0-1) | ❌ |

---

#### `overlap` - كائن التداخل
```json
// ❌ v2.1 - غير موجود

// ✅ v3.0
{
  "diagram": {
    "overlap": {
      "type": "quarter-circle-inside-square",
      "angle": 90,
      "description": "ربع الدائرة داخل المربع"
    }
  }
}
```
| الخاصية | النوع | الوصف | مطلوب |
|---------|-------|-------|-------|
| `type` | `string` | نوع التداخل | ✅ |
| `angle` | `number` | زاوية التداخل (إن وجدت) | ❌ |
| `description` | `string` | وصف منطقة التداخل | ❌ |

---

#### `formulaUsed` - الصيغة المستخدمة
```json
// ❌ v2.1 - غير موجود

// ✅ v3.0
{
  "diagram": {
    "formulaUsed": "المساحة = مساحة المربع - مساحة دائرة كاملة"
  }
}
```
| الخاصية | القيمة |
|---------|--------|
| النوع | `string` |
| الإلزامية | اختياري (موصى به للأشكال المتداخلة) |
| الهدف | توضيح طريقة الحل للطالب |

---

### 2️⃣ قيم جديدة للحقول الموجودة

#### `questionType` - أنواع الأسئلة
```json
// v2.1
"questionType": "mcq" | "comparison" | "diagram" | "chart" | "reading-passage"

// v3.0 (قيمة إضافية)
"questionType": "mcq" | "comparison" | "diagram" | "chart" | "reading-passage" | "overlapping-diagram"
```

| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `overlapping-diagram` | v3.0+ ⭐ | سؤال مع أشكال متداخلة |

---

#### `renderHint` - مكتبة العرض
```json
// v2.1
"renderHint": "SVG" | "Chart.js"

// v3.0 (قيم إضافية)
"renderHint": "SVG" | "Chart.js" | "JSXGraph" | "Mafs" | "Konva" | "D3"
```

| القيمة | الإصدار | الاستخدام |
|--------|---------|-----------|
| `SVG` | v2.0+ | أشكال بسيطة |
| `Chart.js` | v2.0+ | رسوم بيانية |
| `JSXGraph` | v3.0+ ⭐ | أشكال متداخلة (الأفضل) |
| `Mafs` | v3.0+ ⭐ | تفاعلية |
| `Konva` | v3.0+ ⭐ | أداء عالي |
| `D3` | v3.0+ ⭐ | تخصيص متقدم |

---

#### `subtopic` - التصنيفات الفرعية (الهندسة)
```json
// v2.1
"subtopic": "angles" | "triangles" | "circles" | "polygons" | "area-perimeter" | "3d-shapes" | "coordinate-geometry"

// v3.0 (قيمة إضافية)
"subtopic": "... | overlapping-shapes"
```

| القيمة | الإصدار | الوصف |
|--------|---------|-------|
| `overlapping-shapes` | v3.0+ ⭐ | الأشكال المتداخلة والمساحات المظللة |

---

### 3️⃣ هيكل سؤال الأشكال المتداخلة (مثال كامل)

```json
{
  "id": "exam_scientific_quant_geometry_overlap_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "hard",
  "questionType": "overlapping-diagram",
  "stem": "ثلاث دوائر متطابقة نصف قطر كل منها 1 سم، كل دائرة تمس الدائرتين الأخريين. ما المساحة المحصورة بين الدوائر الثلاث؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "three-tangent-circles",
    "data": {
      "circles": [
        {"center": "O₁", "radius": 1, "position": "top"},
        {"center": "O₂", "radius": 1, "position": "bottom-left"},
        {"center": "O₃", "radius": 1, "position": "bottom-right"}
      ],
      "tangentPoints": [
        {"between": ["O₁", "O₂"], "label": "T₁"},
        {"between": ["O₂", "O₃"], "label": "T₂"},
        {"between": ["O₁", "O₃"], "label": "T₃"}
      ],
      "centerTriangle": {
        "show": true,
        "type": "equilateral",
        "side": 2
      },
      "labels": {
        "radius": "1 سم"
      }
    },
    "shading": {
      "type": "difference",
      "operation": "triangle - 3_sectors",
      "shadedRegion": "curvilinear_triangle",
      "fillColor": "#f39c12",
      "fillOpacity": 0.6
    },
    "overlap": {
      "type": "three-60-degree-sectors",
      "angle": 60,
      "description": "ثلاث قطاعات بزاوية 60° لكل منها"
    },
    "renderHint": "JSXGraph",
    "caption": "ثلاث دوائر متماسة",
    "formulaUsed": "المساحة = مساحة المثلث - 3 قطاعات = √3 - π/2"
  },
  "choices": ["√3 - π/2 سم²", "√3 + π/2 سم²", "π - √3 سم²", "2√3 - π سم²"],
  "answerIndex": 0,
  "explanation": "مراكز الدوائر تشكل مثلث متساوي الأضلاع طول ضلعه 2 سم. مساحة المثلث = (√3/4) × 2² = √3 سم². مساحة 3 قطاعات (60° لكل منها) = 3 × (60/360) × π × 1² = π/2 سم². المساحة المحصورة = √3 - π/2 سم²",
  "tags": ["overlapping-shapes", "three-tangent-circles", "curvilinear-triangle"]
}
```

---

### 4️⃣ أمثلة إضافية للأنماط الشائعة

#### مثال: مربع مع أرباع دوائر
```json
{
  "questionType": "overlapping-diagram",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "square-with-corner-circles",
    "data": {
      "square": {"side": 20, "vertices": ["أ", "ب", "ج", "د"]},
      "circles": [
        {"center": "أ", "radius": 20, "visibleArc": 90},
        {"center": "ب", "radius": 20, "visibleArc": 90},
        {"center": "ج", "radius": 20, "visibleArc": 90},
        {"center": "د", "radius": 20, "visibleArc": 90}
      ]
    },
    "shading": {
      "type": "difference",
      "operation": "square - 4_quarter_circles"
    },
    "renderHint": "JSXGraph",
    "formulaUsed": "المساحة = 400 - 100π سم²"
  }
}
```

#### مثال: دائرة محاطة بمربع
```json
{
  "questionType": "overlapping-diagram",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "inscribed-circle-in-square",
    "data": {
      "square": {"side": 10},
      "circle": {"radius": 5, "inscribed": true}
    },
    "shading": {
      "type": "difference",
      "operation": "square - circle"
    },
    "renderHint": "SVG",
    "formulaUsed": "المساحة = 100 - 25π سم²"
  }
}
```

---

## 🔧 دليل التحديث للمطورين

### متطلبات التحديث من v1.0 إلى v3.0

#### 1. تحديث Schema Validation
```javascript
// إضافة الحقول الجديدة للتحقق
const schemaV30 = {
  version: { type: 'string', required: true, enum: ['2.0', '2.1', '3.0'] },
  subtopic: { type: 'string', required: true },
  analogyType: { type: 'string', required: false }, // مطلوب فقط للتناظر
  problemType: { type: 'string', required: false }, // مطلوب فقط للمسائل التطبيقية
  value1: { type: 'string', required: false }, // مطلوب فقط للمقارنات
  value2: { type: 'string', required: false }, // مطلوب فقط للمقارنات
  diagram: { type: 'object', required: false }, // مطلوب فقط لـ diagram/chart/overlapping-diagram
  
  // حقول جديدة في v3.0 ⭐
  'diagram.subtype': { type: 'string', required: false }, // للأشكال المتداخلة
  'diagram.shading': { type: 'object', required: false },
  'diagram.overlap': { type: 'object', required: false },
  'diagram.formulaUsed': { type: 'string', required: false }
};
```

#### 2. تحديث قائمة القيم المسموحة
```javascript
const allowedValues = {
  // أنواع الأسئلة - محدثة في v3.0
  questionType: ['mcq', 'comparison', 'diagram', 'chart', 'reading-passage', 'overlapping-diagram'],
  
  // مكتبات العرض - محدثة في v3.0
  renderHint: ['SVG', 'Chart.js', 'JSXGraph', 'Mafs', 'Konva', 'D3'],
  
  // الكمي
  quantTopics: ['arithmetic', 'algebra', 'geometry', 'statistics', 'word-problems', 'comparisons'],
  
  // الهندسة - محدثة في v3.0
  geometrySubtopics: ['angles', 'triangles', 'circles', 'polygons', 'area-perimeter', '3d-shapes', 'coordinate-geometry', 'overlapping-shapes'],
  
  // أنواع الأشكال المتداخلة - جديد v3.0 ⭐
  overlappingSubtypes: [
    'square-with-corner-circles',
    'square-vertex-at-circle-center', 
    'rose-pattern-in-square',
    'three-tangent-circles',
    'sector-minus-triangle',
    'circles-in-rectangle',
    'inscribed-circle-in-square',
    'inscribed-square-in-circle'
  ],
  
  // أنواع التظليل - جديد v3.0 ⭐
  shadingTypes: ['difference', 'intersection', 'union'],
  
  // اللفظي
  verbalTopics: ['reading-comprehension', 'sentence-completion', 'context-error', 'analogy', 'association-difference', 'odd-word', 'vocabulary'],
  
  // علاقات التناظر (22 علاقة)
  analogyTypes: ['synonymy', 'antonymy', 'part-of-whole', 'whole-to-part', 'cause-effect', 'effect-cause', 'succession', 'temporal', 'spatial', 'tool-usage', 'profession-tool', 'profession-action', 'origin-branch', 'type-of', 'category', 'degree', 'gradation', 'transformation', 'made-of', 'condition', 'conjugation', 'attribute']
};
```

#### 3. التوافق مع الإصدارات السابقة
```javascript
function normalizeQuestion(question) {
  // إضافة subtopic افتراضي للأسئلة القديمة
  if (!question.subtopic) {
    question.subtopic = question.topic;
  }
  
  // إضافة version افتراضي
  if (!question.version) {
    question.version = '1.0';
  }
  
  // تحويل diagram القديم إلى overlapping-diagram إذا لزم ⭐ v3.0
  if (question.diagram?.type === 'overlapping-shapes' && question.questionType === 'diagram') {
    question.questionType = 'overlapping-diagram';
  }
  
  // إضافة renderHint افتراضي للأشكال المتداخلة ⭐ v3.0
  if (question.questionType === 'overlapping-diagram' && !question.diagram?.renderHint) {
    question.diagram.renderHint = 'JSXGraph';
  }
  
  return question;
}
```

#### 4. مكون DiagramRenderer المحدث ⭐ v3.0
```typescript
// components/diagrams/DiagramRenderer.tsx
import dynamic from 'next/dynamic';

const JSXGraphDiagram = dynamic(() => import('./JSXGraphDiagram'), { ssr: false });
const MafsDiagram = dynamic(() => import('./MafsDiagram'), { ssr: false });
const KonvaDiagram = dynamic(() => import('./KonvaDiagram'), { ssr: false });

interface DiagramRendererProps {
  diagram: {
    type: string;
    subtype?: string;
    data: any;
    shading?: ShadingConfig;
    overlap?: OverlapConfig;
    renderHint: 'SVG' | 'Chart.js' | 'JSXGraph' | 'Mafs' | 'Konva' | 'D3';
    formulaUsed?: string;
  };
}

export function DiagramRenderer({ diagram }: DiagramRendererProps) {
  const { type, subtype, data, renderHint } = diagram;

  switch (renderHint) {
    case 'SVG':
      return <SVGDiagram type={type} data={data} />;
    case 'Chart.js':
      return <ChartJSDiagram type={type} data={data} />;
    case 'JSXGraph':
      return <JSXGraphDiagram type={type} subtype={subtype} data={data} shading={diagram.shading} />;
    case 'Mafs':
      return <MafsDiagram type={type} data={data} />;
    case 'Konva':
      return <KonvaDiagram type={type} data={data} />;
    default:
      return <SVGDiagram type={type} data={data} />;
  }
}
```

---

## 📊 إحصائيات التغييرات

### ملخص الحقول
| الحقل | v1.0 | v2.0 | v2.1 | v3.0 |
|-------|------|------|------|------|
| `version` | ❌ | ✅ | ✅ | ✅ |
| `subtopic` | ❌ | ✅ | ✅ | ✅ |
| `value1/value2` | ❌ | ✅ | ✅ | ✅ |
| `problemType` | ❌ | ✅ | ✅ | ✅ |
| `diagram` | ❌ | ✅ | ✅ | ✅ |
| `analogyType` | ❌ | ❌ | ✅ | ✅ |
| `diagram.subtype` | ❌ | ❌ | ❌ | ✅ ⭐ |
| `diagram.shading` | ❌ | ❌ | ❌ | ✅ ⭐ |
| `diagram.overlap` | ❌ | ❌ | ❌ | ✅ ⭐ |
| `diagram.formulaUsed` | ❌ | ❌ | ❌ | ✅ ⭐ |

### ملخص القيم
| الفئة | v1.0 | v2.0 | v2.1 | v3.0 |
|-------|------|------|------|------|
| `questionType` | 2 | 5 | 5 | 6 ⭐ |
| `renderHint` | 0 | 2 | 2 | 6 ⭐ |
| موضوعات كمية | 4 | 6 | 6 | 6 |
| موضوعات لفظية | 5 | 5 | 7 | 7 |
| تصنيفات فرعية كمية | 0 | 28 | 28 | 29 ⭐ |
| تصنيفات فرعية لفظية | 0 | 18 | 36 | 36 |
| علاقات التناظر | 8 | 8 | 22 | 22 |
| أنواع الأشكال المتداخلة | 0 | 0 | 0 | 8 ⭐ |
| أنواع التظليل | 0 | 0 | 0 | 3 ⭐ |

### مكتبات العرض المدعومة (v3.0)
| المكتبة | الإصدار | الاستخدام | الأولوية |
|---------|---------|-----------|----------|
| SVG | v2.0+ | أشكال بسيطة | افتراضي |
| Chart.js | v2.0+ | رسوم بيانية | افتراضي للإحصاء |
| JSXGraph | v3.0+ ⭐ | أشكال متداخلة | الأفضل للتعليم |
| Mafs | v3.0+ ⭐ | تفاعلية | للاستكشاف |
| Konva | v3.0+ ⭐ | أداء عالي | Canvas |
| D3 | v3.0+ ⭐ | تخصيص | متقدم |

---

## 📚 المراجع

| الملف | الوصف |
|-------|-------|
| `EXAM_GENERATION_PROMPTS_V3.0.md` | برومبتات التوليد المحدثة |
| `DIAGRAM_CHART_REFERENCE_GUIDE.md` | دليل الرسومات الشامل (v3.0) |

---

**الإصدار:** 3.0  
**تاريخ التوثيق:** يناير 2026  
**المرجع:** EXAM_GENERATION_PROMPTS_V3.0.md
