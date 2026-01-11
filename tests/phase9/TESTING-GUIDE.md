# Phase 9 Testing Guide

This guide provides comprehensive instructions for completing Phase 9 testing tasks (T090, T094-T097).

**Application**: http://localhost:3007
**Test Account**: hossamsharif1990@gmail.com / Hossam1990@
**API Key**: Set in `.env.local`

---

## T090: Full 120-Question Exam Generation Test

**Objective**: Verify full exam generation completes in <3 minutes with 70%+ cost savings

### Prerequisites
```bash
# Ensure API key is set
export ANTHROPIC_API_KEY="your-api-key-here"

# Or add to .env.local
echo 'ANTHROPIC_API_KEY="your-api-key-here"' >> .env.local
```

### Test Procedure

1. **Navigate to Exam Generation Page**:
   - Login: http://localhost:3007
   - Go to: http://localhost:3007/admin/exam-configs

2. **Create Full Exam Configuration**:
   - Track: Scientific
   - Total Questions: 120
   - Quantitative: 60 questions
   - Verbal: 60 questions
   - Difficulty: Mixed (30% easy, 50% medium, 20% hard)
   - Batch Size: 20 (6 batches total)

3. **Start Generation**:
   - Click "Generate Exam"
   - Start timer
   - Monitor progress

4. **Measure Performance**:
   ```javascript
   // In browser console
   const startTime = Date.now();
   // Wait for generation to complete
   const endTime = Date.now();
   const durationSeconds = (endTime - startTime) / 1000;
   console.log(`Total time: ${durationSeconds}s (Target: <180s)`);
   ```

5. **Verify Results**:
   - Check generation completed successfully
   - Verify 120 questions generated
   - Go to http://localhost:3007/admin/metrics
   - Verify cache hit rate ≥75%
   - Verify cost savings ≥70%

### Success Criteria
- ✅ Generation completes in <3 minutes (180 seconds)
- ✅ All 120 questions generated successfully
- ✅ Cache hit rate ≥75% (batches 2-6 should hit cache)
- ✅ Cost savings ≥70% compared to non-cached generation
- ✅ Quality validation passes for all questions

### Sample Test Data
```json
{
  "expectedResults": {
    "maxDuration": 180,
    "questionsGenerated": 120,
    "minCacheHitRate": 75,
    "minCostSavings": 70,
    "batches": 6,
    "batchSize": 20
  }
}
```

---

## T094: Quickstart Validation End-to-End

**Objective**: Verify all quickstart.md setup steps work correctly

### Test Checklist

#### Step 1: Environment Setup
- [ ] Clone repository works
- [ ] `npm install` completes successfully
- [ ] All dependencies installed (check package.json)
  ```bash
  npm list jsxgraph chart.js react-chartjs-2 zod @anthropic-ai/sdk
  ```

#### Step 2: Environment Variables
- [ ] .env.local created from .env.example
- [ ] All required variables set:
  ```bash
  # Verify environment variables
  cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY"
  ```
- [ ] No error on startup about missing variables

#### Step 3: Database Setup
- [ ] Supabase migrations run successfully
- [ ] Tables exist: questions, question_errors, review_queue, exam_configs
  ```sql
  -- In Supabase SQL Editor
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('questions', 'question_errors', 'review_queue', 'exam_configs');
  ```

#### Step 4: Skills Modules
- [ ] All 5 skills exist:
  ```bash
  ls -la src/skills/*/SKILL.md
  # Should show: qudurat-quant, qudurat-verbal, qudurat-diagrams, qudurat-schema, qudurat-quality
  ```
- [ ] Reference files present:
  ```bash
  find src/skills -name "*.md" | wc -l
  # Should be ≥14 files
  ```

#### Step 5: Development Server
- [ ] Server starts: `npm run dev`
- [ ] Homepage loads: http://localhost:3000 (or 3007)
- [ ] No console errors
- [ ] Arabic fonts load correctly

