> /speckit.plan is running…  /plan


# Tafawoq - Saudi Aptitude Exam Preparation Platform



## Tech Stack & Architecture

- **Frontend Framework**: Next.js for modern web application with SSR/SSG capabilities.

- **UI Library**: shadcn/ui for modern, accessible components with strict RTL layout for Arabic.

- **Database**: Supabase (Postgres) directly connected via client services. No custom backend API layer.

- **Authentication**: Supabase Auth for email/password + OTP verification.

- **Payments**: Stripe integration for subscription tiers (free, monthly premium).

- **AI Models (Gemini)**:

  - Text Generation: Generate exam questions in structured JSON format, explanations, and solution tips.

- **Visual Rendering**: SVG, Canvas, and Chart.js for diagrams and charts.



## AI Workflow - Exam/Practice Generation

1. **User Selection → Exam Generation Request**

   - User selects exam type (full exam or practice), track (scientific/literary), categories, difficulty, and question count.

   - System validates user subscription status and access rights.

2. **Prompt Construction & API Call**

   - System builds a structured prompt based on user selections and exam generation guidelines.

   - Prompt is sent to Gemini API for text generation.

   - Gemini returns a complete JSON response containing all exam questions.

3. **JSON Processing & Storage**

   - JSON response is parsed and validated against the expected schema.

   - Validated exam data is stored directly in Supabase database.

   - Exam is linked to user session for tracking and analytics.

4. **Exam Rendering**

   - Frontend retrieves exam data from Supabase.

   - Questions are rendered with appropriate components (text, diagrams, charts).

   - Diagrams rendered via SVG, Canvas, or Chart.js based on `render_hint` field.

5. **Evaluation & Solution Tips**

   - User answers evaluated with scoring logic.

   - Gemini text generation model produces personalized solution strategies and tips.



## Exam Generation Prompt

The following prompt is used to generate exams via Gemini API:

---

أنت خبير في إنشاء المحتوى التعليمي للاختبارات المعيارية في المملكة العربية السعودية. مهمتك هي توليد اختبار كامل ومنظم لـ "اختبار القدرات العامة" (قدرات) المستخدم للقبول الجامعي. يجب أن يكون الاختبار بالكامل باللغة العربية ويتضمن:

1. **القسم الكمي (Quantitative Section)** – يختلف حسب المسار (علمي أو أدبي)
2. **القسم اللفظي (Verbal Section)** – موحد بين المسارين

---

### 📏 التوجيهات العامة لتكوين الاختبار

- **إجمالي عدد الأسئلة:** 96 سؤالًا.
- **مدة الاختبار:** 120 دقيقة.
- **نوع الأسئلة:** اختيار من متعدد (أربع خيارات لكل سؤال، إجابة واحدة صحيحة).
- **لا يُسمح باستخدام الآلة الحاسبة.**
- **الأسئلة غير مرتبة تصاعديًا في الصعوبة، بل موزعة عشوائيًا.**
- **الدرجات موزعة بالتساوي بين الأسئلة، ولا تُخصم درجات على الإجابات الخاطئة.**

---

### ⚖️ توزيع الأسئلة حسب المسار

| المسار        | نسبة الأسئلة الكمية | نسبة الأسئلة اللفظية |
|---------------|----------------------|------------------------|
| المسار العلمي | 60% (حوالي 57 سؤالًا) | 40% (حوالي 39 سؤالًا) |
| المسار الأدبي | 30% (حوالي 29 سؤالًا) | 70% (حوالي 67 سؤالًا) |

---

### 🧮 القسم الكمي (الرياضي)

**الهدف:** قياس القدرة على التحليل الكمي، التفكير المنطقي، والاستنتاج العددي.

**الموضوعات المطلوب تغطيتها:**

- **الجبر:**
  - للمسار العلمي: معادلات خطية وتربيعية، تبسيط تعابير، تحليل متباينات.
  - للمسار الأدبي: معادلات بسيطة، العمليات الحسابية الأساسية.

- **الهندسة:**
  - للمسار العلمي: الزوايا، المساحات، الحجوم، خصائص الأشكال.
  - للمسار الأدبي: مفاهيم هندسية أولية مثل المحيط والمساحة.

- **الإحصاء والتحليل البياني:**
  - للمسار العلمي: قراءة الجداول، الرسوم البيانية، المتوسط، الوسيط، الانحراف المعياري.
  - للمسار الأدبي: المتوسط والمنوال، قراءة رسوم بيانية بسيطة.

