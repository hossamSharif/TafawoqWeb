---
name: qudurat-verbal
description: توليد أسئلة القسم اللفظي لاختبار القدرات السعودي (GAT/Qudurat). يُستخدم عند طلب إنشاء أسئلة لفظية تشمل: (1) استيعاب المقروء - الفكرة الرئيسية، الاستنتاج، التفاصيل، العنوان المناسب، (2) إكمال الجمل - فراغ واحد، فراغين، تضاد، (3) التناظر اللفظي - 22 علاقة منها الترادف، التضاد، الجزء/الكل، السبب/النتيجة، (4) الخطأ السياقي - خطأ دلالي، تناقض، (5) الارتباط والاختلاف - المفردة الشاذة.
---

# Qudurat Verbal Questions Generator

## Quick Reference

### التوزيع المطلوب (المسار العلمي)
| الموضوع | النسبة | الأسئلة/20 |
|---------|--------|-----------|
| reading-comprehension | 40% | 8 |
| analogy | 25% | 5 |
| sentence-completion | 15% | 3 |
| context-error | 12% | 2-3 |
| odd-word | 8% | 1-2 |

### أنواع الأسئلة
| النوع | الوصف |
|-------|-------|
| `reading-passage` | أسئلة مرتبطة بنص قراءة |
| `mcq` | باقي الأنواع |

## Generation Rules

### قواعد صارمة
1. **4 خيارات بالضبط** - إجابة واحدة صحيحة
2. **عربية فصحى سليمة** - بدون أخطاء نحوية
3. **شرح واضح** - يوضح العلاقة أو السبب
4. **تنوع المصادر** - علمية، أدبية، اجتماعية
5. **مشتتات معقولة** - تبدو صحيحة ظاهرياً

### تنسيق المعرّف
```
{context}_{section}_{topic}_{subtopic}_{seq}
```
مثال: `exam_scientific_verbal_analogy_synonymy_01`

## Reading Comprehension

### أنواع الأسئلة الفرعية
| النوع | الوصف |
|-------|-------|
| `main-idea` | الفكرة الرئيسية للنص |
| `inference` | استنتاج غير مذكور صراحة |
| `detail` | معلومة مذكورة في النص |
| `vocabulary-in-context` | معنى كلمة حسب السياق |
| `suitable-title` | العنوان الأنسب |
| `author-purpose` | غرض الكاتب |

### مواصفات النص
- **الطول**: 100-200 كلمة
- **الأسئلة لكل نص**: 3-5 أسئلة
- **passageId**: لربط الأسئلة بنفس النص

```json
{
  "questionType": "reading-passage",
  "passageId": "passage_01",
  "passage": "النص الكامل... (أول سؤال فقط)"
}
```

## Analogy (التناظر اللفظي)

### الـ 22 علاقة المدعومة (FR-025)
للقائمة الكاملة مع الأمثلة: **[references/analogy-relations.md](references/analogy-relations.md)**

**جميع الـ 22 علاقة يجب أن تُستخدم بشكل متوازن:**
1. synonymy (ترادف)
2. antonymy (تضاد)
3. part-whole (جزء من كل)
4. whole-part (كل إلى جزء)
5. cause-effect (سبب ونتيجة)
6. effect-cause (نتيجة وسبب)
7. tool-user (أداة ومستخدم)
8. profession-tool (مهنة وأداة)
9. profession-action (مهنة وفعل)
10. place (علاقة مكانية)
11. temporal (تعاقب زمني)
12. degree (درجة وشدة)
13. type-of (نوع وصنف)
14. made-of (مادة خام)
15. attribute (صفة)
16. origin-branch (أصل وفرع)
17. function (وظيفة)
18. container (وعاء ومحتوى)
19. condition (شرط ونتيجة)
20. transformation (تحول)
21. conjugation (تصريف لغوي)
22. spatial (علاقة اتجاهية)

### قواعد اختيار نوع العلاقة

