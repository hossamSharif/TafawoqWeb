# Diagram Generation Architecture

## Overview

The Qudratak platform uses a hybrid approach for rendering geometric shapes and statistical charts in exam/practice questions. The AI (Claude) dynamically generates diagram data, while the frontend has predefined components to render specific diagram types.

## Current Architecture

### Generation Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude AI API  │ ──> │  API Response    │ ──> │  DiagramRenderer│
│  (generates     │     │  (diagram field  │     │  (routes to     │
│   diagram data) │     │   in question)   │     │   specific      │
└─────────────────┘     └──────────────────┘     │   component)    │
                                                  └─────────────────┘
                                                          │
                              ┌────────────────────────────┼────────────────────────────┐
                              │                            │                            │
                              ▼                            ▼                            ▼
                     ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
                     │   SVGDiagram    │         │  ChartDiagram   │         │    Fallback     │
                     │  (geometry)     │         │  (statistics)   │         │  (unsupported)  │
                     └─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Data Structure

```typescript
interface DiagramData {
  type: DiagramType        // e.g., 'circle', 'triangle', 'bar-chart'
  data: Record<string, unknown>  // Shape-specific data
  renderHint: 'SVG' | 'Canvas' | 'Chart.js'
  caption?: string         // Arabic description
}
```

---

## Currently Supported Diagram Types

### Geometry Shapes (SVG-based)

| Type | Component | Status | Use Cases |
|------|-----------|--------|-----------|
| `circle` | `Circle.tsx` | ✅ Working | Area, circumference, radius problems |
| `triangle` | `Triangle.tsx` | ✅ Working | Area, angles, Pythagorean theorem |
| `rectangle` | `Rectangle.tsx` | ✅ Working | Area, perimeter calculations |
| `composite-shape` | `SVGDiagram.tsx` | ✅ Working | Complex figures with multiple shapes |

### Statistical Charts (Chart.js-based)

| Type | Component | Status | Use Cases |
|------|-----------|--------|-----------|
| `bar-chart` | `ChartDiagram.tsx` | ✅ Working | Comparing quantities, frequency |
| `pie-chart` | `ChartDiagram.tsx` | ✅ Working | Percentages, proportions |
| `line-graph` | `ChartDiagram.tsx` | ✅ Working | Trends, time series data |

---

## Recommended Shapes to Add

### High Priority (Common in Qudrat Exams)

| Shape | Type Name | Difficulty | Why Important |
|-------|-----------|------------|---------------|
| **Parallelogram** | `parallelogram` | Medium | Common in area/perimeter problems |
| **Trapezoid** | `trapezoid` | Medium | Frequently tested shape |
| **Rhombus** | `rhombus` | Medium | Diagonal-based area calculations |
| **Square** | `square` | Low | Can extend Rectangle component |
| **Right Triangle** | `right-triangle` | Low | Pythagorean theorem problems |

### Medium Priority (Enhanced Questions)

| Shape | Type Name | Difficulty | Why Important |
|-------|-----------|------------|---------------|
| **Sector** | `sector` | Medium | Arc length, sector area |
| **Semicircle** | `semicircle` | Low | Combined perimeter problems |
| **Regular Polygon** | `polygon` | High | Hexagon, pentagon questions |
| **Coordinate Plane** | `coordinate-plane` | High | Graph-based geometry |
| **3D Shapes** | `cube`, `cylinder`, `cone` | High | Volume/surface area |

### Statistics Enhancements

| Chart Type | Enhancement | Why Important |
|------------|-------------|---------------|
| **Histogram** | `histogram` | Frequency distribution |
| **Scatter Plot** | `scatter-plot` | Correlation questions |
| **Box Plot** | `box-plot` | Statistical analysis |
| **Venn Diagram** | `venn-diagram` | Set theory problems |

---

## Implementation Guide for New Shapes

### Step 1: Add Type Definition

```typescript
// src/types/question.ts
export type DiagramType =
  | 'circle'
  | 'triangle'
  | 'rectangle'
  | 'composite-shape'
  | 'parallelogram'    // NEW
  | 'trapezoid'        // NEW
  // ... existing types
```

### Step 2: Create Shape Component

```typescript
// src/components/diagrams/shapes/Parallelogram.tsx
export interface ParallelogramData {
  // Standard format
  points?: [Point, Point, Point, Point]
  // Claude AI format
  vertices?: [number, number][]
  base?: number
  side?: number
  height?: number
  // ... common properties
}

export function Parallelogram({ data, viewBox }: Props) {
  // Normalize data from both formats
  // Render SVG polygon
}
```

### Step 3: Register in SVGDiagram

```typescript
// src/components/diagrams/SVGDiagram.tsx
const SVG_TYPES: DiagramType[] = [
  'circle', 'triangle', 'rectangle',
  'composite-shape', 'parallelogram'  // Add new type
]

// In renderShape():
case 'parallelogram':
  return <Parallelogram data={data} viewBox={viewBox} />
```

### Step 4: Update AI Prompts

```typescript
// src/lib/anthropic/prompts.ts
// Add examples for new shape in DIAGRAM_GENERATION_PROMPT
```

---

## Data Format Compatibility

The system handles two data formats:

### Standard Format (Internal)
```json
{
  "type": "circle",
  "data": {
    "cx": 100,
    "cy": 100,
    "r": 50,
    "label": "نق = 6 سم"
  }
}
```

### Claude AI Format (Generated)
```json
{
  "type": "circle",
  "data": {
    "center": [100, 100],
    "radius": 6,
    "showRadius": true,
    "label": "نق = 6 سم"
  }
}
```

**Important**: New shape components MUST handle both formats for reliability.

---

## Testing Checklist for New Shapes

- [ ] Shape renders correctly with Claude-generated data
- [ ] Shape renders correctly with standard format data
- [ ] Labels display in Arabic (RTL support)
- [ ] Measurements scale properly in viewBox
- [ ] Zoom modal works correctly
- [ ] Works in both Practice and Exam modes
- [ ] Mobile responsive

---

## File Locations

```
src/
├── types/
│   └── question.ts              # DiagramType definitions
├── components/
│   └── diagrams/
│       ├── DiagramRenderer.tsx  # Main dispatcher
│       ├── SVGDiagram.tsx       # SVG shape router
│       ├── ChartDiagram.tsx     # Chart.js wrapper
│       └── shapes/
│           ├── Circle.tsx
│           ├── Triangle.tsx
│           ├── Rectangle.tsx
│           └── [NewShape].tsx   # Add new shapes here
└── lib/
    └── anthropic/
        └── prompts.ts           # AI generation prompts
```

---

## Known Issues & Fixes Applied

1. **API stripping diagram field** - Fixed in all 4 API routes
2. **Missing props in pages** - Fixed in practice/exam page components
3. **Loading state bug** - Fixed in QuestionCard (onLoad on div)
4. **Data format mismatch** - Fixed in Circle and Triangle components

---

*Last updated: December 2024*
