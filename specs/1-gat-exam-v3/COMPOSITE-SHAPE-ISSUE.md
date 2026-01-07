# COMPOSITE-SHAPE DIAGRAM RENDERING ISSUE

**Date:** 2026-01-07
**Status:** 🔴 **BLOCKING** - Composite shapes do not render
**Priority:** P0 - Critical for User Story 1 (Overlapping Shapes)

---

## Issue Description

Composite-shape diagrams (rectangle + half circle, overlapping shapes) are **not rendering** despite:
- Valid API data being returned
- Multiple fix attempts in SVGDiagram.tsx and SVGRenderer.tsx
- No console errors

---

## Test Evidence

**Question 2 (Exam Session f0d2042d-3364-4bf6-b93a-6a8a41a00107):**
- Question text: "في الشكل المقابل، احسب مساحة المنطقة المظللة (المستطيل مع نصف الدائرة)"
- Expected: Rectangle (12x6) connected to half circle (radius 2)
- **Actual**: No diagram displays

**API Data (Correct):**
```json
{
  "type": "composite-shape",
  "data": {
    "shapes": [
      {"type": "rectangle", "x": 0, "y": 0, "width": 12, "height": 6},
      {"type": "circle", "cx": 12, "cy": 3, "radius": 2, "half": true}
    ],
    "labels": ["12 سم", "6 سم", "نق = 2 سم"],
    "shaded": true
  },
  "renderHint": "SVG",
  "caption": "مستطيل متصل بنصف دائرة"
}
```

---

## What Works ✅

1. **Circle diagrams** - Single circles render correctly with labels
2. **Bar charts** - Chart.js bar charts render with Arabic labels
3. **Triangle diagrams** - Assumed working (in SVGDiagram.tsx)
4. **Rectangle diagrams** - Assumed working (in SVGDiagram.tsx)

---

## What Doesn't Work ❌

1. **Composite-shape diagrams** - No rendering at all
2. **Half circles** - Part of composite shapes, not tested standalone

---

## Fix Attempts

### Attempt 1: Added composite-shape to SVGRenderer.tsx
- Added `renderCompositeShape()` function
- Added `case 'composite-shape'` to switch statement
- **Result:** No effect, SVGRenderer.tsx not being used for composite shapes

### Attempt 2: Modified SVGDiagram.tsx data structure handling
- Changed to handle both nested (`shape.data`) and flat (`shape` properties) structures
- **Result:** No rendering

### Attempt 3: Rewrote composite rendering with raw SVG elements
- Removed dependency on Circle/Rectangle components
- Added scaling logic: `const scale = Math.min(viewBox.width / 20, viewBox.height / 20)`
- Implemented half-circle rendering using SVG path with arc
- **Result:** Still no rendering, no console errors

---

## Root Cause (Unknown)

Possible causes:
1. **Validation failure** - Shape data may be failing validation silently
2. **Component not mounting** - SVGDiagram component may not be receiving data
3. **Error boundary catching** - DiagramErrorBoundary may be catching errors silently
4. **Data transformation** - Data may be transformed/lost before reaching render

**No console errors** makes debugging difficult.

---

## Code Changes Made

### `src/components/diagrams/SVGDiagram.tsx` (Lines 91-171)
Added complete composite-shape rendering with:
- Flat data structure support
- Scaling to viewBox
- Half-circle SVG path rendering
- Shading support

### `src/services/diagrams/SVGRenderer.tsx` (Lines 41-56, 218-296)
Added composite-shape case and renderCompositeShape function (unused).

---

## Impact

**User Story 1: Practice Overlapping Shapes Questions**
- **BLOCKED** - Cannot render overlapping shapes
- Primary v3.0 feature is non-functional
- 8 overlapping shape patterns untestable

---

## Next Steps

1. **Add debug logging** to SVGDiagram.tsx composite-shape case
2. **Check DiagramErrorBoundary** for caught errors
3. **Verify data flow** from API → QuestionCard → DiagramRenderer → SVGDiagram
4. **Test simple composite** (2 rectangles) before complex shapes
5. **Consider alternative approach:** Render as custom SVG in separate component

---

## Recommendation

**DO NOT MERGE** until composite-shape rendering is fixed. This blocks core v3.0 functionality.
