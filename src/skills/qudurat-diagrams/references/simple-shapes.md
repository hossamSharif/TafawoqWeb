# Simple Shapes Reference

## Circles

```json
{
  "type": "circle",
  "data": {
    "radius": 5,
    "center": "م",
    "showRadius": true,
    "showDiameter": false,
    "showCenter": true,
    "radiusLabel": "5 سم"
  }
}
```

### مع قطاع
```json
{
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
}
```

### مع وتر
```json
{
  "chord": {
    "points": ["أ", "ب"],
    "midpoint": "م",
    "showMidpoint": true,
    "perpendicularFromCenter": true
  }
}
```

---

## Triangles

```json
{
  "type": "triangle",
  "data": {
    "vertices": ["أ", "ب", "ج"],
    "type": "right | equilateral | isosceles | scalene | 30-60-90 | 45-45-90",
    "rightAngleAt": "ب",
    "showRightAngle": true
  }
}
```

### الزوايا
```json
{
  "angles": [
    {"at": "أ", "value": 60, "label": "60°", "showArc": true},
    {"at": "ب", "value": 90, "label": "90°"},
    {"at": "ج", "value": 30, "label": "30°"}
  ]
}
```

### الأضلاع
```json
{
  "sides": [
    {"from": "أ", "to": "ب", "length": 6, "label": "6 سم"},
    {"from": "ب", "to": "ج", "length": 8, "label": "8 سم"},
    {"from": "أ", "to": "ج", "length": "?", "label": "؟"}
  ]
}
```

### الارتفاع
```json
{
  "height": {
    "from": "أ",
    "to": "ب ج",
    "foot": "د",
    "show": true,
    "dashed": true,
    "label": "ع"
  }
}
```

---

## Quadrilaterals

### مربع
```json
{
  "type": "square",
  "data": {
    "side": 8,
    "vertices": ["أ", "ب", "ج", "د"],
    "showDiagonal": true,
    "diagonalLabel": "ق"
  }
}
```

### مستطيل
```json
{
  "type": "rectangle",
  "data": {
    "length": 10,
    "width": 6,
    "vertices": ["أ", "ب", "ج", "د"]
  }
}
```

### متوازي أضلاع
```json
{
  "type": "parallelogram",
  "data": {
    "base": 8,
    "side": 5,
    "height": 4,
    "vertices": ["أ", "ب", "ج", "د"]
  }
}
```

### شبه منحرف
```json
{
  "type": "trapezoid",
  "data": {
    "base1": 10,
    "base2": 6,
    "height": 4,
    "vertices": ["أ", "ب", "ج", "د"]
  }
}
```

### معين
```json
{
  "type": "rhombus",
  "data": {
    "diagonal1": 8,
    "diagonal2": 6,
    "vertices": ["أ", "ب", "ج", "د"]
  }
}
```

---

## 3D Shapes

### مكعب
```json
{
  "type": "cube",
  "data": {
    "side": 5,
    "showDimensions": true,
    "perspective": "isometric"
  }
}
```

### متوازي مستطيلات
```json
{
  "type": "cuboid",
  "data": {
    "length": 6,
    "width": 4,
    "height": 3,
    "showDimensions": true
  }
}
```

### أسطوانة
```json
{
  "type": "cylinder",
  "data": {
    "radius": 3,
    "height": 7,
    "showDimensions": true
  }
}
```

### كرة
```json
{
  "type": "sphere",
  "data": {
    "radius": 5,
    "showRadius": true,
    "showGreatCircle": true
  }
}
```

---

## Coordinate Plane

```json
{
  "type": "coordinate-plane",
  "data": {
    "gridRange": {"x": [-5, 5], "y": [-5, 5]},
    "showAxes": true,
    "showGrid": true,
    "points": [
      {"x": 3, "y": 4, "label": "أ"},
      {"x": -2, "y": 1, "label": "ب"}
    ],
    "lines": [
      {"from": "أ", "to": "ب", "showLength": true, "showMidpoint": true}
    ]
  }
}
```

---

## Lines and Angles

### خطان متقاطعان
```json
{
  "type": "intersecting-lines",
  "data": {
    "intersection": "O",
    "angles": [
      {"position": 1, "value": 70, "label": "70°"},
      {"position": 3, "value": 70, "label": "س"}
    ]
  }
}
```

### خطان متوازيان وقاطع
```json
{
  "type": "parallel-lines-transversal",
  "data": {
    "line1": "ل₁",
    "line2": "ل₂",
    "transversal": "ق",
    "angles": {
      "corresponding": [1, 5],
      "alternate": [3, 6]
    }
  }
}
```
