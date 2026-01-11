# Full JSON Schema Reference

## Complete Question Object

```typescript
interface Question {
  // Required for all questions
  id: string;
  section: 'quantitative' | 'verbal';
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  stem: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  
  // Optional
  tags?: string[];
  
  // Comparison only
  value1?: string;
  value2?: string;
  
  // Diagram/Chart only
  diagram?: DiagramObject;
  
  // Reading only
  passageId?: string;
  passage?: string;
  
  // Analogy only
  analogyType?: string;
  
  // Word problems only
  problemType?: string;
}

type QuestionType = 
  | 'mcq' 
  | 'comparison' 
  | 'diagram' 
  | 'chart' 
  | 'overlapping-diagram' 
  | 'reading-passage';
```

---

## Diagram Object

```typescript
interface DiagramObject {
  type: string;
  subtype?: string; // for overlapping-shapes
  data: Record<string, any>;
  renderHint: 'SVG' | 'Chart.js' | 'JSXGraph' | 'Mafs' | 'Konva';
  caption?: string;
  shading?: ShadingObject;
  overlap?: OverlapObject;
  formulaUsed?: string;
}

interface ShadingObject {
  type: 'difference' | 'intersection' | 'union';
  operation: string;
  shadedRegion?: string;
  fillColor?: string;
  fillOpacity?: number;
}

interface OverlapObject {
  type: string;
  angle?: number;
  description?: string;
}
```

---

## Validation Functions

```javascript
function validateQuestion(q) {
  const errors = [];
  
  // Required fields
  if (!q.id) errors.push('Missing id');
  if (!q.section) errors.push('Missing section');
  if (!q.topic) errors.push('Missing topic');
  if (!q.subtopic) errors.push('Missing subtopic');
  if (!q.difficulty) errors.push('Missing difficulty');
  if (!q.questionType) errors.push('Missing questionType');
  if (!q.stem) errors.push('Missing stem');
  if (!q.choices || q.choices.length !== 4) errors.push('Must have exactly 4 choices');
  if (q.answerIndex === undefined || q.answerIndex < 0 || q.answerIndex > 3) {
    errors.push('answerIndex must be 0-3');
  }
  if (!q.explanation) errors.push('Missing explanation');
  
  // Type-specific validation
  if (q.questionType === 'comparison') {
    if (!q.value1) errors.push('Comparison requires value1');
    if (!q.value2) errors.push('Comparison requires value2');
  }
  
  if (['diagram', 'chart', 'overlapping-diagram'].includes(q.questionType)) {
    if (!q.diagram) errors.push('Diagram question requires diagram object');
    if (q.diagram && !q.diagram.renderHint) errors.push('Diagram requires renderHint');
  }
  
  if (q.questionType === 'reading-passage') {
    if (!q.passageId) errors.push('Reading requires passageId');
  }
  
  if (q.topic === 'analogy') {
    if (!q.analogyType) errors.push('Analogy requires analogyType');
  }
  
  return errors;
}
```

---

## Complete Example: MCQ

```json
{
  "id": "exam_scientific_quant_arithmetic_fractions_01",
  "section": "quantitative",
  "topic": "arithmetic",
  "subtopic": "fractions",
  "difficulty": "medium",
  "questionType": "mcq",
  "stem": "ما ناتج: 2/3 + 1/4 ؟",
  "choices": ["5/7", "3/7", "11/12", "5/12"],
  "answerIndex": 2,
  "explanation": "نوحد المقامات: م.م.أ(3,4)=12. 2/3 = 8/12، 1/4 = 3/12. المجموع = 11/12",
  "tags": ["fractions", "addition"]
}
```

## Complete Example: Comparison

```json
{
  "id": "exam_scientific_quant_comparisons_algebraic_01",
  "section": "quantitative",
  "topic": "comparisons",
  "subtopic": "algebraic",
  "difficulty": "medium",
  "questionType": "comparison",
  "stem": "قارن بين القيمتين:",
  "value1": "2³ + 1",
  "value2": "3²",
  "choices": [
    "القيمة الأولى أكبر",
    "القيمة الثانية أكبر",
    "القيمتان متساويتان",
    "المعطيات غير كافية للمقارنة"
  ],
  "answerIndex": 2,
  "explanation": "القيمة الأولى = 8 + 1 = 9. القيمة الثانية = 9. متساويتان.",
  "tags": ["comparison", "exponents"]
}
```

## Complete Example: Overlapping Diagram

```json
{
  "id": "exam_scientific_quant_geometry_overlapping_01",
  "section": "quantitative",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "hard",
  "questionType": "overlapping-diagram",
  "stem": "ثلاث دوائر متماسة نصف قطر كل منها 1 سم. ما المساحة المحصورة بينها؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "three-tangent-circles",
    "data": {
      "circles": [
        {"center": "O₁", "radius": 1},
        {"center": "O₂", "radius": 1},
        {"center": "O₃", "radius": 1}
      ]
    },
    "shading": {
      "type": "difference",
      "operation": "triangle - 3_sectors"
    },
    "renderHint": "JSXGraph",
    "formulaUsed": "√3 - π/2"
  },
  "choices": ["√3 - π/2", "√3 + π/2", "π - √3", "2√3 - π"],
  "answerIndex": 0,
  "explanation": "مساحة المثلث المتساوي الأضلاع (ض=2) = √3. مساحة 3 قطاعات (60°) = π/2. المظللة = √3 - π/2",
  "tags": ["overlapping", "circles", "area"]
}
```

## Complete Example: Reading

```json
{
  "id": "exam_scientific_verbal_reading_main-idea_01",
  "section": "verbal",
  "topic": "reading-comprehension",
  "subtopic": "main-idea",
  "difficulty": "medium",
  "questionType": "reading-passage",
  "passageId": "passage_01",
  "passage": "تُعدّ القراءة من أهم وسائل اكتساب المعرفة...",
  "stem": "الفكرة الرئيسية للنص:",
  "choices": [
    "أهمية القراءة وفوائدها",
    "طرق القراءة الصحيحة",
    "تاريخ الكتب",
    "أنواع المكتبات"
  ],
  "answerIndex": 0,
  "explanation": "النص يركز على أهمية القراءة ويعدد فوائدها.",
  "tags": ["reading", "main-idea"]
}
```

## Complete Example: Analogy

```json
{
  "id": "exam_scientific_verbal_analogy_antonymy_01",
  "section": "verbal",
  "topic": "analogy",
  "subtopic": "antonymy",
  "difficulty": "easy",
  "questionType": "mcq",
  "analogyType": "antonymy",
  "stem": "علم : جهل",
  "choices": ["نور : ضوء", "ليل : نهار", "كتاب : قلم", "سماء : أرض"],
  "answerIndex": 1,
  "explanation": "العلاقة تضاد: علم عكس جهل، وليل عكس نهار.",
  "tags": ["analogy", "antonymy"]
}
```
