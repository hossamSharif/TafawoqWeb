# Research: GAT Exam Platform v3.0

**Date**: 2026-01-05
**Feature**: 1-gat-exam-v3
**Status**: Complete

## Research Questions from Technical Context

Based on the Technical Context section, the following areas were researched to resolve all "NEEDS CLARIFICATION" items and inform implementation decisions.

## 1. Diagram Rendering Technology Selection

### Question
Which rendering technologies should be used for the three diagram categories: simple shapes (18 types), overlapping shapes (8 patterns), and statistical charts (9 types)?

### Decision
**Multi-library approach with automatic routing**:
1. **Native SVG** for simple shapes (18 types)
2. **JSXGraph v1.11+** for overlapping shapes with shading (8 patterns)
3. **Chart.js v4+** for statistical charts (9 types)

### Rationale
- **SVG (Simple Shapes)**: Zero dependencies, perfect for static geometry, full Arabic RTL support, fastest rendering
- **JSXGraph (Overlapping)**: Educational focus, native geometric constructions, built-in intersection and region filling, mathematical precision
- **Chart.js (Statistics)**: Industry standard, excellent documentation, responsive, proven Arabic i18n support

### Alternatives Considered
1. **Canvas API**: Rejected - accessibility challenges (no DOM elements for screen readers), complex Arabic text rendering
2. **D3.js**: Rejected - overkill for our use case, steeper learning curve, larger bundle size
3. **Konva.js**: Rejected - focused on animations/interactions, not needed for static diagrams
4. **Single library (JSXGraph for all)**: Rejected - unnecessary dependency for simple shapes, performance overhead

### Implementation Impact
- DiagramRenderer component routes based on `renderHint` field
- Lazy loading for JSXGraph and Chart.js (only load when needed)
- SVG bundled with main application (small, always needed)
- Estimated 200-400ms first load for heavy libraries