#### Step 6: Core Functionality
- [ ] Admin panel accessible: http://localhost:3007/admin/generate
- [ ] Can generate test question
- [ ] Question displays with Arabic text
- [ ] Diagram renders (if geometric question)

### Validation Script
Run the automated validation script:
```bash
node tests/phase9/validate-quickstart.js
```

---

## T095: Performance Testing - Diagram Rendering

**Objective**: Verify diagram rendering <500ms on minimum specs

### Test Setup

1. **Open DevTools**: F12 → Performance tab
2. **Navigate to practice page with diagrams**
3. **Test each diagram type**

### Performance Test Script

```javascript
// Run in browser console
async function testDiagramPerformance() {
  const diagrams = document.querySelectorAll('[data-diagram]');
  const results = [];

  for (const diagram of diagrams) {
    const startTime = performance.now();

    // Force re-render
    diagram.style.display = 'none';
    diagram.offsetHeight; // Force reflow
    diagram.style.display = '';

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    results.push({
      type: diagram.dataset.diagram,
      renderTime: renderTime.toFixed(2),
      pass: renderTime < 500
    });
  }

  console.table(results);

  const allPass = results.every(r => r.pass);
  console.log(`Overall: ${allPass ? '✅ PASS' : '❌ FAIL'}`);

  return results;
}

// Run test
testDiagramPerformance();
```

### Test Cases

| Diagram Type | Target | Min Spec Device |
|--------------|--------|-----------------|
| SVG Simple Circle | <50ms | iPhone 8 |
| SVG Triangle with Labels | <100ms | Galaxy S8 |
| JSXGraph Overlapping Circles | <300ms | iPhone 8 |
| JSXGraph Venn Diagram | <400ms | Galaxy S8 |
| Chart.js Bar Chart | <200ms | iPhone 8 |
| Chart.js Line Chart | <250ms | Galaxy S8 |

### Success Criteria
- ✅ All simple SVG diagrams: <100ms
- ✅ All JSXGraph diagrams: <400ms
- ✅ All Chart.js diagrams: <300ms
- ✅ No diagram >500ms
- ✅ No frame drops during scroll

### Chrome DevTools Steps
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Navigate to question with diagram
5. Stop recording
6. Check "Main" thread timing
7. Verify diagram render <500ms

---

## T096: Accessibility Audit - WCAG 2.1 AA

**Objective**: Verify all diagrams meet WCAG 2.1 AA compliance

### Automated Testing

```bash
# Install axe-core
npm install --save-dev @axe-core/cli

# Run accessibility audit
npx axe http://localhost:3007/practice/quantitative --save accessibility-report.json

# Check specific pages
npx axe http://localhost:3007/admin/metrics
npx axe http://localhost:3007/admin/errors
npx axe http://localhost:3007/admin/review-queue
```

### Manual Testing Checklist

#### Contrast Ratios (4.5:1 minimum)

```javascript
// Test contrast in browser console
function checkContrast() {
  const diagrams = document.querySelectorAll('svg, canvas');

  diagrams.forEach((diagram, idx) => {
    console.log(`Diagram ${idx}:`);

    // Check text contrast
    const texts = diagram.querySelectorAll('text');
    texts.forEach(text => {
      const color = getComputedStyle(text).fill;
      const bg = getComputedStyle(diagram.parentElement).backgroundColor;
      console.log(`  Text: ${color}, Background: ${bg}`);
    });

    // Check stroke contrast
    const shapes = diagram.querySelectorAll('circle, rect, path, line');
    shapes.forEach(shape => {
      const stroke = getComputedStyle(shape).stroke;
      console.log(`  Stroke: ${stroke}`);
    });
  });
}

checkContrast();
```

**Expected Results**:
- Text on white: #000000 (21:1 ratio) ✅
- Diagram strokes: #000000 or #333333 (>4.5:1) ✅
- Shaded regions: ≥4.5:1 contrast ✅

#### Semantic HTML

