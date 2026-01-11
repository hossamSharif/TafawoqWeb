# Charts Reference

## Bar Chart

```json
{
  "type": "bar-chart",
  "data": {
    "labels": ["الربع 1", "الربع 2", "الربع 3", "الربع 4"],
    "values": [150, 200, 180, 220],
    "title": "المبيعات الفصلية",
    "xAxisLabel": "الفترة",
    "yAxisLabel": "المبيعات (ألف)",
    "barColor": "#3498db",
    "showValues": true
  },
  "renderHint": "Chart.js"
}
```

### أعمدة مزدوجة
```json
{
  "type": "grouped-bar-chart",
  "data": {
    "labels": ["2022", "2023", "2024"],
    "datasets": [
      {"label": "المنتج أ", "values": [50, 60, 80], "color": "#3498db"},
      {"label": "المنتج ب", "values": [40, 55, 70], "color": "#e74c3c"}
    ],
    "showLegend": true
  }
}
```

### أعمدة أفقية
```json
{
  "type": "horizontal-bar-chart",
  "data": {
    "labels": ["أحمد", "محمد", "سارة", "نورة"],
    "values": [85, 92, 78, 88],
    "title": "درجات الطلاب"
  }
}
```

---

## Line Graph

```json
{
  "type": "line-graph",
  "data": {
    "labels": ["6:00", "9:00", "12:00", "15:00", "18:00"],
    "values": [15, 22, 28, 25, 18],
    "title": "درجة الحرارة",
    "xAxisLabel": "الوقت",
    "yAxisLabel": "الدرجة (°م)",
    "showPoints": true,
    "lineColor": "#e74c3c",
    "fill": false
  },
  "renderHint": "Chart.js"
}
```

### خطي متعدد
```json
{
  "type": "multi-line-graph",
  "data": {
    "labels": ["يناير", "فبراير", "مارس", "أبريل"],
    "datasets": [
      {"label": "2023", "values": [100, 120, 115, 130], "color": "#3498db"},
      {"label": "2024", "values": [110, 125, 140, 155], "color": "#2ecc71"}
    ],
    "showLegend": true
  }
}
```

### مساحة
```json
{
  "type": "area-chart",
  "data": {
    "labels": [...],
    "values": [...],
    "fillColor": "rgba(52, 152, 219, 0.3)",
    "lineColor": "#3498db"
  }
}
```

---

## Pie Chart

```json
{
  "type": "pie-chart",
  "data": {
    "labels": ["العربية", "الرياضيات", "العلوم", "الإنجليزية"],
    "values": [30, 25, 25, 20],
    "title": "توزيع الحصص",
    "showPercentages": true,
    "showLabels": true,
    "colors": ["#3498db", "#e74c3c", "#2ecc71", "#f39c12"]
  },
  "renderHint": "Chart.js"
}
```

### بالدرجات
```json
{
  "type": "pie-chart",
  "data": {
    "labels": ["أ", "ب", "ج", "د"],
    "angles": [120, 90, 80, 70],
    "showAngles": true,
    "showPercentages": false
  }
}
```

---

## Histogram

```json
{
  "type": "histogram",
  "data": {
    "ranges": ["0-10", "10-20", "20-30", "30-40", "40-50"],
    "frequencies": [5, 12, 25, 18, 10],
    "title": "توزيع الدرجات",
    "xAxisLabel": "الدرجة",
    "yAxisLabel": "التكرار",
    "continuous": true,
    "showFrequencies": true
  },
  "renderHint": "Chart.js"
}
```

---

## Frequency Table

```json
{
  "type": "frequency-table",
  "data": {
    "title": "توزيع الأعمار",
    "headers": ["الفئة", "التكرار", "التكرار النسبي"],
    "rows": [
      ["20-30", 15, "30%"],
      ["30-40", 20, "40%"],
      ["40-50", 15, "30%"]
    ],
    "showTotals": true
  },
  "renderHint": "Table"
}
```

---

## أسئلة شائعة على الرسوم البيانية

### 1. إيجاد القيمة
"ما قيمة المبيعات في الربع الثاني؟"

### 2. المقارنة
"ما الفرق بين أعلى وأقل قيمة؟"

### 3. النسبة المئوية
"ما نسبة القطاع أ من الكل؟"

### 4. المجموع
"ما مجموع القيم في الأشهر الثلاثة الأولى؟"

### 5. المتوسط
"ما متوسط القيم الظاهرة؟"

### 6. معدل التغير
"ما معدل التغير بين النقطتين؟"