- **النسبة والتناسب، النسب المئوية، الكسور:**
  - للمسارين: مسائل تطبيقية في الحياة اليومية.

- **الاحتمالات:**
  - للمسار العلمي: حساب احتمالات باستخدام مبادئ العد.
  - للمسار الأدبي: مفاهيم أساسية في الاحتمال.

- **السرعة والزمن والمسافة:**
  - مسائل تطبيقية تعتمد على العلاقات الرياضية البسيطة.

**ملاحظات توليد الأسئلة الكمية:**
- استخدم سيناريوهات حياتية مألوفة.
- لا تتطلب حفظ قوانين معقدة.
- اجعل الأسئلة متنوعة في الصياغة (نصوص، رسوم، جداول).

---

### 📚 القسم اللفظي (اللغوي)

**الهدف:** قياس القدرة على الفهم القرائي، التحليل اللغوي، والاستدلال اللفظي.

**الموضوعات المطلوب تغطيتها (موحدة للمسارين):**

- **الاستيعاب القرائي:** نصوص متبوعة بأسئلة تحليلية واستنتاجية.
- **إكمال الجمل:** اختيار الكلمة الأنسب لغويًا وسياقيًا.
- **الخطأ السياقي:** تحديد الكلمة غير المناسبة في الجملة.
- **التناظر اللفظي:** إيجاد علاقة مماثلة بين زوجين من الكلمات.
- **الارتباط والاختلاف:** تحديد الكلمة المختلفة أو الأكثر ارتباطًا.
- **المفردات:** فهم معاني الكلمات واستخدامها في السياق.

**ملاحظات توليد الأسئلة اللفظية:**
- استخدم لغة عربية فصيحة وواضحة.
- اجعل النصوص متنوعة في الطول والمجال (أدبي، علمي، اجتماعي).
- راعِ التدرج في مستوى الصعوبة.

---

### 📐 متطلبات الأسئلة البصرية

- **أسئلة الهندسة مع الرسوم:** على الأقل 6 أسئلة تتضمن رسومات (مثلثات، دوائر، أشكال مركبة).
- **أسئلة الإحصاء مع الرسوم البيانية:** على الأقل 4 أسئلة مع رسوم بيانية (شريطية، دائرية، خطية).
- **أسئلة فهم المقروء:** على الأقل 5 نصوص، كل منها متبوع بـ 3-5 أسئلة.
- **أسئلة الاستدلال اللفظي:** على الأقل 10 أسئلة (تناظر، إكمال جمل، خطأ سياقي).

جميع الرسومات والمخططات يجب أن تتضمن:
- كائن `diagram` يحتوي على `type` و`data` و`render_hint`
- بيانات وصفية منظمة تسمح بالعرض عبر SVG أو Canvas أو Chart.js
- لا تستخدم صور base64 أو روابط خارجية – فقط بيانات منظمة

---

### ✅ معايير جودة الأسئلة

- لا تعتمد على مقررات دراسية محددة، بل استند إلى المهارات العامة المكتسبة في المرحلة الثانوية.
- صِغ الأسئلة بطريقة تقيس التفكير النقدي، وليس الحفظ أو التلقين.
- حافظ على التوازن بين أنواع الأسئلة داخل كل قسم.
- راعِ الفروقات في العمق الرياضي بين المسار العلمي والأدبي فقط في القسم الكمي.
- كل سؤال يجب أن يكون مكتفيًا ذاتيًا (بدون مراجع خارجية).
- مناسب لطلاب الثانوية السعوديين.
- محايد ثقافيًا ومتوافق تعليميًا.
- كل سؤال له إجابة صحيحة واحدة فقط.
- جميع البدائل (المشتتات) معقولة وذات صلة.
- حقل `explanation` يوضح الإجابة الصحيحة بشكل واضح.

---

### 📦 صيغة الإخراج (JSON)

أعد كائن JSON واحد بالهيكل التالي:

