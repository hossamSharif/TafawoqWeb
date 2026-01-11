# 📐 دليل الأسئلة المصورة الشامل
## Diagram & Chart Questions Reference Guide

هذا الدليل المرجعي يحتوي على جميع أنواع الرسومات المستخدمة في أسئلة اختبار القدرات، مع أمثلة تفصيلية لكل نوع.

---

## 📊 نظرة عامة

### أنواع الأسئلة المصورة

| النوع | `questionType` | `renderHint` | الاستخدام |
|-------|---------------|--------------|-----------|
| رسم هندسي بسيط | `diagram` | `SVG` | أسئلة الهندسة الأساسية |
| أشكال متداخلة | `diagram` | `JSXGraph` | المساحات المظللة ⭐ |
| رسم تفاعلي | `diagram` | `Mafs` | الاستكشاف الهندسي |
| رسم بياني | `chart` | `Chart.js` | أسئلة الإحصاء |

### المكتبات المدعومة

| المكتبة | الإصدار | الاستخدام |
|---------|---------|-----------|
| SVG خام | - | أشكال بسيطة |
| Chart.js | ^4.x | رسوم بيانية |
| JSXGraph | ^1.11 | أشكال متداخلة ⭐ |
| Mafs | ^0.19 | تفاعلية |
| React-Konva | ^18.x | أداء عالي |

### إحصائيات التوزيع (الاختبار العلمي)

| النوع | العدد | النسبة من الكمي |
|-------|-------|----------------|
| `diagram` (بسيط) | 4-6 أسئلة | ~10% |
| `diagram` (متداخل) | 2-4 أسئلة | ~5% ⭐ |
| `chart` | 4-6 أسئلة | ~10% |

---

## 🔷 القسم الأول: الرسوم الهندسية (SVG)

### البنية الأساسية لكائن الرسم الهندسي

```json
{
  "diagram": {
    "type": "نوع الشكل",
    "data": {
      // بيانات الشكل (تختلف حسب النوع)
    },
    "renderHint": "SVG",
    "caption": "وصف مختصر للرسم"
  }
}
```

---

## 1️⃣ الدائرة (Circle)

### الخصائص المتاحة

| الخاصية | النوع | الوصف | مطلوب |
|---------|-------|-------|-------|
| `radius` | `number` | نصف القطر | ✅ |
| `center` | `string` | تسمية المركز | ❌ |
| `label` | `string` | تسمية الدائرة | ❌ |
| `showRadius` | `boolean` | إظهار نصف القطر | ❌ |
| `showDiameter` | `boolean` | إظهار القطر | ❌ |
| `showCenter` | `boolean` | إظهار المركز | ❌ |
| `chord` | `object` | الوتر | ❌ |
| `arc` | `object` | القوس | ❌ |
| `sector` | `object` | القطاع | ❌ |
| `tangent` | `object` | المماس | ❌ |
| `inscribedAngle` | `object` | الزاوية المحيطية | ❌ |
| `centralAngle` | `object` | الزاوية المركزية | ❌ |

### مثال 1.1: دائرة بسيطة مع نصف القطر

```json
{
  "id": "diagram_circle_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "إذا كان نصف قطر الدائرة = 7 سم، فما محيطها؟ (π = 22/7)",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 7,
      "center": "م",
      "showRadius": true,
      "showCenter": true,
      "radiusLabel": "7 سم"
    },
    "renderHint": "SVG",
    "caption": "دائرة مركزها م"
  },
  "choices": ["22 سم", "44 سم", "154 سم", "88 سم"],
  "answerIndex": 1,
  "explanation": "محيط الدائرة = 2 × π × نق = 2 × 22/7 × 7 = 44 سم"
}
```

### مثال 1.2: دائرة مع قطاع دائري

```json
{
  "id": "diagram_circle_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "ما مساحة القطاع الدائري المظلل إذا كان نصف القطر 6 سم والزاوية المركزية 60°؟",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 6,
      "center": "O",
      "showCenter": true,
      "sector": {
        "startAngle": 0,
        "endAngle": 60,
        "shaded": true,
        "color": "#3498db"
      },
      "centralAngle": {
        "value": 60,
        "label": "60°"
      }
    },
    "renderHint": "SVG",
    "caption": "قطاع دائري بزاوية 60°"
  },
  "choices": ["6π سم²", "12π سم²", "18π سم²", "36π سم²"],
  "answerIndex": 0,
  "explanation": "مساحة القطاع = (الزاوية/360) × π × نق² = (60/360) × π × 36 = 6π سم²"
}
```

### مثال 1.3: دائرة مع وتر

```json
{
  "id": "diagram_circle_03",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "في الشكل، أب وتر في الدائرة، وم منتصف الوتر. إذا كان نصف القطر 5 سم وبُعد م عن المركز 3 سم، فما طول الوتر أب؟",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 5,
      "center": "O",
      "showCenter": true,
      "chord": {
        "points": ["أ", "ب"],
        "midpoint": "م",
        "showMidpoint": true,
        "perpendicularFromCenter": true,
        "perpendicularLength": 3,
        "perpendicularLabel": "3 سم"
      }
    },
    "renderHint": "SVG",
    "caption": "دائرة مع وتر أب"
  },
  "choices": ["6 سم", "8 سم", "10 سم", "12 سم"],
  "answerIndex": 1,
  "explanation": "باستخدام فيثاغورس: نصف الوتر² = نق² - المسافة² = 25 - 9 = 16، إذن نصف الوتر = 4، والوتر = 8 سم"
}
```

### مثال 1.4: دائرتان متماستان

```json
{
  "id": "diagram_circle_04",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "دائرتان متماستان خارجياً، نصف قطر الأولى 4 سم والثانية 3 سم. ما المسافة بين مركزيهما؟",
  "diagram": {
    "type": "two-circles",
    "data": {
      "circle1": {
        "radius": 4,
        "center": "O₁",
        "radiusLabel": "4 سم"
      },
      "circle2": {
        "radius": 3,
        "center": "O₂",
        "radiusLabel": "3 سم"
      },
      "relationship": "external-tangent",
      "showCenterDistance": true,
      "tangentPoint": "T"
    },
    "renderHint": "SVG",
    "caption": "دائرتان متماستان خارجياً"
  },
  "choices": ["1 سم", "7 سم", "12 سم", "5 سم"],
  "answerIndex": 1,
  "explanation": "المسافة بين المركزين للدائرتين المتماستين خارجياً = مجموع نصفي القطرين = 4 + 3 = 7 سم"
}
```

### مثال 1.5: دائرة مع مماس

```json
{
  "id": "diagram_circle_05",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "المستقيم ل مماس للدائرة عند النقطة أ. إذا كان نصف القطر 5 سم والمسافة من المركز إلى النقطة ب على المماس = 13 سم، فما طول أب؟",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 5,
      "center": "O",
      "showCenter": true,
      "tangent": {
        "point": "أ",
        "line": "ل",
        "externalPoint": "ب",
        "showRightAngle": true,
        "distanceToExternal": 13,
        "distanceLabel": "13 سم"
      },
      "showRadius": true,
      "radiusLabel": "5 سم"
    },
    "renderHint": "SVG",
    "caption": "دائرة مع مماس"
  },
  "choices": ["8 سم", "10 سم", "12 سم", "15 سم"],
  "answerIndex": 2,
  "explanation": "المماس عمودي على نصف القطر. باستخدام فيثاغورس: أب² = 13² - 5² = 169 - 25 = 144، إذن أب = 12 سم"
}
```

### مثال 1.6: زاوية محيطية وزاوية مركزية

```json
{
  "id": "diagram_circle_06",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "circles",
  "stem": "في الشكل، الزاوية المركزية أ م ب = 80°. ما قياس الزاوية المحيطية أ ج ب المرسومة على نفس القوس؟",
  "diagram": {
    "type": "circle",
    "data": {
      "radius": 5,
      "center": "م",
      "showCenter": true,
      "points": [
        {"label": "أ", "angle": 30},
        {"label": "ب", "angle": 110},
        {"label": "ج", "angle": 200}
      ],
      "centralAngle": {
        "vertex": "م",
        "points": ["أ", "ب"],
        "value": 80,
        "label": "80°",
        "showArc": true
      },
      "inscribedAngle": {
        "vertex": "ج",
        "points": ["أ", "ب"],
        "showArc": true
      }
    },
    "renderHint": "SVG",
    "caption": "زاوية مركزية وزاوية محيطية"
  },
  "choices": ["40°", "80°", "160°", "20°"],
  "answerIndex": 0,
  "explanation": "الزاوية المحيطية = نصف الزاوية المركزية المرسومة على نفس القوس = 80 ÷ 2 = 40°"
}
```

---

## 2️⃣ المثلث (Triangle)

### الخصائص المتاحة

| الخاصية | النوع | الوصف | مطلوب |
|---------|-------|-------|-------|
| `vertices` | `array` | أسماء الرؤوس | ✅ |
| `sides` | `array` | أطوال الأضلاع | ❌ |
| `angles` | `array` | قياسات الزوايا | ❌ |
| `type` | `string` | نوع المثلث | ❌ |
| `showRightAngle` | `boolean` | إظهار رمز القائمة | ❌ |
| `height` | `object` | الارتفاع | ❌ |
| `median` | `object` | المتوسط | ❌ |
| `bisector` | `object` | المنصف | ❌ |
| `showAngles` | `boolean` | إظهار الزوايا | ❌ |
| `showSides` | `boolean` | إظهار الأطوال | ❌ |

### أنواع المثلثات (`type`)

| القيمة | الوصف |
|--------|-------|
| `equilateral` | متساوي الأضلاع |
| `isosceles` | متساوي الساقين |
| `scalene` | مختلف الأضلاع |
| `right` | قائم الزاوية |
| `right-isosceles` | قائم متساوي الساقين |
| `30-60-90` | المثلث الخاص 30-60-90 |
| `45-45-90` | المثلث الخاص 45-45-90 |