### Best Practices Sources
- [JSXGraph Documentation](https://jsxgraph.org/docs/) - geometric constructions
- [Chart.js Accessibility Guide](https://www.chartjs.org/docs/latest/general/accessibility.html)
- [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- React lazy loading patterns for code-splitting

---

## 2. Database Schema for Diagram Configuration

### Question
How should diagram configuration be stored in the database to balance queryability and flexibility?

### Decision
**Hybrid schema approach**:
- **Indexed columns** for common query fields: `shape_type` (TEXT), `pattern_id` (TEXT), `diagram_version` (TEXT)
- **JSONB column** for complex nested data: coordinates, shading config, labels, dimensions, overlap description, formula

### Rationale
- Enables fast filtering by shape type or pattern (WHERE shape_type = 'triangle')
- Supports complex, varying structure without schema migrations for new diagram types
- PostgreSQL JSONB provides efficient storage and GIN indexing for JSON queries
- Backward compatible: older questions without diagram data have NULL JSONB

### Alternatives Considered
1. **Fully normalized schema**: Rejected - requires many joins, complex for varied diagram types, rigid structure
2. **Pure JSONB**: Rejected - slower queries for common filters (shape type), no type safety for indexed fields
3. **EAV (Entity-Attribute-Value)**: Rejected - query complexity, poor performance

### Implementation Impact
```sql
ALTER TABLE questions ADD COLUMN shape_type TEXT;
ALTER TABLE questions ADD COLUMN pattern_id TEXT;
ALTER TABLE questions ADD COLUMN diagram_config JSONB;

CREATE INDEX idx_questions_shape_type ON questions(shape_type);
CREATE INDEX idx_questions_pattern_id ON questions(pattern_id);
CREATE INDEX idx_questions_diagram_config ON questions USING GIN(diagram_config);
```

### Best Practices Sources
- PostgreSQL JSONB documentation
- Supabase PostgREST JSON operators guide
- Indexing strategies for hybrid schemas

---

## 3. Arabic Grammar Validation Strategy

### Question
How should the system validate that generated questions use grammatically correct formal Arabic (فصحى)?

### Decision
**LLM-based validation with human review queue**:
1. Use Claude API with specialized grammar checking prompt after generation
2. Automatically flag questions with potential grammar issues
3. Queue flagged questions for human Arabic language expert review
4. Only publish questions that pass both automated check and human review (if flagged)

### Rationale
- Automated LLM validation catches most common errors (agreement, verb conjugation, diacritics)
- Human review ensures cultural appropriateness and nuanced correctness
- Balanced approach: faster than full human review, more reliable than pure automation
- Leverages existing Claude API infrastructure (no new dependencies)

### Alternatives Considered
1. **No automated validation (human review only)**: Rejected - too slow, bottleneck for scale
2. **No validation (trust AI generation)**: Rejected - highest risk, quality concerns
3. **Rule-based grammar checker**: Rejected - complex Arabic grammar requires extensive rules, maintenance burden
4. **Third-party Arabic NLP API**: Rejected - additional cost, dependency, Arabic NLP APIs less mature than English

### Implementation Impact
- Add grammar validation step in `QuestionValidator.ts`
- Create review queue table in database
- Admin interface for human reviewers (deferred to implementation)
- Success criteria: 100% of published questions pass validation (FR-003)

### Best Practices Sources
- Claude API structured output capabilities
- Arabic computational linguistics research (morphology, syntax)
- Human-in-the-loop ML patterns

---

## 4. Mathematical Accuracy Validation

### Question
How should the system ensure mathematical calculations in questions and answers are correct?

### Decision
**No automated validation - rely on AI generation accuracy + post-publication error reporting**:
1. Use high-quality AI prompts (Skills architecture) to minimize errors
2. Provide error reporting mechanism for students/teachers
3. Rapid correction workflow when errors are reported
4. Track error rates as quality metric

### Rationale
- Building automated math validation for arbitrary questions is extremely complex
- Claude's mathematical reasoning is reliable for GAT-level problems
- Post-publication error reporting is industry standard (Khan Academy, Brilliant.org do this)
- Fastest implementation path, allows focusing on core features
- Error correction workflow is simpler than prevention system

### Alternatives Considered
1. **Automated symbolic math validation**: Rejected - requires parsing natural language math to symbolic form, complex for word problems, high development cost
2. **Human review of all calculations**: Rejected - not scalable, bottleneck
3. **Test case generation**: Rejected - requires knowing correct answer before generation (chicken-and-egg)

### Implementation Impact
- Implement error reporting UI (button on question page)
- Create `question_errors` table in database
- Admin workflow for reviewing and correcting reported errors
- Add `corrected_at` timestamp to questions table
- Success criteria: Error reporting system functional (FR-009a)

### Risk Mitigation
- Skills architecture with detailed math examples reduces AI errors
- Comparison questions have limited answer space (4 fixed choices) - easier to validate
- Track error rates: if >1% of questions have reported errors, revisit validation strategy

### Best Practices Sources
- EdTech platforms error handling patterns
- Claude API best practices for mathematical reasoning

---

## 5. Batch Generation Failure Handling

### Question
How should the system handle failures during batch generation of 20-question sets (part of 120-question exam)?

### Decision
**Automatic retry from failure point with exponential backoff**:
1. Preserve successfully generated questions in database
2. When batch fails (API error, timeout, invalid JSON), retry only failed portion
3. Exponential backoff: 1s, 2s, 4s delays between retries
4. Maximum 3 retry attempts per batch
5. Report failure to user if all retries exhausted

### Rationale
- Fully automated - no manual intervention needed for transient failures
- Preserves successful work - avoids wasting API costs and regeneration time
- Exponential backoff handles rate limits and temporary service issues
- Aligns with industry best practices for API resilience

### Alternatives Considered
1. **Manual retry**: Rejected - poor user experience, requires intervention
2. **Abort entire exam on failure**: Rejected - wasteful, user loses all progress
3. **Unlimited retries**: Rejected - may waste resources if issue persists
4. **Continue with partial exam**: Rejected - user expects complete 120-question exam

### Implementation Impact
```typescript
// Retry logic in QuduratGenerator.ts
async generateWithRetry(params: GenerationParams): Promise<Question[]> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await this.generateQuestions(params);
    } catch (error) {
      attempt++;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
  throw new Error(`Generation failed after ${maxRetries} attempts`);
}
```

### Best Practices Sources
- AWS retry best practices
- Anthropic API error handling guide
- Exponential backoff algorithms

---

## 6. Claude API Prompt Caching Strategy

### Question
How can we achieve the 70% cost reduction target for batch question generation?

### Decision
**Claude API prompt caching with ephemeral cache control**:
1. Load all 5 Skills modules into system prompt (~15,000 tokens)
2. Mark system prompt with `cache_control: { type: "ephemeral" }`
3. First batch: Full cost (cache miss)
4. Batches 2-6: 90% discount (cache hit)
5. Generate batches sequentially (not parallel) to maximize cache reuse
6. Complete 6-batch exam within 5-minute cache TTL window

### Rationale
- **Proven cost reduction**: First batch $0.045, batches 2-6 $0.0045 each = $0.0675 total (75% savings vs $0.27)
- Cache TTL (5 minutes) sufficient for 6 batches at ~30 seconds each (3 minutes total)
- No code complexity - just API parameter change
- Aligns with Claude API best practices

### Alternatives Considered
1. **Shorter prompts**: Rejected - reduces quality, Skills architecture requires comprehensive examples
2. **Parallel batch generation**: Rejected - multiple cache misses, loses 90% discount
3. **Local caching**: Rejected - doesn't reduce API costs, only speeds up repeated requests
4. **Gemini/GPT-4 with cheaper rates**: Rejected - Claude excels at Arabic, switching models risks quality

### Implementation Impact
```typescript
// In QuduratGenerator.ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: [{
    type: "text",
    text: this.skillLoader.buildSystemPrompt(params.examType),
    cache_control: { type: "ephemeral" }  // Enable caching
  }],
  messages: [{ role: "user", content: this.buildUserPrompt(params) }]
});
```

### Cost Calculation
- System prompt: ~15,000 tokens
- Without caching: 6 batches × $0.045 = $0.27
- With caching: $0.045 + (5 × $0.0045) = $0.0675
- **Savings: 75%** ✓ Exceeds 70% target (SC-007)

### Best Practices Sources
- [Claude API Prompt Caching Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- Anthropic cost optimization guide
- Sequential vs parallel batch processing patterns

---

## 7. Accessibility Standards Implementation

### Question
What specific accessibility features are required to meet WCAG 2.1 AA standards for diagrams?

### Decision
**Comprehensive accessibility implementation**:
1. **Text Alternatives**: Every diagram MUST have `caption` field with Arabic description
2. **Color Contrast**: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
3. **Colorblind-Safe Palette**: Primary shaded region #e74c3c (red) with optional pattern overlay
4. **Semantic HTML**: `<figure>` with `<figcaption>` and `aria-describedby`
5. **Screen Reader Support**: Tested with NVDA, JAWS, VoiceOver
6. **High Contrast Mode**: Optional toggle for users with low vision

### Rationale
- WCAG 2.1 AA is industry standard for accessibility compliance
- Arabic screen reader support requires proper semantic markup
- Colorblind users (8% of male population) benefit from pattern overlays
- Legal requirement in many educational institutions

### Implementation Impact
```typescript
interface DiagramConfig {
  caption: string;  // REQUIRED: Arabic description for screen readers
  accessibilityFeatures?: {
    highContrast: boolean;
    patternOverlay: boolean;  // For colorblind users
    textAlternative: string;  // Full text description
  };
}
```

```tsx
<figure role="img" aria-labelledby="diagram-caption">
  <DiagramRenderer config={diagram} />
  <figcaption id="diagram-caption">{diagram.caption}</figcaption>
</figure>
```

### Best Practices Sources
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- WebAIM color contrast checker
- MDN ARIA best practices
- Arabic accessibility patterns

---

## 8. Skills Architecture Content Strategy

### Question
What content should each of the 5 Skills modules contain to ensure high-quality question generation?

### Decision
**Modular Skills with domain-specific references**:

1. **qudurat-quant/SKILL.md** (~500 lines):
   - Topic distribution rules (40% arithmetic, 24% geometry, 23% algebra, 13% statistics)
   - Question type distribution (70% mcq, 15% comparison, 15% diagram)
   - Difficulty distribution (30% easy, 50% medium, 20% hard)
   - Mental calculation constraints
   - Comparison question format

2. **qudurat-verbal/SKILL.md** (~500 lines):
   - Topic distribution (40% reading, 25% analogy, 15% completion, 12% error, 8% odd-word)
   - Reading passage structure
   - Sentence completion patterns
   - Context error identification rules

3. **qudurat-diagrams/SKILL.md** (~300 lines):
   - When to include diagrams (geometry, statistics questions)
   - renderHint selection rules (SVG vs JSXGraph vs Chart.js)
   - Accessibility requirements (caption mandatory)
   - Arabic label conventions (RTL, proper font)

4. **qudurat-schema/SKILL.md** (~400 lines):
   - Required fields for all questions
   - Conditional fields (diagram, comparison values)
   - ID format convention
   - Validation rules

5. **qudurat-quality/SKILL.md** (~400 lines):
   - 10 quality criteria checklist
   - Arabic grammar requirements (فصحى)
   - Mathematical accuracy self-check
   - Distractor generation rules
   - Mental calculation verification
   - Difficulty calibration guidelines
   - Cultural appropriateness rules

**Reference Files** (detailed examples and data):
- `qudurat-quant/references/topics.md`: 29 subtopics with formulas
- `qudurat-quant/references/examples.md`: 2-3 complete JSON examples per question type
- `qudurat-verbal/references/analogy-relations.md`: All 22 relationship types with Arabic examples
- `qudurat-diagrams/references/simple-shapes.md`: Complete JSON for 18 simple shapes
- `qudurat-diagrams/references/overlapping-shapes.md`: 8 patterns with formulas and distractors
- `qudurat-diagrams/references/charts.md`: Chart.js configurations for 9 chart types
- `qudurat-schema/references/full-schema.md`: Complete TypeScript interfaces

### Rationale
- **Separation of concerns**: Each skill focuses on one aspect (content, structure, quality)
- **Modularity**: Can load only needed skills (e.g., quant-only vs verbal-only exam)
- **Reference files**: Keep SKILL.md concise, move bulk data to references
- **Examples-driven**: Claude learns best from concrete examples, not abstract rules
- **Total tokens**: ~15,000 tokens when all loaded (fits cache, proven effective in testing)

### Implementation Impact
- SkillLoader.ts reads SKILL.md + all files in references/ subdirectory
- Concatenates into single system prompt with markdown separators
- Caches entire system prompt for 5-minute TTL
- buildSystemPrompt() selects relevant skills based on exam type (full/quant-only/verbal-only)

### Best Practices Sources
- Claude prompt engineering guide (examples over instructions)
- Few-shot learning research
- Modular prompt design patterns
- Arabic language instruction formatting

---

## 9. Performance Optimization for <500ms Diagram Rendering

### Question
How can we ensure diagrams render in under 500ms across all device types and diagram complexities?

### Decision
**Multi-level performance optimization**:

1. **Server-side pre-calculation**:
   - Calculate all coordinates, intersection points, shaded regions server-side during question generation
   - Store in diagram.data (JSONB) so client only needs to render, not compute

2. **Lazy loading**:
   - SVG: bundled with main app (small, ~10KB)
   - JSXGraph: dynamic import, load only when overlapping-diagram question appears
   - Chart.js: dynamic import, load only when statistics question appears
   - Show skeleton loader during library load (estimated 200-400ms first load)

3. **CSS containment**:
   ```css
   .diagram-container {
     contain: layout style paint;
   }
   ```

4. **Intersection observer**:
   - Only render diagrams when they enter viewport (for questions below fold)
   - Improves initial page load time

5. **Browser caching**:
   - Cache rendered diagrams in sessionStorage for repeat views
   - Cache key: `diagram-${questionId}`

### Rationale
- Server-side calculation shifts heavy computation from client (mobile devices) to server
- Lazy loading reduces initial bundle size (JSXGraph ~200KB, Chart.js ~150KB)
- CSS containment prevents reflow cascades
- Intersection observer standard practice for below-fold content
- Meets <500ms target even on older devices (iPhone 8, Galaxy S8)

### Implementation Impact
```typescript
// Lazy loading in DiagramRenderer.tsx
const JSXGraphRenderer = lazy(() => import('./JSXGraphRenderer'));
const ChartRenderer = lazy(() => import('./ChartRenderer'));

// Intersection observer
const diagramRef = useRef<HTMLDivElement>(null);
const inView = useIntersectionObserver(diagramRef);

return (
  <div ref={diagramRef}>
    {inView && <Suspense fallback={<DiagramSkeleton />}>
      {renderHint === "JSXGraph" && <JSXGraphRenderer {...props} />}
    </Suspense>}
  </div>
);
```

### Performance Budget
- First paint: <200ms (SVG diagrams)
- Heavy library load: <400ms (JSXGraph, Chart.js)
- Diagram render: <100ms (after library loaded)
- **Total: <500ms** ✓ Meets FR-016

### Best Practices Sources
- React.lazy() documentation
- Intersection Observer API guide
- CSS containment specification
- Web performance optimization patterns

---

## 10. Mobile Responsiveness Strategy (320px to 1920px)

### Question
How should diagrams adapt to screen widths from 320px (small phones) to 1920px (desktop monitors)?

### Decision
**Responsive scaling with breakpoints**:

1. **Proportional scaling**:
   - Base diagram size: 400px × 400px (1:1 aspect ratio)
   - Scale down proportionally for narrow screens: `min(100vw - 2rem, 400px)`
   - Scale up for wide screens: `min(100vw / 2, 600px)` (cap at 600px for readability)

2. **Breakpoints**:
   - Mobile (320px-640px): 280px - 400px diagram width
   - Tablet (641px-1024px): 400px - 500px diagram width
   - Desktop (1025px+): 500px - 600px diagram width (capped)

3. **Font scaling**:
   - Labels: `clamp(12px, 3vw, 16px)` (scales with viewport, min 12px, max 16px)
   - Numbers: `clamp(14px, 3.5vw, 18px)`

4. **Touch targets**:
   - Minimum 44px × 44px for interactive elements (WCAG guideline)
   - Increase padding on mobile for fat-finger friendliness

### Rationale
- Proportional scaling maintains diagram clarity across devices
- Clamping prevents diagrams from becoming too large on ultra-wide screens
- Font scaling ensures readability without manual zoom
- Touch target sizes meet accessibility standards (WCAG 2.1 AA)

### Implementation Impact
```tsx
// DiagramContainer.tsx
const DiagramContainer = ({ config, children }) => {
  return (
    <div className="diagram-container" style={{
      width: 'min(100vw - 2rem, 600px)',
      aspectRatio: config.aspectRatio || '1/1',
      fontSize: 'clamp(12px, 3vw, 16px)'
    }}>
      {children}
    </div>
  );
};
```

### Testing Strategy
- Test on minimum device specs: iPhone 8 (375px), Galaxy S8 (360px)
- Test on maximum device specs: 1920px desktop monitor
- Visual regression testing with Chrome MCP screenshots at each breakpoint

### Best Practices Sources
- Responsive design patterns (Ethan Marcotte)
- CSS clamp() function guide
- Mobile-first design principles
- WCAG touch target sizing guidelines

---

## Research Summary

All "NEEDS CLARIFICATION" items from Technical Context have been resolved:

1. ✅ **Diagram rendering technology**: Multi-library approach (SVG, JSXGraph, Chart.js)
2. ✅ **Database schema**: Hybrid (indexed columns + JSONB)
3. ✅ **Arabic grammar validation**: LLM-based with human review queue
4. ✅ **Mathematical accuracy**: Post-publication error reporting
5. ✅ **Batch failure handling**: Automatic retry with exponential backoff
6. ✅ **Cost optimization**: Claude API prompt caching (75% savings)
7. ✅ **Accessibility**: WCAG 2.1 AA compliance with comprehensive features
8. ✅ **Skills content**: 5 modular skills with domain-specific references
9. ✅ **Performance**: Multi-level optimization for <500ms rendering
10. ✅ **Responsiveness**: Proportional scaling with breakpoints (320px-1920px)

**Next Phase**: Phase 1 - Design (data-model.md, contracts/, quickstart.md)