```json
{
  "track": "scientific" | "literary",
  "version": "v1.0",
  "language": "ar",
  "total_questions": 96,
  "duration_minutes": 120,
  "questions": [
    {
      "id": "unique-string-id",
      "section": "quantitative" | "verbal",
      "topic": "geometry" | "statistics" | "algebra" | "reading-comprehension" | "analogy" | "sentence-completion" | "context-error" | "ratio-proportion" | "probability" | "speed-time-distance",
      "difficulty": "easy" | "medium" | "hard",
      "question_type": "mcq" | "diagram" | "chart" | "text-only" | "reading-passage",
      "stem": "نص السؤال هنا...",
      "choices": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "answer_index": 0,
      "explanation": "شرح مختصر للإجابة الصحيحة",
      "passage": "نص القراءة للأسئلة المتعلقة بفهم المقروء (اختياري)",
      "passage_id": "معرف النص لربط الأسئلة بنص واحد (اختياري)",
      "diagram": {
        "type": "circle" | "triangle" | "rectangle" | "bar-chart" | "pie-chart" | "line-graph" | "composite-shape" | "custom",
        "data": {
          // معلمات الرسم (مثل: نصف القطر، التسميات، القيم، الإحداثيات)
        },
        "render_hint": "SVG" | "Canvas" | "Chart.js",
        "caption": "وصف مختصر للرسم التوضيحي"
      },
      "tags": ["geometry", "visual", "svg", "grade12"]
    }
  ]
}
```

---

### 📋 مثال على الإخراج

```json
{
  "track": "scientific",
  "version": "v1.0",
  "language": "ar",
  "total_questions": 96,
  "duration_minutes": 120,
  "questions": [
    {
      "id": "QGEO-001",
      "section": "quantitative",
      "topic": "geometry",
      "difficulty": "medium",
      "question_type": "diagram",
      "stem": "في الشكل الموضح، ما مساحة الدائرة إذا كان نصف القطر 7 سم؟",
      "choices": ["154", "49", "100", "44"],
      "answer_index": 0,
      "explanation": "مساحة الدائرة = π × نق² = 3.14 × 7² = 153.86 ≈ 154",
      "diagram": {
        "type": "circle",
        "data": {
          "radius": 7,
          "center": [100, 100],
          "label": "r = 7 cm",
          "showRadius": true
        },
        "render_hint": "SVG",
        "caption": "دائرة نصف قطرها 7 سم"
      },
      "tags": ["geometry", "circle", "area", "svg"]
    },
    {
      "id": "QSTAT-002",
      "section": "quantitative",
      "topic": "statistics",
      "difficulty": "easy",
      "question_type": "chart",
      "stem": "يوضح الرسم البياني التالي عدد الكتب المقروءة من قبل أربعة طلاب. من قرأ أكبر عدد من الكتب؟",
      "choices": ["أحمد", "سارة", "ليلى", "خالد"],
      "answer_index": 1,
      "explanation": "سارة قرأت 12 كتابًا وهو العدد الأكبر في الرسم البياني.",
      "diagram": {
        "type": "bar-chart",
        "data": {
          "labels": ["أحمد", "سارة", "ليلى", "خالد"],
          "values": [8, 12, 7, 9],
          "xLabel": "الطلاب",
          "yLabel": "عدد الكتب",
          "colors": ["#1E5631", "#D4AF37", "#1E5631", "#1E5631"]
        },
        "render_hint": "Chart.js",
        "caption": "عدد الكتب المقروءة من قبل كل طالب"
      },
      "tags": ["statistics", "bar-chart", "chart-analysis", "visual"]
    },
    {
      "id": "QVERB-003",
      "section": "verbal",
      "topic": "analogy",
      "difficulty": "medium",
      "question_type": "text-only",
      "stem": "قلم : كتابة :: مفتاح : ؟",
      "choices": ["باب", "فتح", "قفل", "حديد"],
      "answer_index": 1,
      "explanation": "العلاقة هي: الأداة والوظيفة. القلم أداة للكتابة، والمفتاح أداة للفتح.",
      "tags": ["analogy", "verbal-reasoning"]
    },
    {
      "id": "QREAD-004",
      "section": "verbal",
      "topic": "reading-comprehension",
      "difficulty": "hard",
      "question_type": "reading-passage",
      "passage": "يُعدّ التعليم من أهم ركائز التنمية في أي مجتمع، فهو الأساس الذي تُبنى عليه الحضارات وتتقدم الأمم. وقد أولت المملكة العربية السعودية اهتمامًا كبيرًا بقطاع التعليم، حيث خصصت له نسبة كبيرة من الميزانية العامة للدولة...",
      "passage_id": "PASS-001",
      "stem": "ما الفكرة الرئيسية للنص؟",
      "choices": ["أهمية الميزانية في التعليم", "دور التعليم في تقدم المجتمعات", "تاريخ التعليم في السعودية", "مشكلات التعليم الحديث"],
      "answer_index": 1,
      "explanation": "الفكرة الرئيسية للنص تتمحور حول أهمية التعليم كركيزة للتنمية وتقدم الأمم.",
      "tags": ["reading-comprehension", "main-idea"]
    }
  ]
}
```