### مثال 2.1: مثلث قائم الزاوية (فيثاغورس)

```json
{
  "id": "diagram_triangle_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "في المثلث القائم أ ب ج، إذا كان أب = 6 سم، ب ج = 8 سم، فما طول الوتر أ ج؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "type": "right",
      "rightAngleAt": "ب",
      "showRightAngle": true,
      "sides": [
        {"from": "أ", "to": "ب", "length": 6, "label": "6 سم"},
        {"from": "ب", "to": "ج", "length": 8, "label": "8 سم"},
        {"from": "أ", "to": "ج", "length": "?", "label": "؟"}
      ]
    },
    "renderHint": "SVG",
    "caption": "مثلث قائم الزاوية في ب"
  },
  "choices": ["10 سم", "12 سم", "14 سم", "7 سم"],
  "answerIndex": 0,
  "explanation": "باستخدام نظرية فيثاغورس: أج² = أب² + بج² = 36 + 64 = 100، إذن أج = 10 سم"
}
```

### مثال 2.2: مثلث متساوي الأضلاع

```json
{
  "id": "diagram_triangle_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "مثلث متساوي الأضلاع طول ضلعه 8 سم. ما ارتفاعه؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "type": "equilateral",
      "sides": [
        {"from": "أ", "to": "ب", "length": 8, "label": "8 سم"},
        {"from": "ب", "to": "ج", "length": 8, "label": "8 سم"},
        {"from": "أ", "to": "ج", "length": 8, "label": "8 سم"}
      ],
      "height": {
        "from": "أ",
        "to": "ب ج",
        "foot": "د",
        "show": true,
        "dashed": true
      },
      "angles": [
        {"at": "أ", "value": 60},
        {"at": "ب", "value": 60},
        {"at": "ج", "value": 60}
      ]
    },
    "renderHint": "SVG",
    "caption": "مثلث متساوي الأضلاع"
  },
  "choices": ["4 سم", "4√3 سم", "8 سم", "8√3 سم"],
  "answerIndex": 1,
  "explanation": "ارتفاع المثلث متساوي الأضلاع = (ض × √3) / 2 = (8 × √3) / 2 = 4√3 سم"
}
```

### مثال 2.3: مثلث مع زوايا محددة

```json
{
  "id": "diagram_triangle_03",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "في المثلث أ ب ج، إذا كانت الزاوية أ = 50° والزاوية ب = 70°، فما قياس الزاوية ج؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "type": "scalene",
      "angles": [
        {"at": "أ", "value": 50, "label": "50°", "showArc": true},
        {"at": "ب", "value": 70, "label": "70°", "showArc": true},
        {"at": "ج", "value": "?", "label": "؟", "showArc": true}
      ],
      "showAngles": true
    },
    "renderHint": "SVG",
    "caption": "مثلث أ ب ج"
  },
  "choices": ["50°", "60°", "70°", "120°"],
  "answerIndex": 1,
  "explanation": "مجموع زوايا المثلث = 180°، إذن ج = 180 - 50 - 70 = 60°"
}
```

### مثال 2.4: المثلث الخاص 30-60-90

```json
{
  "id": "diagram_triangle_04",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "في المثلث الخاص 30-60-90، إذا كان الضلع المقابل للزاوية 30° = 5 سم، فما طول الوتر؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "type": "30-60-90",
      "rightAngleAt": "ب",
      "showRightAngle": true,
      "angles": [
        {"at": "أ", "value": 30, "label": "30°"},
        {"at": "ب", "value": 90, "label": "90°"},
        {"at": "ج", "value": 60, "label": "60°"}
      ],
      "sides": [
        {"from": "ب", "to": "ج", "length": 5, "label": "5 سم", "note": "مقابل 30°"}
      ],
      "specialTriangleRatios": {
        "show": true,
        "ratios": "1 : √3 : 2"
      }
    },
    "renderHint": "SVG",
    "caption": "مثلث خاص 30-60-90"
  },
  "choices": ["5 سم", "5√3 سم", "10 سم", "10√3 سم"],
  "answerIndex": 2,
  "explanation": "في المثلث 30-60-90، الوتر = ضعف الضلع المقابل للزاوية 30° = 2 × 5 = 10 سم"
}
```

### مثال 2.5: مثلث مع ارتفاع

```json
{
  "id": "diagram_triangle_05",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "مثلث قاعدته 12 سم ومساحته 48 سم². ما ارتفاعه؟",
  "diagram": {
    "type": "triangle",
    "data": {
      "vertices": ["أ", "ب", "ج"],
      "type": "scalene",
      "sides": [
        {"from": "ب", "to": "ج", "length": 12, "label": "12 سم", "isBase": true}
      ],
      "height": {
        "from": "أ",
        "to": "ب ج",
        "foot": "د",
        "show": true,
        "dashed": true,
        "label": "ع"
      },
      "showRightAngle": true,
      "rightAngleAt": "د",
      "area": {
        "value": 48,
        "unit": "سم²"
      }
    },
    "renderHint": "SVG",
    "caption": "مثلث مع ارتفاعه"
  },
  "choices": ["4 سم", "6 سم", "8 سم", "10 سم"],
  "answerIndex": 2,
  "explanation": "المساحة = ½ × القاعدة × الارتفاع، إذن 48 = ½ × 12 × ع، ومنها ع = 8 سم"
}
```

### مثال 2.6: مثلثان متشابهان

```json
{
  "id": "diagram_triangle_06",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "triangles",
  "stem": "المثلثان أ ب ج و د هـ و متشابهان. إذا كان أب = 6 سم، ب ج = 8 سم، د هـ = 9 سم، فما طول هـ و؟",
  "diagram": {
    "type": "similar-triangles",
    "data": {
      "triangle1": {
        "vertices": ["أ", "ب", "ج"],
        "sides": [
          {"from": "أ", "to": "ب", "length": 6, "label": "6 سم"},
          {"from": "ب", "to": "ج", "length": 8, "label": "8 سم"}
        ],
        "position": "left"
      },
      "triangle2": {
        "vertices": ["د", "هـ", "و"],
        "sides": [
          {"from": "د", "to": "هـ", "length": 9, "label": "9 سم"},
          {"from": "هـ", "to": "و", "length": "?", "label": "؟"}
        ],
        "position": "right"
      },
      "correspondence": "أب:دهـ = بج:هـو",
      "showCorrespondence": true
    },
    "renderHint": "SVG",
    "caption": "مثلثان متشابهان"
  },
  "choices": ["10 سم", "12 سم", "15 سم", "18 سم"],
  "answerIndex": 1,
  "explanation": "نسبة التشابه = دهـ/أب = 9/6 = 3/2، إذن هـو = بج × 3/2 = 8 × 3/2 = 12 سم"
}
```

---

## 3️⃣ المستطيل (Rectangle)

### الخصائص المتاحة

| الخاصية | النوع | الوصف |
|---------|-------|-------|
| `width` | `number` | العرض |
| `height` | `number` | الطول |
| `vertices` | `array` | أسماء الرؤوس |
| `showDimensions` | `boolean` | إظهار الأبعاد |
| `showDiagonal` | `boolean` | إظهار القطر |
| `diagonal` | `object` | خصائص القطر |
| `shaded` | `object` | الجزء المظلل |

### مثال 3.1: مستطيل مع قطر

```json
{
  "id": "diagram_rectangle_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "polygons",
  "stem": "مستطيل طوله 12 سم وعرضه 5 سم. ما طول قطره؟",
  "diagram": {
    "type": "rectangle",
    "data": {
      "vertices": ["أ", "ب", "ج", "د"],
      "width": 12,
      "height": 5,
      "showDimensions": true,
      "dimensions": {
        "width": {"label": "12 سم"},
        "height": {"label": "5 سم"}
      },
      "showDiagonal": true,
      "diagonal": {
        "from": "أ",
        "to": "ج",
        "label": "؟",
        "dashed": false
      }
    },
    "renderHint": "SVG",
    "caption": "مستطيل أ ب ج د"
  },
  "choices": ["13 سم", "15 سم", "17 سم", "10 سم"],
  "answerIndex": 0,
  "explanation": "القطر² = الطول² + العرض² = 144 + 25 = 169، إذن القطر = 13 سم"
}
```

### مثال 3.2: مستطيل مع جزء مظلل

```json
{
  "id": "diagram_rectangle_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "area-perimeter",
  "stem": "في الشكل، مستطيل أبعاده 10 سم × 8 سم، بداخله مربع طول ضلعه 3 سم. ما مساحة الجزء المظلل؟",
  "diagram": {
    "type": "composite-shape",
    "data": {
      "outer": {
        "type": "rectangle",
        "width": 10,
        "height": 8,
        "vertices": ["أ", "ب", "ج", "د"],
        "showDimensions": true
      },
      "inner": {
        "type": "square",
        "side": 3,
        "position": "center",
        "showDimensions": true
      },
      "shaded": {
        "region": "outer-minus-inner",
        "color": "#3498db",
        "opacity": 0.5
      }
    },
    "renderHint": "SVG",
    "caption": "مستطيل بداخله مربع"
  },
  "choices": ["71 سم²", "80 سم²", "77 سم²", "89 سم²"],
  "answerIndex": 0,
  "explanation": "المساحة المظللة = مساحة المستطيل - مساحة المربع = (10×8) - (3×3) = 80 - 9 = 71 سم²"
}
```

---

## 4️⃣ المربع (Square)

### مثال 4.1: مربع مع قطر