- [ ] Diagrams wrapped in `<figure>` tags
- [ ] Captions present: `<figcaption>`
- [ ] ARIA labels on SVG: `aria-label="..."`
- [ ] Role attributes: `role="img"`

```javascript
// Check semantic structure
document.querySelectorAll('svg, canvas').forEach((diagram, idx) => {
  const figure = diagram.closest('figure');
  const caption = figure?.querySelector('figcaption');
  const ariaLabel = diagram.getAttribute('aria-label');
  const role = diagram.getAttribute('role');

  console.log(`Diagram ${idx}:`, {
    hasFigure: !!figure,
    hasCaption: !!caption,
    hasAriaLabel: !!ariaLabel,
    hasRole: !!role
  });
});
```

#### Screen Reader Testing

**NVDA (Windows)**:
1. Download NVDA: https://www.nvaccess.org/download/
2. Start NVDA (Ctrl+Alt+N)
3. Navigate to diagram page
4. Use arrow keys to navigate
5. Verify diagram description read aloud
6. Verify caption read correctly

**VoiceOver (macOS)**:
1. Enable: System Preferences → Accessibility → VoiceOver
2. Start VoiceOver (Cmd+F5)
3. Navigate to diagram
4. Verify description announced

**Expected Behavior**:
- Diagram description read: "Circle with radius 10 cm"
- Caption read: "Find the area of the circle"
- All labels read in logical order

#### Keyboard Navigation

- [ ] Tab to diagram container
- [ ] Focus visible (outline)
- [ ] Skip links work
- [ ] No keyboard traps

### Success Criteria
- ✅ All text contrast ≥4.5:1
- ✅ All diagrams have captions
- ✅ All diagrams have ARIA labels
- ✅ Screen readers announce correctly
- ✅ Keyboard navigation works
- ✅ Axe audit: 0 violations

---

## T097: Responsive Testing - Multiple Widths

**Objective**: Verify diagrams display correctly at 320px, 640px, 1024px, 1920px

### Test Procedure

#### Method 1: Chrome DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "Responsive"
4. Test each width:

```javascript
// Test widths programmatically
const testWidths = [320, 640, 1024, 1920];

testWidths.forEach(width => {
  // Resize viewport
  window.resizeTo(width, 800);

  console.log(`Testing ${width}px width...`);

  // Check diagram scaling
  const diagrams = document.querySelectorAll('[data-diagram], svg, canvas');
  diagrams.forEach((diagram, idx) => {
    const rect = diagram.getBoundingClientRect();
    const fits = rect.width <= width;
    const aspectOk = Math.abs((rect.width / rect.height) - (4/3)) < 0.1; // 4:3 aspect

    console.log(`  Diagram ${idx}: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)} ${fits ? '✅' : '❌'} ${aspectOk ? '✅' : '❌'}`);
  });
});
```

#### Method 2: Real Devices

**320px - iPhone SE**:
- [ ] Diagrams scale to fit
- [ ] Labels readable (min 12px)
- [ ] No horizontal scroll
- [ ] Touch targets ≥44px

**640px - iPad Mini Portrait**:
- [ ] Diagrams centered
- [ ] Proportional scaling
- [ ] Text size appropriate

**1024px - iPad Landscape**:
- [ ] Diagrams use available space
- [ ] Margins appropriate
- [ ] No overflow

**1920px - Desktop**:
- [ ] Max-width constraint applied
- [ ] Diagrams not stretched
- [ ] Centered in container

### Responsive Test Script