---

### 🎯 الهدف

أعد كائن JSON كامل ونظيف يمكن تخزينه مباشرة في قاعدة بيانات Supabase وعرضه في واجهة Next.js دون تعديل. جميع المنطق والتنسيق وبيانات الرسوم يجب أن تُعالج من قبلك. لا يجب أن تكون هناك حاجة لأي معالجة أو تحويل إضافي في الواجهة الأمامية.

---

## Customized Practice Generation Prompt

The following is a **dynamic prompt template** for generating customized practice sessions. The system constructs this prompt based on user selections (sections, categories, difficulty, question count, and academic track).

---

### 📝 قالب توليد التدريب المخصص (Dynamic Practice Prompt Template)

أنت خبير في إنشاء المحتوى التعليمي للاختبارات المعيارية في المملكة العربية السعودية. مهمتك هي توليد جلسة تدريب مخصصة لـ "اختبار القدرات العامة" (قدرات) بناءً على اختيارات المستخدم.

---

### ⚙️ معلمات التدريب (Dynamic Parameters)

```
المسار الأكاديمي: {{TRACK}} // "scientific" | "literary"
الأقسام المختارة: {{SELECTED_SECTIONS}} // ["quantitative"] | ["verbal"] | ["quantitative", "verbal"]
الفئات المختارة: {{SELECTED_CATEGORIES}} // مصفوفة من الفئات المحددة
مستوى الصعوبة: {{DIFFICULTY}} // "easy" | "medium" | "hard"
عدد الأسئلة: {{QUESTION_COUNT}} // 5-100
```

---

### 📋 الفئات المتاحة حسب القسم

**القسم الكمي (quantitative):**
| معرف الفئة | الاسم بالعربية | الوصف |
|------------|----------------|-------|
| `algebra` | الجبر | معادلات، تعابير، متباينات |
| `geometry` | الهندسة | أشكال، زوايا، مساحات، حجوم - *يتضمن رسومات* |
| `statistics` | الإحصاء والتحليل البياني | جداول، رسوم بيانية، متوسطات - *يتضمن رسومات* |
| `ratio-proportion` | النسبة والتناسب | نسب مئوية، كسور، تطبيقات حياتية |
| `probability` | الاحتمالات | مبادئ العد وحسابات الاحتمال |
| `speed-time-distance` | السرعة والزمن والمسافة | علاقات رياضية تطبيقية |

**القسم اللفظي (verbal):**
| معرف الفئة | الاسم بالعربية | الوصف |
|------------|----------------|-------|
| `reading-comprehension` | الاستيعاب القرائي | تحليل واستنتاج من نصوص |
| `sentence-completion` | إكمال الجمل | اختيار الكلمة المناسبة سياقيًا |
| `context-error` | الخطأ السياقي | تحديد الكلمة غير المناسبة |
| `analogy` | التناظر اللفظي | علاقات بين أزواج الكلمات |
| `association-difference` | الارتباط والاختلاف | تحديد الكلمة المختلفة أو الأكثر ارتباطًا |
| `vocabulary` | المفردات | معاني الكلمات واستخدامها |

---

### 🎚️ تعديل الصعوبة حسب المستوى

**مستوى سهل (easy):**
- أسئلة مباشرة بخطوة أو خطوتين
- مفاهيم أساسية بدون تعقيد
- نصوص قصيرة وواضحة للفهم القرائي
- أرقام بسيطة وعمليات أساسية

**مستوى متوسط (medium):**
- أسئلة تتطلب 2-3 خطوات
- مزيج من المفاهيم المترابطة
- نصوص متوسطة الطول مع استنتاجات
- أرقام معتدلة وعمليات متنوعة

**مستوى صعب (hard):**
- أسئلة متعددة الخطوات (3+)
- دمج مفاهيم من عدة مجالات
- نصوص طويلة مع تحليل عميق
- أرقام معقدة وعمليات متقدمة

---

### 🎯 تعديل التعقيد حسب المسار الأكاديمي

**للمسار العلمي (scientific) - القسم الكمي فقط:**
- معادلات خطية وتربيعية
- هندسة متقدمة (حجوم، زوايا معقدة)
- إحصاء متقدم (انحراف معياري، وسيط)
- احتمالات مع مبادئ العد

**للمسار الأدبي (literary) - القسم الكمي فقط:**
- معادلات بسيطة وعمليات أساسية
- هندسة أولية (محيط، مساحة)
- إحصاء بسيط (متوسط، منوال)
- احتمالات أساسية

