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

### الـ 22 علاقة المدعومة
للقائمة الكاملة مع الأمثلة: **[references/analogy-relations.md](references/analogy-relations.md)**

### العلاقات الأكثر شيوعاً
| العلاقة | مثال |
|---------|------|
| `synonymy` | سعيد : مبتهج |
| `antonymy` | علم : جهل |
| `part-whole` | صفحة : كتاب |
| `cause-effect` | نار : دخان |
| `tool-user` | مبضع : جراح |
| `place` | طالب : مدرسة |

### تنسيق سؤال التناظر
```json
{
  "questionType": "mcq",
  "topic": "analogy",
  "subtopic": "synonymy",
  "analogyType": "synonymy",
  "stem": "كريم : سخي",
  "choices": ["بخيل : شحيح", "غني : فقير", "طويل : قصير", "سريع : بطيء"]
}
```

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