```json
{
  "id": "diagram_square_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "polygons",
  "stem": "مربع طول قطره 10 سم. ما مساحته؟",
  "diagram": {
    "type": "square",
    "data": {
      "vertices": ["أ", "ب", "ج", "د"],
      "showDiagonal": true,
      "diagonal": {
        "from": "أ",
        "to": "ج",
        "length": 10,
        "label": "10 سم"
      },
      "side": {
        "label": "؟"
      }
    },
    "renderHint": "SVG",
    "caption": "مربع مع قطره"
  },
  "choices": ["25 سم²", "50 سم²", "100 سم²", "25√2 سم²"],
  "answerIndex": 1,
  "explanation": "مساحة المربع = ½ × ق₁ × ق₂ = ½ × 10 × 10 = 50 سم²"
}
```

---

## 5️⃣ متوازي الأضلاع (Parallelogram)

### مثال 5.1: متوازي أضلاع مع ارتفاع

```json
{
  "id": "diagram_parallelogram_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "polygons",
  "stem": "متوازي أضلاع قاعدته 15 سم وارتفاعه 8 سم. ما مساحته؟",
  "diagram": {
    "type": "parallelogram",
    "data": {
      "vertices": ["أ", "ب", "ج", "د"],
      "base": 15,
      "height": 8,
      "side": 10,
      "showDimensions": true,
      "dimensions": {
        "base": {"label": "15 سم"},
        "height": {"label": "8 سم", "dashed": true}
      },
      "heightLine": {
        "from": "أ",
        "to": "base",
        "foot": "هـ",
        "showRightAngle": true
      }
    },
    "renderHint": "SVG",
    "caption": "متوازي أضلاع أ ب ج د"
  },
  "choices": ["80 سم²", "100 سم²", "120 سم²", "150 سم²"],
  "answerIndex": 2,
  "explanation": "مساحة متوازي الأضلاع = القاعدة × الارتفاع = 15 × 8 = 120 سم²"
}
```

---

## 6️⃣ شبه المنحرف (Trapezoid)

### مثال 6.1: شبه منحرف

```json
{
  "id": "diagram_trapezoid_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "polygons",
  "stem": "شبه منحرف قاعدتاه 12 سم و 8 سم وارتفاعه 5 سم. ما مساحته؟",
  "diagram": {
    "type": "trapezoid",
    "data": {
      "vertices": ["أ", "ب", "ج", "د"],
      "base1": 12,
      "base2": 8,
      "height": 5,
      "showDimensions": true,
      "dimensions": {
        "base1": {"label": "12 سم", "position": "bottom"},
        "base2": {"label": "8 سم", "position": "top"},
        "height": {"label": "5 سم", "dashed": true}
      },
      "parallelBases": true,
      "showParallelMarks": true
    },
    "renderHint": "SVG",
    "caption": "شبه منحرف"
  },
  "choices": ["40 سم²", "50 سم²", "60 سم²", "100 سم²"],
  "answerIndex": 1,
  "explanation": "مساحة شبه المنحرف = ½ × (مجموع القاعدتين) × الارتفاع = ½ × (12 + 8) × 5 = 50 سم²"
}
```

---

## 7️⃣ المعين (Rhombus)

### مثال 7.1: معين مع قطريه

```json
{
  "id": "diagram_rhombus_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "polygons",
  "stem": "معين طولا قطريه 10 سم و 24 سم. ما مساحته؟",
  "diagram": {
    "type": "rhombus",
    "data": {
      "vertices": ["أ", "ب", "ج", "د"],
      "diagonal1": 10,
      "diagonal2": 24,
      "showDiagonals": true,
      "diagonals": {
        "d1": {"label": "10 سم", "from": "أ", "to": "ج"},
        "d2": {"label": "24 سم", "from": "ب", "to": "د"}
      },
      "intersection": "م",
      "showRightAngle": true
    },
    "renderHint": "SVG",
    "caption": "معين مع قطريه"
  },
  "choices": ["60 سم²", "120 سم²", "240 سم²", "340 سم²"],
  "answerIndex": 1,
  "explanation": "مساحة المعين = ½ × ق₁ × ق₂ = ½ × 10 × 24 = 120 سم²"
}
```

---

## 8️⃣ الأشكال ثلاثية الأبعاد (3D Shapes)

### مثال 8.1: المكعب

```json
{
  "id": "diagram_3d_cube_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "3d-shapes",
  "stem": "مكعب طول حرفه 4 سم. ما حجمه؟",
  "diagram": {
    "type": "cube",
    "data": {
      "edge": 4,
      "showDimensions": true,
      "edgeLabel": "4 سم",
      "style": "isometric",
      "showHiddenEdges": true,
      "hiddenEdgesStyle": "dashed"
    },
    "renderHint": "SVG",
    "caption": "مكعب"
  },
  "choices": ["16 سم³", "48 سم³", "64 سم³", "96 سم³"],
  "answerIndex": 2,
  "explanation": "حجم المكعب = ل³ = 4³ = 64 سم³"
}
```

### مثال 8.2: متوازي المستطيلات

```json
{
  "id": "diagram_3d_cuboid_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "3d-shapes",
  "stem": "متوازي مستطيلات أبعاده 5 سم × 4 سم × 3 سم. ما مساحته الكلية؟",
  "diagram": {
    "type": "cuboid",
    "data": {
      "length": 5,
      "width": 4,
      "height": 3,
      "showDimensions": true,
      "dimensions": {
        "length": {"label": "5 سم"},
        "width": {"label": "4 سم"},
        "height": {"label": "3 سم"}
      },
      "style": "isometric",
      "showHiddenEdges": true
    },
    "renderHint": "SVG",
    "caption": "متوازي مستطيلات"
  },
  "choices": ["60 سم²", "94 سم²", "120 سم²", "188 سم²"],
  "answerIndex": 1,
  "explanation": "المساحة الكلية = 2(ط×ع + ط×ف + ع×ف) = 2(5×4 + 5×3 + 4×3) = 2(20+15+12) = 94 سم²"
}
```

### مثال 8.3: الأسطوانة

```json
{
  "id": "diagram_3d_cylinder_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "3d-shapes",
  "stem": "أسطوانة نصف قطر قاعدتها 7 سم وارتفاعها 10 سم. ما حجمها؟ (π = 22/7)",
  "diagram": {
    "type": "cylinder",
    "data": {
      "radius": 7,
      "height": 10,
      "showDimensions": true,
      "dimensions": {
        "radius": {"label": "7 سم"},
        "height": {"label": "10 سم"}
      },
      "showTopEllipse": true,
      "showBottomEllipse": true,
      "style": "3d"
    },
    "renderHint": "SVG",
    "caption": "أسطوانة"
  },
  "choices": ["1540 سم³", "1400 سم³", "440 سم³", "3080 سم³"],
  "answerIndex": 0,
  "explanation": "حجم الأسطوانة = π × نق² × ع = 22/7 × 49 × 10 = 1540 سم³"
}
```

### مثال 8.4: المخروط

```json
{
  "id": "diagram_3d_cone_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "3d-shapes",
  "stem": "مخروط نصف قطر قاعدته 3 سم وارتفاعه 4 سم. ما حجمه؟",
  "diagram": {
    "type": "cone",
    "data": {
      "radius": 3,
      "height": 4,
      "showDimensions": true,
      "dimensions": {
        "radius": {"label": "3 سم"},
        "height": {"label": "4 سم", "dashed": true}
      },
      "showAxis": true,
      "showBaseCircle": true,
      "style": "3d"
    },
    "renderHint": "SVG",
    "caption": "مخروط"
  },
  "choices": ["12π سم³", "36π سم³", "48π سم³", "9π سم³"],
  "answerIndex": 0,
  "explanation": "حجم المخروط = ⅓ × π × نق² × ع = ⅓ × π × 9 × 4 = 12π سم³"
}
```

### مثال 8.5: الكرة

```json
{
  "id": "diagram_3d_sphere_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "3d-shapes",
  "stem": "كرة نصف قطرها 3 سم. ما مساحة سطحها؟",
  "diagram": {
    "type": "sphere",
    "data": {
      "radius": 3,
      "showRadius": true,
      "radiusLabel": "3 سم",
      "showEquator": true,
      "showMeridian": true,
      "style": "shaded"
    },
    "renderHint": "SVG",
    "caption": "كرة"
  },
  "choices": ["18π سم²", "27π سم²", "36π سم²", "12π سم²"],
  "answerIndex": 2,
  "explanation": "مساحة سطح الكرة = 4 × π × نق² = 4 × π × 9 = 36π سم²"
}
```

---

## 9️⃣ المستوى الإحداثي (Coordinate Plane)

### مثال 9.1: نقطتان على المستوى

```json
{
  "id": "diagram_coordinate_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "coordinate-geometry",
  "stem": "ما المسافة بين النقطتين أ(1, 2) و ب(4, 6)؟",
  "diagram": {
    "type": "coordinate-plane",
    "data": {
      "xRange": [-1, 6],
      "yRange": [-1, 8],
      "gridLines": true,
      "showAxes": true,
      "axisLabels": {"x": "س", "y": "ص"},
      "points": [
        {"label": "أ", "x": 1, "y": 2, "color": "red"},
        {"label": "ب", "x": 4, "y": 6, "color": "blue"}
      ],
      "lines": [
        {"from": "أ", "to": "ب", "style": "solid", "color": "green"}
      ],
      "showCoordinates": true
    },
    "renderHint": "SVG",
    "caption": "مستوى إحداثي"
  },
  "choices": ["3", "4", "5", "7"],
  "answerIndex": 2,
  "explanation": "المسافة = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5"
}
```

### مثال 9.2: مستقيم على المستوى