**القسم اللفظي:** موحد لكلا المسارين

---

### 📦 صيغة الإخراج للتدريب المخصص (JSON)

```json
{
  "type": "practice",
  "track": "{{TRACK}}",
  "version": "v1.0",
  "language": "ar",
  "total_questions": {{QUESTION_COUNT}},
  "difficulty": "{{DIFFICULTY}}",
  "selected_sections": {{SELECTED_SECTIONS}},
  "selected_categories": {{SELECTED_CATEGORIES}},
  "questions": [
    {
      "id": "unique-string-id",
      "section": "quantitative" | "verbal",
      "topic": "{{CATEGORY_ID}}",
      "difficulty": "{{DIFFICULTY}}",
      "question_type": "mcq" | "diagram" | "chart" | "text-only" | "reading-passage",
      "stem": "نص السؤال هنا...",
      "choices": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "answer_index": 0,
      "explanation": "شرح مختصر للإجابة الصحيحة",
      "solving_strategy": "استراتيجية الحل خطوة بخطوة",
      "tip": "نصيحة سريعة لأسئلة مشابهة",
      "passage": "نص القراءة (اختياري - للاستيعاب القرائي فقط)",
      "passage_id": "معرف النص (اختياري)",
      "diagram": {
        "type": "circle" | "triangle" | "rectangle" | "bar-chart" | "pie-chart" | "line-graph" | "composite-shape",
        "data": { /* معلمات الرسم */ },
        "render_hint": "SVG" | "Canvas" | "Chart.js",
        "caption": "وصف الرسم"
      },
      "tags": ["category", "difficulty", "visual"]
    }
  ]
}
```

---

### 📋 مثال: توليد تدريب مخصص

**مدخلات المستخدم:**
```
المسار: علمي (scientific)
الأقسام: ["quantitative"]
الفئات: ["geometry", "algebra"]
الصعوبة: متوسط (medium)
عدد الأسئلة: 10
```

**الإخراج المتوقع:**
```json
{
  "type": "practice",
  "track": "scientific",
  "version": "v1.0",
  "language": "ar",
  "total_questions": 10,
  "difficulty": "medium",
  "selected_sections": ["quantitative"],
  "selected_categories": ["geometry", "algebra"],
  "questions": [
    {
      "id": "PRAC-GEO-001",
      "section": "quantitative",
      "topic": "geometry",
      "difficulty": "medium",
      "question_type": "diagram",
      "stem": "مثلث قائم الزاوية، طول الضلع الأول 6 سم والضلع الثاني 8 سم. ما طول الوتر؟",
      "choices": ["10 سم", "14 سم", "12 سم", "7 سم"],
      "answer_index": 0,
      "explanation": "باستخدام نظرية فيثاغورس: الوتر² = 6² + 8² = 36 + 64 = 100، إذن الوتر = 10 سم",
      "solving_strategy": "1. تحديد أن المثلث قائم الزاوية\n2. تطبيق نظرية فيثاغورس: أ² + ب² = ج²\n3. حساب مجموع مربعي الضلعين\n4. إيجاد الجذر التربيعي للناتج",
      "tip": "احفظ الثلاثيات الفيثاغورية الشائعة: (3,4,5)، (5,12,13)، (6,8,10)",
      "diagram": {
        "type": "triangle",
        "data": {
          "vertices": [[0, 0], [6, 0], [0, 8]],
          "labels": {"a": "6 سم", "b": "8 سم", "c": "؟"},
          "rightAngle": [0, 0],
          "showLabels": true
        },
        "render_hint": "SVG",
        "caption": "مثلث قائم الزاوية"
      },
      "tags": ["geometry", "triangle", "pythagorean", "medium", "diagram"]
    },
    {
      "id": "PRAC-ALG-002",
      "section": "quantitative",
      "topic": "algebra",
      "difficulty": "medium",
      "question_type": "text-only",
      "stem": "إذا كان 2س + 5 = 17، فما قيمة س؟",
      "choices": ["6", "5", "7", "4"],
      "answer_index": 0,
      "explanation": "2س + 5 = 17 → 2س = 12 → س = 6",
      "solving_strategy": "1. اطرح 5 من الطرفين: 2س = 12\n2. اقسم على 2: س = 6",
      "tip": "دائمًا تحقق من إجابتك بالتعويض في المعادلة الأصلية",
      "tags": ["algebra", "linear-equation", "medium"]
    }
  ]
}
```

