---
name: qudurat-diagrams
description: توليد بيانات الرسومات الهندسية والبيانية لأسئلة اختبار القدرات. يُستخدم عند الحاجة لإنشاء: (1) رسوم هندسية بسيطة (SVG) - دوائر، مثلثات، مربعات، (2) أشكال متداخلة ومساحات مظللة (JSXGraph) - 8 أنماط شائعة، (3) رسوم بيانية (Chart.js) - أعمدة، خطي، دائري. يحدد المكتبة المناسبة عبر renderHint ويُنشئ هيكل JSON للعرض.
---

# Qudurat Diagrams Generator

## Quick Reference

### اختيار المكتبة (renderHint)
| الحالة | المكتبة | renderHint |
|--------|---------|------------|
| دائرة، مثلث، مربع | SVG | `SVG` |
| رسم بياني إحصائي | Chart.js | `Chart.js` |
| أشكال متداخلة | JSXGraph | `JSXGraph` |
| تفاعلي (سحب) | Mafs | `Mafs` |

### أنواع الأسئلة
| questionType | الاستخدام |
|--------------|-----------|
| `diagram` | رسم هندسي بسيط |
| `chart` | رسم بياني |
| `overlapping-diagram` | أشكال متداخلة |

## Diagram Structure

```json
{
  "diagram": {
    "type": "نوع الشكل",
    "subtype": "النوع الفرعي (للمتداخلة)",
    "data": { },
    "renderHint": "SVG | Chart.js | JSXGraph",
    "caption": "وصف مختصر"
  }
}
```

## Simple Shapes (SVG)

### الأنواع المدعومة
`circle`, `triangle`, `rectangle`, `square`, `parallelogram`, `trapezoid`, `rhombus`

### مثال - مثلث
```json
{
  "type": "triangle",
  "data": {
    "vertices": ["أ", "ب", "ج"],
    "angles": [
      {"at": "أ", "value": 60, "label": "60°"},
      {"at": "ب", "value": 90, "label": "90°", "showRightAngle": true},
      {"at": "ج", "value": 30, "label": "30°"}
    ],
    "sides": [
      {"from": "أ", "to": "ب", "length": 6, "label": "6 سم"}
    ]
  },
  "renderHint": "SVG"
}
```

### مثال - دائرة
```json
{
  "type": "circle",
  "data": {
    "radius": 5,
    "center": "م",
    "showRadius": true,
    "sector": {
      "startAngle": 0,
      "endAngle": 90,
      "shaded": true
    }
  },
  "renderHint": "SVG"
}
```

## Charts (Chart.js)

### الأنواع المدعومة
`bar-chart`, `line-graph`, `pie-chart`, `histogram`

### مثال - أعمدة
```json
{
  "type": "bar-chart",
  "data": {
    "labels": ["أ", "ب", "ج", "د"],
    "values": [25, 40, 15, 30],
    "title": "المبيعات",
    "xAxisLabel": "المنتج",
    "yAxisLabel": "القيمة"
  },
  "renderHint": "Chart.js"
}
```

## Overlapping Shapes (JSXGraph)

**هذا القسم مهم جداً - الأشكال المتداخلة شائعة في الاختبار**

### الأنماط الثمانية

للتفاصيل الكاملة: **[references/overlapping-shapes.md](references/overlapping-shapes.md)**

| النمط | subtype | الصيغة |
|-------|---------|--------|
| مربع + أرباع دوائر | `square-with-corner-circles` | ض² - πنق² |
| رأس مربع في مركز دائرة | `square-vertex-at-circle-center` | معقد |
| وردة في مربع | `rose-pattern-in-square` | صعب جداً |
| 3 دوائر متماسة | `three-tangent-circles` | √3 - π/2 |
| قطاع - مثلث | `sector-minus-triangle` | قطاع - مثلث |
| دوائر في مستطيل | `circles-in-rectangle` | مستطيل - دوائر |
| دائرة في مربع | `inscribed-circle-in-square` | ض² - π(ض/2)² |
| مربع في دائرة | `inscribed-square-in-circle` | πنق² - ض² |

### هيكل الأشكال المتداخلة
```json
{
  "type": "overlapping-shapes",
  "subtype": "three-tangent-circles",
  "data": {
    "circles": [...],
    "labels": {...}
  },
  "shading": {
    "type": "difference",
    "operation": "triangle - sectors",
    "fillColor": "#e74c3c",
    "fillOpacity": 0.5
  },
  "renderHint": "JSXGraph",
  "formulaUsed": "المساحة = √3 - π/2"
}
```

## 3D Shapes

### الأنواع
`cube`, `cuboid`, `cylinder`, `cone`, `sphere`

### مثال - أسطوانة
```json
{
  "type": "cylinder",
  "data": {
    "radius": 3,
    "height": 7,
    "showDimensions": true,
    "labels": {
      "radius": "3 سم",
      "height": "7 سم"
    }
  },
  "renderHint": "SVG"
}
```

## Coordinate Plane

```json
{
  "type": "coordinate-plane",
  "data": {
    "points": [
      {"x": 2, "y": 3, "label": "أ"},
      {"x": -1, "y": 4, "label": "ب"}
    ],
    "lines": [
      {"from": "أ", "to": "ب", "showLength": true}
    ],
    "gridRange": {"x": [-5, 5], "y": [-5, 5]}
  },
  "renderHint": "SVG"
}
```

## Best Practices

### قواعد مهمة
1. **الوضوح**: تسميات واضحة بالعربية
2. **البساطة**: لا تكدس الشكل بالتفاصيل
3. **الألوان**: استخدم شفافية للتظليل (0.3-0.6)
4. **القياسات**: أرقام بسيطة قابلة للحساب الذهني
5. **renderHint**: اختر المكتبة الصحيحة

### الأخطاء الشائعة
- ❌ نسيان رمز الزاوية القائمة
- ❌ عدم تسمية الرؤوس
- ❌ أرقام معقدة تحتاج آلة حاسبة
- ❌ استخدام SVG للأشكال المتداخلة
