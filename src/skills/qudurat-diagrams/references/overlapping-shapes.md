# Overlapping Shapes Reference

## Table of Contents
1. [القاعدة الذهبية](#القاعدة-الذهبية)
2. [النمط 1: مربع مع أرباع دوائر](#النمط-1)
3. [النمط 2: رأس مربع في مركز دائرة](#النمط-2)
4. [النمط 3: وردة في مربع](#النمط-3)
5. [النمط 4: ثلاث دوائر متماسة](#النمط-4)
6. [النمط 5: قطاع ناقص مثلث](#النمط-5)
7. [النمط 6: دوائر في مستطيل](#النمط-6)
8. [النمط 7: دائرة في مربع](#النمط-7)
9. [النمط 8: مربع في دائرة](#النمط-8)

---

## القاعدة الذهبية

```
المساحة المظللة = مساحة الشكل الخارجي - مساحة الشكل الداخلي
```

### الصيغ الأساسية
| الشكل | الصيغة |
|-------|--------|
| دائرة | πr² |
| قطاع | (θ/360) × πr² |
| مثلث | ½ × قاعدة × ارتفاع |
| مربع | ض² |
| مثلث متساوي الأضلاع | (√3/4) × ض² |

---

## النمط 1
### square-with-corner-circles
**الوصف**: مربع رؤوسه الأربعة مراكز لأربع دوائر متطابقة

**الصيغة**: مساحة المربع - مساحة دائرة كاملة (4 أرباع = دائرة)

```json
{
  "type": "overlapping-shapes",
  "subtype": "square-with-corner-circles",
  "data": {
    "square": {
      "side": 20,
      "vertices": ["أ", "ب", "ج", "د"]
    },
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
  "formulaUsed": "400 - 100π"
}
```

**مثال**: ض=20، نق=20
- مساحة المربع = 400
- مساحة 4 أرباع = π × 20² = 400π/4 × 4 = 100π
- المظللة = 400 - 100π

---

## النمط 2
### square-vertex-at-circle-center
**الوصف**: رأس المربع يقع في مركز الدائرة

**الصيغة**: معقدة - تعتمد على حجم التداخل

```json
{
  "type": "overlapping-shapes",
  "subtype": "square-vertex-at-circle-center",
  "data": {
    "circle": {
      "center": "م",
      "radius": 6
    },
    "square": {
      "side": 12,
      "vertexAtCenter": "أ"
    }
  },
  "overlap": {
    "type": "quarter-circle-inside-square",
    "angle": 90
  },
  "renderHint": "JSXGraph"
}
```

**مثال**: نق=6، ض=12
- ربع الدائرة داخل المربع = 9π
- ¾ الدائرة خارج المربع = 27π
- المربع - الربع = 144 - 9π

---

## النمط 3
### rose-pattern-in-square
**الوصف**: 4 أنصاف دوائر من منتصفات الأضلاع تشكل وردة (الأصعب)

```json
{
  "type": "overlapping-shapes",
  "subtype": "rose-pattern-in-square",
  "data": {
    "square": {
      "side": 10,
      "showMidpoints": true
    },
    "semicircles": [
      {"from": "top", "diameter": 10},
      {"from": "right", "diameter": 10},
      {"from": "bottom", "diameter": 10},
      {"from": "left", "diameter": 10}
    ]
  },
  "shading": {
    "type": "intersection-of-all",
    "description": "الوردة في المنتصف"
  },
  "renderHint": "JSXGraph"
}
```

---

## النمط 4
### three-tangent-circles
**الوصف**: 3 دوائر متماسة، مراكزها مثلث متساوي الأضلاع

**الصيغة**: مساحة المثلث - 3 قطاعات (60° لكل)

```json
{
  "type": "overlapping-shapes",
  "subtype": "three-tangent-circles",
  "data": {
    "circles": [
      {"center": "O₁", "radius": 1, "position": "top"},
      {"center": "O₂", "radius": 1, "position": "bottom-left"},
      {"center": "O₃", "radius": 1, "position": "bottom-right"}
    ],
    "centerTriangle": {
      "type": "equilateral",
      "side": 2
    }
  },
  "shading": {
    "type": "curvilinear-triangle"
  },
  "renderHint": "JSXGraph",
  "formulaUsed": "√3 - π/2"
}
```

**مثال**: نق=1
- ضلع المثلث = 2 (قطرين متلاصقين)
- مساحة المثلث = (√3/4) × 4 = √3
- مساحة 3 قطاعات = 3 × (60/360) × π × 1 = π/2
- المظللة = √3 - π/2

---

## النمط 5
### sector-minus-triangle
**الوصف**: قطاع دائري (عادة 90°) ناقص مثلث داخله

**الصيغة**: مساحة القطاع - مساحة المثلث

```json
{
  "type": "overlapping-shapes",
  "subtype": "sector-minus-triangle",
  "data": {
    "sector": {
      "center": "O",
      "radius": 4,
      "angle": 90
    },
    "triangle": {
      "vertices": ["O", "أ", "ب"],
      "type": "right-isosceles"
    }
  },
  "shading": {
    "type": "difference",
    "operation": "sector - triangle"
  },
  "renderHint": "SVG",
  "formulaUsed": "4π - 8"
}
```

**مثال**: نق=4، زاوية=90°
- مساحة القطاع = (90/360) × π × 16 = 4π
- مساحة المثلث = ½ × 4 × 4 = 8
- المظللة = 4π - 8 = 4(π - 2)

---

## النمط 6
### circles-in-rectangle
**الوصف**: مستطيل يحتوي دوائر متماسة

```json
{
  "type": "overlapping-shapes",
  "subtype": "circles-in-rectangle",
  "data": {
    "rectangle": {
      "width": 6,
      "height": 4
    },
    "circles": {
      "count": 4,
      "arrangement": "2x2",
      "radius": 1
    }
  },
  "shading": {
    "type": "difference",
    "operation": "rectangle - circles"
  },
  "renderHint": "SVG",
  "formulaUsed": "24 - 4π"
}
```

---

## النمط 7
### inscribed-circle-in-square
**الوصف**: دائرة داخل مربع تمس أضلاعه الأربعة

**الصيغة**: ض² - π(ض/2)²

```json
{
  "type": "overlapping-shapes",
  "subtype": "inscribed-circle-in-square",
  "data": {
    "square": {"side": 10},
    "circle": {"inscribed": true}
  },
  "shading": {
    "type": "difference"
  },
  "renderHint": "SVG",
  "formulaUsed": "100 - 25π"
}
```

**مثال**: ض=10
- نق = 5 (نصف الضلع)
- مساحة المربع = 100
- مساحة الدائرة = 25π
- المظللة = 100 - 25π

---

## النمط 8
### inscribed-square-in-circle
**الوصف**: مربع داخل دائرة رؤوسه على المحيط

**الصيغة**: πنق² - ض²

```json
{
  "type": "overlapping-shapes",
  "subtype": "inscribed-square-in-circle",
  "data": {
    "circle": {"radius": "5√2"},
    "square": {"inscribed": true, "side": 10}
  },
  "shading": {
    "type": "difference"
  },
  "renderHint": "SVG",
  "formulaUsed": "50π - 100"
}
```

**مثال**: نق=5√2
- قطر الدائرة = قطر المربع = 10√2
- ض = 10
- مساحة الدائرة = π × 50 = 50π
- مساحة المربع = 100
- المظللة = 50π - 100