```json
{
  "id": "diagram_coordinate_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "coordinate-geometry",
  "stem": "ما ميل المستقيم المار بالنقطتين (0, 1) و (3, 7)؟",
  "diagram": {
    "type": "coordinate-plane",
    "data": {
      "xRange": [-1, 5],
      "yRange": [-1, 9],
      "gridLines": true,
      "showAxes": true,
      "points": [
        {"label": "أ", "x": 0, "y": 1},
        {"label": "ب", "x": 3, "y": 7}
      ],
      "lines": [
        {"equation": "y = 2x + 1", "style": "solid", "extend": true}
      ],
      "showSlope": true,
      "slopeTriangle": {
        "show": true,
        "rise": 6,
        "run": 3
      }
    },
    "renderHint": "SVG",
    "caption": "مستقيم في المستوى الإحداثي"
  },
  "choices": ["1", "2", "3", "6"],
  "answerIndex": 1,
  "explanation": "الميل = (ص₂ - ص₁)/(س₂ - س₁) = (7-1)/(3-0) = 6/3 = 2"
}
```

---

## 🔶 الزوايا (Angles)

### مثال 10.1: زوايا متقابلة بالرأس

```json
{
  "id": "diagram_angles_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "angles",
  "stem": "في الشكل، إذا كانت الزاوية أ = 65°، فما قياس الزاوية ب؟",
  "diagram": {
    "type": "intersecting-lines",
    "data": {
      "lines": [
        {"from": "ل₁", "to": "ل₂"},
        {"from": "م₁", "to": "م₂"}
      ],
      "intersection": "O",
      "angles": [
        {"label": "أ", "value": 65, "position": "top-right"},
        {"label": "ب", "value": "?", "position": "bottom-left"},
        {"label": "ج", "value": null, "position": "top-left"},
        {"label": "د", "value": null, "position": "bottom-right"}
      ],
      "showAngleArcs": true,
      "highlightAngles": ["أ", "ب"]
    },
    "renderHint": "SVG",
    "caption": "مستقيمان متقاطعان"
  },
  "choices": ["25°", "65°", "115°", "180°"],
  "answerIndex": 1,
  "explanation": "الزوايا المتقابلة بالرأس متساوية، إذن ب = أ = 65°"
}
```

### مثال 10.2: زوايا على مستقيم

```json
{
  "id": "diagram_angles_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "angles",
  "stem": "في الشكل، أوجد قيمة س:",
  "diagram": {
    "type": "angles-on-line",
    "data": {
      "baseLine": {"from": "أ", "to": "ب"},
      "vertex": "O",
      "rays": [
        {"to": "ج", "angle": "2س"},
        {"to": "د", "angle": "3س"}
      ],
      "angles": [
        {"value": "2س", "label": "2س°"},
        {"value": "3س", "label": "3س°"}
      ],
      "showAngleArcs": true,
      "sumNote": "مجموع الزوايا على المستقيم = 180°"
    },
    "renderHint": "SVG",
    "caption": "زوايا على مستقيم"
  },
  "choices": ["30°", "36°", "45°", "60°"],
  "answerIndex": 1,
  "explanation": "2س + 3س = 180° (زوايا على مستقيم)، إذن 5س = 180، ومنها س = 36°"
}
```

### مثال 10.3: قاطع لمستقيمين متوازيين

```json
{
  "id": "diagram_angles_03",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "angles",
  "stem": "في الشكل، ل₁ // ل₂، إذا كانت الزاوية 1 = 70°، فما قياس الزاوية 2؟",
  "diagram": {
    "type": "parallel-lines-transversal",
    "data": {
      "parallelLines": [
        {"label": "ل₁", "y": 0},
        {"label": "ل₂", "y": 3}
      ],
      "transversal": {"label": "ق"},
      "showParallelMarks": true,
      "angles": {
        "line1": [
          {"position": "top-right", "label": "1", "value": 70},
          {"position": "top-left", "label": "3"},
          {"position": "bottom-right", "label": "4"},
          {"position": "bottom-left", "label": "5"}
        ],
        "line2": [
          {"position": "top-right", "label": "2", "value": "?"},
          {"position": "top-left", "label": "6"},
          {"position": "bottom-right", "label": "7"},
          {"position": "bottom-left", "label": "8"}
        ]
      },
      "highlightAngles": ["1", "2"],
      "relationship": "corresponding"
    },
    "renderHint": "SVG",
    "caption": "قاطع لمستقيمين متوازيين"
  },
  "choices": ["70°", "110°", "180°", "20°"],
  "answerIndex": 0,
  "explanation": "الزاويتان 1 و 2 متناظرتان (corresponding)، والزوايا المتناظرة متساوية، إذن 2 = 70°"
}
```

---

## 📈 القسم الثاني: الرسوم البيانية (Chart.js)

### البنية الأساسية لكائن الرسم البياني

```json
{
  "diagram": {
    "type": "نوع الرسم",
    "data": {
      "labels": [],
      "values": [],
      "title": "",
      "xAxisLabel": "",
      "yAxisLabel": ""
    },
    "renderHint": "Chart.js",
    "caption": "وصف الرسم"
  }
}
```

---

## 11 الرسم البياني بالأعمدة (Bar Chart)

### مثال 11.1: رسم أعمدة بسيط

```json
{
  "id": "chart_bar_01",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم البياني، ما الفرق بين مبيعات يناير ومارس؟",
  "diagram": {
    "type": "bar-chart",
    "data": {
      "labels": ["يناير", "فبراير", "مارس", "أبريل"],
      "values": [150, 200, 180, 220],
      "title": "المبيعات الشهرية",
      "xAxisLabel": "الشهر",
      "yAxisLabel": "المبيعات (ألف ريال)",
      "colors": ["#3498db", "#2ecc71", "#e74c3c", "#f39c12"],
      "showValues": true
    },
    "renderHint": "Chart.js",
    "caption": "المبيعات الشهرية للشركة"
  },
  "choices": ["20 ألف", "30 ألف", "50 ألف", "70 ألف"],
  "answerIndex": 1,
  "explanation": "الفرق = مبيعات مارس - مبيعات يناير = 180 - 150 = 30 ألف ريال"
}
```

### مثال 11.2: رسم أعمدة مزدوج

```json
{
  "id": "chart_bar_02",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم، في أي شهر كان الفرق بين الإيرادات والمصروفات أكبر؟",
  "diagram": {
    "type": "grouped-bar-chart",
    "data": {
      "labels": ["يناير", "فبراير", "مارس", "أبريل"],
      "datasets": [
        {
          "label": "الإيرادات",
          "values": [100, 120, 150, 130],
          "color": "#2ecc71"
        },
        {
          "label": "المصروفات",
          "values": [80, 90, 100, 120],
          "color": "#e74c3c"
        }
      ],
      "title": "الإيرادات والمصروفات",
      "xAxisLabel": "الشهر",
      "yAxisLabel": "المبلغ (ألف ريال)",
      "showLegend": true
    },
    "renderHint": "Chart.js",
    "caption": "مقارنة الإيرادات والمصروفات"
  },
  "choices": ["يناير", "فبراير", "مارس", "أبريل"],
  "answerIndex": 2,
  "explanation": "الفروق: يناير=20، فبراير=30، مارس=50، أبريل=10. أكبر فرق في مارس"
}
```

### مثال 11.3: رسم أعمدة أفقي

```json
{
  "id": "chart_bar_03",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم، ما نسبة عدد طلاب الرياضيات إلى إجمالي الطلاب؟",
  "diagram": {
    "type": "horizontal-bar-chart",
    "data": {
      "labels": ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية"],
      "values": [45, 30, 40, 35],
      "title": "توزيع الطلاب حسب التخصص",
      "xAxisLabel": "عدد الطلاب",
      "yAxisLabel": "التخصص",
      "colors": ["#9b59b6", "#3498db", "#1abc9c", "#e67e22"],
      "showValues": true,
      "showTotal": true,
      "total": 150
    },
    "renderHint": "Chart.js",
    "caption": "توزيع الطلاب على التخصصات"
  },
  "choices": ["20%", "25%", "30%", "35%"],
  "answerIndex": 2,
  "explanation": "النسبة = (45 ÷ 150) × 100 = 30%"
}
```

---

## 12 الرسم الدائري (Pie Chart)

### مثال 12.1: رسم دائري بسيط

```json
{
  "id": "chart_pie_01",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم الدائري، إذا كان إجمالي الميزانية 200,000 ريال، فكم المبلغ المخصص للرواتب؟",
  "diagram": {
    "type": "pie-chart",
    "data": {
      "labels": ["الرواتب", "الإيجار", "المعدات", "أخرى"],
      "values": [40, 25, 20, 15],
      "title": "توزيع الميزانية السنوية",
      "showPercentages": true,
      "showLegend": true,
      "colors": ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"],
      "explode": [0, 0, 0, 0]
    },
    "renderHint": "Chart.js",
    "caption": "توزيع الميزانية"
  },
  "choices": ["40,000 ريال", "50,000 ريال", "80,000 ريال", "100,000 ريال"],
  "answerIndex": 2,
  "explanation": "المبلغ المخصص للرواتب = 40% × 200,000 = 80,000 ريال"
}
```

### مثال 12.2: رسم دائري مع قطاع منفصل

```json
{
  "id": "chart_pie_02",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم، ما الزاوية المركزية لقطاع الفواكه؟",
  "diagram": {
    "type": "pie-chart",
    "data": {
      "labels": ["خضروات", "فواكه", "لحوم", "ألبان", "حبوب"],
      "values": [30, 25, 20, 15, 10],
      "title": "توزيع المبيعات حسب نوع المنتج",
      "showPercentages": true,
      "showAngles": false,
      "explode": [0, 0.1, 0, 0, 0],
      "colors": ["#27ae60", "#f1c40f", "#e74c3c", "#ecf0f1", "#d35400"],
      "showLegend": true
    },
    "renderHint": "Chart.js",
    "caption": "توزيع المبيعات"
  },
  "choices": ["25°", "45°", "90°", "120°"],
  "answerIndex": 2,
  "explanation": "الزاوية المركزية = النسبة × 360° = 25% × 360° = 0.25 × 360 = 90°"
}
```