```javascript
// Comprehensive responsive test
async function testResponsive() {
  const widths = [320, 640, 1024, 1920];
  const results = [];

  for (const width of widths) {
    // Set viewport width
    document.documentElement.style.width = `${width}px`;

    await new Promise(r => setTimeout(r, 500)); // Wait for reflow

    const diagrams = document.querySelectorAll('svg, canvas');
    const containerWidth = document.querySelector('.container')?.clientWidth || width;

    const diagramResults = Array.from(diagrams).map((diagram, idx) => {
      const rect = diagram.getBoundingClientRect();
      const fitsViewport = rect.width <= width;
      const fitsContainer = rect.width <= containerWidth;
      const aspectRatio = rect.width / rect.height;

      return {
        diagramIdx: idx,
        viewportWidth: width,
        diagramWidth: rect.width.toFixed(0),
        diagramHeight: rect.height.toFixed(0),
        aspectRatio: aspectRatio.toFixed(2),
        fitsViewport,
        fitsContainer,
        pass: fitsViewport && fitsContainer && aspectRatio > 0.5 && aspectRatio < 2
      };
    });

    results.push(...diagramResults);
  }

  console.table(results);

  const allPass = results.every(r => r.pass);
  console.log(`\nOverall: ${allPass ? '✅ PASS' : '❌ FAIL'}`);

  return results;
}

testResponsive();
```

### Success Criteria
- ✅ 320px: All diagrams visible, no scroll
- ✅ 640px: Diagrams scale proportionally
- ✅ 1024px: Optimal viewing experience
- ✅ 1920px: Max-width applied, centered
- ✅ All widths: Text ≥12px, readable
- ✅ All widths: Maintain aspect ratio

---

## Test Report Template

```markdown
# Phase 9 Testing Results

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [OS, Browser, Version]

## T090: Full Exam Generation
- [ ] PASS - Time: ___s (target: <180s)
- [ ] PASS - Questions: ___ (target: 120)
- [ ] PASS - Cache Hit Rate: ___% (target: ≥75%)
- [ ] PASS - Cost Savings: ___% (target: ≥70%)
- Notes: ___

## T094: Quickstart Validation
- [ ] PASS - Environment setup
- [ ] PASS - Dependencies installed
- [ ] PASS - Database migrations
- [ ] PASS - Skills modules present
- [ ] PASS - Server starts
- [ ] PASS - Core functionality
- Notes: ___

## T095: Performance Testing
- [ ] PASS - SVG diagrams: <100ms
- [ ] PASS - JSXGraph: <400ms
- [ ] PASS - Chart.js: <300ms
- [ ] PASS - All diagrams: <500ms
- Notes: ___

## T096: Accessibility Audit
- [ ] PASS - Contrast ratios ≥4.5:1
- [ ] PASS - Semantic HTML
- [ ] PASS - ARIA labels present
- [ ] PASS - Screen reader compatible
- [ ] PASS - Keyboard navigation
- [ ] PASS - Axe audit: 0 violations
- Notes: ___

## T097: Responsive Testing
- [ ] PASS - 320px (mobile)
- [ ] PASS - 640px (tablet portrait)
- [ ] PASS - 1024px (tablet landscape)
- [ ] PASS - 1920px (desktop)
- Notes: ___

## Overall Status
- Total Tests: 5
- Passed: ___
- Failed: ___
- Issues: ___
```

---

## Common Issues & Solutions

### Issue: API Rate Limits
**Solution**: Wait 1-2 minutes between large generation requests

### Issue: Diagrams Not Rendering
**Solution**:
1. Check browser console for errors
2. Verify jsxgraph and chart.js loaded
3. Clear cache: Ctrl+Shift+Delete

### Issue: Slow Performance
**Solution**:
1. Close other browser tabs
2. Disable browser extensions
3. Test in incognito mode

### Issue: Contrast Ratio Failing
**Solution**:
1. Use Chrome DevTools Color Picker
2. Check "Show contrast ratio" checkbox
3. Adjust colors until ≥4.5:1

---

## Automation Script

For automated testing, run:

```bash
# Run all Phase 9 tests
npm run test:phase9

# Or individual tests
npm run test:phase9:generation
npm run test:phase9:performance
npm run test:phase9:accessibility
npm run test:phase9:responsive
```

---

**Security Reminder**: After completing tests, rotate the API key and change the test password!