**التوزيع المتوازن (User Story 5):**
- يجب توليد أسئلة تغطي **جميع الـ 22 علاقة**
- عند توليد دفعة من أسئلة التناظر، نوّع بين جميع العلاقات
- لا تُكرر نفس العلاقة في أسئلة متتالية
- احفظ العلاقة في حقل `relationship_type` (FR-026)

**اختيار العلاقة:**
1. استخدم جميع العلاقات بالتناوب
2. ابدأ بالعلاقات الأكثر شيوعاً (synonymy, antonymy, part-whole)
3. انتقل تدريجياً للعلاقات الأقل شيوعاً
4. تأكد من تغطية جميع الـ 22 علاقة عند توليد مجموعة كبيرة

### قواعد توليد المشتتات في التناظر

**المشتت الجيد:**
- يحمل علاقة مختلفة عن العلاقة الصحيحة
- يستخدم كلمات ذات صلة بالموضوع
- يبدو منطقياً للوهلة الأولى

**أمثلة:**
| السؤال | الإجابة الصحيحة | مشتت جيد | السبب |
|--------|-----------------|----------|--------|
| قلم : كاتب (tool-user) | فرشاة : رسام | قلم : كتابة (function) | علاقة مختلفة |
| نار : دخان (cause-effect) | مرض : ألم | نار : حرارة (attribute) | علاقة مختلفة |

### تنسيق سؤال التناظر
```json
{
  "questionType": "mcq",
  "topic": "analogy",
  "subtopic": "tool-user",
  "relationship_type": "tool-user",
  "stem": "قلم : كاتب",
  "choices": ["فرشاة : رسام", "قلم : كتابة", "كاتب : مكتب", "ورق : قلم"],
  "answerIndex": 0,
  "explanation": "العلاقة: أداة ومستخدم (tool-user). القلم أداة يستخدمها الكاتب، والفرشاة أداة يستخدمها الرسام.",
  "tags": ["analogy", "tool-user"]
}
```

**ملاحظة مهمة:**
- يجب ذكر اسم العلاقة في `explanation` بالعربية (FR-026)
- احفظ نوع العلاقة في حقل `relationship_type`
- استخدم الأمثلة من [references/analogy-relations.md](references/analogy-relations.md) كمرجع

## Sentence Completion

### الأنواع
| النوع | الوصف |
|-------|-------|
| `single-blank` | فراغ واحد |
| `double-blank` | فراغين |
| `contrast` | علاقة تضاد (لكن، بينما) |
| `cause-effect` | علاقة سببية (لأن، لذلك) |

## Context Error

### الأنواع
| النوع | الوصف |
|-------|-------|
| `semantic-error` | كلمة لا تناسب المعنى |
| `contradiction` | تناقض منطقي |

## Topic Details

للموضوعات والأمثلة التفصيلية: **[references/topics.md](references/topics.md)**

لعلاقات التناظر الـ 22: **[references/analogy-relations.md](references/analogy-relations.md)**

## Output Format

### سؤال تناظر
```json
{
  "id": "exam_verbal_analogy_synonymy_01",
  "section": "verbal",
  "topic": "analogy",
  "subtopic": "synonymy",
  "difficulty": "medium",
  "questionType": "mcq",
  "analogyType": "synonymy",
  "stem": "عالِم : جاهل",
  "choices": ["كبير : صغير", "أب : أم", "قلم : كتاب", "سريع : سيارة"],
  "answerIndex": 0,
  "explanation": "العلاقة تضاد: عالم عكس جاهل، وكبير عكس صغير",
  "tags": ["analogy", "antonymy"]
}
```

### سؤال قراءة
```json
{
  "id": "exam_verbal_reading_main-idea_01",
  "section": "verbal",
  "topic": "reading-comprehension",
  "subtopic": "main-idea",
  "difficulty": "medium",
  "questionType": "reading-passage",
  "passageId": "passage_01",
  "passage": "النص الكامل هنا...",
  "stem": "الفكرة الرئيسية للنص هي:",
  "choices": ["أ", "ب", "ج", "د"],
  "answerIndex": 0,
  "explanation": "الشرح...",
  "tags": ["reading", "main-idea"]
}
```