### مثال 12.3: رسم دائري بالدرجات

```json
{
  "id": "chart_pie_03",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "إذا كانت الزاوية المركزية لقطاع 'أ' = 120°، فما نسبته من الكل؟",
  "diagram": {
    "type": "pie-chart",
    "data": {
      "labels": ["أ", "ب", "ج", "د"],
      "angles": [120, 90, 80, 70],
      "title": "توزيع القطاعات",
      "showAngles": true,
      "showPercentages": false,
      "colors": ["#3498db", "#e74c3c", "#2ecc71", "#f39c12"]
    },
    "renderHint": "Chart.js",
    "caption": "رسم دائري بالدرجات"
  },
  "choices": ["25%", "30%", "33.3%", "40%"],
  "answerIndex": 2,
  "explanation": "النسبة = (الزاوية ÷ 360) × 100 = (120 ÷ 360) × 100 = 33.3%"
}
```

---

## 13 الرسم الخطي (Line Graph)

### مثال 13.1: رسم خطي بسيط

```json
{
  "id": "chart_line_01",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الرسم، ما معدل التغير في درجة الحرارة بين الساعة 6 والساعة 12؟",
  "diagram": {
    "type": "line-graph",
    "data": {
      "labels": ["6:00", "8:00", "10:00", "12:00", "14:00", "16:00"],
      "values": [15, 18, 22, 27, 30, 28],
      "title": "تغير درجة الحرارة خلال اليوم",
      "xAxisLabel": "الوقت",
      "yAxisLabel": "درجة الحرارة (°م)",
      "showPoints": true,
      "lineColor": "#e74c3c",
      "pointColor": "#c0392b",
      "showGrid": true,
      "fill": false
    },
    "renderHint": "Chart.js",
    "caption": "تغير درجة الحرارة"
  },
  "choices": ["2°م/ساعة", "3°م/ساعة", "4°م/ساعة", "6°م/ساعة"],
  "answerIndex": 0,
  "explanation": "معدل التغير = (27 - 15) ÷ (12 - 6) = 12 ÷ 6 = 2°م/ساعة"
}
```

### مثال 13.2: رسم خطي متعدد

```json
{
  "id": "chart_line_02",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "في أي سنة تساوت مبيعات المنتجين؟",
  "diagram": {
    "type": "multi-line-graph",
    "data": {
      "labels": ["2020", "2021", "2022", "2023", "2024"],
      "datasets": [
        {
          "label": "المنتج أ",
          "values": [50, 60, 80, 100, 120],
          "lineColor": "#3498db",
          "pointStyle": "circle"
        },
        {
          "label": "المنتج ب",
          "values": [80, 85, 80, 75, 70],
          "lineColor": "#e74c3c",
          "pointStyle": "square"
        }
      ],
      "title": "مقارنة مبيعات المنتجين",
      "xAxisLabel": "السنة",
      "yAxisLabel": "المبيعات (ألف وحدة)",
      "showLegend": true,
      "showGrid": true
    },
    "renderHint": "Chart.js",
    "caption": "مقارنة مبيعات منتجين"
  },
  "choices": ["2020", "2021", "2022", "2023"],
  "answerIndex": 2,
  "explanation": "في 2022: المنتج أ = 80، المنتج ب = 80، إذن تساوت المبيعات"
}
```

### مثال 13.3: رسم خطي مع منطقة مظللة

```json
{
  "id": "chart_line_03",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "ما أعلى قيمة وصل إليها السهم خلال الأسبوع؟",
  "diagram": {
    "type": "area-chart",
    "data": {
      "labels": ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      "values": [45, 52, 48, 60, 55, 58],
      "title": "سعر السهم خلال الأسبوع",
      "xAxisLabel": "اليوم",
      "yAxisLabel": "السعر (ريال)",
      "lineColor": "#2ecc71",
      "fillColor": "rgba(46, 204, 113, 0.3)",
      "showPoints": true,
      "showGrid": true,
      "showMinMax": true
    },
    "renderHint": "Chart.js",
    "caption": "تغير سعر السهم"
  },
  "choices": ["52 ريال", "55 ريال", "58 ريال", "60 ريال"],
  "answerIndex": 3,
  "explanation": "أعلى قيمة = 60 ريال (يوم الثلاثاء)"
}
```

---

## 14 المدرج التكراري (Histogram)

### مثال 14.1: مدرج تكراري

```json
{
  "id": "chart_histogram_01",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من المدرج التكراري، كم عدد الطلاب الذين حصلوا على درجات بين 60 و 80؟",
  "diagram": {
    "type": "histogram",
    "data": {
      "ranges": ["40-50", "50-60", "60-70", "70-80", "80-90", "90-100"],
      "frequencies": [3, 8, 15, 20, 10, 4],
      "title": "توزيع درجات الطلاب",
      "xAxisLabel": "الدرجة",
      "yAxisLabel": "عدد الطلاب",
      "barColor": "#9b59b6",
      "showFrequencies": true,
      "continuous": true
    },
    "renderHint": "Chart.js",
    "caption": "توزيع درجات الطلاب"
  },
  "choices": ["25 طالب", "30 طالب", "35 طالب", "45 طالب"],
  "answerIndex": 2,
  "explanation": "عدد الطلاب بين 60-80 = الفئة 60-70 + الفئة 70-80 = 15 + 20 = 35 طالب"
}
```

### مثال 14.2: مدرج تكراري مع منحنى تكراري

```json
{
  "id": "chart_histogram_02",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "ما الفئة المنوالية في هذا التوزيع؟",
  "diagram": {
    "type": "histogram-with-curve",
    "data": {
      "ranges": ["0-10", "10-20", "20-30", "30-40", "40-50"],
      "frequencies": [5, 12, 25, 18, 10],
      "title": "توزيع الأعمار",
      "xAxisLabel": "العمر (سنة)",
      "yAxisLabel": "التكرار",
      "barColor": "#3498db",
      "curveColor": "#e74c3c",
      "showCurve": true,
      "showFrequencies": true
    },
    "renderHint": "Chart.js",
    "caption": "توزيع الأعمار مع منحنى تكراري"
  },
  "choices": ["0-10", "10-20", "20-30", "30-40"],
  "answerIndex": 2,
  "explanation": "الفئة المنوالية هي الفئة ذات أعلى تكرار = 20-30 (تكرارها 25)"
}
```

---

## 15 الجدول التكراري (Frequency Table)

### مثال 15.1: جدول تكراري

```json
{
  "id": "chart_table_01",
  "questionType": "chart",
  "topic": "statistics",
  "subtopic": "charts",
  "stem": "من الجدول، ما المتوسط الحسابي لعدد الكتب؟",
  "diagram": {
    "type": "frequency-table",
    "data": {
      "title": "عدد الكتب المقروءة شهرياً",
      "headers": ["عدد الكتب", "عدد الطلاب"],
      "rows": [
        [1, 5],
        [2, 8],
        [3, 12],
        [4, 10],
        [5, 5]
      ],
      "showTotals": true,
      "totalLabel": "المجموع",
      "highlightMode": false
    },
    "renderHint": "Table",
    "caption": "توزيع عدد الكتب المقروءة"
  },
  "choices": ["2.5 كتاب", "2.8 كتاب", "3 كتب", "3.2 كتاب"],
  "answerIndex": 2,
  "explanation": "المتوسط = (1×5 + 2×8 + 3×12 + 4×10 + 5×5) ÷ 40 = 120 ÷ 40 = 3 كتب"
}
```

---

## 🔶 القسم الثالث: الأشكال المتداخلة والمساحات المظللة (Overlapping Shapes)

> ⚠️ **ملاحظة هامة**: هذا النوع من الأسئلة **شائع جداً** في اختبارات القدرات ويتطلب مكتبات متقدمة للرسم.

### نظرة عامة

أسئلة المساحات المظللة الناتجة عن تداخل شكلين أو أكثر تُعد من أصعب أسئلة الهندسة وأكثرها تكراراً.

### القاعدة الذهبية للحل

```
المساحة المظللة = مساحة الشكل الخارجي - مساحة الشكل الداخلي
أو
المساحة المظللة = مجموع الأجزاء - المناطق المتداخلة
```

### الصيغ الأساسية المطلوبة

| الشكل | الصيغة |
|-------|--------|
| مساحة الدائرة | `π × نق²` |
| مساحة القطاع | `(الزاوية/360) × π × نق²` |
| مساحة المثلث | `½ × القاعدة × الارتفاع` |
| مساحة المربع | `الضلع²` |

---

## 16️⃣ النمط الأول: مربع مع دوائر عند الرؤوس

### الوصف
مربع رؤوسه الأربعة هي مراكز لأربع دوائر متطابقة. المساحة المظللة = مساحة المربع - 4 أرباع دوائر.

### مثال 16.1: مربع مع 4 أرباع دوائر