---

### ✅ قواعد توليد التدريب المخصص

1. **توزيع الأسئلة:** وزّع الأسئلة بالتساوي على الفئات المختارة
2. **التنوع:** تجنب تكرار نفس نمط السؤال
3. **الصعوبة:** جميع الأسئلة تطابق مستوى الصعوبة المحدد
4. **المسار:** اضبط تعقيد الأسئلة الكمية حسب المسار الأكاديمي
5. **الرسومات:** أضف رسومات للفئات التي تتطلبها (هندسة، إحصاء)
6. **الشرح:** كل سؤال يتضمن explanation و solving_strategy و tip
7. **الجودة:** نفس معايير الجودة المطبقة على الاختبارات الكاملة

---

### 🔄 بناء الـ Prompt برمجيًا (Implementation Guide)

```typescript
interface PracticeConfig {
  track: 'scientific' | 'literary';
  sections: ('quantitative' | 'verbal')[];
  categories: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

function buildPracticePrompt(config: PracticeConfig): string {
  const basePrompt = `أنت خبير في إنشاء المحتوى التعليمي...`;

  const dynamicSection = `
    المسار الأكاديمي: ${config.track === 'scientific' ? 'علمي' : 'أدبي'}
    الأقسام المختارة: ${config.sections.map(s => s === 'quantitative' ? 'الكمي' : 'اللفظي').join('، ')}
    الفئات المختارة: ${config.categories.join('، ')}
    مستوى الصعوبة: ${config.difficulty === 'easy' ? 'سهل' : config.difficulty === 'medium' ? 'متوسط' : 'صعب'}
    عدد الأسئلة المطلوبة: ${config.questionCount}
  `;

  return `${basePrompt}\n\n${dynamicSection}\n\n${jsonSchemaInstructions}`;
}
```

---

## MCP Tools & Integration Instructions

- For documentation, code references, or gathering technical resources, always use the **ref MCP tool**—supporting design files, private repos, PDFs, and Markdown docs.

- For database interactions (authentication, user data, exam storage, analytics), always use the **Supabase MCP tool**. Never bypass this tool for DB access.

- For all payment, subscription, or invoice operations, always use **Stripe MCP tool**.

- For UI and design implementation, always use the **shadcn/ui MCP tool** to ensure strict adherence to modern design guidelines and achieve consistent, high-quality results with proper RTL support.

- For manual testing and browser automation, use the **Chrome MCP tool** for testing exam rendering, RTL layout verification, and user flow validation.

- Never custom-code these integrations—agents and code must use designated MCP tools for all corresponding operations.



## Visual Identity & Design System

- **Aesthetic**: Modern Minimalist, Professional, Academic. No cartoonish or playful elements.

- **Layout**: Strict RTL (Right-to-Left) for Arabic. All components flow RTL.

- **Typography**: Google Font "Noto Kufi Arabic" imported via Next.js font optimization. Web-optimized sizes.

- **Color Palette**:

  - Primary: Saudi Deep Green (#1E5631)

  - Secondary/Accent: Muted Gold (#D4AF37)

  - Backgrounds: White (#FFFFFF) and Warm Light Grey (#F9FAFB)

- **Design Integration**:

  - Each screen references `design/<screen>/screen.html` and `screen.png`.

  - Next.js implementation must visually match provided assets.

  - Strict adherence to spacing, alignment, and hierarchy.

  - Master guidelines override any conflicts. No improvisation for referenced screens.



## Key Features

- Subscription tiers with access control (Free vs Premium).

- Full integrated exams (verbal + quantitative).

- Customized practice sessions with category/difficulty selection.

- Rich visual question support (text + diagrams + charts).

- Detailed performance analytics (per-section scores, strengths/weaknesses, trends).

- Real-time notifications for reminders and milestones.

- Exportable reports (premium).

- Legal compliance: Terms, Conditions, Privacy Policy.



## Implementation Notes

- Use Supabase services directly for data persistence and auth.

- Ensure responsive design for all screen sizes with mobile-first approach.

- Implement lazy loading for exam questions and chart/diagram rendering.

- Strict adherence to RTL and Arabic accessibility (alt text for images, ARIA labels).

- Stripe integration for secure payments and trial handling.

- Testing focus: exam generation accuracy, JSON schema validation, RTL UI consistency, subscription enforcement, diagram/chart rendering accuracy.

- Use Next.js App Router for routing and server components where appropriate.

- Implement proper error boundaries and loading states for Gemini API calls.