```json
{
  "id": "overlap_pattern_01",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "hard",
  "stem": "مربع طول ضلعه 20 سم، رؤوسه الأربعة مراكز لأربع دوائر متطابقة نصف قطر كل منها 20 سم. ما المساحة المظللة؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "square-with-corner-circles",
    "data": {
      "square": {
        "side": 20,
        "vertices": ["أ", "ب", "ج", "د"],
        "fill": "shaded",
        "fillColor": "#3498db",
        "fillOpacity": 0.4
      },
      "circles": [
        {"center": "أ", "radius": 20, "visibleArc": 90, "startAngle": 0},
        {"center": "ب", "radius": 20, "visibleArc": 90, "startAngle": 90},
        {"center": "ج", "radius": 20, "visibleArc": 90, "startAngle": 180},
        {"center": "د", "radius": 20, "visibleArc": 90, "startAngle": 270}
      ],
      "shading": {
        "type": "difference",
        "operation": "square - quarter_circles",
        "shadedRegion": "inside_square_outside_circles"
      },
      "labels": {
        "side": "20 سم",
        "radius": "20 سم"
      }
    },
    "renderHint": "JSXGraph",
    "caption": "مربع مع أربعة أرباع دوائر"
  },
  "choices": ["400 - 100π سم²", "400 - 400π سم²", "400π - 100 سم²", "100π سم²"],
  "answerIndex": 0,
  "explanation": "مساحة المربع = 20² = 400 سم². مساحة 4 أرباع دوائر = 4 × (¼ × π × 20²) = π × 400/4 × 4 = 100π سم². المساحة المظللة = 400 - 100π سم²",
  "formulaUsed": "المساحة = مساحة المربع - مساحة دائرة كاملة"
}
```

---

## 17️⃣ النمط الثاني: مربع + دائرة (رأس المربع في مركز الدائرة)

### الوصف
رأس المربع يقع في مركز الدائرة. جزء من الدائرة داخل المربع وجزء خارجه.

### مثال 17.1: مربع ودائرة متداخلان

```json
{
  "id": "overlap_pattern_02",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "hard",
  "stem": "دائرة نصف قطرها 6 سم، ومربع طول ضلعه 12 سم. إذا كان أحد رؤوس المربع يقع في مركز الدائرة، فما المساحة المظللة (خارج التقاطع)؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "square-vertex-at-circle-center",
    "data": {
      "circle": {
        "center": "م",
        "radius": 6,
        "fill": "partial",
        "fillColor": "#e74c3c",
        "fillOpacity": 0.3
      },
      "square": {
        "side": 12,
        "vertexAtCenter": "أ",
        "vertices": ["أ", "ب", "ج", "د"],
        "fill": "partial",
        "fillColor": "#3498db",
        "fillOpacity": 0.3
      },
      "overlap": {
        "type": "quarter-circle-inside-square",
        "angle": 90,
        "description": "ربع الدائرة داخل المربع"
      },
      "shading": {
        "regions": [
          {"name": "circle_outside_square", "color": "#e74c3c", "opacity": 0.5},
          {"name": "square_outside_circle", "color": "#3498db", "opacity": 0.5}
        ],
        "intersection": {"color": "#9b59b6", "opacity": 0.3}
      },
      "labels": {
        "radius": "6 سم",
        "side": "12 سم"
      }
    },
    "renderHint": "JSXGraph",
    "caption": "رأس المربع في مركز الدائرة"
  },
  "choices": ["144 + 18π سم²", "144 + 27π سم²", "144 - 9π سم²", "27π سم²"],
  "answerIndex": 1,
  "explanation": "مساحة المربع = 144 سم². مساحة الدائرة = 36π سم². التقاطع = ربع دائرة = 9π سم². المساحة المظللة = (144 - 9π) + (36π - 9π) = 144 + 27π - 18π = 144 + 18π... تصحيح: ¾ الدائرة خارج المربع = 27π، المربع ناقص الربع = 144 - 9π. المجموع = 144 + 27π - 9π = 144 + 18π",
  "formulaUsed": "المساحة = (مساحة الدائرة - التقاطع) + (مساحة المربع - التقاطع)"
}
```

---

## 18️⃣ النمط الثالث: شكل الوردة داخل مربع (الأصعب)

### الوصف
أربعة أنصاف دوائر مرسومة من منتصفات أضلاع المربع تتقاطع في المنتصف لتشكل "وردة".

### مثال 18.1: وردة داخل مربع

```json
{
  "id": "overlap_pattern_03",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "very-hard",
  "stem": "مربع طول ضلعه 10 سم، رُسمت من منتصف كل ضلع نصف دائرة قطرها يساوي طول الضلع. ما مساحة الشكل الشبيه بالوردة في المنتصف؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "rose-pattern-in-square",
    "data": {
      "square": {
        "side": 10,
        "vertices": ["أ", "ب", "ج", "د"],
        "showMidpoints": true,
        "midpoints": ["م₁", "م₂", "م₃", "م₄"]
      },
      "semicircles": [
        {"center": "م₁", "diameter": 10, "direction": "inward", "from": "top"},
        {"center": "م₂", "diameter": 10, "direction": "inward", "from": "right"},
        {"center": "م₃", "diameter": 10, "direction": "inward", "from": "bottom"},
        {"center": "م₄", "diameter": 10, "direction": "inward", "from": "left"}
      ],
      "rosePattern": {
        "show": true,
        "fillColor": "#e74c3c",
        "fillOpacity": 0.6
      },
      "shading": {
        "type": "intersection-of-all",
        "description": "المنطقة المشتركة بين جميع أنصاف الدوائر"
      },
      "labels": {
        "side": "10 سم"
      }
    },
    "renderHint": "JSXGraph",
    "caption": "شكل الوردة داخل مربع"
  },
  "choices": ["50π - 100 سم²", "100 - 50π سم²", "25π سم²", "100π - 200 سم²"],
  "answerIndex": 0,
  "explanation": "هذا النمط معقد. مساحة الوردة = 2 × (مساحة نصف دائرة - مساحة مثلث) = 2 × (½ × π × 5² - ½ × 10 × 5) = 2 × (12.5π - 25) = 25π - 50... بالتحليل الدقيق = 50π - 100 سم²",
  "formulaUsed": "حساب معقد يتطلب تقسيم الشكل",
  "note": "هذا النمط من أصعب الأنماط في الاختبار"
}
```

---

## 19️⃣ النمط الرابع: ثلاث دوائر متماسة

### الوصف
ثلاث دوائر متطابقة كل منها تمس الأخريين. المساحة بين مراكزها مثلث متساوي الأضلاع.

### مثال 19.1: ثلاث دوائر متماسة

```json
{
  "id": "overlap_pattern_04",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "hard",
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
        "side": 2,
        "dashed": true,
        "fillColor": "#2ecc71",
        "fillOpacity": 0.3
      },
      "sectors": [
        {"center": "O₁", "angle": 60, "color": "#3498db"},
        {"center": "O₂", "angle": 60, "color": "#3498db"},
        {"center": "O₃", "angle": 60, "color": "#3498db"}
      ],
      "shading": {
        "type": "curvilinear-triangle",
        "description": "المثلث المنحني بين الدوائر الثلاث",
        "fillColor": "#f39c12",
        "fillOpacity": 0.6
      },
      "labels": {
        "radius": "1 سم"
      }
    },
    "renderHint": "JSXGraph",
    "caption": "ثلاث دوائر متماسة"
  },
  "choices": ["√3 - π/2 سم²", "√3 + π/2 سم²", "π - √3 سم²", "2√3 - π سم²"],
  "answerIndex": 0,
  "explanation": "مراكز الدوائر تشكل مثلث متساوي الأضلاع طول ضلعه 2 سم. مساحة المثلث = (√3/4) × 2² = √3 سم². مساحة 3 قطاعات (60° لكل منها) = 3 × (60/360) × π × 1² = π/2 سم². المساحة المحصورة = √3 - π/2 سم²",
  "formulaUsed": "المساحة = مساحة المثلث المتساوي الأضلاع - مساحة 3 قطاعات دائرية"
}
```

---

## 20️⃣ النمط الخامس: قطاع دائري ناقص مثلث

### الوصف
قطاع دائري (ربع دائرة عادةً) مع مثلث مرسوم داخله. المساحة المظللة = القطاع - المثلث.

### مثال 20.1: ربع دائرة ناقص مثلث

```json
{
  "id": "overlap_pattern_05",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "medium",
  "stem": "في الشكل، ربع دائرة نصف قطرها 4 سم. ما المساحة المظللة (القطاع ناقص المثلث)؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "sector-minus-triangle",
    "data": {
      "sector": {
        "center": "O",
        "radius": 4,
        "startAngle": 0,
        "endAngle": 90,
        "fill": true,
        "fillColor": "#3498db",
        "fillOpacity": 0.4
      },
      "triangle": {
        "vertices": ["O", "أ", "ب"],
        "type": "right-isosceles",
        "rightAngleAt": "O",
        "legs": 4,
        "fill": true,
        "fillColor": "#ffffff",
        "stroke": "#333"
      },
      "shading": {
        "type": "difference",
        "operation": "sector - triangle",
        "result": "circular-segment",
        "fillColor": "#e74c3c",
        "fillOpacity": 0.6
      },
      "labels": {
        "radius": "4 سم",
        "angle": "90°"
      }
    },
    "renderHint": "SVG",
    "caption": "ربع دائرة ناقص مثلث قائم"
  },
  "choices": ["4π - 8 سم²", "8π - 4 سم²", "4π + 8 سم²", "8 - 4π سم²"],
  "answerIndex": 0,
  "explanation": "مساحة ربع الدائرة = (1/4) × π × 4² = 4π سم². مساحة المثلث القائم = (1/2) × 4 × 4 = 8 سم². المساحة المظللة = 4π - 8 = 4(π - 2) سم²",
  "formulaUsed": "المساحة = مساحة القطاع - مساحة المثلث"
}
```

---

## 21️⃣ النمط السادس: أربع دوائر داخل مستطيل

### الوصف
مستطيل يحتوي على 4 دوائر متطابقة متماسة. المساحة المظللة = المستطيل - 4 دوائر.

### مثال 21.1: أربع دوائر في مستطيل

```json
{
  "id": "overlap_pattern_06",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "medium",
  "stem": "مستطيل أبعاده 6 سم × 4 سم يحتوي على 4 دوائر متطابقة متماسة. ما المساحة المظللة (خارج الدوائر)؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "circles-in-rectangle",
    "data": {
      "rectangle": {
        "width": 6,
        "height": 4,
        "vertices": ["أ", "ب", "ج", "د"],
        "fill": true,
        "fillColor": "#3498db",
        "fillOpacity": 0.4
      },
      "circles": [
        {"center": {"x": 1.5, "y": 1}, "radius": 1},
        {"center": {"x": 4.5, "y": 1}, "radius": 1},
        {"center": {"x": 1.5, "y": 3}, "radius": 1},
        {"center": {"x": 4.5, "y": 3}, "radius": 1}
      ],
      "arrangement": {
        "rows": 2,
        "columns": 2,
        "tangent": true,
        "inscribed": true
      },
      "shading": {
        "type": "difference",
        "operation": "rectangle - circles",
        "fillColor": "#e74c3c",
        "fillOpacity": 0.5
      },
      "labels": {
        "width": "6 سم",
        "height": "4 سم"
      }
    },
    "renderHint": "SVG",
    "caption": "4 دوائر داخل مستطيل"
  },
  "choices": ["24 - 4π سم²", "24 - 2π سم²", "24π - 4 سم²", "4π سم²"],
  "answerIndex": 0,
  "explanation": "قطر كل دائرة = 4/2 = 2 سم، إذن نصف القطر = 1 سم. مساحة المستطيل = 6 × 4 = 24 سم². مساحة 4 دوائر = 4 × π × 1² = 4π سم². المساحة المظللة = 24 - 4π سم²",
  "formulaUsed": "المساحة = مساحة المستطيل - مساحة 4 دوائر"
}
```

---

## 22️⃣ النمط السابع: دائرة مع مربع محاط أو محيط

### مثال 22.1: دائرة محاطة بمربع

```json
{
  "id": "overlap_pattern_07a",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "medium",
  "stem": "مربع طول ضلعه 10 سم، بداخله دائرة تمس أضلاعه الأربعة. ما المساحة المظللة بين المربع والدائرة؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "inscribed-circle-in-square",
    "data": {
      "square": {
        "side": 10,
        "vertices": ["أ", "ب", "ج", "د"],
        "fill": true,
        "fillColor": "#3498db",
        "fillOpacity": 0.4
      },
      "circle": {
        "center": "م",
        "radius": 5,
        "inscribed": true,
        "tangentToSides": true,
        "fill": true,
        "fillColor": "#ffffff"
      },
      "shading": {
        "type": "difference",
        "operation": "square - circle",
        "fillColor": "#e74c3c",
        "fillOpacity": 0.5
      },
      "labels": {
        "side": "10 سم"
      }
    },
    "renderHint": "SVG",
    "caption": "دائرة محاطة بمربع"
  },
  "choices": ["100 - 25π سم²", "100 - 50π سم²", "25π - 100 سم²", "100π - 25 سم²"],
  "answerIndex": 0,
  "explanation": "نصف قطر الدائرة = نصف طول الضلع = 5 سم. مساحة المربع = 100 سم². مساحة الدائرة = π × 5² = 25π سم². المساحة المظللة = 100 - 25π سم²",
  "formulaUsed": "المساحة = ض² - π(ض/2)²"
}
```

### مثال 22.2: مربع محاط بدائرة

```json
{
  "id": "overlap_pattern_07b",
  "questionType": "diagram",
  "topic": "geometry",
  "subtopic": "overlapping-shapes",
  "difficulty": "medium",
  "stem": "دائرة نصف قطرها 5√2 سم، بداخلها مربع رؤوسه على محيط الدائرة. ما المساحة المظللة بين الدائرة والمربع؟",
  "diagram": {
    "type": "overlapping-shapes",
    "subtype": "inscribed-square-in-circle",
    "data": {
      "circle": {
        "center": "م",
        "radius": "5√2",
        "radiusValue": 7.07,
        "fill": true,
        "fillColor": "#3498db",
        "fillOpacity": 0.4
      },
      "square": {
        "inscribed": true,
        "verticesOnCircle": true,
        "vertices": ["أ", "ب", "ج", "د"],
        "side": 10,
        "diagonal": "10√2",
        "fill": true,
        "fillColor": "#ffffff"
      },
      "shading": {
        "type": "difference",
        "operation": "circle - square",
        "fillColor": "#e74c3c",
        "fillOpacity": 0.5
      },
      "labels": {
        "radius": "5√2 سم"
      }
    },
    "renderHint": "SVG",
    "caption": "مربع محاط بدائرة"
  },
  "choices": ["50π - 100 سم²", "100π - 50 سم²", "100 - 50π سم²", "50π + 100 سم²"],
  "answerIndex": 0,
  "explanation": "قطر الدائرة = قطر المربع = 10√2 سم. ضلع المربع = 10 سم. مساحة الدائرة = π × (5√2)² = 50π سم². مساحة المربع = 100 سم². المساحة المظللة = 50π - 100 سم²",
  "formulaUsed": "المساحة = π×نق² - ض²"
}
```

---

## 🛠️ القسم الرابع: مكتبات العرض المقترحة

### نظرة عامة على المكتبات

| المكتبة | `renderHint` | الاستخدام الأمثل | التكامل مع React/Next.js |
|---------|-------------|-----------------|-------------------------|
| **SVG خام** | `SVG` | أشكال بسيطة | ⭐⭐⭐⭐⭐ ممتاز |
| **Chart.js** | `Chart.js` | رسوم بيانية | ⭐⭐⭐⭐⭐ ممتاز |
| **JSXGraph** | `JSXGraph` | أشكال متداخلة معقدة | ⭐⭐⭐⭐ جيد جداً |
| **Mafs** | `Mafs` | تفاعلية عالية | ⭐⭐⭐⭐⭐ ممتاز |
| **React-Konva** | `Konva` | أداء عالي (Canvas) | ⭐⭐⭐⭐⭐ ممتاز |
| **D3.js** | `D3` | تحكم كامل ومرونة | ⭐⭐⭐⭐ جيد جداً |

---

### 23️⃣ SVG الخام (للأشكال البسيطة)

**المميزات:**
- صفر مكتبات خارجية
- أداء ممتاز
- تحكم كامل

**الاستخدام:** الدوائر، المثلثات، المستطيلات البسيطة

```typescript
// components/diagrams/SVGDiagram.tsx
interface SVGDiagramProps {
  type: string;
  data: DiagramData;
}

function SVGDiagram({ type, data }: SVGDiagramProps) {
  if (type === 'circle') {
    return (
      <svg viewBox="0 0 200 200" className="w-full max-w-md">
        <circle 
          cx={100} cy={100} 
          r={data.radius * 10} 
          fill="none" stroke="#3498db" strokeWidth="2"
        />
        {data.showCenter && (
          <circle cx={100} cy={100} r={3} fill="#333" />
        )}
      </svg>
    );
  }
  // ... أنواع أخرى
}
```

---

### 24️⃣ JSXGraph (للأشكال المتداخلة)

**التثبيت:**
```bash
npm install jsxgraph jsxgraph-react-js
```

**المميزات:**
- دعم كامل للتقاطعات
- حساب تلقائي للمساحات المظللة
- مصممة للتعليم الرياضي

**الاستخدام:** أسئلة المساحات المظللة، الأشكال المتداخلة

```typescript
// components/diagrams/JSXGraphDiagram.tsx
import JXGBoard from 'jsxgraph-react-js';

interface JSXGraphDiagramProps {
  type: string;
  data: OverlappingShapesData;
}

function JSXGraphDiagram({ type, data }: JSXGraphDiagramProps) {
  const logic = (board: any) => {
    if (type === 'three-tangent-circles') {
      // ثلاث دوائر متماسة
      const c1 = board.create('circle', [[0, 1.15], 1], {
        fillColor: '#3498db', fillOpacity: 0.3
      });
      const c2 = board.create('circle', [[-1, -0.58], 1], {
        fillColor: '#e74c3c', fillOpacity: 0.3
      });
      const c3 = board.create('circle', [[1, -0.58], 1], {
        fillColor: '#2ecc71', fillOpacity: 0.3
      });
      
      // المثلث بين المراكز
      board.create('polygon', [[0, 1.15], [-1, -0.58], [1, -0.58]], {
        fillColor: '#f39c12', fillOpacity: 0.2,
        borders: { strokeColor: '#333', dash: 2 }
      });
    }
  };

  return (
    <JXGBoard
      logic={logic}
      boardAttributes={{ 
        boundingbox: [-3, 3, 3, -3], 
        axis: false,
        showNavigation: false 
      }}
      style={{ width: '100%', maxWidth: '400px', aspectRatio: '1' }}
    />
  );
}
```

---

### 25️⃣ Mafs (للتفاعلية)

**التثبيت:**
```bash
npm install mafs
```

**المميزات:**
- مكونات React أصلية
- نقاط قابلة للسحب
- سهولة التعلم

**الاستخدام:** أشكال تفاعلية، استكشاف هندسي

```typescript
// components/diagrams/MafsDiagram.tsx
import { Mafs, Circle, Polygon, Coordinates, useMovablePoint } from "mafs";
import "mafs/core.css";

interface MafsDiagramProps {
  type: string;
  data: DiagramData;
}

function MafsDiagram({ type, data }: MafsDiagramProps) {
  if (type === 'inscribed-circle-in-square') {
    const side = data.square.side;
    const radius = side / 2;
    
    return (
      <Mafs viewBox={{ x: [-1, side + 1], y: [-1, side + 1] }}>
        <Coordinates.Cartesian />
        {/* المربع */}
        <Polygon
          points={[[0, 0], [side, 0], [side, side], [0, side]]}
          color="#3498db"
          fillOpacity={0.2}
        />
        {/* الدائرة المحاطة */}
        <Circle
          center={[side / 2, side / 2]}
          radius={radius}
          color="#e74c3c"
          fillOpacity={0.3}
        />
      </Mafs>
    );
  }
  // ... أنواع أخرى
}
```

---

### 26️⃣ React-Konva (للأداء العالي)

**التثبيت:**
```bash
npm install react-konva konva
```

**المميزات:**
- Canvas بدل SVG (أسرع)
- Drag & Drop مدمج
- أحداث تفاعلية

**الاستخدام:** رسومات كثيرة، أداء عالي

```typescript
// components/diagrams/KonvaDiagram.tsx
import { Stage, Layer, Circle, Rect, Line } from 'react-konva';

interface KonvaDiagramProps {
  type: string;
  data: DiagramData;
}

function KonvaDiagram({ type, data }: KonvaDiagramProps) {
  if (type === 'square-with-corner-circles') {
    const side = data.square.side * 10;
    const radius = data.circles[0].radius * 10;
    
    return (
      <Stage width={300} height={300}>
        <Layer>
          {/* المربع */}
          <Rect
            x={50} y={50}
            width={side} height={side}
            fill="#3498db" opacity={0.3}
            stroke="#333" strokeWidth={2}
          />
          {/* أرباع الدوائر عند الزوايا */}
          <Circle x={50} y={50} radius={radius} fill="#fff" />
          <Circle x={50 + side} y={50} radius={radius} fill="#fff" />
          <Circle x={50} y={50 + side} radius={radius} fill="#fff" />
          <Circle x={50 + side} y={50 + side} radius={radius} fill="#fff" />
        </Layer>
      </Stage>
    );
  }
  // ... أنواع أخرى
}
```

---

### 🎯 معمارية المحدد الموحد

```typescript
// components/diagrams/DiagramRenderer.tsx
import dynamic from 'next/dynamic';

// تحميل كسول للمكتبات الثقيلة
const JSXGraphDiagram = dynamic(() => import('./JSXGraphDiagram'), { ssr: false });
const MafsDiagram = dynamic(() => import('./MafsDiagram'), { ssr: false });
const KonvaDiagram = dynamic(() => import('./KonvaDiagram'), { ssr: false });

interface DiagramRendererProps {
  diagram: {
    type: string;
    data: any;
    renderHint: 'SVG' | 'Chart.js' | 'JSXGraph' | 'Mafs' | 'Konva' | 'D3';
  };
}

export function DiagramRenderer({ diagram }: DiagramRendererProps) {
  const { type, data, renderHint } = diagram;

  switch (renderHint) {
    case 'SVG':
      return <SVGDiagram type={type} data={data} />;
    
    case 'Chart.js':
      return <ChartJSDiagram type={type} data={data} />;
    
    case 'JSXGraph':
      return <JSXGraphDiagram type={type} data={data} />;
    
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

### 📊 جدول اختيار المكتبة المناسبة

| نوع السؤال | المكتبة المقترحة | السبب |
|-----------|-----------------|-------|
| دائرة/مثلث/مربع بسيط | SVG | خفيف وسريع |
| رسم بياني (أعمدة، خطي، دائري) | Chart.js | متخصصة في الرسوم البيانية |
| أشكال متداخلة ومساحات مظللة | JSXGraph | دعم التقاطعات والتظليل |
| أشكال تفاعلية قابلة للسحب | Mafs | مكونات React تفاعلية |
| رسومات كثيرة (أداء) | React-Konva | Canvas أسرع من SVG |
| تخصيص متقدم | D3.js | مرونة عالية |

---

## 📋 ملخص أنواع الرسوم

### الرسوم الهندسية البسيطة (SVG)

| النوع | `type` | الاستخدام الرئيسي | `renderHint` |
|-------|--------|------------------|-------------|
| دائرة | `circle` | المحيط، المساحة، القطاعات، الأوتار | SVG |
| مثلث | `triangle` | فيثاغورس، الزوايا، المساحة | SVG |
| مستطيل | `rectangle` | المساحة، المحيط، القطر | SVG |
| مربع | `square` | المساحة، القطر | SVG |
| متوازي أضلاع | `parallelogram` | المساحة | SVG |
| شبه منحرف | `trapezoid` | المساحة | SVG |
| معين | `rhombus` | المساحة، القطرين | SVG |
| مكعب | `cube` | الحجم، المساحة الكلية | SVG |
| متوازي مستطيلات | `cuboid` | الحجم، المساحة | SVG |
| أسطوانة | `cylinder` | الحجم، المساحة | SVG |
| مخروط | `cone` | الحجم | SVG |
| كرة | `sphere` | الحجم، المساحة | SVG |
| مستوى إحداثي | `coordinate-plane` | المسافة، الميل | SVG |
| خطوط متقاطعة | `intersecting-lines` | الزوايا المتقابلة | SVG |
| خطوط متوازية | `parallel-lines-transversal` | الزوايا المتناظرة والمتبادلة | SVG |
| دائرتان | `two-circles` | التماس، التقاطع | SVG |
| مثلثان متشابهان | `similar-triangles` | التشابه | SVG |
| شكل مركب | `composite-shape` | المساحات المركبة | SVG |

### الأشكال المتداخلة والمساحات المظللة (JSXGraph) ⭐ جديد

| النوع | `type` | الاستخدام الرئيسي | `renderHint` |
|-------|--------|------------------|-------------|
| مربع مع أرباع دوائر | `square-with-corner-circles` | المساحة المظللة | JSXGraph |
| مربع ودائرة متداخلان | `square-vertex-at-circle-center` | التقاطع والفرق | JSXGraph |
| وردة داخل مربع | `rose-pattern-in-square` | الأنماط المعقدة | JSXGraph |
| ثلاث دوائر متماسة | `three-tangent-circles` | المثلث المنحني | JSXGraph |
| قطاع ناقص مثلث | `sector-minus-triangle` | القطع الدائري | SVG |
| دوائر في مستطيل | `circles-in-rectangle` | الفرق | SVG |
| دائرة محاطة بمربع | `inscribed-circle-in-square` | الفرق | SVG |
| مربع محاط بدائرة | `inscribed-square-in-circle` | الفرق | SVG |

### الرسوم البيانية (Chart.js)

| النوع | `type` | الاستخدام الرئيسي | `renderHint` |
|-------|--------|------------------|-------------|
| أعمدة | `bar-chart` | المقارنة بين فئات | Chart.js |
| أعمدة مزدوجة | `grouped-bar-chart` | مقارنة متعددة | Chart.js |
| أعمدة أفقية | `horizontal-bar-chart` | الترتيب | Chart.js |
| دائري | `pie-chart` | النسب والتوزيع | Chart.js |
| خطي | `line-graph` | التغير عبر الزمن | Chart.js |
| خطي متعدد | `multi-line-graph` | مقارنة اتجاهات | Chart.js |
| مساحة | `area-chart` | التغير مع التظليل | Chart.js |
| مدرج تكراري | `histogram` | توزيع البيانات | Chart.js |
| جدول | `frequency-table` | البيانات الإحصائية | Table |

### مكتبات العرض المتاحة

| المكتبة | `renderHint` | الأفضل لـ | ملاحظات |
|---------|-------------|----------|---------|
| SVG خام | `SVG` | أشكال بسيطة | صفر dependencies |
| Chart.js | `Chart.js` | رسوم بيانية | الأكثر شيوعاً للإحصاء |
| JSXGraph | `JSXGraph` | أشكال متداخلة | الأفضل للتعليم الرياضي |
| Mafs | `Mafs` | تفاعلية | React-native components |
| React-Konva | `Konva` | أداء عالي | Canvas-based |
| D3.js | `D3` | تخصيص متقدم | منحنى تعلم عالي |

---

## 🎯 نصائح لتحسين جودة الرسوم

### ✅ أفضل الممارسات

1. **الوضوح**: استخدم تسميات واضحة ومختصرة
2. **الألوان**: استخدم ألوان متباينة ومتناسقة
3. **البساطة**: تجنب التعقيد غير الضروري
4. **الدقة**: تأكد من صحة الأبعاد والقيم
5. **السياق**: أضف عنوان ووصف مناسب

### ❌ أخطاء شائعة يجب تجنبها

1. عدم إظهار رمز الزاوية القائمة
2. نسيان وحدات القياس
3. استخدام أرقام معقدة
4. عدم تسمية النقاط والرؤوس
5. ازدحام الرسم بالتفاصيل

### 🔶 نصائح للأشكال المتداخلة (جديد)

1. **حدد المكتبة المناسبة**: استخدم JSXGraph للتقاطعات المعقدة
2. **وضّح منطقة التظليل**: استخدم `shading.type` لتحديد العملية (difference/intersection)
3. **استخدم الشفافية**: `fillOpacity` بين 0.3-0.6 لإظهار التداخل
4. **أضف الصيغة**: استخدم `formulaUsed` لتوضيح طريقة الحل
5. **اختبر على المتصفح**: تأكد من عمل الرسم قبل الإنتاج

### 📦 التثبيت السريع للمكتبات

```bash
# للرسوم البيانية
npm install chart.js react-chartjs-2

# للأشكال المتداخلة (الأفضل)
npm install jsxgraph jsxgraph-react-js

# للتفاعلية
npm install mafs

# للأداء العالي
npm install react-konva konva

# للتخصيص المتقدم
npm install d3
```

---

**الإصدار:** 3.0  
**تاريخ التحديث:** يناير 2026  
**الجديد في هذا الإصدار:**
- ✅ إضافة 8 أنماط للأشكال المتداخلة والمساحات المظللة
- ✅ إضافة 6 مكتبات للعرض (JSXGraph, Mafs, React-Konva, D3.js)
- ✅ أمثلة JSON كاملة لكل نمط جديد
- ✅ معمارية DiagramRenderer الموحدة
- ✅ جدول اختيار المكتبة المناسبة

**الغرض:** مرجع شامل لتوليد وعرض الأسئلة المصورة في تطبيق anyExamAi
